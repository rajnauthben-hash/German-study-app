import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { getStudySets } from '../services/storageService';
import { GrammarTopic } from '../types';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';

const CATEGORY_COLORS: Record<string, string> = {
  'Modal Verbs': Colors.primary,
  'Perfekt': Colors.success,
  'Cases': Colors.secondary,
  'Articles': '#9C27B0',
  'Word Order': Colors.warning,
  'Other': Colors.textLight,
};

export default function GrammarHubScreen() {
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    loadTopics();
  }, []));

  const loadTopics = async () => {
    const sets = await getStudySets();
    const all: GrammarTopic[] = [];
    const seen = new Set<string>();
    sets.forEach(set => {
      set.grammarTopics.forEach(g => {
        if (!seen.has(g.title.toLowerCase())) {
          seen.add(g.title.toLowerCase());
          all.push(g);
        }
      });
    });
    setTopics(all);
  };

  const getColor = (title: string) => {
    const key = Object.keys(CATEGORY_COLORS).find(k => title.toLowerCase().includes(k.toLowerCase()));
    return key ? CATEGORY_COLORS[key] : CATEGORY_COLORS['Other'];
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="Grammar Hub" showBack />
      {topics.length === 0 ? (
        <EmptyState icon="📐" title="No Grammar Topics Yet" description="Scan worksheets to build your grammar reference library." />
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>Grammar rules from all your study sets, in one place.</Text>
          {topics.map(topic => (
            <TouchableOpacity
              key={topic.id}
              style={[styles.card, { borderLeftColor: getColor(topic.title), borderLeftWidth: 4 }]}
              onPress={() => setExpanded(expanded === topic.id ? null : topic.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.topicTitle, { color: getColor(topic.title) }]}>{topic.title}</Text>
                <Text style={styles.chevron}>{expanded === topic.id ? '▲' : '▼'}</Text>
              </View>
              {expanded === topic.id && (
                <View style={styles.expandedContent}>
                  <Text style={styles.rule}>{topic.rule}</Text>
                  {topic.tip && (
                    <View style={styles.tipBox}>
                      <Text style={styles.tipText}>Tip: {topic.tip}</Text>
                    </View>
                  )}
                  {topic.examples.length > 0 && (
                    <View style={styles.examples}>
                      <Text style={styles.examplesTitle}>Examples:</Text>
                      {topic.examples.map((ex, i) => (
                        <View key={i} style={styles.exampleRow}>
                          <Text style={styles.exGerman}>{ex.german}</Text>
                          <Text style={styles.exEnglish}>{ex.english}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  intro: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginVertical: Spacing.lg },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.small },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topicTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, flex: 1 },
  chevron: { fontSize: 12, color: Colors.textLight },
  expandedContent: { marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },
  rule: { fontSize: Typography.fontSizeSM, color: Colors.text, lineHeight: 20, marginBottom: Spacing.md },
  tipBox: { backgroundColor: Colors.accentLight, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md },
  tipText: { fontSize: Typography.fontSizeSM, color: Colors.warning, fontWeight: Typography.fontWeightMedium },
  examples: {},
  examplesTitle: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightBold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  exampleRow: { marginBottom: Spacing.sm },
  exGerman: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold, color: Colors.primary },
  exEnglish: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary },
});
