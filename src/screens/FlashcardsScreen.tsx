import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Animated, Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, StudySet, VocabularyItem } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { getStudySetById } from '../services/storageService';
import { updateProgressAfterSession } from '../services/storageService';
import ProgressBar from '../components/ProgressBar';

type Nav = StackNavigationProp<RootStackParamList>;
type RouteT = RouteProp<RootStackParamList, 'Flashcards'>;

const { width } = Dimensions.get('window');

export default function FlashcardsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [cards, setCards] = useState<VocabularyItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<string[]>([]);
  const [needsWork, setNeedsWork] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const isFlipping = useRef(false);

  useEffect(() => {
    const load = async () => {
      const set = await getStudySetById(route.params.studySetId);
      if (set) {
        setStudySet(set);
        setCards(shuffle([...set.vocabulary]));
      }
    };
    load();
  }, [route.params.studySetId]);

  const flip = () => {
    if (isFlipping.current) return;
    isFlipping.current = true;

    Animated.spring(flipAnim, {
      toValue: flipped ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 10,
    }).start(() => {
      isFlipping.current = false;
    });
    setFlipped(!flipped);
  };

  const handleKnow = async (knewIt: boolean) => {
    const card = cards[currentIdx];
    if (knewIt) {
      setKnown((prev) => [...prev, card.id]);
    } else {
      setNeedsWork((prev) => [...prev, card.id]);
    }

    if (currentIdx + 1 >= cards.length) {
      setFinished(true);
      if (studySet) {
        await updateProgressAfterSession({
          studySetId: studySet.id,
          studySetTitle: studySet.title,
          wordsStudied: cards.length,
          quizScore: Math.round((knewIt ? known.length + 1 : known.length) / cards.length * 100),
          correctAnswers: knewIt ? known.length + 1 : known.length,
          totalQuestions: cards.length,
          mode: 'flashcards',
        });
      }
    } else {
      // Reset flip and move to next
      flipAnim.setValue(0);
      setFlipped(false);
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handleRestart = () => {
    flipAnim.setValue(0);
    setFlipped(false);
    setCurrentIdx(0);
    setKnown([]);
    setNeedsWork([]);
    setFinished(false);
    if (studySet) setCards(shuffle([...studySet.vocabulary]));
  };

  if (!studySet || cards.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}><Text style={styles.loadingText}>Loading flashcards…</Text></View>
      </SafeAreaView>
    );
  }

  if (finished) {
    const knownCount = known.length;
    const needsCount = needsWork.length;
    const score = Math.round((knownCount / cards.length) * 100);

    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.finishedContainer}>
          <Text style={styles.finishedEmoji}>{score >= 80 ? '🎉' : score >= 60 ? '👍' : '💪'}</Text>
          <Text style={styles.finishedTitle}>Round Complete!</Text>
          <Text style={styles.finishedScore}>{score}%</Text>
          <Text style={styles.finishedSub}>knew it on first try</Text>

          <View style={styles.finishedStats}>
            <View style={[styles.finishedStat, { backgroundColor: Colors.successLight }]}>
              <Text style={styles.finishedStatNum}>{knownCount}</Text>
              <Text style={styles.finishedStatLabel}>✅ Knew it</Text>
            </View>
            <View style={[styles.finishedStat, { backgroundColor: Colors.errorLight }]}>
              <Text style={styles.finishedStatNum}>{needsCount}</Text>
              <Text style={styles.finishedStatLabel}>🔁 Review</Text>
            </View>
          </View>

          {needsCount > 0 && (
            <TouchableOpacity style={[styles.restartBtn, { backgroundColor: Colors.secondary }]} onPress={handleRestart}>
              <Text style={styles.restartBtnText}>Practice "Needs Review" cards</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.restartBtn} onPress={handleRestart}>
            <Text style={styles.restartBtnText}>Restart all cards</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Back to Study Set</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const card = cards[currentIdx];
  const progress = ((currentIdx) / cards.length) * 100;

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Flashcards</Text>
        <Text style={styles.counter}>{currentIdx + 1} / {cards.length}</Text>
      </View>

      <View style={styles.progressRow}>
        <ProgressBar progress={progress} color={Colors.primary} />
      </View>

      {/* Card */}
      <View style={styles.cardArea}>
        <Text style={styles.tapHint}>Tap card to flip</Text>

        <TouchableOpacity onPress={flip} activeOpacity={1} style={styles.cardWrapper}>
          {/* Front */}
          <Animated.View style={[styles.card, styles.cardFront, { transform: [{ rotateY: frontRotate }] }]}>
            <Text style={styles.cardLang}>🇩🇪 German</Text>
            {card.article && <Text style={styles.cardArticle}>{card.article}</Text>}
            <Text style={styles.cardWord}>{card.german}</Text>
            {card.pronunciationHint && (
              <Text style={styles.cardPronun}>🔊 {card.pronunciationHint}</Text>
            )}
            <Text style={styles.flipHint}>Tap to see meaning →</Text>
          </Animated.View>

          {/* Back */}
          <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backRotate }] }]}>
            <Text style={styles.cardLang}>🇬🇧 English</Text>
            <Text style={styles.cardWordBack}>{card.english}</Text>
            {card.exampleSentence && (
              <View style={styles.exampleBox}>
                <Text style={styles.exampleDe}>{card.exampleSentence}</Text>
                <Text style={styles.exampleEn}>{card.exampleTranslation}</Text>
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.needsWorkBtn]}
            onPress={() => handleKnow(false)}
          >
            <Text style={styles.needsWorkBtnText}>🔁 Study More</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.knewItBtn]}
            onPress={() => handleKnow(true)}
          >
            <Text style={styles.knewItBtnText}>✅ Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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
  counter: { fontSize: Typography.fontSizeSM, color: Colors.textLight, fontWeight: Typography.fontWeightMedium },
  progressRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.card },
  cardArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },
  tapHint: { fontSize: Typography.fontSizeXS, color: Colors.textLight, marginBottom: Spacing.md },
  cardWrapper: { width: width - 48, height: 280, marginBottom: Spacing.xxl },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    ...Shadows.large,
  },
  cardFront: { backgroundColor: Colors.primary },
  cardBack: { backgroundColor: Colors.card },
  cardLang: { fontSize: Typography.fontSizeSM, color: 'rgba(255,255,255,0.7)', marginBottom: Spacing.sm },
  cardArticle: { fontSize: Typography.fontSizeLG, color: Colors.accent, fontWeight: Typography.fontWeightBold },
  cardWord: { fontSize: Typography.fontSize3XL, fontWeight: Typography.fontWeightExtraBold, color: '#fff', textAlign: 'center' },
  cardPronun: { fontSize: Typography.fontSizeSM, color: 'rgba(255,255,255,0.8)', marginTop: Spacing.sm },
  flipHint: { fontSize: Typography.fontSizeXS, color: 'rgba(255,255,255,0.6)', marginTop: Spacing.lg },
  cardWordBack: { fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightExtraBold, color: Colors.text, textAlign: 'center', marginBottom: Spacing.md },
  exampleBox: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.md, width: '100%' },
  exampleDe: { fontSize: Typography.fontSizeSM, color: Colors.german, fontWeight: Typography.fontWeightMedium, marginBottom: 3 },
  exampleEn: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  btnRow: { flexDirection: 'row', gap: Spacing.md },
  actionBtn: { flex: 1, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', ...Shadows.small },
  needsWorkBtn: { backgroundColor: Colors.errorLight, borderWidth: 2, borderColor: Colors.error },
  needsWorkBtnText: { color: Colors.error, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
  knewItBtn: { backgroundColor: Colors.successLight, borderWidth: 2, borderColor: Colors.success },
  knewItBtnText: { color: Colors.success, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
  finishedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl },
  finishedEmoji: { fontSize: 72, marginBottom: Spacing.lg },
  finishedTitle: { fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightExtraBold, color: Colors.text, marginBottom: Spacing.sm },
  finishedScore: { fontSize: 56, fontWeight: Typography.fontWeightExtraBold, color: Colors.primary },
  finishedSub: { fontSize: Typography.fontSizeMD, color: Colors.textLight, marginBottom: Spacing.xxl },
  finishedStats: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  finishedStat: { flex: 1, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center' },
  finishedStatNum: { fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightExtraBold, color: Colors.text },
  finishedStatLabel: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  restartBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, marginBottom: Spacing.md },
  restartBtnText: { color: Colors.textOnPrimary, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
  doneBtn: { paddingVertical: Spacing.md },
  doneBtnText: { color: Colors.textLight, fontSize: Typography.fontSizeMD },
});
