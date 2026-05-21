import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, StudySet } from '../types';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { getStudySets } from '../services/storageService';
import StudySetCard from '../components/StudySetCard';

type Nav = StackNavigationProp<RootStackParamList>;

export default function SavedSetsScreen() {
  const navigation = useNavigation<Nav>();
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const sets = await getStudySets();
        setStudySets(sets);
      };
      load();
    }, [])
  );

  const filtered = studySets.filter(
    (s) =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.topic.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Saved Study Sets</Text>
        <Text style={styles.subtitle}>{studySets.length} worksheet{studySets.length !== 1 ? 's' : ''} saved</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search study sets…"
            placeholderTextColor={Colors.textLight}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          {studySets.length === 0 ? (
            <>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyTitle}>No study sets yet</Text>
              <Text style={styles.emptyText}>Scan your first German worksheet to create a study set.</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('Main', { screen: 'ScanTab' } as any)}
              >
                <Text style={styles.emptyBtnText}>📷 Scan a Worksheet</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No results</Text>
              <Text style={styles.emptyText}>No study sets match "{query}"</Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StudySetCard
              studySet={item}
              onPress={() => navigation.navigate('StudySet', { studySetId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  title: { fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightExtraBold, color: Colors.text },
  subtitle: { fontSize: Typography.fontSizeSM, color: Colors.textLight, marginTop: 2 },
  searchRow: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSizeMD,
    color: Colors.text,
  },
  clearIcon: { fontSize: 14, color: Colors.textLight, paddingLeft: Spacing.sm },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 32 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyIcon: { fontSize: 64, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.sm },
  emptyText: { fontSize: Typography.fontSizeMD, color: Colors.textLight, textAlign: 'center', marginBottom: Spacing.xl },
  emptyBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md },
  emptyBtnText: { color: Colors.textOnPrimary, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
});
