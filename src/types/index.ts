// ─── Core Data Models ────────────────────────────────────────────────────────

export interface VocabularyItem {
  id: string;
  german: string;
  english: string;
  article?: 'der' | 'die' | 'das';
  plural?: string;
  wordType?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'modal';
  exampleSentence?: string;
  exampleTranslation?: string;
  pronunciationHint?: string;
}

export interface GrammarTopic {
  id: string;
  title: string;
  rule: string;
  examples: Array<{ german: string; english: string }>;
  tip?: string;
}

export interface ExampleSentence {
  id: string;
  german: string;
  english: string;
  highlight?: string; // the grammar feature being highlighted
}

export type QuestionType =
  | 'multiple-choice'
  | 'fill-blank'
  | 'translate-de-en'
  | 'translate-en-de'
  | 'sentence-build';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  correctAnswer: string;
  options?: string[]; // for multiple-choice
  words?: string[];   // for sentence-build (shuffled words)
  hint?: string;
  explanation?: string;
  vocabularyRef?: string; // id of associated VocabularyItem
}

export interface HomeworkQuestion {
  id: string;
  question: string;
  hint1: string;
  hint2: string;
  answer: string;
  explanation: string;
  grammarNote?: string;
}

export interface StudySet {
  id: string;
  title: string;
  topic: string;
  sourceImageUri?: string;
  rawText: string;
  vocabulary: VocabularyItem[];
  grammarTopics: GrammarTopic[];
  exampleSentences: ExampleSentence[];
  quizQuestions: QuizQuestion[];
  toMemorize: string[];       // bullet points of things to memorize
  toUnderstand: string[];     // bullet points of concepts to understand
  toPracticeAgain: string[];  // areas that need more work
  homeworkQuestions: HomeworkQuestion[];
  createdAt: string;          // ISO string for JSON serialization
  lastStudied?: string;
  bestQuizScore?: number;
  masteryLevel: number;       // 0–100
}

export interface Worksheet {
  id: string;
  imageUri: string;
  extractedText: string;
  createdAt: string;
  studySetId?: string;
}

// ─── Progress & Gamification ──────────────────────────────────────────────────

export interface StudyHistoryEntry {
  date: string;
  studySetId: string;
  studySetTitle: string;
  wordsStudied: number;
  quizScore: number;
  mode: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface UserProgress {
  totalWordsLearned: number;
  totalWorksheetsScanned: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: string;
  totalQuizzesTaken: number;
  totalCorrectAnswers: number;
  totalQuestions: number;
  topicsNeedingReview: string[];
  studyHistory: StudyHistoryEntry[];
  achievements: Achievement[];
}

// ─── Practice Session ─────────────────────────────────────────────────────────

export type PracticeMode =
  | 'flashcards'
  | 'quiz'
  | 'fill-blank'
  | 'translate-de-en'
  | 'translate-en-de'
  | 'sentence-build'
  | 'mistake-review';

export interface MistakeReviewItem {
  id: string;
  questionId: string;
  studySetId: string;
  studySetTitle: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  timestamp: string;
  reviewCount: number;
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

export type RootStackParamList = {
  Main: undefined;
  StudySet: { studySetId: string };
  Practice: { studySetId: string };
  Flashcards: { studySetId: string };
  Quiz: { studySetId: string };
  FillBlank: { studySetId: string };
  SentenceBuilder: { studySetId: string };
  HomeworkHelper: { studySetId: string };
  MistakeReview: { studySetId?: string };
};

export type TabParamList = {
  HomeTab: undefined;
  ScanTab: undefined;
  SavedTab: undefined;
  ProgressTab: undefined;
};
