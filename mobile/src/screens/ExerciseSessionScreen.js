import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { buildItems } from '../exercises/buildItems';
import { useChildPreferences } from '../hooks/useChildPreferences';
import { speakLetter } from '../hooks/useSpeech';
import { useTheme } from '../theme/ThemeContext';
import { Card, Chip, ErrorState, Letter2D, LoadingState, PrimaryButton, Screen, StarSparkle, ThemedText } from '../components/ui';
import { formatDuration } from '../utils/format';
import { Letter3D } from '../three/Letter3D';
import Svg, { Circle, Polyline, Text as SvgText } from 'react-native-svg';

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
          <MatchPairsQuestion key={current.item_index} item={current} onAnswer={answer} colors={colors} speechRate={speechRate} hintUsed={hintUsed} />
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

function MatchPairsQuestion({ item, onAnswer, colors, speechRate, hintUsed }) {
  const pairs = useMemo(() => item.pairs || [], [item.pairs]);
  const letterOptions = useMemo(() => pairs.map((pair) => pair.symbol), [pairs]);
  const [soundOptions] = useState(() => {
    const copy = (item.pairs || []).slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  });
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [matched, setMatched] = useState([]);
  const [message, setMessage] = useState('Langkah 1: pilih satu huruf. Langkah 2: pilih bunyi yang cocok.');
  const [tries, setTries] = useState(0);

  function chooseLetter(symbol) {
    if (matched.includes(symbol)) return;
    setSelectedLetter(symbol);
    setMessage(`Huruf "${symbol}" dipilih. Sekarang pilih bunyinya.`);
  }

  function chooseSound(pair) {
    speakLetter(pair.sound, speechRate);
    if (matched.includes(pair.symbol)) return;
    if (!selectedLetter) {
      setMessage('Pilih huruf dulu, lalu pilih bunyinya.');
      return;
    }
    if (pair.symbol === selectedLetter) {
      const nextMatched = [...matched, selectedLetter];
      setMatched(nextMatched);
      setSelectedLetter(null);
      if (nextMatched.length >= pairs.length) {
        setMessage('Semua pasangan sudah cocok. Hebat!');
        onAnswer(item.letter, true, item.letter);
      } else {
        setMessage(`Cocok! ${nextMatched.length} dari ${pairs.length} pasangan selesai.`);
      }
      return;
    }
    const nextTries = tries + 1;
    setTries(nextTries);
    setSelectedLetter(null);
    setMessage(nextTries >= 2 && !hintUsed
      ? 'Belum cocok. Coba dengarkan bunyinya lagi, lalu cari huruf yang pas.'
      : 'Belum cocok. Coba lagi ya, pelan-pelan.');
  }

  return (
    <View style={styles.question}>
      <ThemedText variant="subtitle" style={styles.center}>Pasangkan huruf dan bunyinya</ThemedText>
      <ThemedText variant="caption" style={styles.center}>
        Pilih 1 huruf, lalu pilih bunyi yang cocok. Ulangi sampai semua pasangan selesai.
      </ThemedText>
      <ThemedText variant="caption" style={[styles.center, { fontWeight: '700' }]}>
        {matched.length} dari {pairs.length} pasangan selesai
      </ThemedText>
      <View style={styles.pairGrid}>
        <View style={styles.pairColumn}>
          <ThemedText variant="caption" style={styles.center}>Huruf</ThemedText>
          {letterOptions.map((symbol) => {
            const done = matched.includes(symbol);
            return (
              <Chip
                key={`letter-${symbol}`}
                title={done ? `${symbol} ✓` : symbol}
                selected={selectedLetter === symbol}
                disabled={done}
                onPress={() => chooseLetter(symbol)}
                style={done ? { backgroundColor: colors.success, borderColor: colors.accent } : null}
              />
            );
          })}
        </View>
        <View style={styles.pairColumn}>
          <ThemedText variant="caption" style={styles.center}>Bunyi</ThemedText>
          {soundOptions.map((pair) => {
            const done = matched.includes(pair.symbol);
            return (
              <PrimaryButton
                key={`sound-${pair.symbol}`}
                title={done ? `✓ ${pair.sound}` : `🔊 ${pair.sound}`}
                secondary
                disabled={done}
                style={done ? { backgroundColor: colors.success, borderColor: colors.accent } : null}
                onPress={() => chooseSound(pair)}
              />
            );
          })}
        </View>
      </View>
      <Card style={[styles.pairHintCard, { backgroundColor: hintUsed || tries >= 2 ? colors.secondary : colors.bg }]}>
        <ThemedText variant="caption" style={styles.center}>{message}</ThemedText>
        {hintUsed ? <ThemedText variant="caption" style={styles.center}>Petunjuk: coba cari pasangan huruf target &quot;{item.letter}&quot; terlebih dulu.</ThemedText> : null}
      </Card>
    </View>
  );
}

