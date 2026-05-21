import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { StudySet } from '../types';
import ProgressBar from './ProgressBar';

interface Props {
  studySet: StudySet;
  onPress: () => void;
  compact?: boolean;
}

export default function StudySetCard({ studySet, onPress, compact = false }: Props) {
  const wordCount = studySet.vocabulary.length;
  const lastStudied = studySet.lastStudied
    ? formatRelativeDate(new Date(studySet.lastStudied))
    : 'Not studied yet';

  return (
    <TouchableOpacity style={[styles.card, compact && styles.compactCard]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.topRow}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>📄</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>{studySet.title}</Text>
          <Text style={styles.topic} numberOfLines={1}>{studySet.topic}</Text>
        </View>
        {studySet.bestQuizScore !== undefined && (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{studySet.bestQuizScore}%</Text>
          </View>
        )}
      </View>

      {!compact && (
        <>
          <ProgressBar
            progress={studySet.masteryLevel}
            color={getMasteryColor(studySet.masteryLevel)}
            height={6}
            showLabel
            label="Mastery"
          />
          <View style={styles.bottomRow}>
            <Text style={styles.stat}>📖 {wordCount} words</Text>
            <Text style={styles.stat}>🕐 {lastStudied}</Text>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

function getMasteryColor(level: number): string {
  if (level >= 80) return Colors.success;
  if (level >= 50) return Colors.warning;
  return Colors.primary;
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  compactCard: {
    padding: Spacing.md,
    marginRight: Spacing.md,
    width: 200,
    marginBottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  icon: {
    fontSize: 22,
  },
  meta: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.text,
    marginBottom: 2,
  },
  topic: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textLight,
  },
  scoreBadge: {
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  scoreText: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
    color: Colors.success,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  stat: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textLight,
  },
});
