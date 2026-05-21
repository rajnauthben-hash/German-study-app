import { VocabularyItem, GrammarTopic, ExampleSentence, QuizQuestion } from '../types';

// ─── Quiz Generator ───────────────────────────────────────────────────────────

export function generateQuizQuestions(
  vocab: VocabularyItem[],
  grammar: GrammarTopic[],
  sentences: ExampleSentence[]
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Multiple choice – vocab meanings
  vocab.slice(0, 4).forEach((item, i) => {
    const wrongAnswers = vocab
      .filter((v) => v.id !== item.id)
      .map((v) => v.english)
      .slice(0, 3);

    if (wrongAnswers.length < 3) return;

    questions.push({
      id: `q-gen-mc-${i}`,
      type: 'multiple-choice',
      question: `What does "${item.german}" mean?`,
      correctAnswer: item.english,
      options: shuffle([item.english, ...wrongAnswers]),
      hint: item.exampleSentence ? `Hint: "${item.exampleSentence}"` : undefined,
      explanation: item.exampleTranslation,
      vocabularyRef: item.id,
    });
  });

  // Fill in the blank – from example sentences
  sentences.slice(0, 3).forEach((sentence, i) => {
    const words = sentence.german.split(' ');
    if (words.length < 3) return;

    // blank out a non-trivial word (not the first, not punctuation-only)
    const targetIdx = Math.min(2, words.length - 1);
    const blank = words[targetIdx].replace(/[.,!?]$/, '');
    const question = words.map((w, idx) => (idx === targetIdx ? '___' : w)).join(' ');

    questions.push({
      id: `q-gen-fb-${i}`,
      type: 'fill-blank',
      question,
      correctAnswer: blank,
      hint: sentence.english,
      explanation: `Full sentence: "${sentence.german}" means "${sentence.english}"`,
    });
  });

  // Translation – DE → EN
  vocab.slice(0, 3).forEach((item, i) => {
    questions.push({
      id: `q-gen-de-${i}`,
      type: 'translate-de-en',
      question: `Translate: "${item.german}"`,
      correctAnswer: item.english,
      hint: item.pronunciationHint ? `Pronunciation: ${item.pronunciationHint}` : undefined,
      explanation: item.exampleSentence
        ? `Example: "${item.exampleSentence}" = "${item.exampleTranslation}"`
        : undefined,
      vocabularyRef: item.id,
    });
  });

  // Sentence build – from grammar examples
  grammar.forEach((topic, i) => {
    topic.examples.slice(0, 1).forEach((ex, j) => {
      const words = ex.german.split(' ').filter((w) => w.length > 0);
      if (words.length < 3) return;

      questions.push({
        id: `q-gen-sb-${i}-${j}`,
        type: 'sentence-build',
        question: `Build: "${ex.english}"`,
        correctAnswer: ex.german,
        words: shuffle([...words]),
        hint: topic.tip,
        explanation: topic.rule,
      });
    });
  });

  return questions;
}

// ─── Answer Checking ──────────────────────────────────────────────────────────

export function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:]/g, '')
      .replace(/\s+/g, ' ');

  return normalize(userAnswer) === normalize(correctAnswer);
}

export function getScoreLabel(score: number): { label: string; emoji: string } {
  if (score >= 90) return { label: 'Excellent!', emoji: '🏆' };
  if (score >= 75) return { label: 'Great job!', emoji: '⭐' };
  if (score >= 60) return { label: 'Good work!', emoji: '👍' };
  if (score >= 40) return { label: 'Keep going!', emoji: '💪' };
  return { label: 'Keep practicing!', emoji: '📚' };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
