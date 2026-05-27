import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { RootStackParamList } from '../types';

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'SessionSummary'>;

export default function SessionSummaryScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { score, totalQuestions, correctAnswers, studySetId, studySetTitle, mode } = route.params;

  const emoji = score >= 90 ? '🏆' : score >= 70 ? '⭐' : score >= 50 ? '👍' : '💪';
  const message = score >= 90 ? 'Outstanding!' : score >= 70 ? 'Great job!' : score >= 50 ? 'Good effort!' : 'Keep practicing!';
  const scoreColor = score >= 80 ? Colors.success : score >= 50 ? Colors.warning : Colors.error;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.setTitle}>{studySetTitle}</Text>
        <Text style={styles.modeLabel}>{mode}</Text>

        <View style={[styles.scoreBig, { backgroundColor: scoreColor }]}>
          <Text style={styles.scoreNumber}>{score}%</Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{correctAnswers}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalQuestions - correctAnswers}</Text>
            <Text style={styles.statLabel}>Incorrect</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalQuestions}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {(totalQuestions - correctAnswers) > 0 && (
          <View style={styles.mistakesNote}>
            <Text style={styles.mistakesNoteText}>
              {totalQuestions - correctAnswers} question{totalQuestions - correctAnswers !== 1 ? 's' : ''} added to Mistake Review
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Practice', { studySetId })}
          >
            <Text style={styles.primaryBtnText}>Practice Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => navigation.navigate('StudySet', { studySetId })}
          >
            <Text style={styles.outlineBtnText}>Back to Study Set</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => navigation.navigate('Main')}
          >
            <Text style={styles.ghostBtnText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { alignItems: 'center', padding: Spacing.xxl },
  emoji: { fontSize: 72, marginTop: Spacing.xxl, marginBottom: Spacing.lg },
  message: { fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightExtraBold, color: Colors.text, marginBottom: Spacing.sm },
  setTitle: { fontSize: Typography.fontSizeMD, color: Colors.textSecondary, marginBottom: 4 },
  modeLabel: { fontSize: Typography.fontSizeSM, color: Colors.textLight, marginBottom: Spacing.xxl },
  scoreBig: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xxl, ...Shadows.large },
  scoreNumber: { fontSize: 42, fontWeight: Typography.fontWeightExtraBold, color: '#fff' },
  scoreLabel: { fontSize: Typography.fontSizeSM, color: 'rgba(255,255,255,0.85)', fontWeight: Typography.fontWeightSemiBold },
  statsRow: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.xxl },
  statBox: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', minWidth: 80, ...Shadows.small },
  statValue: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightExtraBold, color: Colors.text },
  statLabel: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary, marginTop: 2 },
  mistakesNote: { backgroundColor: Colors.warningLight, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.xxl, width: '100%' },
  mistakesNoteText: { fontSize: Typography.fontSizeSM, color: Colors.warning, fontWeight: Typography.fontWeightMedium, textAlign: 'center' },
  actions: { width: '100%', gap: Spacing.md },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, padding: Spacing.lg, alignItems: 'center', ...Shadows.medium },
  primaryBtnText: { color: '#fff', fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeLG },
  outlineBtn: { borderWidth: 2, borderColor: Colors.primary, borderRadius: BorderRadius.full, padding: Spacing.lg, alignItems: 'center' },
  outlineBtnText: { color: Colors.primary, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
  ghostBtn: { alignItems: 'center', padding: Spacing.md },
  ghostBtnText: { color: Colors.textLight, fontSize: Typography.fontSizeMD },
});
