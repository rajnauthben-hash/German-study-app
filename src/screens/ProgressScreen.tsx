import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, UserProgress } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { getUserProgress } from '../services/storageService';
import { getStreakMessage, getOverallAccuracy, getWeeklyStudyDays } from '../services/progressService';
import ProgressBar from '../components/ProgressBar';
import StatCard from '../components/StatCard';

type Nav = StackNavigationProp<RootStackParamList>;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ProgressScreen() {
  const navigation = useNavigation<Nav>();
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const p = await getUserProgress();
        setProgress(p);
      };
      load();
    }, [])
  );

  if (!progress) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}><Text style={styles.loadingText}>Loading progress…</Text></View>
      </SafeAreaView>
    );
  }

  const accuracy = getOverallAccuracy(progress);
  const weekDays = getWeeklyStudyDays(progress);
  const unlockedAchievements = progress.achievements.filter((a) => a.isUnlocked);
  const lockedAchievements = progress.achievements.filter((a) => !a.isUnlocked);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>Keep up the great work! 🌟</Text>
        </View>

        {/* Streak card */}
        <View style={styles.streakCard}>
          <View style={styles.streakLeft}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View>
              <Text style={styles.streakNum}>{progress.currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
          </View>
          <View style={styles.streakRight}>
            <Text style={styles.streakMessage}>{getStreakMessage(progress.currentStreak)}</Text>
            <Text style={styles.longestStreak}>Longest: {progress.longestStreak} days</Text>
          </View>
        </View>

        {/* Weekly activity */}
        <View style={styles.weekCard}>
          <Text style={styles.cardTitle}>This Week</Text>
          <View style={styles.weekRow}>
            {DAYS.map((day, i) => (
              <View key={day} style={styles.dayCol}>
                <View style={[styles.dayDot, weekDays[i] && styles.dayDotActive]} />
                <Text style={styles.dayLabel}>{day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard icon="📖" value={progress.totalWordsLearned} label="Words" color={Colors.primary} />
          <StatCard icon="📄" value={progress.totalWorksheetsScanned} label="Sheets" color={Colors.secondary} />
          <StatCard icon="✅" value={progress.totalQuizzesTaken} label="Quizzes" color={Colors.success} />
        </View>

        {/* Accuracy */}
        <View style={styles.accuracyCard}>
          <Text style={styles.cardTitle}>Overall Accuracy</Text>
          <ProgressBar
            progress={accuracy}
            color={accuracy >= 80 ? Colors.success : accuracy >= 60 ? Colors.warning : Colors.error}
            height={12}
            showLabel
            label={`${progress.totalCorrectAnswers} / ${progress.totalQuestions} correct`}
          />
        </View>

        {/* Topics needing review */}
        {progress.topicsNeedingReview.length > 0 && (
          <View style={[styles.reviewCard, { borderLeftColor: Colors.warning }]}>
            <Text style={styles.cardTitle}>⚠️ Topics to Review</Text>
            {progress.topicsNeedingReview.map((topic, i) => (
              <Text key={i} style={styles.reviewItem}>• {topic}</Text>
            ))}
          </View>
        )}

        {/* Mistake review CTA */}
        <TouchableOpacity
          style={styles.mistakeCTA}
          onPress={() => navigation.navigate('MistakeReview', {})}
        >
          <Text style={styles.mistakeCTAIcon}>🔁</Text>
          <View>
            <Text style={styles.mistakeCTATitle}>Review Your Mistakes</Text>
            <Text style={styles.mistakeCTASub}>Practice questions you got wrong</Text>
          </View>
          <Text style={styles.mistakeCTAArrow}>→</Text>
        </TouchableOpacity>

        {/* Recent history */}
        {progress.studyHistory.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {progress.studyHistory.slice(0, 5).map((entry, i) => (
              <View key={i} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyTitle}>{entry.studySetTitle}</Text>
                  <Text style={styles.historyMeta}>{entry.mode} · {formatDate(entry.date)}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={[styles.historyScore, { color: entry.quizScore >= 80 ? Colors.success : entry.quizScore >= 60 ? Colors.warning : Colors.error }]}>
                    {entry.quizScore}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Achievements */}
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsGrid}>
          {unlockedAchievements.map((ach) => (
            <View key={ach.id} style={[styles.achCard, styles.achCardUnlocked]}>
              <Text style={styles.achIcon}>{ach.icon}</Text>
              <Text style={styles.achTitle}>{ach.title}</Text>
              <Text style={styles.achDesc}>{ach.description}</Text>
            </View>
          ))}
          {lockedAchievements.map((ach) => (
            <View key={ach.id} style={[styles.achCard, styles.achCardLocked]}>
              <Text style={[styles.achIcon, { opacity: 0.3 }]}>{ach.icon}</Text>
              <Text style={[styles.achTitle, { color: Colors.textLight }]}>{ach.title}</Text>
              <Text style={[styles.achDesc, { color: Colors.textLight }]}>{ach.description}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: Typography.fontSizeMD, color: Colors.textLight },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  header: { paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  title: { fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightExtraBold, color: Colors.text },
  subtitle: { fontSize: Typography.fontSizeMD, color: Colors.textSecondary, marginTop: 2 },
  streakCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl, padding: Spacing.xl, marginBottom: Spacing.md, ...Shadows.medium,
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', marginRight: Spacing.lg },
  streakEmoji: { fontSize: 40, marginRight: Spacing.md },
  streakNum: { fontSize: Typography.fontSize3XL, fontWeight: Typography.fontWeightExtraBold, color: '#fff' },
  streakLabel: { fontSize: Typography.fontSizeSM, color: 'rgba(255,255,255,0.8)' },
  streakRight: { flex: 1 },
  streakMessage: { fontSize: Typography.fontSizeSM, color: '#fff', fontWeight: Typography.fontWeightMedium, marginBottom: 4 },
  longestStreak: { fontSize: Typography.fontSizeXS, color: 'rgba(255,255,255,0.7)' },
  weekCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.small },
  cardTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.md },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: Spacing.xs },
  dayDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.border },
  dayDotActive: { backgroundColor: Colors.primary },
  dayLabel: { fontSize: Typography.fontSizeXS, color: Colors.textLight },
  statsRow: { flexDirection: 'row', marginBottom: Spacing.md, marginHorizontal: -Spacing.xs },
  accuracyCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.small },
  reviewCard: {
    backgroundColor: Colors.warningLight, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    marginBottom: Spacing.md, borderLeftWidth: 4,
  },
  reviewItem: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginBottom: 3 },
  mistakeCTA: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.xl,
    borderWidth: 2, borderColor: Colors.error + '44', ...Shadows.small,
  },
  mistakeCTAIcon: { fontSize: 26, marginRight: Spacing.md },
  mistakeCTATitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text },
  mistakeCTASub: { fontSize: Typography.fontSizeSM, color: Colors.textLight },
  mistakeCTAArrow: { fontSize: 20, color: Colors.error, marginLeft: 'auto' },
  sectionTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.md },
  historyCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.small,
  },
  historyLeft: { flex: 1 },
  historyTitle: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold, color: Colors.text },
  historyMeta: { fontSize: Typography.fontSizeXS, color: Colors.textLight, textTransform: 'capitalize' },
  historyRight: { marginLeft: Spacing.md },
  historyScore: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightExtraBold },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.md },
  achCard: { width: '47%', borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', ...Shadows.small },
  achCardUnlocked: { backgroundColor: Colors.card },
  achCardLocked: { backgroundColor: Colors.background, borderWidth: 2, borderColor: Colors.border },
  achIcon: { fontSize: 32, marginBottom: Spacing.xs },
  achTitle: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightBold, color: Colors.text, textAlign: 'center', marginBottom: 2 },
  achDesc: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary, textAlign: 'center' },
});
