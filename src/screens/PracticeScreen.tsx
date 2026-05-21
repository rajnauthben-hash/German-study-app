import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, StudySet } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { getStudySetById } from '../services/storageService';
import { PRACTICE_MODES } from '../data/sampleData';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteT = RouteProp<RootStackParamList, 'Practice'>;

const MODE_TO_SCREEN: Record<string, keyof RootStackParamList> = {
  flashcards: 'Flashcards',
  quiz: 'Quiz',
  'fill-blank': 'FillBlank',
  'sentence-build': 'SentenceBuilder',
};

export default function PracticeScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const [studySet, setStudySet] = useState<StudySet | null>(null);

  useEffect(() => {
    const load = async () => {
      const set = await getStudySetById(route.params.studySetId);
      setStudySet(set);
    };
    load();
  }, [route.params.studySetId]);

  const handleMode = (modeId: string) => {
    if (!studySet) return;
    if (modeId === 'translate-de-en' || modeId === 'translate-en-de') {
      navigation.navigate('Quiz', { studySetId: studySet.id });
      return;
    }
    const screen = MODE_TO_SCREEN[modeId];
    if (screen) {
      navigation.navigate(screen as any, { studySetId: studySet.id });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Practice Mode</Text>
          {studySet && <Text style={styles.headerSub}>{studySet.title}</Text>}
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Choose how to practice</Text>
        <Text style={styles.sectionSub}>Each mode helps you practice in a different way.</Text>

        {PRACTICE_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={styles.modeCard}
            onPress={() => handleMode(mode.id)}
            activeOpacity={0.85}
          >
            <View style={[styles.modeIconBg, { backgroundColor: mode.color + '22' }]}>
              <Text style={styles.modeIcon}>{mode.icon}</Text>
            </View>
            <View style={styles.modeInfo}>
              <Text style={styles.modeLabel}>{mode.label}</Text>
              <Text style={styles.modeSub}>{mode.description}</Text>
            </View>
            <Text style={[styles.modeArrow, { color: mode.color }]}>→</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.modeCard, { borderColor: Colors.error + '44', borderWidth: 2 }]}
          onPress={() => navigation.navigate('MistakeReview', { studySetId: studySet?.id })}
          activeOpacity={0.85}
        >
          <View style={[styles.modeIconBg, { backgroundColor: Colors.errorLight }]}>
            <Text style={styles.modeIcon}>🔁</Text>
          </View>
          <View style={styles.modeInfo}>
            <Text style={styles.modeLabel}>Mistake Review</Text>
            <Text style={styles.modeSub}>Practice questions you got wrong</Text>
          </View>
          <Text style={[styles.modeArrow, { color: Colors.error }]}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeworkCard}
          onPress={() => studySet && navigation.navigate('HomeworkHelper', { studySetId: studySet.id })}
          activeOpacity={0.85}
        >
          <Text style={styles.homeworkIcon}>📝</Text>
          <View style={styles.modeInfo}>
            <Text style={[styles.modeLabel, { color: Colors.textOnPrimary }]}>Homework Helper</Text>
            <Text style={[styles.modeSub, { color: 'rgba(255,255,255,0.8)' }]}>Step-by-step guided assistance</Text>
          </View>
          <Text style={[styles.modeArrow, { color: Colors.textOnPrimary }]}>→</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.xs },
  backArrow: { fontSize: 22, color: Colors.primary },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.text },
  headerSub: { fontSize: Typography.fontSizeXS, color: Colors.textLight },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  sectionTitle: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold, color: Colors.text, marginTop: Spacing.xl, marginBottom: Spacing.xs },
  sectionSub: { fontSize: Typography.fontSizeSM, color: Colors.textLight, marginBottom: Spacing.xl },
  modeCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.small,
  },
  modeIconBg: { width: 52, height: 52, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  modeIcon: { fontSize: 26 },
  modeInfo: { flex: 1 },
  modeLabel: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightSemiBold, color: Colors.text, marginBottom: 2 },
  modeSub: { fontSize: Typography.fontSizeSM, color: Colors.textLight },
  modeArrow: { fontSize: 20 },
  homeworkCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.success,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.medium,
  },
  homeworkIcon: { fontSize: 26, marginRight: Spacing.md },
});
