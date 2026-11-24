import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { buildItems } from '../exercises/buildItems';
import { useChildPreferences } from '../hooks/useChildPreferences';
import { speakLetter } from '../hooks/useSpeech';
import { useTheme } from '../theme/ThemeContext';
import { Card, Chip, ErrorState, Letter2D, LoadingState, PrimaryButton, Screen, StarSparkle, ThemedText } from '../components/ui';
import { formatDuration } from '../utils/format';
import { Letter3D } from '../three/Letter3D';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

export function ExerciseSessionScreen({ route, navigation }) {
  const { exerciseType, targetLetters, sessionName, length } = route.params || {};
  const { choiceCount, sessionLength, speechRate } = useChildPreferences();
  const { colors } = useTheme();
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [stagedResult, setStagedResult] = useState(null);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [builtWord, setBuiltWord] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(null);
  const questionShownAt = useRef(0);
  const firstChoice = useRef(null);
  const firstResponseMs = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [letterRows, wordRows] = await Promise.all([
        api.letters(),
        exerciseType === 'syllable_build' ? api.words(100) : Promise.resolve([]),
      ]);
      const built = buildItems(
        exerciseType,
        targetLetters,
        { choice_count: choiceCount, session_length: length || sessionLength },
        letterRows,
        wordRows,
      );
      setItems(built);
      const started = new Date().toISOString();
      startedAt.current = started;
      questionShownAt.current = Date.now();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [exerciseType, targetLetters, choiceCount, sessionLength, length]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => {
    if (!startedAt.current) return undefined;
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - Date.parse(startedAt.current)) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [items.length]);

  const current = items[index];

  function resetQuestion() {
    setAttempts(0);
    setHintUsed(false);
    setPrompt('');
    setStagedResult(null);
    setSelectedLetter(null);
    setBuiltWord('');
    firstChoice.current = null;
    firstResponseMs.current = null;
    questionShownAt.current = Date.now();
  }

  function resultFor({ correct, resolved, attemptCount, usedHint, value }) {
    return {
      item_index: current.item_index,
      letter: current.letter,
      is_correct: Boolean(correct && attemptCount === 1 && !usedHint),
      resolved,
      attempts: attemptCount,
      hint_used: usedHint,
      response_ms: firstResponseMs.current ?? Math.min(Date.now() - questionShownAt.current, 120000),
      chosen_value: firstChoice.current ?? value ?? null,
    };
  }

  function finishItem(result) {
    const nextResults = [...results, result];
    setResults(nextResults);
    if (index + 1 >= items.length) {
      navigation.navigate('SessionSummary', {
        sessionName,
        exerciseType,
        startedAt: startedAt.current,
        endedAt: new Date().toISOString(),
        results: nextResults,
      });
      return;
    }
    setIndex((value) => value + 1);
    resetQuestion();
  }

  function answer(value, isCorrect, recordedChoice = value) {
    if (!current || stagedResult) return;
    const nextAttempt = attempts + 1;
    if (firstChoice.current === null) {
      firstChoice.current = recordedChoice;
      firstResponseMs.current = Math.min(Date.now() - questionShownAt.current, 120000);
    }
    if (isCorrect) {
      finishItem(resultFor({ correct: nextAttempt === 1, resolved: true, attemptCount: nextAttempt, usedHint: hintUsed, value }));
      return;
    }
    setAttempts(nextAttempt);
    if (nextAttempt === 1) {
      setPrompt('Coba lagi ya ↻');
      return;
    }
    setHintUsed(true);
    if (nextAttempt === 2) {
      setPrompt('Ayo lihat bersama-sama');
      if (current.tts_syllable) speakLetter(current.tts_syllable, speechRate);
      return;
    }
    const result = resultFor({ correct: false, resolved: false, attemptCount: 3, usedHint: true, value });
    setStagedResult(result);
    setPrompt(`Ini dia jawabannya: ${current.correct_value}`);
  }

  function exitSession() {
    Alert.alert('Keluar dari latihan?', 'Latihan ini belum disimpan. Kamu bisa mulai lagi nanti.', [
      { text: 'Lanjut belajar', style: 'cancel' },
      { text: 'Keluar', onPress: () => navigation.goBack() },
    ]);
  }

  if (loading) return <Screen><LoadingState message="Menyiapkan latihan..." /></Screen>;
  if (error) return <Screen><ErrorState error={error} onRetry={load} /></Screen>;
  if (!current) return <Screen><ErrorState error={new Error('Item latihan belum tersedia.')} onRetry={load} /></Screen>;

  const timeLabel = formatDuration(elapsed);
  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText variant="subtitle">{sessionName}</ThemedText>
        <Pressable onPress={exitSession} accessibilityRole="button" accessibilityLabel="Keluar dari latihan">
          <ThemedText style={{ color: colors.accent, fontWeight: '700' }}>Keluar</ThemedText>
        </Pressable>
      </View>
      <View style={styles.progressRow}>
        {items.map((item, itemIndex) => (
          <ThemedText key={item.item_index} style={{ color: itemIndex < index ? colors.star : colors.border, fontSize: 24 }}>
            {itemIndex < index ? '★' : '☆'}
          </ThemedText>
        ))}
      </View>
      <ThemedText variant="caption" style={styles.center}>Item {index + 1} dari {items.length} · {timeLabel}</ThemedText>
      <Card style={styles.questionCard}>
        {exerciseType === 'listen_choose' ? (
          <ListenQuestion item={current} colors={colors} speechRate={speechRate} hintUsed={hintUsed} onAnswer={answer} />
        ) : null}
        {exerciseType === 'discriminate' ? (
          <DiscriminateQuestion item={current} onAnswer={answer} colors={colors} hintUsed={hintUsed} />
        ) : null}
        {exerciseType === 'match_pairs' ? (
          <MatchPairsQuestion item={current} selectedLetter={selectedLetter} setSelectedLetter={setSelectedLetter} onAnswer={answer} colors={colors} speechRate={speechRate} hintUsed={hintUsed} />
        ) : null}
        {exerciseType === 'trace' ? (
          <TraceQuestion
            key={current.item_index}
            item={current}
            colors={colors}
            speechRate={speechRate}
            onComplete={({ usedHint, resolved }) => {
              const attemptCount = resolved ? (usedHint ? 2 : 1) : 3;
              const result = resultFor({ correct: !usedHint && resolved, resolved, attemptCount, usedHint, value: current.letter });
              if (resolved) finishItem(result);
              else {
                setStagedResult(result);
                setPrompt(`Ini dia jawabannya: ${current.letter}`);
              }
            }}
          />
        ) : null}
        {exerciseType === 'syllable_build' ? (
          <SyllableQuestion
            key={current.item_index}
            item={current}
            builtWord={builtWord}
            setBuiltWord={setBuiltWord}
            onAnswer={answer}
            onSpeak={() => speakLetter(current.word.word, speechRate)}
            colors={colors}
            hintUsed={hintUsed}
            disabled={Boolean(stagedResult)}
          />
        ) : null}
      </Card>
      {prompt ? (
        <Card style={[styles.promptCard, { backgroundColor: hintUsed ? colors.secondary : colors.retry }]}>
          <ThemedText style={styles.center}>{prompt}</ThemedText>
          {stagedResult ? <PrimaryButton title="Lanjut" onPress={() => finishItem(stagedResult)} style={styles.continueButton} /> : null}
        </Card>
      ) : null}
      <ThemedText variant="caption" style={[styles.center, { color: colors.textSecondary }]}>
        Tidak perlu terburu-buru. Kita belajar pelan-pelan.
      </ThemedText>
    </Screen>
  );
}

