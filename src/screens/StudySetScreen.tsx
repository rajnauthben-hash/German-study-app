import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, StudySet } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { getStudySetById, deleteStudySet } from '../services/storageService';
import ProgressBar from '../components/ProgressBar';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteT = RouteProp<RootStackParamList, 'StudySet'>;

type Tab = 'overview' | 'vocabulary' | 'grammar' | 'practice';

export default function StudySetScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    const load = async () => {
      const set = await getStudySetById(route.params.studySetId);
      setStudySet(set);
    };
    load();
  }, [route.params.studySetId]);

  if (!studySet) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading study set…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete Study Set', 'Are you sure you want to delete this study set?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteStudySet(studySet.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{studySet.title}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{studySet.topic}</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>

      {/* Mastery bar */}
      <View style={styles.masteryRow}>
        <ProgressBar progress={studySet.masteryLevel} showLabel label="Mastery" color={studySet.masteryLevel >= 80 ? Colors.success : Colors.primary} />
      </View>

      {/* Tab navigation */}
      <View style={styles.tabs}>
        {(['overview', 'vocabulary', 'grammar', 'practice'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Overview tab */}
        {activeTab === 'overview' && (
          <View>
            {/* Start practicing CTA */}
            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: Colors.primary }]}
                onPress={() => navigation.navigate('Flashcards', { studySetId: studySet.id })}
              >
                <Text style={styles.ctaBtnText}>🃏 Flashcards</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: Colors.secondary }]}
                onPress={() => navigation.navigate('Quiz', { studySetId: studySet.id })}
              >
                <Text style={styles.ctaBtnText}>✅ Quiz</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.practiceAllBtn}
              onPress={() => navigation.navigate('Practice', { studySetId: studySet.id })}
            >
              <Text style={styles.practiceAllBtnText}>⚡ All Practice Modes</Text>
            </TouchableOpacity>

            {/* What to memorize */}
            {studySet.toMemorize.length > 0 && (
              <View style={[styles.infoCard, { borderLeftColor: Colors.primary }]}>
                <Text style={styles.infoCardTitle}>🧠 What to Memorize</Text>
                {studySet.toMemorize.map((item, i) => (
                  <Text key={i} style={styles.infoCardItem}>• {item}</Text>
                ))}
              </View>
            )}

            {/* What to understand */}
            {studySet.toUnderstand.length > 0 && (
              <View style={[styles.infoCard, { borderLeftColor: Colors.success }]}>
                <Text style={styles.infoCardTitle}>💡 What to Understand</Text>
                {studySet.toUnderstand.map((item, i) => (
                  <Text key={i} style={styles.infoCardItem}>• {item}</Text>
                ))}
              </View>
            )}

            {/* Practice again */}
            {studySet.toPracticeAgain.length > 0 && (
              <View style={[styles.infoCard, { borderLeftColor: Colors.warning }]}>
                <Text style={styles.infoCardTitle}>🔁 Practice Again</Text>
                {studySet.toPracticeAgain.map((item, i) => (
                  <Text key={i} style={styles.infoCardItem}>• {item}</Text>
                ))}
              </View>
            )}

            {/* Example sentences */}
            {studySet.exampleSentences.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Example Sentences</Text>
                {studySet.exampleSentences.map((s) => (
                  <View key={s.id} style={styles.sentenceCard}>
                    <Text style={styles.sentenceGerman}>{s.german}</Text>
                    <Text style={styles.sentenceEnglish}>{s.english}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Homework helper */}
            {studySet.homeworkQuestions.length > 0 && (
              <TouchableOpacity
                style={styles.homeworkBtn}
                onPress={() => navigation.navigate('HomeworkHelper', { studySetId: studySet.id })}
              >
                <Text style={styles.homeworkBtnIcon}>📝</Text>
                <View>
                  <Text style={styles.homeworkBtnTitle}>Homework Helper</Text>
                  <Text style={styles.homeworkBtnSub}>{studySet.homeworkQuestions.length} questions with guided hints</Text>
                </View>
                <Text style={styles.homeworkArrow}>→</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Vocabulary tab */}
        {activeTab === 'vocabulary' && (
          <View>
            <Text style={styles.tabIntro}>{studySet.vocabulary.length} words to learn</Text>
            {studySet.vocabulary.map((item) => (
              <View key={item.id} style={styles.vocabCard}>
                <View style={styles.vocabTop}>
                  <Text style={styles.vocabGerman}>
                    {item.article ? `${item.article} ` : ''}{item.german}
                  </Text>
                  {item.wordType && (
                    <View style={styles.wordTypeBadge}>
                      <Text style={styles.wordTypeText}>{item.wordType}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.vocabEnglish}>{item.english}</Text>
                {item.pronunciationHint && (
                  <Text style={styles.vocabPronun}>🔊 {item.pronunciationHint}</Text>
                )}
                {item.exampleSentence && (
                  <View style={styles.exampleBox}>
                    <Text style={styles.exampleGerman}>{item.exampleSentence}</Text>
                    <Text style={styles.exampleEnglish}>{item.exampleTranslation}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Grammar tab */}
        {activeTab === 'grammar' && (
          <View>
            <Text style={styles.tabIntro}>{studySet.grammarTopics.length} grammar topics</Text>
            {studySet.grammarTopics.map((topic) => (
              <View key={topic.id} style={styles.grammarCard}>
                <Text style={styles.grammarTitle}>{topic.title}</Text>
                <Text style={styles.grammarRule}>{topic.rule}</Text>
                {topic.examples.map((ex, i) => (
                  <View key={i} style={styles.grammarExample}>
                    <Text style={styles.grammarExDe}>🇩🇪 {ex.german}</Text>
                    <Text style={styles.grammarExEn}>🇬🇧 {ex.english}</Text>
                  </View>
                ))}
                {topic.tip && (
                  <View style={styles.tipRow}>
                    <Text style={styles.tipText}>💡 {topic.tip}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Practice tab */}
        {activeTab === 'practice' && (
          <View>
            <Text style={styles.tabIntro}>Choose a practice mode</Text>
            {[
              { label: 'Flashcards', icon: '🃏', sub: 'Flip cards – German / English', screen: 'Flashcards', color: Colors.primary },
              { label: 'Multiple Choice Quiz', icon: '✅', sub: 'Test your knowledge', screen: 'Quiz', color: Colors.secondary },
              { label: 'Fill in the Blank', icon: '✏️', sub: 'Complete the sentences', screen: 'FillBlank', color: Colors.warning },
              { label: 'Sentence Builder', icon: '🧩', sub: 'Arrange words in order', screen: 'SentenceBuilder', color: '#9C27B0' },
              { label: 'Homework Helper', icon: '📝', sub: 'Step-by-step guided help', screen: 'HomeworkHelper', color: Colors.success },
            ].map((mode) => (
              <TouchableOpacity
                key={mode.screen}
                style={styles.modeCard}
                onPress={() => navigation.navigate(mode.screen as any, { studySetId: studySet.id })}
                activeOpacity={0.85}
              >
                <View style={[styles.modeIcon, { backgroundColor: mode.color + '22' }]}>
                  <Text style={{ fontSize: 22 }}>{mode.icon}</Text>
                </View>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeLabel}>{mode.label}</Text>
                  <Text style={styles.modeSub}>{mode.sub}</Text>
                </View>
                <Text style={[styles.modeArrow, { color: mode.color }]}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: Typography.fontSizeMD, color: Colors.textLight },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  backBtn: { padding: Spacing.xs, marginRight: Spacing.sm },
  backArrow: { fontSize: 22, color: Colors.primary },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.text },
  headerSub: { fontSize: Typography.fontSizeXS, color: Colors.textLight },
  deleteBtn: { padding: Spacing.xs },
  deleteBtnText: { fontSize: 18 },
  masteryRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.card },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary,
  },
  tabText: { fontSize: Typography.fontSizeSM, color: Colors.textLight, fontWeight: Typography.fontWeightMedium },
  tabTextActive: { color: Colors.primary, fontWeight: Typography.fontWeightBold },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  ctaRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  ctaBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.small,
  },
  ctaBtnText: { color: Colors.textOnPrimary, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
  practiceAllBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  practiceAllBtnText: { color: Colors.primary, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
  sectionTitle: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    ...Shadows.small,
  },
  infoCardTitle: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  infoCardItem: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginBottom: 4, lineHeight: 20 },
  sentenceCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  sentenceGerman: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightSemiBold, color: Colors.german, marginBottom: 4 },
  sentenceEnglish: { fontSize: Typography.fontSizeSM, color: Colors.english },
  homeworkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.success,
    ...Shadows.small,
  },
  homeworkBtnIcon: { fontSize: 28, marginRight: Spacing.md },
  homeworkBtnTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text },
  homeworkBtnSub: { fontSize: Typography.fontSizeSM, color: Colors.textLight },
  homeworkArrow: { fontSize: 20, color: Colors.success, marginLeft: 'auto' },
  tabIntro: { fontSize: Typography.fontSizeSM, color: Colors.textLight, marginBottom: Spacing.md },
  vocabCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  vocabTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  vocabGerman: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.german, flex: 1 },
  wordTypeBadge: { backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  wordTypeText: { fontSize: Typography.fontSizeXS, color: Colors.primary, fontWeight: Typography.fontWeightMedium },
  vocabEnglish: { fontSize: Typography.fontSizeMD, color: Colors.english, marginBottom: Spacing.xs },
  vocabPronun: { fontSize: Typography.fontSizeXS, color: Colors.textLight, marginBottom: Spacing.sm },
  exampleBox: { backgroundColor: Colors.background, borderRadius: BorderRadius.sm, padding: Spacing.sm, marginTop: Spacing.xs },
  exampleGerman: { fontSize: Typography.fontSizeSM, color: Colors.german, marginBottom: 2 },
  exampleEnglish: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  grammarCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  grammarTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.sm },
  grammarRule: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
  grammarExample: { backgroundColor: Colors.background, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.sm },
  grammarExDe: { fontSize: Typography.fontSizeSM, color: Colors.german, marginBottom: 3, fontWeight: Typography.fontWeightMedium },
  grammarExEn: { fontSize: Typography.fontSizeSM, color: Colors.english },
  tipRow: { backgroundColor: Colors.accentLight, borderRadius: BorderRadius.sm, padding: Spacing.sm, marginTop: Spacing.sm },
  tipText: { fontSize: Typography.fontSizeSM, color: Colors.text },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  modeIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  modeInfo: { flex: 1 },
  modeLabel: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightSemiBold, color: Colors.text, marginBottom: 2 },
  modeSub: { fontSize: Typography.fontSizeSM, color: Colors.textLight },
  modeArrow: { fontSize: 18 },
});
