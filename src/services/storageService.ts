import AsyncStorage from '@react-native-async-storage/async-storage';
import { StudySet, UserProgress, MistakeReviewItem, Worksheet } from '../types';
import { SAMPLE_STUDY_SETS, INITIAL_PROGRESS, SAMPLE_MISTAKES } from '../data/sampleData';

const KEYS = {
  STUDY_SETS: '@deutschsnap/study_sets',
  PROGRESS: '@deutschsnap/progress',
  MISTAKES: '@deutschsnap/mistakes',
  WORKSHEETS: '@deutschsnap/worksheets',
};

// ─── Study Sets ───────────────────────────────────────────────────────────────

export async function getStudySets(): Promise<StudySet[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.STUDY_SETS);
    if (json) return JSON.parse(json) as StudySet[];
    // Seed with sample data on first launch
    await saveStudySets(SAMPLE_STUDY_SETS);
    return SAMPLE_STUDY_SETS;
  } catch {
    return SAMPLE_STUDY_SETS;
  }
}

export async function getStudySetById(id: string): Promise<StudySet | null> {
  const sets = await getStudySets();
  return sets.find((s) => s.id === id) ?? null;
}

export async function saveStudySet(set: StudySet): Promise<void> {
  const sets = await getStudySets();
  const idx = sets.findIndex((s) => s.id === set.id);
  if (idx >= 0) {
    sets[idx] = set;
  } else {
    sets.unshift(set); // newest first
  }
  await saveStudySets(sets);
}

export async function deleteStudySet(id: string): Promise<void> {
  const sets = await getStudySets();
  await saveStudySets(sets.filter((s) => s.id !== id));
}

async function saveStudySets(sets: StudySet[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.STUDY_SETS, JSON.stringify(sets));
}

// ─── User Progress ────────────────────────────────────────────────────────────

export async function getUserProgress(): Promise<UserProgress> {
  try {
    const json = await AsyncStorage.getItem(KEYS.PROGRESS);
    if (json) return JSON.parse(json) as UserProgress;
    await saveUserProgress(INITIAL_PROGRESS);
    return INITIAL_PROGRESS;
  } catch {
    return INITIAL_PROGRESS;
  }
}

export async function saveUserProgress(progress: UserProgress): Promise<void> {
  await AsyncStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));
}

export async function updateProgressAfterSession(params: {
  studySetId: string;
  studySetTitle: string;
  wordsStudied: number;
  quizScore: number;
  correctAnswers: number;
  totalQuestions: number;
  mode: string;
}): Promise<UserProgress> {
  const progress = await getUserProgress();

  const today = new Date().toDateString();
  const lastStudy = progress.lastStudyDate
    ? new Date(progress.lastStudyDate).toDateString()
    : null;
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  let newStreak = progress.currentStreak;
  if (lastStudy === today) {
    // already studied today, streak unchanged
  } else if (lastStudy === yesterday) {
    newStreak += 1;
  } else {
    newStreak = 1; // streak broken
  }

  const updated: UserProgress = {
    ...progress,
    totalWordsLearned: progress.totalWordsLearned + params.wordsStudied,
    totalQuizzesTaken: progress.totalQuizzesTaken + 1,
    totalCorrectAnswers: progress.totalCorrectAnswers + params.correctAnswers,
    totalQuestions: progress.totalQuestions + params.totalQuestions,
    currentStreak: newStreak,
    longestStreak: Math.max(progress.longestStreak, newStreak),
    lastStudyDate: new Date().toISOString(),
    studyHistory: [
      {
        date: new Date().toISOString(),
        studySetId: params.studySetId,
        studySetTitle: params.studySetTitle,
        wordsStudied: params.wordsStudied,
        quizScore: params.quizScore,
        mode: params.mode,
      },
      ...progress.studyHistory.slice(0, 29), // keep last 30 entries
    ],
  };

  await saveUserProgress(updated);
  return updated;
}

// ─── Mistakes ─────────────────────────────────────────────────────────────────

export async function getMistakes(): Promise<MistakeReviewItem[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.MISTAKES);
    if (json) return JSON.parse(json) as MistakeReviewItem[];
    await saveMistakes(SAMPLE_MISTAKES);
    return SAMPLE_MISTAKES;
  } catch {
    return SAMPLE_MISTAKES;
  }
}

export async function addMistake(mistake: MistakeReviewItem): Promise<void> {
  const mistakes = await getMistakes();
  const existing = mistakes.findIndex((m) => m.questionId === mistake.questionId);
  if (existing >= 0) {
    mistakes[existing] = { ...mistake, reviewCount: mistakes[existing].reviewCount + 1 };
  } else {
    mistakes.unshift(mistake);
  }
  await saveMistakes(mistakes.slice(0, 50)); // cap at 50 mistakes
}

export async function removeMistake(id: string): Promise<void> {
  const mistakes = await getMistakes();
  await saveMistakes(mistakes.filter((m) => m.id !== id));
}

async function saveMistakes(mistakes: MistakeReviewItem[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.MISTAKES, JSON.stringify(mistakes));
}

// ─── Worksheets ───────────────────────────────────────────────────────────────

export async function getWorksheets(): Promise<Worksheet[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.WORKSHEETS);
    return json ? (JSON.parse(json) as Worksheet[]) : [];
  } catch {
    return [];
  }
}

export async function saveWorksheet(worksheet: Worksheet): Promise<void> {
  const worksheets = await getWorksheets();
  worksheets.unshift(worksheet);
  await AsyncStorage.setItem(KEYS.WORKSHEETS, JSON.stringify(worksheets.slice(0, 20)));
}

// ─── Reset (dev helper) ───────────────────────────────────────────────────────

export async function resetAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
