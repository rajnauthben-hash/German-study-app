// ─── AI Study Generator ───────────────────────────────────────────────────────
//
// This service takes raw text extracted from a German worksheet and generates
// a structured StudySet with vocabulary, grammar topics, quizzes, etc.
//
// TO CONNECT A REAL AI API:
//
//   1. Claude API (Anthropic):
//      - npm install @anthropic-ai/sdk
//      - import Anthropic from '@anthropic-ai/sdk'
//      - const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
//      - const msg = await client.messages.create({ model: 'claude-opus-4-7', ... })
//      - See generateWithClaude() example below
//
//   2. OpenAI:
//      - npm install openai
//      - import OpenAI from 'openai'
//      - const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
//      - const completion = await openai.chat.completions.create(...)
//
//   3. Google Gemini:
//      - npm install @google/generative-ai
//      - import { GoogleGenerativeAI } from '@google/generative-ai'
//
// The AI prompt should instruct the model to return a JSON object matching
// the StudySet interface (excluding id, createdAt which are added client-side).

import { StudySet, VocabularyItem, GrammarTopic, QuizQuestion, HomeworkQuestion, ExampleSentence } from '../types';
import { generateQuizQuestions } from './quizGenerator';

export interface GenerationResult {
  success: boolean;
  studySet?: StudySet;
  error?: string;
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
    // TODO: Replace this mock with a real AI API call.
    // The rawText is already extracted from the worksheet image.
    // Pass it to an AI model with the prompt below and parse the JSON response.

    await delay(2500); // simulate AI processing time

    const studySet = generateMockStudySet(rawText, imageUri);
    return { success: true, studySet };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to generate study set. Please try again.',
    };
  }
}

// ─── Mock Generator (replace with real AI call) ───────────────────────────────

function generateMockStudySet(rawText: string, imageUri?: string): StudySet {
  const title = extractTitleFromText(rawText);
  const vocab = extractVocabularyFromText(rawText);
  const grammar = extractGrammarFromText(rawText);
  const sentences = extractSentencesFromText(rawText);
  const quizQuestions = generateQuizQuestions(vocab, grammar, sentences);
  const homeworkQuestions = extractHomeworkFromText(rawText);

  return {
    id: generateId(),
    title,
    topic: `German Study – ${title}`,
    sourceImageUri: imageUri,
    rawText,
    vocabulary: vocab,
    grammarTopics: grammar,
    exampleSentences: sentences,
    quizQuestions,
    toMemorize: generateMemorizeList(vocab, grammar),
    toUnderstand: generateUnderstandList(grammar),
    toPracticeAgain: [],
    homeworkQuestions,
    createdAt: new Date().toISOString(),
    masteryLevel: 0,
  };
}

// Simple heuristic parsers – replace entirely with AI output
function extractTitleFromText(text: string): string {
  const firstLine = text.split('\n')[0].trim();
  if (firstLine.length > 0 && firstLine.length < 60) return firstLine;
  return 'German Worksheet';
}

function extractVocabularyFromText(text: string): VocabularyItem[] {
  const germanWords: string[] = [];
  const germanPattern = /\b[A-ZÄÖÜ][a-zäöüß]{2,}\b/g;
  const matches = text.match(germanPattern) ?? [];

  // Deduplicate
  const unique = [...new Set(matches)].slice(0, 12);

  return unique.map((word, i) => ({
    id: `v-gen-${i}`,
    german: word,
    english: `[Connect AI to translate "${word}"]`,
    wordType: 'noun' as const,
    exampleSentence: `${word} ist ein deutsches Wort.`,
    exampleTranslation: `"${word}" is a German word.`,
  }));
}

