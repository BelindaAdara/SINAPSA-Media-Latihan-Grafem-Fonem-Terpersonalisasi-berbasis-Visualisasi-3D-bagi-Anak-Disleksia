import { Component, createElement, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Circle, Polygon, Polyline } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { ThemedText } from '../components/ui';
import { projectStrokes } from './strokeProjection';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
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

function ProceduralLetterViewer({ strokes, symbol, height, colors, mirrored, autoRotate, reduceMotion }) {
  const [rotation, setRotation] = useState({ yaw: -0.55, pitch: 0.12 });
  const [dragging, setDragging] = useState(false);
  const lastGesture = useRef({ dx: 0, dy: 0 });
  const lastTap = useRef(0);
  const geometry = useMemo(
    () => projectStrokes(strokes, rotation, mirrored),
    [strokes, rotation, mirrored],
  );

  useEffect(() => {
    if (!autoRotate || reduceMotion || dragging) return undefined;
    let frame;
    let previousFrame = 0;
    const rotate = (time) => {
      if (time - previousFrame >= 80) {
        previousFrame = time;
        setRotation((current) => ({ ...current, yaw: current.yaw + 0.014 }));
      }
      frame = requestAnimationFrame(rotate);
    };
    frame = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(frame);
  }, [autoRotate, reduceMotion, dragging]);

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
      if (now - lastTap.current < 300) setRotation({ yaw: -0.55, pitch: 0.12 });
      lastTap.current = now;
    },
    onPanResponderTerminate: () => setDragging(false),
  }), []);

  return (
    <View
      {...responder.panHandlers}
      accessible
      accessibilityLabel={`Model huruf ${symbol}. Seret untuk memutar, ketuk dua kali untuk mengatur ulang.`}
      style={[styles.viewer, { height, backgroundColor: colors.background }]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 160 160">
        {geometry.faces.map((face) => (
          <Polygon key={face.key} points={face.points} fill={colors.shadow} />
        ))}
        {geometry.backPaths.map((path) => (
          <Polyline key={path.key} points={path.points} fill="none" stroke={colors.shadow} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {geometry.backDots.map((dot) => (
          <Circle key={dot.key} cx={dot.x} cy={dot.y} r="7" fill={colors.shadow} />
        ))}
        {geometry.frontPaths.map((path) => (
          <Polyline key={path.key} points={path.points} fill="none" stroke={colors.body} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {geometry.frontDots.map((dot) => (
          <Circle key={dot.key} cx={dot.x} cy={dot.y} r="6" fill={colors.body} />
        ))}
      </Svg>
      <View pointerEvents="none" style={styles.viewerHint}>
        <ThemedText variant="caption" style={styles.center}>Geser untuk memutar · ketuk dua kali untuk mengatur ulang</ThemedText>
      </View>
    </View>
  );
}

export function Letter3D({ symbol, strokes, mirrored = false, autoRotate = true, colors, height = 250 }) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const themeColors = colors || {
    body: theme.colors.accent,
    shadow: theme.colors.secondary,
    background: theme.colors.bg,
  };
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const rotation = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const lastTap = useRef(0);
  const resumeTimer = useRef(null);
  const pointList = Array.isArray(strokes) ? strokes : strokes?.strokes || [];

  const Scene = getThreeLetterScene();

  useEffect(() => {
    if (!Scene || ready || failed) return undefined;
    const timeout = setTimeout(() => setFailed(true), 3000);
    return () => clearTimeout(timeout);
  }, [Scene, ready, failed]);

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
    return <View style={[styles.fallback, { height }]}><ThemedText>Gambar huruf belum tersedia.</ThemedText></View>;
  }

  if (failed) {
    return (
      <ProceduralLetterViewer
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

  if (!Scene) {
    return (
      <ProceduralLetterViewer
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

  return (
    <View
      {...responder.panHandlers}
      accessible
      accessibilityLabel={`Model tiga dimensi huruf ${symbol}. Seret untuk memutar, ketuk dua kali untuk mengatur ulang.`}
      style={[styles.viewer, { height, backgroundColor: themeColors.background }]}
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
  );
}

const styles = StyleSheet.create({
  viewer: { borderRadius: 22, overflow: 'hidden' },
  fallback: { borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8 },
  viewerHint: { position: 'absolute', left: 12, right: 12, bottom: 8, alignItems: 'center' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
