import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { getUserProgress } from '../services/storageService';
import { StudyHistoryEntry, RootStackParamList } from '../types';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';

type Nav = StackNavigationProp<RootStackParamList>;

export default function StudyHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const [history, setHistory] = useState<StudyHistoryEntry[]>([]);

  useFocusEffect(useCallback(() => {
    getUserProgress().then(p => setHistory(p.studyHistory));
  }, []));

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getModeIcon = (mode: string) => {
    const icons: Record<string, string> = { flashcards: '🃏', quiz: '✅', 'fill-blank': '✏️', 'sentence-build': '🧩', 'mistake-review': '🔁' };
    return icons[mode] || '📖';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="Study History" showBack />
      {history.length === 0 ? (
        <EmptyState icon="📅" title="No History Yet" description="Complete a quiz or practice session to see your history here." />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('StudySet', { studySetId: item.studySetId })}
              activeOpacity={0.8}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.modeIcon}>{getModeIcon(item.mode)}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.title} numberOfLines={1}>{item.studySetTitle}</Text>
                <Text style={styles.meta}>{item.mode} · {item.wordsStudied} words</Text>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
              </View>
              {item.quizScore > 0 && (
                <View style={[styles.scoreBadge, { backgroundColor: item.quizScore >= 80 ? Colors.successLight : Colors.warningLight }]}>
                  <Text style={[styles.scoreText, { color: item.quizScore >= 80 ? Colors.success : Colors.warning }]}>{item.quizScore}%</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.small },
  cardLeft: { marginRight: Spacing.md },
  modeIcon: { fontSize: 28 },
  cardBody: { flex: 1 },
  title: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: 2 },
  meta: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary, marginBottom: 2 },
  date: { fontSize: Typography.fontSizeXS, color: Colors.textLight },
  scoreBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  scoreText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightBold },
});