function extractGrammarFromText(text: string): GrammarTopic[] {
  // Detect keywords that hint at grammar topics
  const topics: GrammarTopic[] = [];

  if (/modal|können|müssen|dürfen|wollen|sollen|möchten/i.test(text)) {
    topics.push({
      id: 'g-gen-001',
      title: 'Modal Verbs',
      rule: 'Modal verbs come in position 2; the main verb (infinitive) goes to the end.',
      examples: [{ german: 'Ich kann schwimmen.', english: 'I can swim.' }],
      tip: 'Always send the infinitive to the end!',
    });
  }

  if (/perfekt|haben|sein|gespielt|gemacht|gegangen/i.test(text)) {
    topics.push({
      id: 'g-gen-002',
      title: 'Perfekt (Past Tense)',
      rule: 'Perfekt = haben/sein + past participle (Partizip II). Motion verbs use "sein".',
      examples: [
        { german: 'Ich habe gespielt.', english: 'I played / I have played.' },
        { german: 'Er ist gegangen.', english: 'He went / He has gone.' },
      ],
      tip: 'Use "sein" for verbs of motion or change of state.',
    });
  }

  if (/akkusativ|nominativ|dativ|artikel|den|dem/i.test(text)) {
    topics.push({
      id: 'g-gen-003',
      title: 'German Cases',
      rule: 'German has 4 cases: Nominativ (subject), Akkusativ (direct object), Dativ (indirect object), Genitiv (possession).',
      examples: [
        { german: 'Der Mann (Nom) gibt dem Kind (Dat) den Ball (Akk).', english: 'The man gives the child the ball.' },
      ],
    });
  }

  if (topics.length === 0) {
    topics.push({
      id: 'g-gen-000',
      title: 'Grammar Topic Detected',
      rule: 'Connect the AI service to automatically identify and explain grammar rules from your worksheet.',
      examples: [{ german: 'Beispiel', english: 'Example' }],
      tip: 'Add your AI API key to unlock automatic grammar detection.',
    });
  }

  return topics;
}

function extractSentencesFromText(text: string): ExampleSentence[] {
  const sentencePattern = /[A-ZÄÖÜ][^.!?]*[.!?]/g;
  const matches = text.match(sentencePattern) ?? [];

  return matches
    .filter((s) => s.length > 10 && s.length < 120)
    .slice(0, 6)
    .map((sentence, i) => ({
      id: `es-gen-${i}`,
      german: sentence.trim(),
      english: '[AI translation will appear here]',
    }));
}

function extractHomeworkFromText(text: string): HomeworkQuestion[] {
  const questionPattern = /\d+[.)]\s+(.{10,100}[?.])/g;
  const matches = [...text.matchAll(questionPattern)];

  return matches.slice(0, 5).map((match, i) => ({
    id: `hw-gen-${i}`,
    question: match[1].trim(),
    hint1: 'Think about what grammar concept this is testing.',
    hint2: 'Look at the vocabulary section for clues.',
    answer: '[Connect AI to generate the answer]',
    explanation: '[Connect AI to generate a full explanation]',
  }));
}

function generateMemorizeList(vocab: VocabularyItem[], grammar: GrammarTopic[]): string[] {
  const items: string[] = [];
  if (vocab.length > 0) {
    items.push(`${vocab.length} vocabulary words from this worksheet`);
    vocab.slice(0, 5).forEach((v) => items.push(`${v.german} = ${v.english}`));
  }
  if (grammar.length > 0) {
    items.push(`Key rule: ${grammar[0].rule.substring(0, 80)}...`);
  }
  return items;
}

function generateUnderstandList(grammar: GrammarTopic[]): string[] {
  return grammar.map((g) => `How ${g.title} works in sentences`);
}

function generateId(): string {
  return `ss-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Claude API Example (commented out) ──────────────────────────────────────
//
// async function generateWithClaude(rawText: string): Promise<StudySet> {
//   const Anthropic = require('@anthropic-ai/sdk');
//   const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
//
//   const message = await client.messages.create({
//     model: 'claude-opus-4-7',
//     max_tokens: 4096,
//     messages: [{
//       role: 'user',
//       content: `You are a German language teacher assistant. Analyze this worksheet text and return a JSON object.
//
//       Worksheet text:
//       ${rawText}
//
//       Return a JSON object with these fields:
//       - title: string (short descriptive title)
//       - topic: string
//       - vocabulary: VocabularyItem[] (german, english, article, wordType, exampleSentence, exampleTranslation)
//       - grammarTopics: GrammarTopic[] (title, rule, examples, tip)
//       - exampleSentences: ExampleSentence[] (german, english)
//       - quizQuestions: QuizQuestion[] (type, question, correctAnswer, options, hint, explanation)
//       - toMemorize: string[]
//       - toUnderstand: string[]
//       - homeworkQuestions: HomeworkQuestion[] (question, hint1, hint2, answer, explanation)
//
//       Return only valid JSON, no markdown.`
//     }],
//   });
//
//   const json = JSON.parse(message.content[0].text);
//   return { ...json, id: generateId(), rawText, createdAt: new Date().toISOString(), masteryLevel: 0 };
// }
