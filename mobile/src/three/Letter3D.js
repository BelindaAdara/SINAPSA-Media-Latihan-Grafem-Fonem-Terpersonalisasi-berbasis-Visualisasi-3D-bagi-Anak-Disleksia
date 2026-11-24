import { Component, createElement, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Polygon, Polyline } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { ThemedText } from '../components/ui';
import { projectStrokes } from './strokeProjection';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const INITIAL_ROTATION = { yaw: -0.55, pitch: 0.14 };
let ThreeLetterScene;
let sceneLoadError;
let sceneLoadErrorLogged = false;

function getThreeLetterScene() {
  if (!ThreeLetterScene && !sceneLoadError) {
    try {
      ThreeLetterScene = require('./Letter3DScene').Letter3DScene;
    } catch (error) {
      sceneLoadError = error;
    }
  }
  if (sceneLoadError && !sceneLoadErrorLogged) {
    console.warn('[SINAPSA] 3D viewer unavailable; using 2D fallback.', sceneLoadError);
    sceneLoadErrorLogged = true;
  }
  return ThreeLetterScene;
}

class RendererBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.error) return null;
    return this.props.children;
  }
}

function ViewerButton({ title, onPress, active = false, colors }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.viewerButton,
        {
          backgroundColor: active ? colors.accent : colors.surface,
          borderColor: active ? colors.accent : colors.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <ThemedText
        variant="caption"
        style={{ color: active ? colors.onAccent : colors.text, fontWeight: '700' }}
      >
        {title}
      </ThemedText>
    </Pressable>
  );
}

