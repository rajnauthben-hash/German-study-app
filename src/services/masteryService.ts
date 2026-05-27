import AsyncStorage from '@react-native-async-storage/async-storage';
import { MasteryItem } from '../types';

const MASTERY_KEY = '@deutschsnap/mastery';

export async function getMasteryItems(): Promise<MasteryItem[]> {
  try {
    const json = await AsyncStorage.getItem(MASTERY_KEY);
    return json ? (JSON.parse(json) as MasteryItem[]) : [];
  } catch { return []; }
}

export async function updateMasteryItem(
  itemId: string,
  itemType: MasteryItem['itemType'],
  studySetId: string,
  wasCorrect: boolean
): Promise<void> {
  const items = await getMasteryItems();
  const idx = items.findIndex(m => m.itemId === itemId);
  const now = new Date();

  if (idx >= 0) {
    const item = items[idx];
    const timesCorrect = item.timesCorrect + (wasCorrect ? 1 : 0);
    const timesWrong = item.timesWrong + (wasCorrect ? 0 : 1);
    const total = timesCorrect + timesWrong;
    const masteryScore = Math.round((timesCorrect / total) * 100);
    // Simple spaced repetition: next review in 1, 3, 7, 14, 30 days
    const intervals = [1, 3, 7, 14, 30];
    const intervalIndex = Math.min(Math.floor(timesCorrect / 2), intervals.length - 1);
    const daysUntilReview = wasCorrect ? intervals[intervalIndex] : 1;
    const nextReview = new Date(now.getTime() + daysUntilReview * 86400000);

    items[idx] = {
      ...item,
      timesCorrect,
      timesWrong,
      lastReviewed: now.toISOString(),
      nextReviewDate: nextReview.toISOString(),
      masteryScore,
    };
  } else {
    const nextReview = new Date(now.getTime() + (wasCorrect ? 3 : 1) * 86400000);
    items.push({
      itemId,
      itemType,
      studySetId,
      timesCorrect: wasCorrect ? 1 : 0,
      timesWrong: wasCorrect ? 0 : 1,
      lastReviewed: now.toISOString(),
      nextReviewDate: nextReview.toISOString(),
      masteryScore: wasCorrect ? 100 : 0,
    });
  }

  await AsyncStorage.setItem(MASTERY_KEY, JSON.stringify(items));
}

export async function getItemsDueForReview(): Promise<MasteryItem[]> {
  const items = await getMasteryItems();
  const now = new Date();
  return items.filter(m => new Date(m.nextReviewDate) <= now && m.masteryScore < 90);
}
