// API client that connects mobile app to the web backend
import { StudySet } from '../types';

const DEFAULT_API_URL = 'http://localhost:3000';

export function getApiBaseUrl(): string {
  // In production, this would come from settings
  return DEFAULT_API_URL;
}

export interface ApiGenerateResult {
  success: boolean;
  studySet?: Partial<StudySet>;
  error?: string;
  isDemo?: boolean;
}

export async function generateStudySetFromBackend(
  text: string,
  apiBaseUrl: string = DEFAULT_API_URL
): Promise<ApiGenerateResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${apiBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json();

    if (!response.ok || data.error) {
      if (data.demo) {
        return { success: false, error: data.error, isDemo: true };
      }
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return { success: true, studySet: data };
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timed out. Check your server is running.' };
      }
      return { success: false, error: error.message || 'Could not reach backend server.' };
    }
    return { success: false, error: 'Could not reach backend server.' };
  }
}

export async function checkApiHealth(apiBaseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${apiBaseUrl}/health`, { method: 'GET' });
    const data = await response.json();
    return data.ok === true;
  } catch {
    return false;
  }
}