function StrokePlayback({ strokeList, colors }) {
  const [progress, setProgress] = useState({ strokeIndex: 0, pointIndex: 1, phase: 'draw' });
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing || strokeList.length === 0) return undefined;
    const timer = setInterval(() => {
      setProgress((current) => {
        const stroke = strokeList[current.strokeIndex];
        if (!stroke) return { strokeIndex: 0, pointIndex: 1, phase: 'draw' };
        if (current.phase === 'pause') {
          const nextStroke = current.strokeIndex + 1;
          if (nextStroke >= strokeList.length) return { strokeIndex: 0, pointIndex: 1, phase: 'draw' };
          return { strokeIndex: nextStroke, pointIndex: 1, phase: 'draw' };
        }
        const pointsCount = Math.max(stroke.points?.length || 1, 1);
        const nextPoint = current.pointIndex + 1;
        if (nextPoint > pointsCount) return { ...current, phase: 'pause' };
        return { ...current, pointIndex: nextPoint };
      });
    }, 120);
    return () => clearInterval(timer);
  }, [playing, strokeList]);

  const activeStroke = strokeList[progress.strokeIndex];
  const partialPoints = activeStroke ? activeStroke.points.slice(0, Math.max(progress.pointIndex, activeStroke.type === 'dot' ? 1 : 2)) : [];
  const toPoint = ([x, y]) => `${10 + x * 80},${100 - y * 65}`;

  return (
    <View style={styles.playbackWrap}>
      <View style={[styles.traceArea, { backgroundColor: colors.bg, borderColor: colors.border, height: 280 }]}>
        <Letter2D strokes={strokeList} width="100%" height="100%" color={colors.border} />
        {progress.strokeIndex > 0 ? <Letter2D strokes={strokeList.slice(0, progress.strokeIndex)} width="100%" height="100%" color={colors.textSecondary} /> : null}
        <Svg pointerEvents="none" width="100%" height="100%" viewBox="0 0 100 140" style={StyleSheet.absoluteFill}>
          {strokeList.map((stroke, strokeNumber) => {
            const [x, y] = stroke.points[0];
            const cx = 10 + x * 80;
            const cy = 100 - y * 65;
            const active = strokeNumber === progress.strokeIndex;
            const done = strokeNumber < progress.strokeIndex;
            return (
              <Fragment key={`marker-${stroke.order}`}>
                <Circle cx={cx} cy={cy} r="7.5" fill={active ? colors.accent : done ? colors.success : colors.secondary} stroke={colors.border} strokeWidth="1.5" />
                <SvgText x={cx} y={cy + 3} textAnchor="middle" fill={colors.text} fontSize="8" fontWeight="bold">{strokeNumber + 1}</SvgText>
              </Fragment>
            );
          })}
          {activeStroke?.type === 'dot' && partialPoints[0] ? (
            <Circle cx={10 + partialPoints[0][0] * 80} cy={100 - partialPoints[0][1] * 65} r="6" fill={colors.accent} />
          ) : null}
          {activeStroke && activeStroke.type !== 'dot' && partialPoints.length > 1 ? (
            <Polyline
              points={partialPoints.map(toPoint).join(' ')}
              fill="none"
              stroke={colors.accent}
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {partialPoints[partialPoints.length - 1] ? (
            <Circle
              cx={10 + partialPoints[partialPoints.length - 1][0] * 80}
              cy={100 - partialPoints[partialPoints.length - 1][1] * 65}
              r="5"
              fill={colors.star}
              stroke={colors.surface}
              strokeWidth="1.5"
            />
          ) : null}
        </Svg>
      </View>
      <View style={styles.playbackControls}>
        <PrimaryButton
          title={playing ? 'Jeda' : 'Putar'}
          secondary
          onPress={() => setPlaying((value) => !value)}
          style={styles.playbackButton}
        />
        <PrimaryButton
          title="Ulangi"
          secondary
          onPress={() => {
            setProgress({ strokeIndex: 0, pointIndex: 1, phase: 'draw' });
            setPlaying(true);
          }}
          style={styles.playbackButton}
        />
      </View>
    </View>
  );
}

function TraceQuestion({ item, colors, speechRate, onComplete }) {
  const strokeList = useMemo(() => item.strokes?.strokes || [], [item.strokes]);

  return (
    <View style={styles.question}>
      <ThemedText variant="subtitle" style={styles.center}>Simulasi Huruf 3D</ThemedText>
      <ThemedText variant="caption" style={styles.center}>
        Lihat huruf 3D, lalu ikuti langkah-langkah dan video cara menulisnya.
      </ThemedText>
      <Letter3D symbol={item.letter} strokes={item.strokes} height={210} autoRotate />
      <StrokePlayback strokeList={strokeList} colors={colors} />
      <Card style={[styles.stepsCard, { backgroundColor: colors.bg }]}>
        <ThemedText variant="caption" style={{ fontWeight: '700' }}>Langkah-langkah menulis</ThemedText>
        {strokeList.map((stroke, index) => (
          <ThemedText key={`step-${stroke.order || index}`} variant="caption" style={styles.stepText}>
            {`${index + 1}. ${stroke.type === 'dot' ? 'Beri titik di posisi bernomor.' : 'Mulai dari titik bernomor, lalu ikuti alur goresan ini sampai selesai.'}`}
          </ThemedText>
        ))}
        {strokeList.length === 0 ? (
          <ThemedText variant="caption" style={styles.stepText}>Langkah menulis belum tersedia.</ThemedText>
        ) : null}
      </Card>
      <PrimaryButton
        title="🔊 Dengarkan bunyi huruf"
        secondary
        onPress={() => speakLetter(item.tts_syllable, speechRate)}
      />
      <PrimaryButton title="Lanjut" onPress={() => onComplete({ resolved: true, usedHint: false })} />
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
  pairHintCard: { gap: 6, borderWidth: 1 },
  traceArea: { width: '100%', height: 310, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tracePreview: { width: '100%', height: 150, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  traceGuide: { position: 'absolute', left: 0, top: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: 'transparent', elevation: 3 },
  playbackWrap: { gap: 10 },
  playbackControls: { flexDirection: 'row', gap: 10 },
  playbackButton: { flex: 1 },
  stepsCard: { gap: 8, borderWidth: 1 },
  stepText: { textAlign: 'left' },
  built: { textAlign: 'center', minHeight: 56 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  tile: { minWidth: 50, minHeight: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
});
