import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, StudySet, QuizQuestion, MistakeReviewItem } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { getStudySetById, updateProgressAfterSession, addMistake } from '../services/storageService';
import { checkAnswer, getScoreLabel } from '../services/quizGenerator';
import QuizOption from '../components/QuizOption';
import ProgressBar from '../components/ProgressBar';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteT = RouteProp<RootStackParamList, 'Quiz'>;

type QuestionState = 'unanswered' | 'answered';

export default function QuizScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [questionState, setQuestionState] = useState<QuestionState>('unanswered');
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState<MistakeReviewItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const set = await getStudySetById(route.params.studySetId);
      if (set) {
        setStudySet(set);
        const mcQuestions = set.quizQuestions.filter(
          (q) => q.type === 'multiple-choice' && q.options && q.options.length > 0
        );
        setQuestions(mcQuestions.length > 0 ? mcQuestions : set.quizQuestions.slice(0, 8));
      }
    };
    load();
  }, [route.params.studySetId]);

  if (!studySet || questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading quiz…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIdx];
  const progress = (currentIdx / questions.length) * 100;

  const handleSelect = (answer: string) => {
    if (questionState === 'answered') return;
    setSelectedAnswer(answer);
    setQuestionState('answered');

    const isCorrect = checkAnswer(answer, currentQuestion.correctAnswer);
    if (isCorrect) {
      setScore((prev) => prev + 1);
    } else {
      const mistake: MistakeReviewItem = {
        id: `m-${Date.now()}`,
        questionId: currentQuestion.id,
        studySetId: studySet.id,
        studySetTitle: studySet.title,
        question: currentQuestion.question,
        userAnswer: answer,
        correctAnswer: currentQuestion.correctAnswer,
        timestamp: new Date().toISOString(),
        reviewCount: 0,
      };
      setMistakes((prev) => [...prev, mistake]);
      addMistake(mistake);
    }
  };

  const handleNext = async () => {
    if (currentIdx + 1 >= questions.length) {
      const finalScore = Math.round(((score + (checkAnswer(selectedAnswer ?? '', currentQuestion.correctAnswer) ? 0 : 0)) / questions.length) * 100);
      await updateProgressAfterSession({
        studySetId: studySet.id,
        studySetTitle: studySet.title,
        wordsStudied: 0,
        quizScore: finalScore,
        correctAnswers: score,
        totalQuestions: questions.length,
        mode: 'quiz',
      });
      setFinished(true);
    } else {
      setCurrentIdx((prev) => prev + 1);
      setSelectedAnswer(null);
      setQuestionState('unanswered');
    }
  };

  if (finished) {
    const finalScore = Math.round((score / questions.length) * 100);
    const { label, emoji } = getScoreLabel(finalScore);

    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <ScrollView contentContainerStyle={styles.finishedContainer}>
          <Text style={styles.finishedEmoji}>{emoji}</Text>
          <Text style={styles.finishedTitle}>{label}</Text>
          <Text style={styles.finishedScore}>{finalScore}%</Text>
          <Text style={styles.finishedSub}>{score} / {questions.length} correct</Text>

          <View style={styles.scoreBar}>
            <ProgressBar
              progress={finalScore}
              color={finalScore >= 80 ? Colors.success : finalScore >= 60 ? Colors.warning : Colors.error}
              height={12}
              showLabel
              label="Score"
            />
          </View>

          {mistakes.length > 0 && (
            <View style={styles.mistakesSection}>
              <Text style={styles.mistakesTitle}>🔁 Review These</Text>
              {mistakes.map((m, i) => (
                <View key={i} style={styles.mistakeCard}>
                  <Text style={styles.mistakeQuestion}>{m.question}</Text>
                  <Text style={styles.mistakeYours}>Your answer: <Text style={styles.wrongText}>{m.userAnswer}</Text></Text>
                  <Text style={styles.mistakeCorrect}>Correct: <Text style={styles.correctText}>{m.correctAnswer}</Text></Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.retryBtn} onPress={() => {
            setCurrentIdx(0);
            setSelectedAnswer(null);
            setQuestionState('unanswered');
            setScore(0);
            setFinished(false);
            setMistakes([]);
          }}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Back to Study Set</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const getOptionState = (option: string) => {
    if (questionState === 'unanswered') return 'default';
    if (option === currentQuestion.correctAnswer) return 'correct';
    if (option === selectedAnswer && option !== currentQuestion.correctAnswer) return 'incorrect';
    return 'default';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz</Text>
        <Text style={styles.counter}>{currentIdx + 1}/{questions.length}</Text>
      </View>

      <View style={styles.progressRow}>
        <ProgressBar progress={progress} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Score so far */}
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>Score: {score}/{currentIdx}</Text>
          <Text style={styles.questionType}>{currentQuestion.type.replace('-', ' ')}</Text>
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {/* Options */}
        {currentQuestion.options?.map((option) => (
          <QuizOption
            key={option}
            label={option}
            state={getOptionState(option)}
            onPress={() => handleSelect(option)}
            disabled={questionState === 'answered'}
          />
        ))}

        {/* For non-MC questions without options */}
        {(!currentQuestion.options || currentQuestion.options.length === 0) && (
          <View style={styles.noOptions}>
            <Text style={styles.noOptionsText}>Answer: {currentQuestion.correctAnswer}</Text>
          </View>
        )}

        {/* Feedback after answering */}
        {questionState === 'answered' && (
          <View style={[
            styles.feedbackCard,
            { backgroundColor: checkAnswer(selectedAnswer ?? '', currentQuestion.correctAnswer) ? Colors.successLight : Colors.errorLight },
          ]}>
            <Text style={styles.feedbackEmoji}>
              {checkAnswer(selectedAnswer ?? '', currentQuestion.correctAnswer) ? '✅ Correct!' : '❌ Not quite!'}
            </Text>
            {currentQuestion.explanation && (
              <Text style={styles.feedbackExplanation}>{currentQuestion.explanation}</Text>
            )}
          </View>
        )}

        {/* Hint */}
        {questionState === 'unanswered' && currentQuestion.hint && (
          <Text style={styles.hint}>💡 Hint: {currentQuestion.hint}</Text>
        )}

        {questionState === 'answered' && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {currentIdx + 1 >= questions.length ? 'See Results 🎉' : 'Next Question →'}
            </Text>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.xs },
  backArrow: { fontSize: 22, color: Colors.primary },
  headerTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.text },
  counter: { fontSize: Typography.fontSizeSM, color: Colors.textLight },
  progressRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.card },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  scoreLabel: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, fontWeight: Typography.fontWeightMedium },
  questionType: {
    fontSize: Typography.fontSizeXS,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    textTransform: 'capitalize',
  },
  questionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  questionText: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightSemiBold,
    color: Colors.text,
    lineHeight: 26,
  },
  noOptions: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  noOptionsText: { fontSize: Typography.fontSizeMD, color: Colors.primary },
  feedbackCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  feedbackEmoji: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.xs },
  feedbackExplanation: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 20 },
  hint: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginBottom: Spacing.md, fontStyle: 'italic' },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  nextBtnText: { color: Colors.textOnPrimary, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
  finishedContainer: { alignItems: 'center', paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg },
  finishedEmoji: { fontSize: 72, marginBottom: Spacing.lg },
  finishedTitle: { fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightExtraBold, color: Colors.text },
  finishedScore: { fontSize: 56, fontWeight: Typography.fontWeightExtraBold, color: Colors.primary, marginVertical: Spacing.sm },
  finishedSub: { fontSize: Typography.fontSizeMD, color: Colors.textLight, marginBottom: Spacing.xl },
  scoreBar: { width: '100%', marginBottom: Spacing.xl },
  mistakesSection: { width: '100%', marginBottom: Spacing.xl },
  mistakesTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.md },
  mistakeCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  mistakeQuestion: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold, color: Colors.text, marginBottom: Spacing.xs },
  mistakeYours: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  mistakeCorrect: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  wrongText: { color: Colors.error, fontWeight: Typography.fontWeightBold },
  correctText: { color: Colors.success, fontWeight: Typography.fontWeightBold },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, marginBottom: Spacing.md },
  retryBtnText: { color: Colors.textOnPrimary, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
  doneBtn: { paddingVertical: Spacing.md },
  doneBtnText: { color: Colors.textLight, fontSize: Typography.fontSizeMD },
});
