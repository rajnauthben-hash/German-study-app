// ─── AI Study Generator ───────────────────────────────────────────────────────
//
// Connects to the web backend (Node.js/Groq) for real AI generation.
// Falls back to mock heuristics if the backend is unreachable.

import { StudySet, VocabularyItem, GrammarTopic, QuizQuestion, HomeworkQuestion, ExampleSentence } from '../types';
import { generateQuizQuestions } from './quizGenerator';
import { generateStudySetFromBackend } from './apiClient';
import { getSettings } from './settingsService';

export interface GenerationResult {
  success: boolean;
  studySet?: StudySet;
  error?: string;
  isDemo?: boolean;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateStudySetFromText(
  rawText: string,
  imageUri?: string
): Promise<GenerationResult> {
  if (!rawText.trim()) {
    return { success: false, error: 'No text provided. Please enter or paste the worksheet text.' };
  }

  try {
    const settings = await getSettings();
    const apiResult = await generateStudySetFromBackend(rawText, settings.apiBaseUrl);

    if (apiResult.success && apiResult.studySet) {
      const studySet = normalizeStudySet(apiResult.studySet, rawText, imageUri);
      return { success: true, studySet };
    }

    // Fall back to mock if backend unavailable
    console.warn('Backend unavailable, using mock generation:', apiResult.error);
    const mockSet = generateMockStudySet(rawText, imageUri);
    return { success: true, studySet: mockSet, isDemo: true };
  } catch (_error) {
    const mockSet = generateMockStudySet(rawText, imageUri);
    return { success: true, studySet: mockSet, isDemo: true };
  }
}

// ─── Normalization helpers ─────────────────────────────────────────────────────

function normalizeStudySet(data: Partial<StudySet>, rawText: string, imageUri?: string): StudySet {
  return {
    id: `ss-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: data.title || 'German Worksheet',
    topic: data.topic || 'German Study',
    sourceImageUri: imageUri,
    rawText,
    vocabulary: normalizeVocabulary((data.vocabulary as unknown[] | undefined) || []),
    grammarTopics: normalizeGrammar((data.grammarTopics as unknown[] | undefined) || []),
    exampleSentences: normalizeSentences((data.exampleSentences as unknown[] | undefined) || []),
    quizQuestions: normalizeQuiz((data.quizQuestions as unknown[] | undefined) || []),
    toMemorize: Array.isArray(data.toMemorize) ? data.toMemorize : [],
    toUnderstand: Array.isArray(data.toUnderstand) ? data.toUnderstand : [],
    toPracticeAgain: Array.isArray(data.toPracticeAgain) ? data.toPracticeAgain : [],
    homeworkQuestions: normalizeHomework(
      ((data as Record<string, unknown>)['homework'] as unknown[] | undefined) ||
      ((data.homeworkQuestions as unknown[] | undefined) ?? [])
    ),
    createdAt: new Date().toISOString(),
    masteryLevel: 0,
  };
}

function normalizeVocabulary(vocab: unknown[]): VocabularyItem[] {
  return (vocab as Record<string, unknown>[]).map((v, i) => ({
    id: typeof v['id'] === 'string' ? v['id'] : `v-${i}`,
    german: typeof v['german'] === 'string' ? v['german'] : '',
    english: typeof v['english'] === 'string' ? v['english'] : '',
    article: (v['article'] as VocabularyItem['article']) || undefined,
    plural: typeof v['plural'] === 'string' ? v['plural'] : undefined,
    wordType: (v['wordType'] as VocabularyItem['wordType']) || undefined,
    exampleSentence: (typeof v['example'] === 'string' ? v['example'] : undefined) ||
      (typeof v['exampleSentence'] === 'string' ? v['exampleSentence'] : undefined),
    exampleTranslation: typeof v['exampleTranslation'] === 'string' ? v['exampleTranslation'] : undefined,
    pronunciationHint: typeof v['pronunciationHint'] === 'string' ? v['pronunciationHint'] : undefined,
  })).filter(v => v.german && v.english);
}

function normalizeGrammar(grammar: unknown[]): GrammarTopic[] {
  return (grammar as Record<string, unknown>[]).map((g, i) => ({
    id: typeof g['id'] === 'string' ? g['id'] : `g-${i}`,
    title: typeof g['title'] === 'string' ? g['title'] : 'Grammar Topic',
    rule: typeof g['rule'] === 'string' ? g['rule'] : '',
    examples: Array.isArray(g['examples']) ? g['examples'] as Array<{ german: string; english: string }> : [],
    tip: typeof g['tip'] === 'string' ? g['tip'] : undefined,
  }));
}

function normalizeSentences(sentences: unknown[]): ExampleSentence[] {
  return (sentences as Record<string, unknown>[]).map((s, i) => ({
    id: typeof s['id'] === 'string' ? s['id'] : `es-${i}`,
    german: typeof s['german'] === 'string' ? s['german'] : '',
    english: typeof s['english'] === 'string' ? s['english'] : '',
    highlight: typeof s['highlight'] === 'string' ? s['highlight'] : undefined,
  })).filter(s => s.german);
}

function normalizeQuiz(questions: unknown[]): QuizQuestion[] {
  return (questions as Record<string, unknown>[]).map((q, i) => ({
    id: typeof q['id'] === 'string' ? q['id'] : `q-${i}`,
    type: (q['type'] as QuizQuestion['type']) || 'multiple-choice',
    question: typeof q['question'] === 'string' ? q['question'] : '',
    correctAnswer: typeof q['correctAnswer'] === 'string' ? q['correctAnswer'] : '',
    options: Array.isArray(q['options']) ? q['options'] as string[] : undefined,
    hint: typeof q['hint'] === 'string' ? q['hint'] : undefined,
    explanation: typeof q['explanation'] === 'string' ? q['explanation'] : undefined,
  })).filter(q => q.question && q.correctAnswer);
}

function normalizeHomework(questions: unknown[]): HomeworkQuestion[] {
  return (questions as Record<string, unknown>[]).map((q, i) => ({
    id: typeof q['id'] === 'string' ? q['id'] : `hw-${i}`,
    question: typeof q['question'] === 'string' ? q['question'] : '',
    hint1: (typeof q['hint1'] === 'string' ? q['hint1'] : undefined) ||
      (typeof q['hint'] === 'string' ? q['hint'] : 'Think carefully about this.'),
    hint2: typeof q['hint2'] === 'string' ? q['hint2'] : 'Look at the grammar rules.',
    answer: typeof q['answer'] === 'string' ? q['answer'] : '',
    explanation: typeof q['explanation'] === 'string' ? q['explanation'] : '',
    grammarNote: typeof q['grammarNote'] === 'string' ? q['grammarNote'] : undefined,
  })).filter(q => q.question);
}

// ─── Mock fallback (kept for offline/demo use) ────────────────────────────────

function generateMockStudySet(rawText: string, imageUri?: string): StudySet {
  const title = rawText.split('\n')[0].trim().slice(0, 50) || 'German Worksheet';
  const vocab = extractVocabularyFromText(rawText);
  const grammar = extractGrammarFromText(rawText);
  const sentences = extractSentencesFromText(rawText);
  const quizQuestions = generateQuizQuestions(vocab, grammar, sentences);
  const homeworkQuestions = extractHomeworkFromText(rawText);

  return {
    id: `ss-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    topic: `German Study – ${title}`,
    sourceImageUri: imageUri,
    rawText,
    vocabulary: vocab,
    grammarTopics: grammar,
    exampleSentences: sentences,
    quizQuestions,
    toMemorize: vocab.slice(0, 5).map(v => `${v.german} = ${v.english}`),
    toUnderstand: grammar.map(g => `How ${g.title} works`),
    toPracticeAgain: [],
    homeworkQuestions,
    createdAt: new Date().toISOString(),
    masteryLevel: 0,
  };
}

function extractVocabularyFromText(text: string): VocabularyItem[] {
  const germanPattern = /\b[A-ZÄÖÜ][a-zäöüß]{2,}\b/g;
  const matches = text.match(germanPattern) ?? [];
  const unique = [...new Set(matches)].slice(0, 12);
  return unique.map((word, i) => ({
    id: `v-gen-${i}`,
    german: word,
    english: `[${word}]`,
    wordType: 'noun' as const,
  }));
}

function extractGrammarFromText(text: string): GrammarTopic[] {
  const topics: GrammarTopic[] = [];
  if (/modal|können|müssen|dürfen|wollen|sollen|möchten/i.test(text)) {
    topics.push({ id: 'g-modal', title: 'Modal Verbs', rule: 'Modal verb in position 2, infinitive at end.', examples: [{ german: 'Ich kann schwimmen.', english: 'I can swim.' }], tip: 'Infinitive goes to the end!' });
  }
  if (/perfekt|haben|sein|gespielt|gemacht|gegangen/i.test(text)) {
    topics.push({ id: 'g-perfekt', title: 'Perfekt', rule: 'haben/sein + Partizip II', examples: [{ german: 'Ich habe gespielt.', english: 'I played.' }] });
  }
  if (topics.length === 0) {
    topics.push({ id: 'g-gen', title: 'Grammar', rule: 'Connect backend for AI-powered grammar detection.', examples: [] });
  }
  return topics;
}

function extractSentencesFromText(text: string): ExampleSentence[] {
  const matches = text.match(/[A-ZÄÖÜ][^.!?]*[.!?]/g) ?? [];
  return matches.filter(s => s.length > 10 && s.length < 120).slice(0, 6).map((s, i) => ({
    id: `es-${i}`, german: s.trim(), english: '',
  }));
}

function extractHomeworkFromText(text: string): HomeworkQuestion[] {
  const matches = [...text.matchAll(/\d+[.)]\s+(.{10,100}[?.])/g)];
  return matches.slice(0, 5).map((m, i) => ({
    id: `hw-${i}`, question: m[1].trim(),
    hint1: 'Think about the grammar concept.', hint2: 'Check the vocabulary section.',
    answer: '', explanation: '',
  }));
}
