import { UserProgress, Achievement } from '../types';
import { getUserProgress, saveUserProgress } from './storageService';

// ─── Achievement Definitions ──────────────────────────────────────────────────

const ACHIEVEMENT_DEFS = [
  { id: 'a-001', title: 'First Scan', description: 'Scanned your first German worksheet', icon: '📸', condition: (p: UserProgress) => p.totalWorksheetsScanned >= 1 },
  { id: 'a-002', title: 'Vocab Star', description: 'Learned 10 German words', icon: '⭐', condition: (p: UserProgress) => p.totalWordsLearned >= 10 },
  { id: 'a-003', title: '3-Day Streak', description: 'Studied 3 days in a row', icon: '🔥', condition: (p: UserProgress) => p.currentStreak >= 3 },
  { id: 'a-004', title: 'Quiz Master', description: 'Score 100% on any quiz', icon: '🏆', condition: (p: UserProgress) => p.studyHistory.some((h) => h.quizScore === 100) },
  { id: 'a-005', title: 'Grammar Guru', description: 'Study 5 different worksheets', icon: '📚', condition: (p: UserProgress) => p.totalWorksheetsScanned >= 5 },
  { id: 'a-006', title: '7-Day Streak', description: 'Studied 7 days in a row', icon: '💎', condition: (p: UserProgress) => p.currentStreak >= 7 },
  { id: 'a-007', title: 'Vocab Master', description: 'Learned 50 German words', icon: '🧠', condition: (p: UserProgress) => p.totalWordsLearned >= 50 },
  { id: 'a-008', title: 'Determined', description: 'Taken 10 quizzes', icon: '🎯', condition: (p: UserProgress) => p.totalQuizzesTaken >= 10 },
];

// ─── Check and unlock achievements ───────────────────────────────────────────

export async function checkAndUnlockAchievements(progress: UserProgress): Promise<{
  progress: UserProgress;
  newlyUnlocked: Achievement[];
}> {
  const newlyUnlocked: Achievement[] = [];
  const unlockedIds = new Set(progress.achievements.filter((a) => a.isUnlocked).map((a) => a.id));

  const updatedAchievements: Achievement[] = ACHIEVEMENT_DEFS.map((def) => {
    const existing = progress.achievements.find((a) => a.id === def.id);
    if (existing?.isUnlocked) return existing;

    const shouldUnlock = def.condition(progress);
    if (shouldUnlock && !unlockedIds.has(def.id)) {
      const unlocked: Achievement = {
        id: def.id,
        title: def.title,
        description: def.description,
        icon: def.icon,
        isUnlocked: true,
        unlockedAt: new Date().toISOString(),
      };
      newlyUnlocked.push(unlocked);
      return unlocked;
    }

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      isUnlocked: existing?.isUnlocked ?? false,
      unlockedAt: existing?.unlockedAt,
    };
  });

  const updatedProgress = { ...progress, achievements: updatedAchievements };

  if (newlyUnlocked.length > 0) {
    await saveUserProgress(updatedProgress);
  }

  return { progress: updatedProgress, newlyUnlocked };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getOverallAccuracy(progress: UserProgress): number {
  if (progress.totalQuestions === 0) return 0;
  return Math.round((progress.totalCorrectAnswers / progress.totalQuestions) * 100);
}

export function getStreakMessage(streak: number): string {
  if (streak === 0) return 'Start your streak today!';
  if (streak === 1) return '1 day streak – keep it up!';
  if (streak < 7) return `${streak} day streak – you\'re on a roll! 🔥`;
  if (streak < 30) return `${streak} day streak – amazing! 💎`;
  return `${streak} day streak – unbelievable! 🌟`;
}

export function getWeeklyStudyDays(progress: UserProgress): boolean[] {
  const days = Array(7).fill(false);
  const now = new Date();

  progress.studyHistory.forEach((entry) => {
    const entryDate = new Date(entry.date);
    const diffDays = Math.floor((now.getTime() - entryDate.getTime()) / 86400000);
    if (diffDays < 7) {
      days[6 - diffDays] = true;
    }
  });

  return days;
}