function ProceduralLetterViewer({ strokes, symbol, height, colors, mirrored, autoRotate, reduceMotion }) {
  const [rotation, setRotation] = useState(INITIAL_ROTATION);
  const [dragging, setDragging] = useState(false);
  const [autoSpin, setAutoSpin] = useState(autoRotate && !reduceMotion);
  const lastGesture = useRef({ dx: 0, dy: 0 });
  const lastTap = useRef(0);
  const geometry = useMemo(
    () => projectStrokes(strokes, rotation, mirrored, colors),
    [strokes, rotation, mirrored, colors],
  );

  useEffect(() => {
    if (!autoSpin || dragging) return undefined;
    let frame;
    let previousFrame = 0;
    const rotate = (time) => {
      if (time - previousFrame >= 80) {
        previousFrame = time;
        setRotation((current) => ({ ...current, yaw: current.yaw + 0.016 }));
      }
      frame = requestAnimationFrame(rotate);
    };
    frame = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(frame);
  }, [autoSpin, dragging]);

  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
    onPanResponderGrant: () => {
      lastGesture.current = { dx: 0, dy: 0 };
      setDragging(true);
    },
    onPanResponderMove: (_, gesture) => {
      const deltaX = gesture.dx - lastGesture.current.dx;
      const deltaY = gesture.dy - lastGesture.current.dy;
      lastGesture.current = { dx: gesture.dx, dy: gesture.dy };
      setRotation((current) => ({
        yaw: current.yaw + deltaX * 0.012,
        pitch: clamp(current.pitch + deltaY * 0.01, -1.15, 1.15),
      }));
    },
    onPanResponderRelease: (event) => {
      setDragging(false);
      const now = event.nativeEvent.timestamp;
      if (now - lastTap.current < 300) setRotation(INITIAL_ROTATION);
      lastTap.current = now;
    },
    onPanResponderTerminate: () => setDragging(false),
  }), []);

  return (
    <View style={[styles.viewerFrame, { height, borderColor: colors.border || '#D6DCE8', backgroundColor: colors.background }]}>
      <View {...responder.panHandlers} style={styles.canvasWrap} accessible accessibilityLabel={`Model huruf ${symbol}. Seret untuk memutar.`}>
        <Svg width="100%" height="100%" viewBox="0 0 160 160">
          {geometry.faces.map((face) => (
            <Polygon key={face.key} points={face.points} fill={face.fill} opacity="0.92" />
          ))}
          {geometry.backPaths.map((path) => (
            <Polyline key={path.key} points={path.points} fill="none" stroke={geometry.backColor} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
          ))}
          {geometry.backDots.map((dot) => (
            <Circle key={dot.key} cx={dot.x} cy={dot.y} r="7" fill={geometry.backColor} opacity="0.8" />
          ))}
          {geometry.frontPaths.map((path) => (
            <Polyline key={path.key} points={path.points} fill="none" stroke={geometry.frontColor} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {geometry.frontDots.map((dot) => (
            <Circle key={dot.key} cx={dot.x} cy={dot.y} r="6" fill={geometry.frontColor} />
          ))}
        </Svg>
      </View>
      <View style={styles.controls}>
        <ViewerButton title="Atur ulang" onPress={() => setRotation(INITIAL_ROTATION)} colors={colors} />
        <ViewerButton title={autoSpin ? 'Jeda putar' : 'Putar'} onPress={() => setAutoSpin((value) => !value)} active={autoSpin} colors={colors} />
      </View>
      <ThemedText variant="caption" style={[styles.center, { color: colors.textSecondary || '#5B6475' }]}>Geser huruf untuk mengamati bentuknya</ThemedText>
    </View>
  );
}

export function Letter3D({ symbol, strokes, mirrored = false, autoRotate = true, colors, height = 250, resetKey = 0 }) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const themeColors = colors || {
    body: theme.colors.accent,
    shadow: theme.colors.secondary,
    background: theme.colors.surface,
    border: theme.colors.border,
    textSecondary: theme.colors.textSecondary,
  };
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [attempt, setAttempt] = useState({ symbol, resetKey, hasScene: false });
  const rotation = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const lastTap = useRef(0);
  const resumeTimer = useRef(null);
  const pointList = Array.isArray(strokes) ? strokes : strokes?.strokes || [];

  const Scene = getThreeLetterScene();
  const nextAttempt = { symbol, resetKey, hasScene: Boolean(Scene) };
  if (attempt.symbol !== nextAttempt.symbol || attempt.resetKey !== nextAttempt.resetKey || attempt.hasScene !== nextAttempt.hasScene) {
    setAttempt(nextAttempt);
    setReady(false);
    setFailed(false);
    rotation.current = { x: 0, y: 0 };
    velocity.current = { x: 0, y: 0 };
  }

  useEffect(() => {
    if (!Scene || ready || failed) return undefined;
    const timeout = setTimeout(() => setFailed(true), 3000);
    return () => clearTimeout(timeout);
  }, [Scene, ready, failed, symbol, resetKey]);

  useEffect(() => () => clearTimeout(resumeTimer.current), []);

  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3,
    onPanResponderGrant: () => {
      clearTimeout(resumeTimer.current);
      setInteracting(true);
      velocity.current = { x: 0, y: 0 };
    },
    onPanResponderMove: (_, gesture) => {
      rotation.current.x = clamp(rotation.current.x + gesture.dy * 0.004, -0.61, 0.61);
      rotation.current.y += gesture.dx * 0.006;
    },
    onPanResponderRelease: (event, gesture) => {
      velocity.current = { x: gesture.vy * 0.08, y: gesture.vx * 0.08 };
      setInteracting(false);
      resumeTimer.current = setTimeout(() => {
        velocity.current = { x: 0, y: 0 };
      }, 1200);
      const currentTime = event.nativeEvent.timestamp;
      if (currentTime - lastTap.current < 300) {
        rotation.current.x = 0;
        rotation.current.y = 0;
        velocity.current = { x: 0, y: 0 };
      }
      lastTap.current = currentTime;
    },
    onPanResponderTerminate: () => setInteracting(false),
  }), []);

  if (!pointList.length) {
    return <View style={[styles.fallback, { height, borderColor: themeColors.border || theme.colors.border }]}><ThemedText>Gambar huruf belum tersedia.</ThemedText></View>;
  }

  if (failed || !Scene) {
    return (
      <ProceduralLetterViewer
        key={`${symbol}-${resetKey}-${mirrored}`}
        strokes={pointList}
        symbol={symbol}
        height={height}
        colors={themeColors}
        mirrored={mirrored}
        autoRotate={autoRotate}
        reduceMotion={reduceMotion}
      />
    );
  }

  function resetView() {
    rotation.current = { x: 0, y: 0 };
    velocity.current = { x: 0, y: 0 };
  }

  return (
    <View style={[styles.viewerFrame, { height, borderColor: theme.colors.border, backgroundColor: themeColors.background }]}>
      <View
        {...responder.panHandlers}
        accessible
        accessibilityLabel={`Model tiga dimensi huruf ${symbol}. Seret untuk memutar, ketuk dua kali untuk mengatur ulang.`}
        style={styles.canvasWrap}
      >
        <RendererBoundary
          onError={(error) => {
            console.warn('[SINAPSA] 3D renderer failed; using 2D fallback.', error);
            setFailed(true);
          }}
        >
          {createElement(Scene, {
            strokes: pointList,
            mirrored,
            autoRotate,
            reducedMotion: reduceMotion,
            rotation,
            interacting,
            velocityRef: velocity,
            colors: themeColors,
            darkMode: theme.theme === 'dark',
            onReady: () => setReady(true),
          })}
        </RendererBoundary>
        {!ready ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={themeColors.body} />
          </View>
        ) : null}
      </View>
      <View style={styles.controls}>
        <ViewerButton title="Atur ulang" onPress={resetView} colors={theme.colors} />
      </View>
      <ThemedText variant="caption" style={[styles.center, { color: theme.colors.textSecondary }]}>Geser untuk memutar · ketuk dua kali untuk mengatur ulang</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  viewerFrame: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, padding: 10, gap: 8 },
  canvasWrap: { flex: 1, minHeight: 180, borderRadius: 18, overflow: 'hidden' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  viewerButton: { minHeight: 40, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  fallback: { borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});