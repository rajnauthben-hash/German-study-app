import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Keyboard,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, StudySet, HomeworkQuestion } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { getStudySetById } from '../services/storageService';
import ProgressBar from '../components/ProgressBar';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteT = RouteProp<RootStackParamList, 'HomeworkHelper'>;

type QuestionPhase = 'question' | 'hint1' | 'hint2' | 'try' | 'answered' | 'revealed';

export default function HomeworkHelperScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [questions, setQuestions] = useState<HomeworkQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<QuestionPhase>('question');
  const [userAttempt, setUserAttempt] = useState('');
  const [attemptResult, setAttemptResult] = useState<'correct' | 'close' | 'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const [solved, setSolved] = useState(0);

  useEffect(() => {
    const load = async () => {
      const set = await getStudySetById(route.params.studySetId);
      if (set) {
        setStudySet(set);
        setQuestions(set.homeworkQuestions);
      }
    };
    load();
  }, [route.params.studySetId]);

  if (!studySet) return null;

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Homework Helper</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.noQIcon}>📝</Text>
          <Text style={styles.noQTitle}>No homework questions</Text>
          <Text style={styles.noQSub}>This study set doesn't have homework questions. When you scan a worksheet with numbered questions, they'll appear here.</Text>
          <TouchableOpacity style={styles.backBtnFull} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnFullText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQ = questions[currentIdx];
  const progress = (currentIdx / questions.length) * 100;

  const handleAttempt = () => {
    Keyboard.dismiss();
    if (!userAttempt.trim()) return;

    const attempt = userAttempt.toLowerCase().trim();
    const answer = currentQ.answer.toLowerCase().trim();

    if (attempt === answer || attempt.includes(answer.substring(0, Math.floor(answer.length * 0.7)))) {
      setAttemptResult('correct');
      setSolved((prev) => prev + 1);
    } else if (answer.includes(attempt) || attempt.length > 2 && answer.startsWith(attempt.substring(0, 3))) {
      setAttemptResult('close');
    } else {
      setAttemptResult('wrong');
    }
    setPhase('answered');
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIdx((prev) => prev + 1);
      setPhase('question');
      setUserAttempt('');
      setAttemptResult(null);
    }
  };

  if (finished) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.finishedContainer}>
          <Text style={styles.finishedEmoji}>🎓</Text>
          <Text style={styles.finishedTitle}>Homework Complete!</Text>
          <Text style={styles.finishedSub}>Worked through {questions.length} questions</Text>
          <Text style={styles.finishedScore}>{solved}/{questions.length}</Text>
          <Text style={styles.finishedScoreLabel}>answered correctly on first try</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Back to Study Set</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Homework Helper</Text>
        <Text style={styles.counter}>{currentIdx + 1}/{questions.length}</Text>
      </View>

      <View style={styles.progressRow}>
        <ProgressBar progress={progress} color={Colors.success} />
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionNumber}>Question {currentIdx + 1}</Text>
          <Text style={styles.questionText}>{currentQ.question}</Text>
        </View>

        {/* Phase: initial – show what to do */}
        {phase === 'question' && (
          <View>
            <View style={styles.guideCard}>
              <Text style={styles.guideTitle}>📌 How to approach this</Text>
              <Text style={styles.guideText}>Think carefully before looking at hints. Try to work it out first!</Text>
            </View>
            <TouchableOpacity style={styles.hintBtn} onPress={() => setPhase('hint1')}>
              <Text style={styles.hintBtnText}>💡 Show First Hint</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tryBtn} onPress={() => setPhase('try')}>
              <Text style={styles.tryBtnText}>✏️ I'll Try It Myself</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Hint 1 */}
        {(phase === 'hint1' || phase === 'hint2') && (
          <View>
            <View style={styles.hintCard}>
              <Text style={styles.hintLabel}>Hint 1</Text>
              <Text style={styles.hintText}>{currentQ.hint1}</Text>
            </View>

            {phase === 'hint1' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.hint2Btn} onPress={() => setPhase('hint2')}>
                  <Text style={styles.hint2BtnText}>🔍 Another Hint</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tryBtn2} onPress={() => setPhase('try')}>
                  <Text style={styles.tryBtn2Text}>✏️ Try It</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Hint 2 */}
        {phase === 'hint2' && (
          <View>
            <View style={[styles.hintCard, { backgroundColor: Colors.primaryLight }]}>
              <Text style={styles.hintLabel}>Hint 2</Text>
              <Text style={styles.hintText}>{currentQ.hint2}</Text>
            </View>
            <TouchableOpacity style={styles.tryBtn} onPress={() => setPhase('try')}>
              <Text style={styles.tryBtnText}>✏️ Now Try It</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Try it */}
        {phase === 'try' && (
          <View>
            <Text style={styles.inputLabel}>Your Answer:</Text>
            <TextInput
              style={styles.input}
              value={userAttempt}
              onChangeText={setUserAttempt}
              placeholder="Type your answer here…"
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.revealBtn} onPress={() => setPhase('revealed')}>
                <Text style={styles.revealBtnText}>👁 Show Answer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.checkBtn, !userAttempt.trim() && styles.checkBtnDisabled]}
                onPress={handleAttempt}
                disabled={!userAttempt.trim()}
              >
                <Text style={styles.checkBtnText}>Check</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Answered */}
        {phase === 'answered' && (
          <View>
            <View style={[
              styles.attemptResultCard,
              {
                backgroundColor:
                  attemptResult === 'correct' ? Colors.successLight
                  : attemptResult === 'close' ? Colors.accentLight
                  : Colors.errorLight,
              },
            ]}>
              <Text style={styles.attemptResultTitle}>
                {attemptResult === 'correct' ? '✅ Correct!' : attemptResult === 'close' ? '🔥 Very close!' : '💪 Keep trying!'}
              </Text>
              <Text style={styles.attemptResultText}>Your answer: {userAttempt}</Text>
            </View>

            <View style={styles.answerRevealCard}>
              <Text style={styles.answerRevealLabel}>✅ Correct Answer</Text>
              <Text style={styles.answerText}>{currentQ.answer}</Text>
              <Text style={styles.explanationLabel}>📖 Explanation</Text>
              <Text style={styles.explanationText}>{currentQ.explanation}</Text>
              {currentQ.grammarNote && (
                <>
                  <Text style={styles.grammarLabel}>📝 Grammar Note</Text>
                  <Text style={styles.grammarText}>{currentQ.grammarNote}</Text>
                </>
              )}
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {currentIdx + 1 >= questions.length ? 'Finish 🎓' : 'Next Question →'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Revealed */}
        {phase === 'revealed' && (
          <View>
            <View style={styles.answerRevealCard}>
              <Text style={styles.answerRevealLabel}>✅ Answer</Text>
              <Text style={styles.answerText}>{currentQ.answer}</Text>
              <Text style={styles.explanationLabel}>📖 Explanation</Text>
              <Text style={styles.explanationText}>{currentQ.explanation}</Text>
              {currentQ.grammarNote && (
                <>
                  <Text style={styles.grammarLabel}>📝 Grammar Note</Text>
                  <Text style={styles.grammarText}>{currentQ.grammarNote}</Text>
                </>
              )}
            </View>
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {currentIdx + 1 >= questions.length ? 'Finish 🎓' : 'Next Question →'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl },
  noQIcon: { fontSize: 64, marginBottom: Spacing.lg },
  noQTitle: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.sm, textAlign: 'center' },
  noQSub: { fontSize: Typography.fontSizeSM, color: Colors.textLight, textAlign: 'center', marginBottom: Spacing.sm, lineHeight: 20 },
  backBtnFull: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, marginTop: Spacing.xl },
  backBtnFullText: { color: Colors.textOnPrimary, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.xs },
  backArrow: { fontSize: 22, color: Colors.primary },
  headerTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.text },
  counter: { fontSize: Typography.fontSizeSM, color: Colors.textLight },
  progressRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.card },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  questionCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.xl, marginTop: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.small },
  questionNumber: { fontSize: Typography.fontSizeSM, color: Colors.primary, fontWeight: Typography.fontWeightBold, marginBottom: Spacing.sm },
  questionText: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightSemiBold, color: Colors.text, lineHeight: 26 },
  guideCard: { backgroundColor: Colors.accentLight, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.md },
  guideTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.xs },
  guideText: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  hintCard: { backgroundColor: Colors.successLight, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.md, borderLeftWidth: 4, borderLeftColor: Colors.success },
  hintLabel: { fontSize: Typography.fontSizeXS, fontWeight: Typography.fontWeightBold, color: Colors.success, marginBottom: Spacing.xs, textTransform: 'uppercase' },
  hintText: { fontSize: Typography.fontSizeMD, color: Colors.text, lineHeight: 22 },
  actionRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  hintBtn: { backgroundColor: Colors.successLight, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md, borderWidth: 2, borderColor: Colors.success },
  hintBtnText: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightSemiBold, color: Colors.success },
  hint2Btn: { flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 2, borderColor: Colors.border },
  hint2BtnText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightMedium, color: Colors.textSecondary },
  tryBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md, ...Shadows.small },
  tryBtnText: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.textOnPrimary },
  tryBtn2: { flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center' },
  tryBtn2Text: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightBold, color: Colors.textOnPrimary },
  inputLabel: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightSemiBold, color: Colors.text, marginBottom: Spacing.sm },
  input: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, borderWidth: 2,
    borderColor: Colors.border, padding: Spacing.lg, fontSize: Typography.fontSizeMD,
    color: Colors.text, minHeight: 100, marginBottom: Spacing.md, ...Shadows.small,
  },
  revealBtn: { flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 2, borderColor: Colors.border },
  revealBtnText: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, fontWeight: Typography.fontWeightMedium },
  checkBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center' },
  checkBtnDisabled: { backgroundColor: Colors.textLight },
  checkBtnText: { color: Colors.textOnPrimary, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
  attemptResultCard: { borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.md },
  attemptResultTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.xs },
  attemptResultText: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  answerRevealCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadows.small },
  answerRevealLabel: { fontSize: Typography.fontSizeXS, fontWeight: Typography.fontWeightBold, color: Colors.success, textTransform: 'uppercase', marginBottom: Spacing.xs },
  answerText: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.german, marginBottom: Spacing.lg },
  explanationLabel: { fontSize: Typography.fontSizeXS, fontWeight: Typography.fontWeightBold, color: Colors.primary, textTransform: 'uppercase', marginBottom: Spacing.xs },
  explanationText: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
  grammarLabel: { fontSize: Typography.fontSizeXS, fontWeight: Typography.fontWeightBold, color: Colors.warning, textTransform: 'uppercase', marginBottom: Spacing.xs },
  grammarText: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 20 },
  nextBtn: { backgroundColor: Colors.success, borderRadius: BorderRadius.full, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md, ...Shadows.small },
  nextBtnText: { color: Colors.textOnPrimary, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
  finishedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl },
  finishedEmoji: { fontSize: 72, marginBottom: Spacing.lg },
  finishedTitle: { fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightExtraBold, color: Colors.text, marginBottom: Spacing.sm },
  finishedSub: { fontSize: Typography.fontSizeMD, color: Colors.textLight, marginBottom: Spacing.lg },
  finishedScore: { fontSize: 56, fontWeight: Typography.fontWeightExtraBold, color: Colors.success },
  finishedScoreLabel: { fontSize: Typography.fontSizeSM, color: Colors.textLight, marginBottom: Spacing.xxl },
  doneBtn: { backgroundColor: Colors.success, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md },
  doneBtnText: { color: Colors.textOnPrimary, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
});
