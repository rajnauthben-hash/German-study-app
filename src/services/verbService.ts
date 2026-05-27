import AsyncStorage from '@react-native-async-storage/async-storage';
import { VerbItem } from '../types';

const VERBS_KEY = '@deutschsnap/verbs';

// Common German verbs as seed data
const COMMON_VERBS: VerbItem[] = [
  {
    infinitive: 'sein', english: 'to be',
    conjugations: { ich: 'bin', du: 'bist', erSieEs: 'ist', wir: 'sind', ihr: 'seid', sieSie: 'sind' },
    isRegular: false, exampleSentence: 'Ich bin Student.', studySetIds: [],
  },
  {
    infinitive: 'haben', english: 'to have',
    conjugations: { ich: 'habe', du: 'hast', erSieEs: 'hat', wir: 'haben', ihr: 'habt', sieSie: 'haben' },
    isRegular: false, exampleSentence: 'Ich habe ein Buch.', studySetIds: [],
  },
  {
    infinitive: 'gehen', english: 'to go',
    conjugations: { ich: 'gehe', du: 'gehst', erSieEs: 'geht', wir: 'gehen', ihr: 'geht', sieSie: 'gehen' },
    isRegular: true, exampleSentence: 'Ich gehe zur Schule.', studySetIds: [],
  },
  {
    infinitive: 'machen', english: 'to make / to do',
    conjugations: { ich: 'mache', du: 'machst', erSieEs: 'macht', wir: 'machen', ihr: 'macht', sieSie: 'machen' },
    isRegular: true, exampleSentence: 'Was machst du?', studySetIds: [],
  },
  {
    infinitive: 'können', english: 'can / to be able to',
    conjugations: { ich: 'kann', du: 'kannst', erSieEs: 'kann', wir: 'können', ihr: 'könnt', sieSie: 'können' },
    isRegular: false, exampleSentence: 'Ich kann Deutsch sprechen.', studySetIds: [],
  },
  {
    infinitive: 'müssen', english: 'must / have to',
    conjugations: { ich: 'muss', du: 'musst', erSieEs: 'muss', wir: 'müssen', ihr: 'müsst', sieSie: 'müssen' },
    isRegular: false, exampleSentence: 'Du musst lernen.', studySetIds: [],
  },
  {
    infinitive: 'sprechen', english: 'to speak',
    conjugations: { ich: 'spreche', du: 'sprichst', erSieEs: 'spricht', wir: 'sprechen', ihr: 'sprecht', sieSie: 'sprechen' },
    isRegular: false, exampleSentence: 'Er spricht Deutsch.', studySetIds: [],
  },
  {
    infinitive: 'lernen', english: 'to learn',
    conjugations: { ich: 'lerne', du: 'lernst', erSieEs: 'lernt', wir: 'lernen', ihr: 'lernt', sieSie: 'lernen' },
    isRegular: true, exampleSentence: 'Wir lernen Deutsch.', studySetIds: [],
  },
];

export async function getVerbs(): Promise<VerbItem[]> {
  try {
    const json = await AsyncStorage.getItem(VERBS_KEY);
    if (json) return JSON.parse(json) as VerbItem[];
    await AsyncStorage.setItem(VERBS_KEY, JSON.stringify(COMMON_VERBS));
    return COMMON_VERBS;
  } catch { return COMMON_VERBS; }
}

export async function addVerbsFromStudySet(studySetId: string, verbs: VerbItem[]): Promise<void> {
  const existing = await getVerbs();
  const updated = [...existing];

  verbs.forEach(verb => {
    const idx = updated.findIndex(v => v.infinitive === verb.infinitive);
    if (idx >= 0) {
      if (!updated[idx].studySetIds.includes(studySetId)) {
        updated[idx].studySetIds.push(studySetId);
      }
    } else {
      updated.push({ ...verb, studySetIds: [studySetId] });
    }
  });

  await AsyncStorage.setItem(VERBS_KEY, JSON.stringify(updated));
}
