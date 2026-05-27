import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { getStudySets } from '../services/storageService';
import { VocabularyItem } from '../types';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';

type FilterKey = 'all' | 'der' | 'die' | 'das' | 'verb';

export default function VocabularyBankScreen() {
  const [allVocab, setAllVocab] = useState<VocabularyItem[]>([]);
  const [filtered, setFiltered] = useState<VocabularyItem[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  useFocusEffect(useCallback(() => {
    loadVocab();
  }, []));

  const loadVocab = async () => {
    const sets = await getStudySets();
    const vocab: VocabularyItem[] = [];
    const seen = new Set<string>();
    sets.forEach(set => {
      set.vocabulary.forEach(v => {
        if (!seen.has(v.german.toLowerCase())) {
          seen.add(v.german.toLowerCase());
          vocab.push(v);
        }
      });
    });
    setAllVocab(vocab);
    applyFilters(vocab, search, filter);
  };

  const applyFilters = (vocab: VocabularyItem[], q: string, f: FilterKey) => {
    let result = vocab;
    if (q) result = result.filter(v => v.german.toLowerCase().includes(q.toLowerCase()) || v.english.toLowerCase().includes(q.toLowerCase()));
    if (f === 'der') result = result.filter(v => v.article === 'der');
    else if (f === 'die') result = result.filter(v => v.article === 'die');
    else if (f === 'das') result = result.filter(v => v.article === 'das');
    else if (f === 'verb') result = result.filter(v => v.wordType === 'verb' || v.wordType === 'modal');
    setFiltered(result);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    applyFilters(allVocab, text, filter);
  };

  const handleFilter = (f: FilterKey) => {
    setFilter(f);
    applyFilters(allVocab, search, f);
  };

  const articleColor = (article?: string) => {
    if (article === 'der') return Colors.primary;
    if (article === 'die') return Colors.secondary;
    if (article === 'das') return Colors.success;
    return Colors.textLight;
  };

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'der', label: 'der' },
    { key: 'die', label: 'die' }, { key: 'das', label: 'das' }, { key: 'verb', label: 'Verbs' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="Vocabulary Bank" showBack />
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={handleSearch}
          placeholder="Search words..."
          placeholderTextColor={Colors.textLight}
        />
      </View>
      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity key={f.key} style={[styles.filterChip, filter === f.key && styles.filterChipActive]} onPress={() => handleFilter(f.key)}>
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {allVocab.length === 0 ? (
        <EmptyState icon="📖" title="No Vocabulary Yet" description="Generate a study set from a worksheet to build your vocabulary bank." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item.id || i.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.noResults}>No words match your search.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                {item.article && (
                  <Text style={[styles.article, { color: articleColor(item.article) }]}>{item.article}</Text>
                )}
                <Text style={styles.german}>{item.german}</Text>
                {item.wordType && <Text style={styles.type}>{item.wordType}</Text>}
              </View>
              <Text style={styles.english}>{item.english}</Text>
              {item.exampleSentence && (
                <Text style={styles.example} numberOfLines={2}>"{item.exampleSentence}"</Text>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  searchWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  search: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: Typography.fontSizeMD, color: Colors.text },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold, color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },
  list: { padding: Spacing.lg },
  noResults: { textAlign: 'center', color: Colors.textLight, marginTop: Spacing.xxl },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.small },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  article: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightBold },
  german: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.text, flex: 1 },
  type: { fontSize: Typography.fontSizeXS, color: Colors.textLight, backgroundColor: Colors.background, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  english: { fontSize: Typography.fontSizeMD, color: Colors.success, fontWeight: Typography.fontWeightMedium, marginBottom: Spacing.xs },
  example: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary, fontStyle: 'italic' },
});