function ListenQuestion({ item, colors, speechRate, hintUsed, onAnswer }) {
  useEffect(() => { speakLetter(item.tts_syllable, speechRate); }, [item.item_index, item.tts_syllable, speechRate]);
  return (
    <View style={styles.question}>
      <ThemedText variant="subtitle" style={styles.center}>Dengarkan bunyinya</ThemedText>
      <PrimaryButton title="🔊 Dengar lagi" secondary onPress={() => speakLetter(item.tts_syllable, speechRate)} />
      <ChoiceGrid
        choices={item.choices}
        colors={colors}
        hintSymbol={hintUsed ? item.correct_value : null}
        onChoose={(choice) => onAnswer(choice.symbol, choice.symbol === item.correct_value)}
      />
    </View>
  );
}

function DiscriminateQuestion({ item, colors, hintUsed, onAnswer }) {
  return (
    <View style={styles.question}>
      <ThemedText variant="subtitle" style={styles.center}>Pilih bentuk yang sama persis</ThemedText>
      <Letter3D symbol={item.letter} strokes={item.strokes} height={210} autoRotate />
      <ChoiceGrid
        choices={item.choices}
        colors={colors}
        hintSymbol={hintUsed ? item.correct_value : null}
        onChoose={(choice) => {
          const value = choice.mirrored ? item.target?.similar_to?.[0] || choice.symbol : choice.symbol;
          onAnswer(value, choice.symbol === item.correct_value && !choice.mirrored);
        }}
      />
    </View>
  );
}

