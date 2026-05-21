import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Keyboard,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, StudySet, QuizQuestion } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { getStudySetById, updateProgressAfterSession, addMistake } from '../services/storageService';
import { checkAnswer, getScoreLabel } from '../services/quizGenerator';
import ProgressBar from '../components/ProgressBar';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteT = RouteProp<RootStackParamList, 'FillBlank'>;

export default function FillBlankScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const load = async () => {
      const set = await getStudySetById(route.params.studySetId);
      if (set) {
        setStudySet(set);
        const fbQuestions = set.quizQuestions.filter((q) => q.type === 'fill-blank');
        setQuestions(fbQuestions.length > 0 ? fbQuestions : set.quizQuestions.slice(0, 6));
      }
    };
    load();
  }, [route.params.studySetId]);

  if (!studySet || questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}><Text style={styles.loadingText}>Loading exercises…</Text></View>
      </SafeAreaView>
    );
  }

  const currentQ = questions[currentIdx];

  const handleCheck = () => {
    if (!userInput.trim()) return;
    Keyboard.dismiss();

    const correct = checkAnswer(userInput, currentQ.correctAnswer);
    setIsCorrect(correct);
    setAnswered(true);

    if (correct) {
      setScore((prev) => prev + 1);
    } else if (studySet) {
      addMistake({
        id: `m-${Date.now()}`,
        questionId: currentQ.id,
        studySetId: studySet.id,
        studySetTitle: studySet.title,
        question: currentQ.question,
        userAnswer: userInput,
        correctAnswer: currentQ.correctAnswer,
        timestamp: new Date().toISOString(),
        reviewCount: 0,
      });
    }
  };

  const handleNext = async () => {
    if (currentIdx + 1 >= questions.length) {
      const finalScore = Math.round((score / questions.length) * 100);
      if (studySet) {
        await updateProgressAfterSession({
          studySetId: studySet.id,
          studySetTitle: studySet.title,
          wordsStudied: 0,
          quizScore: finalScore,
          correctAnswers: score,
          totalQuestions: questions.length,
          mode: 'fill-blank',
        });
      }
      setFinished(true);
    } else {
      setCurrentIdx((prev) => prev + 1);
      setUserInput('');
      setAnswered(false);
      setIsCorrect(false);
      setShowHint(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  if (finished) {
    const finalScore = Math.round((score / questions.length) * 100);
    const { label, emoji } = getScoreLabel(finalScore);
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.finishedContainer}>
          <Text style={styles.finishedEmoji}>{emoji}</Text>
          <Text style={styles.finishedTitle}>{label}</Text>
          <Text style={styles.finishedScore}>{finalScore}%</Text>
          <Text style={styles.finishedSub}>{score} / {questions.length} correct</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => {
            setCurrentIdx(0); setUserInput(''); setAnswered(false);
            setIsCorrect(false); setShowHint(false); setScore(0); setFinished(false);
          }}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Done</Text>
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
        <Text style={styles.headerTitle}>Fill in the Blank</Text>
        <Text style={styles.counter}>{currentIdx + 1}/{questions.length}</Text>
      </View>

      <View style={styles.progressRow}>
        <ProgressBar progress={(currentIdx / questions.length) * 100} />
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>Score: {score}/{currentIdx}</Text>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>Complete the sentence:</Text>
          <Text style={styles.sentence}>{currentQ.question}</Text>
        </View>

        <View style={[
          styles.inputWrapper,
          answered && { borderColor: isCorrect ? Colors.success : Colors.error },
        ]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={userInput}
            onChangeText={setUserInput}
            placeholder="Type your answer…"
            placeholderTextColor={Colors.textLight}
            autoCapitalize="none"
            editable={!answered}
            onSubmitEditing={handleCheck}
            returnKeyType="done"
          />
        </View>

        {showHint && currentQ.hint && (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>💡 {currentQ.hint}</Text>
          </View>
        )}

        {!answered && (
          <View style={styles.actionRow}>
            {currentQ.hint && !showHint && (
              <TouchableOpacity style={styles.hintBtn} onPress={() => setShowHint(true)}>
                <Text style={styles.hintBtnText}>💡 Show Hint</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.checkBtn, !userInput.trim() && styles.checkBtnDisabled]}
              onPress={handleCheck}
              disabled={!userInput.trim()}
            >
              <Text style={styles.checkBtnText}>Check Answer</Text>
            </TouchableOpacity>
          </View>
        )}

        {answered && (
          <View style={[styles.feedbackCard, { backgroundColor: isCorrect ? Colors.successLight : Colors.errorLight }]}>
            <Text style={styles.feedbackTitle}>{isCorrect ? '✅ Correct!' : '❌ Not quite!'}</Text>
            {!isCorrect && (
              <Text style={styles.feedbackAnswer}>
                Correct answer: <Text style={styles.correctText}>{currentQ.correctAnswer}</Text>
              </Text>
            )}
            {currentQ.explanation && (
              <Text style={styles.feedbackExplanation}>{currentQ.explanation}</Text>
            )}
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {currentIdx + 1 >= questions.length ? 'See Results 🎉' : 'Next →'}
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: Typography.fontSizeMD, color: Colors.textLight },
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
  scoreRow: { paddingVertical: Spacing.md },
  scoreLabel: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  questionCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadows.small },
  questionText: { fontSize: Typography.fontSizeSM, color: Colors.textLight, marginBottom: Spacing.sm },
  sentence: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightSemiBold, color: Colors.text, lineHeight: 30 },
  inputWrapper: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, borderWidth: 2,
    borderColor: Colors.border, marginBottom: Spacing.md, ...Shadows.small,
  },
  input: { padding: Spacing.lg, fontSize: Typography.fontSizeLG, color: Colors.text },
  hintBox: { backgroundColor: Colors.accentLight, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md },
  hintText: { fontSize: Typography.fontSizeSM, color: Colors.text },
  actionRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  hintBtn: {
    flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', borderWidth: 2, borderColor: Colors.accent,
  },
  hintBtnText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold, color: Colors.text },
  checkBtn: {
    flex: 2, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', ...Shadows.small,
  },
  checkBtnDisabled: { backgroundColor: Colors.textLight },
  checkBtnText: { color: Colors.textOnPrimary, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
  feedbackCard: { borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  feedbackTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.sm },
  feedbackAnswer: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginBottom: Spacing.xs },
  correctText: { color: Colors.success, fontWeight: Typography.fontWeightBold },
  feedbackExplanation: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
  nextBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, padding: Spacing.md, alignItems: 'center' },
  nextBtnText: { color: Colors.textOnPrimary, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
  finishedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl },
  finishedEmoji: { fontSize: 72, marginBottom: Spacing.lg },
  finishedTitle: { fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightExtraBold, color: Colors.text },
  finishedScore: { fontSize: 56, fontWeight: Typography.fontWeightExtraBold, color: Colors.primary, marginVertical: Spacing.sm },
  finishedSub: { fontSize: Typography.fontSizeMD, color: Colors.textLight, marginBottom: Spacing.xl },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, marginBottom: Spacing.md },
  retryBtnText: { color: Colors.textOnPrimary, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
  doneBtn: { paddingVertical: Spacing.md },
  doneBtnText: { color: Colors.textLight, fontSize: Typography.fontSizeMD },
});
