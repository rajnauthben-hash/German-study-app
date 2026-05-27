import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings } from '../types';

const SETTINGS_KEY = '@deutschsnap/settings';

const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Student',
  germanLevel: 'A2',
  dailyGoalMinutes: 15,
  preferredPracticeMode: 'flashcards',
  apiBaseUrl: 'http://localhost:3000',
  theme: 'light',
};

export async function getSettings(): Promise<UserSettings> {
  try {
    const json = await AsyncStorage.getItem(SETTINGS_KEY);
    if (json) {
      const saved = JSON.parse(json) as Partial<UserSettings>;
      return { ...DEFAULT_SETTINGS, ...saved };
    }
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function resetSettings(): Promise<void> {
  await AsyncStorage.removeItem(SETTINGS_KEY);
}
