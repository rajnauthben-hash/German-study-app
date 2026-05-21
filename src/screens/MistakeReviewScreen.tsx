import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, MistakeReviewItem } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { getMistakes, removeMistake } from '../services/storageService';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteT = RouteProp<RootStackParamList, 'MistakeReview'>;

export default function MistakeReviewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const [mistakes, setMistakes] = useState<MistakeReviewItem[]>([]);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      const all = await getMistakes();
      const filtered = route.params?.studySetId
        ? all.filter((m) => m.studySetId === route.params.studySetId)
        : all;
      setMistakes(filtered);
    };
    load();
  }, []);

  const handleReveal = (id: string) => {
    setRevealedIds((prev) => new Set([...prev, id]));
  };

  const handleMarkFixed = async (id: string) => {
    await removeMistake(id);
    setMistakes((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mistake Review</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll}>
        <Text style={styles.intro}>
          {mistakes.length > 0
            ? `Review ${mistakes.length} mistake${mistakes.length !== 1 ? 's' : ''} and mark them as fixed when you're confident.`
            : 'No mistakes to review! Keep studying to track any errors.'}
        </Text>

        {mistakes.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>All clear!</Text>
            <Text style={styles.emptyText}>You haven't made any mistakes yet — or you've fixed them all!</Text>
          </View>
        )}

        {mistakes.map((mistake) => (
          <View key={mistake.id} style={styles.mistakeCard}>
            <View style={styles.mistakeHeader}>
              <Text style={styles.studySetName}>{mistake.studySetTitle}</Text>
              <Text style={styles.reviewCount}>{mistake.reviewCount}× reviewed</Text>
            </View>

            <Text style={styles.question}>{mistake.question}</Text>

            <View style={styles.answerRow}>
              <Text style={styles.yourAnswerLabel}>Your answer:</Text>
              <Text style={styles.yourAnswer}>{mistake.userAnswer}</Text>
            </View>

            {revealedIds.has(mistake.id) ? (
              <View>
                <View style={styles.correctRow}>
                  <Text style={styles.correctLabel}>✅ Correct answer:</Text>
                  <Text style={styles.correctAnswer}>{mistake.correctAnswer}</Text>
                </View>
                <TouchableOpacity
                  style={styles.fixedBtn}
                  onPress={() => handleMarkFixed(mistake.id)}
                >
                  <Text style={styles.fixedBtnText}>✅ I've got this now – remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.revealBtn} onPress={() => handleReveal(mistake.id)}>
                <Text style={styles.revealBtnText}>👁 Show correct answer</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

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
  headerTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.text },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  intro: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.lg, lineHeight: 20 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyIcon: { fontSize: 64, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.sm },
  emptyText: { fontSize: Typography.fontSizeMD, color: Colors.textLight, textAlign: 'center' },
  mistakeCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    marginBottom: Spacing.md, borderLeftWidth: 4, borderLeftColor: Colors.error, ...Shadows.small,
  },
  mistakeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  studySetName: { fontSize: Typography.fontSizeXS, color: Colors.primary, fontWeight: Typography.fontWeightSemiBold },
  reviewCount: { fontSize: Typography.fontSizeXS, color: Colors.textLight },
  question: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightSemiBold, color: Colors.text, marginBottom: Spacing.md },
  answerRow: { marginBottom: Spacing.md },
  yourAnswerLabel: { fontSize: Typography.fontSizeXS, color: Colors.textLight, marginBottom: 2 },
  yourAnswer: { fontSize: Typography.fontSizeMD, color: Colors.error, fontWeight: Typography.fontWeightMedium },
  correctRow: { marginBottom: Spacing.md },
  correctLabel: { fontSize: Typography.fontSizeXS, color: Colors.success, marginBottom: 2 },
  correctAnswer: { fontSize: Typography.fontSizeMD, color: Colors.success, fontWeight: Typography.fontWeightBold },
  revealBtn: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.md, padding: Spacing.md,
    alignItems: 'center', borderWidth: 2, borderColor: Colors.border,
  },
  revealBtnText: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, fontWeight: Typography.fontWeightMedium },
  fixedBtn: {
    backgroundColor: Colors.successLight, borderRadius: BorderRadius.md, padding: Spacing.md,
    alignItems: 'center', borderWidth: 2, borderColor: Colors.success,
  },
  fixedBtnText: { fontSize: Typography.fontSizeSM, color: Colors.success, fontWeight: Typography.fontWeightBold },
});
