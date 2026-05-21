import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, StudySet, UserProgress } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { getStudySets, getUserProgress } from '../services/storageService';
import { getStreakMessage, getOverallAccuracy } from '../services/progressService';
import StudySetCard from '../components/StudySetCard';
import StatCard from '../components/StatCard';

type Nav = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [sets, prog] = await Promise.all([getStudySets(), getUserProgress()]);
    setStudySets(sets);
    setProgress(prog);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const recentSets = studySets.slice(0, 5);
  const accuracy = progress ? getOverallAccuracy(progress) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hallo! 👋</Text>
            <Text style={styles.subtitle}>Ready to study German today?</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={styles.streakCount}>{progress?.currentStreak ?? 0}</Text>
          </View>
        </View>

        {/* Streak message */}
        {progress && (
          <View style={styles.streakBanner}>
            <Text style={styles.streakMessage}>{getStreakMessage(progress.currentStreak)}</Text>
          </View>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard icon="📖" value={progress?.totalWordsLearned ?? 0} label="Words Learned" color={Colors.primary} />
          <StatCard icon="📄" value={progress?.totalWorksheetsScanned ?? 0} label="Worksheets" color={Colors.secondary} />
          <StatCard icon="🎯" value={`${accuracy}%`} label="Accuracy" color={Colors.success} />
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick Start</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
            onPress={() => navigation.navigate('Main', { screen: 'ScanTab' } as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionLabel}>Scan Worksheet</Text>
            <Text style={styles.actionSub}>Take or upload a photo</Text>
          </TouchableOpacity>

          {studySets.length > 0 && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.secondary }]}
              onPress={() => navigation.navigate('Practice', { studySetId: studySets[0].id })}
              activeOpacity={0.85}
            >
              <Text style={styles.actionIcon}>⚡</Text>
              <Text style={styles.actionLabel}>Quick Practice</Text>
              <Text style={styles.actionSub}>Continue where you left off</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Topics to review */}
        {progress && progress.topicsNeedingReview.length > 0 && (
          <View style={styles.reviewBanner}>
            <Text style={styles.reviewTitle}>⚠️ Needs Review</Text>
            {progress.topicsNeedingReview.map((topic, i) => (
              <Text key={i} style={styles.reviewItem}>• {topic}</Text>
            ))}
          </View>
        )}

        {/* Recent study sets */}
        {recentSets.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Recent Study Sets</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'SavedTab' } as any)}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentSets.map((set) => (
              <StudySetCard
                key={set.id}
                studySet={set}
                onPress={() => navigation.navigate('StudySet', { studySetId: set.id })}
              />
            ))}
          </>
        )}

        {studySets.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No study sets yet</Text>
            <Text style={styles.emptyText}>Scan your first German worksheet to get started!</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('Main', { screen: 'ScanTab' } as any)}
            >
              <Text style={styles.emptyBtnText}>Scan a Worksheet</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: Colors.accentLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    minWidth: 56,
  },
  streakFire: { fontSize: 20 },
  streakCount: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.warning,
  },
  streakBanner: {
    backgroundColor: Colors.accentLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  streakMessage: {
    fontSize: Typography.fontSizeSM,
    color: Colors.warning,
    fontWeight: Typography.fontWeightMedium,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    marginHorizontal: -Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  seeAll: {
    fontSize: Typography.fontSizeSM,
    color: Colors.primary,
    fontWeight: Typography.fontWeightSemiBold,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionBtn: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  actionIcon: { fontSize: 28, marginBottom: Spacing.sm },
  actionLabel: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textOnPrimary,
    marginBottom: 3,
  },
  actionSub: {
    fontSize: Typography.fontSizeXS,
    color: 'rgba(255,255,255,0.8)',
  },
  reviewBanner: {
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  reviewTitle: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
    color: Colors.warning,
    marginBottom: Spacing.sm,
  },
  reviewItem: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyIcon: { fontSize: 64, marginBottom: Spacing.lg },
  emptyTitle: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  emptyBtnText: {
    color: Colors.textOnPrimary,
    fontWeight: Typography.fontWeightBold,
    fontSize: Typography.fontSizeMD,
  },
});
