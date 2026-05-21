import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, StudySet, QuizQuestion } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { getStudySetById, updateProgressAfterSession, addMistake } from '../services/storageService';
import { checkAnswer, getScoreLabel } from '../services/quizGenerator';
import ProgressBar from '../components/ProgressBar';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteT = RouteProp<RootStackParamList, 'SentenceBuilder'>;

export default function SentenceBuilderScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const load = async () => {
      const set = await getStudySetById(route.params.studySetId);
      if (set) {
        setStudySet(set);
        const sbQuestions = set.quizQuestions.filter((q) => q.type === 'sentence-build' && q.words);
        setQuestions(sbQuestions);
        if (sbQuestions.length > 0 && sbQuestions[0].words) {
          setAvailableWords([...sbQuestions[0].words]);
        }
      }
    };
    load();
  }, [route.params.studySetId]);

  if (!studySet || questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.noQTitle}>No Sentence Builder exercises</Text>
          <Text style={styles.noQSub}>This study set doesn't have sentence builder questions yet.</Text>
          <Text style={styles.noQSub}>Try scanning more worksheets or use another practice mode.</Text>
          <TouchableOpacity style={styles.backBtnFull} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnFullText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQ = questions[currentIdx];

  const addWord = (word: string, idx: number) => {
    if (answered) return;
    setSelectedWords((prev) => [...prev, word]);
    setAvailableWords((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeWord = (word: string, idx: number) => {
    if (answered) return;
    setAvailableWords((prev) => [...prev, word]);
    setSelectedWords((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCheck = () => {
    const builtSentence = selectedWords.join(' ');
    const correct = checkAnswer(builtSentence, currentQ.correctAnswer);
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
        userAnswer: builtSentence,
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
          mode: 'sentence-build',
        });
      }
      setFinished(true);
    } else {
      const nextQ = questions[currentIdx + 1];
      setCurrentIdx((prev) => prev + 1);
      setSelectedWords([]);
      setAvailableWords(nextQ.words ? [...nextQ.words] : []);
      setAnswered(false);
      setIsCorrect(false);
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
          <Text style={styles.finishedSub}>{score}/{questions.length} sentences correct</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => {
            const firstQ = questions[0];
            setCurrentIdx(0); setSelectedWords([]);
            setAvailableWords(firstQ.words ? [...firstQ.words] : []);
            setAnswered(false); setIsCorrect(false); setScore(0); setFinished(false);
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
        <Text style={styles.headerTitle}>Sentence Builder</Text>
        <Text style={styles.counter}>{currentIdx + 1}/{questions.length}</Text>
      </View>

      <View style={styles.progressRow}>
        <ProgressBar progress={(currentIdx / questions.length) * 100} />
      </View>

      <ScrollView style={styles.scroll}>
        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>Build this sentence:</Text>
          <Text style={styles.questionText}>{currentQ.question}</Text>
          {currentQ.hint && <Text style={styles.hint}>💡 {currentQ.hint}</Text>}
        </View>

        {/* Drop zone */}
        <Text style={styles.zoneLabel}>Your sentence:</Text>
        <View style={[styles.dropZone, answered && { borderColor: isCorrect ? Colors.success : Colors.error }]}>
          {selectedWords.length === 0 ? (
            <Text style={styles.dropPlaceholder}>Tap words below to build your sentence</Text>
          ) : (
            <View style={styles.wordRow}>
              {selectedWords.map((word, i) => (
                <TouchableOpacity
                  key={`sel-${i}`}
                  style={[styles.wordTile, styles.wordTileSelected]}
                  onPress={() => removeWord(word, i)}
                  disabled={answered}
                >
                  <Text style={styles.wordTileText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Available words */}
        <Text style={styles.zoneLabel}>Available words:</Text>
        <View style={styles.wordBank}>
          {availableWords.map((word, i) => (
            <TouchableOpacity
              key={`avail-${i}`}
              style={[styles.wordTile, answered && styles.wordTileDisabled]}
              onPress={() => addWord(word, i)}
              disabled={answered}
            >
              <Text style={styles.wordTileText}>{word}</Text>
            </TouchableOpacity>
          ))}
          {availableWords.length === 0 && !answered && (
            <Text style={styles.allUsedText}>All words used – tap Check!</Text>
          )}
        </View>

        {/* Feedback */}
        {answered && (
          <View style={[styles.feedbackCard, { backgroundColor: isCorrect ? Colors.successLight : Colors.errorLight }]}>
            <Text style={styles.feedbackTitle}>{isCorrect ? '✅ Perfect!' : '❌ Not quite!'}</Text>
            {!isCorrect && (
              <Text style={styles.feedbackAnswer}>
                Correct: <Text style={styles.correctText}>{currentQ.correctAnswer}</Text>
              </Text>
            )}
            {currentQ.explanation && (
              <Text style={styles.feedbackExplanation}>{currentQ.explanation}</Text>
            )}
          </View>
        )}

        {/* Buttons */}
        {!answered ? (
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                if (currentQ.words) setAvailableWords([...currentQ.words]);
                setSelectedWords([]);
              }}
            >
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.checkBtn, selectedWords.length === 0 && styles.checkBtnDisabled]}
              onPress={handleCheck}
              disabled={selectedWords.length === 0}
            >
              <Text style={styles.checkBtnText}>Check Sentence</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {currentIdx + 1 >= questions.length ? 'See Results 🎉' : 'Next →'}
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xxl },
  noQTitle: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold, color: Colors.text, textAlign: 'center', marginBottom: Spacing.md },
  noQSub: { fontSize: Typography.fontSizeSM, color: Colors.textLight, textAlign: 'center', marginBottom: Spacing.sm },
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
  questionLabel: { fontSize: Typography.fontSizeSM, color: Colors.textLight, marginBottom: Spacing.sm },
  questionText: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightSemiBold, color: Colors.text, marginBottom: Spacing.sm },
  hint: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, fontStyle: 'italic' },
  zoneLabel: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  dropZone: {
    minHeight: 80, backgroundColor: Colors.card, borderRadius: BorderRadius.lg, borderWidth: 2,
    borderColor: Colors.border, borderStyle: 'dashed', padding: Spacing.md,
    marginBottom: Spacing.lg, justifyContent: 'center', ...Shadows.small,
  },
  dropPlaceholder: { fontSize: Typography.fontSizeSM, color: Colors.textLight, textAlign: 'center', fontStyle: 'italic' },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  wordBank: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  wordTile: {
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 2, borderColor: Colors.primary,
  },
  wordTileSelected: { backgroundColor: Colors.primary },
  wordTileDisabled: { opacity: 0.4 },
  wordTileText: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightMedium, color: Colors.primary },
  allUsedText: { fontSize: Typography.fontSizeSM, color: Colors.textLight, fontStyle: 'italic' },
  feedbackCard: { borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  feedbackTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.sm },
  feedbackAnswer: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginBottom: Spacing.xs },
  correctText: { color: Colors.success, fontWeight: Typography.fontWeightBold },
  feedbackExplanation: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 20 },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  clearBtn: { flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 2, borderColor: Colors.border },
  clearBtnText: { fontSize: Typography.fontSizeMD, color: Colors.textSecondary, fontWeight: Typography.fontWeightMedium },
  checkBtn: { flex: 2, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', ...Shadows.small },
  checkBtnDisabled: { backgroundColor: Colors.textLight },
  checkBtnText: { color: Colors.textOnPrimary, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
  nextBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, padding: Spacing.lg, alignItems: 'center', ...Shadows.small, marginBottom: Spacing.md },
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
