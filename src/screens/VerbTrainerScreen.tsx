import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { getVerbs } from '../services/verbService';
import { VerbItem } from '../types';
import AppHeader from '../components/AppHeader';

const PRONOUNS = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];
const CONJ_KEYS: (keyof VerbItem['conjugations'])[] = ['ich', 'du', 'erSieEs', 'wir', 'ihr', 'sieSie'];

type Mode = 'browse' | 'practice';

export default function VerbTrainerScreen() {
  const [verbs, setVerbs] = useState<VerbItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('browse');
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);

  useFocusEffect(useCallback(() => {
    getVerbs().then(v => { setVerbs(v); setCurrentIndex(0); });
  }, []));

  const current = verbs[currentIndex];

  if (!current) {
    return <SafeAreaView style={styles.safe}><AppHeader title="Verb Trainer" showBack /></SafeAreaView>;
  }

  const checkAnswers = () => {
    let correct = 0;
    CONJ_KEYS.forEach(key => {
      if ((practiceAnswers[key] || '').trim().toLowerCase() === current.conjugations[key].toLowerCase()) correct++;
    });
    setRevealed(true);
    Alert.alert('Results', `${correct}/6 correct for "${current.infinitive}"!`);
  };

  const nextVerb = () => {
    setCurrentIndex(i => (i + 1) % verbs.length);
    setPracticeAnswers({});
    setRevealed(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="Verb Trainer" showBack />
      <View style={styles.modeRow}>
        {(['browse', 'practice'] as const).map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
            onPress={() => { setMode(m); setPracticeAnswers({}); setRevealed(false); }}
          >
            <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
              {m === 'browse' ? 'Browse' : 'Practice'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.verbHeader}>
          <Text style={styles.infinitive}>{current.infinitive}</Text>
          <Text style={styles.meaning}>{current.english}</Text>
          {current.exampleSentence && <Text style={styles.example}>"{current.exampleSentence}"</Text>}
          <Text style={styles.verbCount}>{currentIndex + 1} / {verbs.length}</Text>
        </View>

        <View style={styles.conjugationGrid}>
          <Text style={styles.gridTitle}>Present Tense Conjugation</Text>
          {PRONOUNS.map((pronoun, i) => {
            const key = CONJ_KEYS[i];
            const correct = current.conjugations[key];
            const userAnswer = practiceAnswers[key] || '';
            const isCorrect = userAnswer.trim().toLowerCase() === correct.toLowerCase();

            return (
              <View key={pronoun} style={styles.conjugationRow}>
                <Text style={styles.pronoun}>{pronoun}</Text>
                {mode === 'browse' ? (
                  <Text style={styles.conjugation}>{correct}</Text>
                ) : (
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={[
                        styles.conjInput,
                        revealed && (isCorrect ? styles.inputCorrect : styles.inputWrong),
                      ]}
                      value={userAnswer}
                      onChangeText={v => setPracticeAnswers(p => ({ ...p, [key]: v }))}
                      placeholder={`${pronoun} ___`}
                      autoCapitalize="none"
                      editable={!revealed}
                    />
                    {revealed && !isCorrect && <Text style={styles.revealedAnswer}> → {correct}</Text>}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.btnRow}>
          {mode === 'practice' && !revealed && (
            <TouchableOpacity style={styles.checkBtn} onPress={checkAnswers}>
              <Text style={styles.checkBtnText}>Check Answers</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.nextBtn} onPress={nextVerb}>
            <Text style={styles.nextBtnText}>Next Verb</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  modeRow: { flexDirection: 'row', padding: Spacing.lg, gap: Spacing.md },
  modeBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  modeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeBtnText: { fontWeight: Typography.fontWeightSemiBold, color: Colors.textSecondary, fontSize: Typography.fontSizeSM },
  modeBtnTextActive: { color: '#fff' },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  verbHeader: { backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg, ...Shadows.medium },
  infinitive: { fontSize: Typography.fontSize3XL, fontWeight: Typography.fontWeightExtraBold, color: '#fff', marginBottom: 4 },
  meaning: { fontSize: Typography.fontSizeLG, color: 'rgba(255,255,255,0.85)', marginBottom: Spacing.sm },
  example: { fontSize: Typography.fontSizeSM, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', textAlign: 'center' },
  verbCount: { fontSize: Typography.fontSizeXS, color: 'rgba(255,255,255,0.6)', marginTop: Spacing.sm },
  conjugationGrid: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadows.small, marginBottom: Spacing.lg },
  gridTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.lg, textAlign: 'center' },
  conjugationRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pronoun: { width: 80, fontSize: Typography.fontSizeSM, color: Colors.textSecondary, fontStyle: 'italic' },
  conjugation: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.primary },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  conjInput: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.sm, padding: Spacing.sm, fontSize: Typography.fontSizeMD, color: Colors.text },
  inputCorrect: { borderColor: Colors.success, backgroundColor: Colors.successLight },
  inputWrong: { borderColor: Colors.error, backgroundColor: Colors.errorLight },
  revealedAnswer: { fontSize: Typography.fontSizeSM, color: Colors.success, fontWeight: Typography.fontWeightBold, marginLeft: Spacing.sm },
  btnRow: { flexDirection: 'row', gap: Spacing.md },
  checkBtn: { flex: 1, backgroundColor: Colors.success, borderRadius: BorderRadius.full, padding: Spacing.lg, alignItems: 'center', ...Shadows.small },
  checkBtnText: { color: '#fff', fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
  nextBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, padding: Spacing.lg, alignItems: 'center', ...Shadows.small },
  nextBtnText: { color: '#fff', fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
});