function ChoiceGrid({ choices, colors, onChoose, hintSymbol }) {
  return (
    <View style={styles.choiceGrid}>
      {choices.map((choice, index) => (
        <Pressable
          key={`${choice.symbol}-${choice.mirrored}-${index}`}
          accessibilityRole="button"
          accessibilityLabel={`Pilihan huruf ${choice.symbol}${choice.mirrored ? ' bercermin' : ''}`}
          onPress={() => onChoose(choice)}
          style={[
            styles.choice,
            { backgroundColor: colors.secondary, borderColor: colors.border },
            hintSymbol === choice.symbol && !choice.mirrored ? { backgroundColor: colors.success, borderColor: colors.accent, borderWidth: 3 } : null,
          ]}
        >
          <ThemedText variant="title" style={choice.mirrored ? styles.mirrorChoice : null}>{choice.symbol}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

function MatchPairsQuestion({ item, selectedLetter, setSelectedLetter, onAnswer, colors, speechRate, hintUsed }) {
  const selectedPair = item.pairs.find((pair) => pair.symbol === selectedLetter);
  return (
    <View style={styles.question}>
      <ThemedText variant="subtitle" style={styles.center}>Pilih huruf, lalu pasangkan bunyinya</ThemedText>
      <View style={styles.pairGrid}>
        <View style={styles.pairColumn}>
          {item.pairs.map((pair) => (
            <Chip
              key={`letter-${pair.symbol}`}
              title={pair.symbol}
              selected={selectedLetter === pair.symbol || (hintUsed && pair.symbol === item.letter)}
              onPress={() => setSelectedLetter(pair.symbol)}
            />
          ))}
        </View>
        <View style={styles.pairColumn}>
          {item.pairs.map((pair, index) => (
            <PrimaryButton
              key={`sound-${pair.symbol}`}
              title={`🔊 ${pair.sound}`}
              secondary
              style={hintUsed && pair.symbol === item.letter ? { borderColor: colors.accent, borderWidth: 3 } : null}
              onPress={() => {
                speakLetter(pair.sound, speechRate);
                if (selectedPair) onAnswer(pair.symbol, selectedLetter === item.letter && pair.symbol === item.letter);
              }}
            />
          ))}
        </View>
      </View>
      {!selectedLetter ? <ThemedText variant="caption" style={styles.center}>Pilih satu huruf di sebelah kiri.</ThemedText> : null}
    </View>
  );
}

function TraceQuestion({ item, colors, speechRate, onComplete }) {
  const strokeList = useMemo(() => item.strokes?.strokes || [], [item.strokes]);
  const [started, setStarted] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [hintActive, setHintActive] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const sizeRef = useRef({ width: 0, height: 0 });
  const progressRef = useRef({ strokeIndex: 0, pointIndex: 0, completed: 0, misses: 0, hintUsed: false, revealed: false, lastMissAt: 0 });
  const [guideProgress] = useState(() => new Animated.Value(0));

  const activeStroke = strokeList[completedCount] || null;
  const guidePoints = activeStroke?.points?.length > 1 ? activeStroke.points : [[0, 0], [1, 1]];
  const guideScale = size.width && size.height ? Math.min(size.width / 100, size.height / 140) : 0;
  const guideOffsetX = (size.width - 100 * guideScale) / 2;
  const guideOffsetY = (size.height - 140 * guideScale) / 2;
  const guideX = guideProgress.interpolate({
    inputRange: guidePoints.map((_, index) => index),
    outputRange: guidePoints.map(([x]) => guideOffsetX + (10 + x * 80) * guideScale - 7),
    extrapolate: 'clamp',
  });
  const guideY = guideProgress.interpolate({
    inputRange: guidePoints.map((_, index) => index),
    outputRange: guidePoints.map(([, y]) => guideOffsetY + (100 - y * 65) * guideScale - 7),
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (!started || !hintActive || !activeStroke || activeStroke.points.length < 2) return undefined;
    guideProgress.stopAnimation();
    guideProgress.setValue(0);
    const animation = Animated.loop(
      Animated.timing(guideProgress, {
        toValue: activeStroke.points.length - 1,
        duration: Math.max(1400, activeStroke.points.length * 350),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [activeStroke, guideProgress, hintActive, completedCount, started]);

  function revealHint() {
    if (!progressRef.current.hintUsed) {
      progressRef.current.hintUsed = true;
      setHintActive(true);
    }
  }

  function advanceProgress(x, y) {
    const state = progressRef.current;
    if (!started || state.revealed || strokeList.length === 0) return;
    let { strokeIndex, pointIndex, completed, misses } = state;
    let stroke = strokeList[strokeIndex];
    if (!stroke) return;
    let moved = false;
    const threshold = stroke.type === 'dot' ? 0.2 : 0.18;
    while (stroke) {
      const expected = stroke.points[Math.min(pointIndex, stroke.points.length - 1)];
      const dx = x - expected[0];
      const dy = y - expected[1];
      if (Math.sqrt(dx * dx + dy * dy) > threshold) break;
      moved = true;
      if (pointIndex + 1 < stroke.points.length) {
        pointIndex += 1;
      } else {
        strokeIndex += 1;
        pointIndex = 0;
        completed = strokeIndex;
        stroke = strokeList[strokeIndex];
      }
    }
    if (moved) {
      state.strokeIndex = strokeIndex;
      state.pointIndex = pointIndex;
      state.completed = completed;
      if (completed !== completedCount) setCompletedCount(completed);
      return;
    }
    const now = Date.now();
    if (now - state.lastMissAt < 450) return;
    state.lastMissAt = now;
    misses += 1;
    state.misses = misses;
    if (misses >= 2) revealHint();
    if (misses >= 4 && !state.revealed) setShowReveal(true);
  }

  function trackTouch(event) {
    const { width, height } = sizeRef.current;
    if (!width || !height) return;
    const { locationX, locationY } = event.nativeEvent;
    const scale = Math.min(width / 100, height / 140);
    const offsetX = (width - 100 * scale) / 2;
    const offsetY = (height - 140 * scale) / 2;
    const x = (((locationX - offsetX) / scale) - 10) / 80;
    const y = (100 - (locationY - offsetY) / scale) / 65;
    advanceProgress(x, y);
  }

  function finishTrace() {
    onComplete({ resolved: true, usedHint: progressRef.current.hintUsed });
  }

  if (showModel) {
    return (
      <View style={styles.question}>
        <StarSparkle size={32} />
        <ThemedText variant="subtitle" style={styles.center}>{answerRevealed ? 'Ini dia bentuk hurufnya.' : 'Hurufnya muncul! Hebat sekali.'}</ThemedText>
        <Letter3D symbol={item.letter} strokes={item.strokes} height={200} autoRotate />
        {!answerRevealed ? <PrimaryButton title="Lanjut" onPress={finishTrace} /> : null}
      </View>
    );
  }

  if (!started) {
    return (
      <View style={styles.question}>
        <ThemedText variant="subtitle" style={styles.center}>Lihat huruf 3D dulu</ThemedText>
        <ThemedText variant="caption" style={styles.center}>
          Amati bentuk huruf dan urutan goresannya, lalu mulai simulasi menulis.
        </ThemedText>
        <Letter3D symbol={item.letter} strokes={item.strokes} height={210} autoRotate />
        <View style={[styles.tracePreview, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Letter2D strokes={strokeList} width="100%" height="100%" color={colors.textSecondary} />
          <Svg pointerEvents="none" width="100%" height="100%" viewBox="0 0 100 140" style={StyleSheet.absoluteFill}>
            {strokeList.map((stroke, strokeNumber) => {
              const [x, y] = stroke.points[0];
              const cx = 10 + x * 80;
              const cy = 100 - y * 65;
              return (
                <Fragment key={`preview-${stroke.order}`}>
                  <Circle cx={cx} cy={cy} r="7.5" fill={colors.secondary} stroke={colors.border} strokeWidth="1.5" />
                  <SvgText x={cx} y={cy + 3} textAnchor="middle" fill={colors.text} fontSize="8" fontWeight="bold">{strokeNumber + 1}</SvgText>
                </Fragment>
              );
            })}
          </Svg>
        </View>
        <PrimaryButton
          title="Mulai simulasi menulis"
          onPress={() => {
            speakLetter(item.tts_syllable, speechRate);
            setStarted(true);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.question}>
      <ThemedText variant="subtitle" style={styles.center}>Simulasi menulis huruf</ThemedText>
      <ThemedText variant="caption" style={styles.center}>
        Ikuti nomor goresan dari titik awal sampai selesai.
      </ThemedText>
      <View
        onLayout={(event) => {
          const nextSize = event.nativeEvent.layout;
          sizeRef.current = { width: nextSize.width, height: nextSize.height };
          setSize(nextSize);
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onStartShouldSetResponderCapture={() => true}
        onMoveShouldSetResponderCapture={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={trackTouch}
        onResponderMove={trackTouch}
        style={[styles.traceArea, { backgroundColor: colors.bg, borderColor: colors.border }]}
      >
        <Letter2D strokes={strokeList} width="100%" height="100%" color={colors.textSecondary} />
        {completedCount > 0 ? <Letter2D strokes={strokeList.slice(0, completedCount)} width="100%" height="100%" color={colors.accent} /> : null}
        <Svg pointerEvents="none" width="100%" height="100%" viewBox="0 0 100 140" style={StyleSheet.absoluteFill}>
          {strokeList.map((stroke, strokeNumber) => {
            const [x, y] = stroke.points[0];
            const cx = 10 + x * 80;
            const cy = 100 - y * 65;
            const active = strokeNumber === completedCount;
            return (
              <Fragment key={`marker-${stroke.order}`}>
                <Circle cx={cx} cy={cy} r="7.5" fill={active ? colors.accent : colors.secondary} stroke={colors.border} strokeWidth="1.5" />
                <SvgText x={cx} y={cy + 3} textAnchor="middle" fill={colors.text} fontSize="8" fontWeight="bold">{strokeNumber + 1}</SvgText>
              </Fragment>
            );
          })}
        </Svg>
        {hintActive && size.width > 0 && size.height > 0 && activeStroke ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.traceGuide, { backgroundColor: colors.star, transform: [{ translateX: guideX }, { translateY: guideY }] }]}
          />
        ) : null}
      </View>
      <ThemedText style={styles.center}>
        {completedCount >= strokeList.length && strokeList.length > 0
          ? 'Semua goresan selesai. Lihat hasil huruf 3D-mu.'
          : hintActive
            ? `Ikuti panduan pada goresan ${Math.min(completedCount + 1, strokeList.length)} dari ${strokeList.length}.`
            : `Goresan ${Math.min(completedCount + 1, Math.max(strokeList.length, 1))} dari ${Math.max(strokeList.length, 1)}: mulai dari titik bernomor.`}
      </ThemedText>
      {completedCount >= strokeList.length && strokeList.length > 0 ? (
        <PrimaryButton
          title="Lihat huruf 3D"
          onPress={() => {
            setShowModel(true);
            speakLetter(item.tts_syllable, speechRate);
          }}
        />
      ) : null}
      {showReveal && completedCount < strokeList.length ? (
        <PrimaryButton
          title="Lihat contoh huruf"
          secondary
          onPress={() => {
            progressRef.current.revealed = true;
            setShowModel(true);
            setAnswerRevealed(true);
            speakLetter(item.tts_syllable, speechRate);
            onComplete({ resolved: false, usedHint: true });
          }}
        />
      ) : null}
    </View>
  );
}

function SyllableQuestion({ item, builtWord, setBuiltWord, onAnswer, onSpeak, colors, hintUsed, disabled }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const expectedTile = item.correct_value[builtWord.length];

  function selectTile(tile) {
    if (selectedIds.includes(tile.id) || disabled) return;
    const next = builtWord + tile.letter;
    const nextIds = [...selectedIds, tile.id];
    setBuiltWord(next);
    setSelectedIds(nextIds);
    if (next.length >= item.word.word.length) {
      const mismatchIndex = next.split('').findIndex((letter, index) => letter !== item.correct_value[index]);
      const recordedChoice = mismatchIndex === -1 ? item.letter : next[mismatchIndex];
      onAnswer(next, next === item.correct_value, recordedChoice);
      setBuiltWord('');
      setSelectedIds([]);
    }
  }
  function reset() {
    setBuiltWord('');
    setSelectedIds([]);
  }
  return (
    <View style={styles.question}>
      <ThemedText variant="title" style={styles.center}>{item.word.emoji || '🔤'}</ThemedText>
      <ThemedText variant="subtitle" style={styles.center}>Susun huruf menjadi kata</ThemedText>
      <PrimaryButton title="🔊 Dengarkan contoh" secondary onPress={onSpeak} />
      <ThemedText variant="title" style={styles.built}>{builtWord || '· · ·'}</ThemedText>
      <View style={styles.tiles}>
        {item.tiles.map((tile) => (
          <Pressable
            key={tile.id}
            onPress={() => selectTile(tile)}
            disabled={disabled || selectedIds.includes(tile.id)}
            style={[
              styles.tile,
              { backgroundColor: colors.secondary, borderColor: colors.border },
              hintUsed && tile.letter === expectedTile && !selectedIds.includes(tile.id) ? { backgroundColor: colors.success, borderColor: colors.accent, borderWidth: 3 } : null,
              selectedIds.includes(tile.id) ? { opacity: 0.45 } : null,
            ]}
          >
            <ThemedText variant="subtitle">{tile.letter}</ThemedText>
          </Pressable>
        ))}
      </View>
      {builtWord ? <PrimaryButton title="Mulai susun lagi" secondary onPress={reset} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  progressRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2 },
  center: { textAlign: 'center' },
  questionCard: { gap: 14 },
  question: { gap: 14 },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  choice: { width: '29%', minHeight: 76, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  mirrorChoice: { transform: [{ scaleX: -1 }] },
  promptCard: { gap: 10 },
  continueButton: { backgroundColor: 'transparent' },
  pairGrid: { flexDirection: 'row', gap: 12 },
  pairColumn: { flex: 1, gap: 8 },
  traceArea: { width: '100%', height: 310, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tracePreview: { width: '100%', height: 150, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  traceGuide: { position: 'absolute', left: 0, top: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: 'transparent', elevation: 3 },
  built: { textAlign: 'center', minHeight: 56 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  tile: { minWidth: 50, minHeight: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
});
