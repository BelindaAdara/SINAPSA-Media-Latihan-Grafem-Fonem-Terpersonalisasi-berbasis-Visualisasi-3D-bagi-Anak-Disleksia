import { Component, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, PanResponder, StyleSheet, View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { MathUtils, PlaneGeometry, SphereGeometry } from 'three';
import { useTheme } from '../theme/ThemeContext';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { Letter2D, ThemedText } from '../components/ui';
import { createStrokeGeometries } from './strokeGeometry';

class CanvasBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.error) return null;
    return this.props.children;
  }
}

function LetterMeshes({ strokes, mirrored, autoRotate, reducedMotion, rotation, interacting, velocity, colors, darkMode }) {
  const group = useRef(null);
  const geometries = useMemo(() => createStrokeGeometries(strokes), [strokes]);
  const shadowGeometry = useMemo(() => new PlaneGeometry(1.7, 0.24), []);
  const dotGeometry = useMemo(() => new SphereGeometry(0.06, 12, 12), []);

  useEffect(() => () => {
    geometries.entries.forEach((entry) => entry.geometry?.dispose());
    geometries.capGeometry.dispose();
    shadowGeometry.dispose();
    dotGeometry.dispose();
  }, [geometries, shadowGeometry, dotGeometry]);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.scale.x = MathUtils.damp(group.current.scale.x, mirrored ? -1 : 1, 7, delta);
    group.current.rotation.x = rotation.current.x;
    if (interacting) {
      group.current.rotation.y = rotation.current.y;
    } else if (autoRotate && !reducedMotion) {
      group.current.rotation.y += delta * 0.3;
    } else if (Math.abs(velocity.current.y) + Math.abs(velocity.current.x) > 0.001) {
      group.current.rotation.y += velocity.current.y * delta;
      group.current.rotation.x = MathUtils.clamp(group.current.rotation.x + velocity.current.x * delta, -0.61, 0.61);
      const decay = Math.pow(0.08, delta);
      velocity.current = { x: velocity.current.x * decay, y: velocity.current.y * decay };
    }
  });

  return (
    <>
      <color attach="background" args={[colors.background]} />
      <ambientLight intensity={darkMode ? 0.55 : 0.8} />
      <directionalLight position={[2, 3, 4]} intensity={darkMode ? 0.7 : 1.1} color={colors.body} />
      <group ref={group} scale={[1, 1, 1]}>
        {geometries.entries.map((entry, index) => entry.type === 'dot' ? (
          <mesh key={`dot-${index}`} geometry={dotGeometry} position={entry.position}>
            <meshStandardMaterial color={colors.body} roughness={0.45} metalness={0.04} />
          </mesh>
        ) : (
          <group key={`line-${index}`}>
            <mesh geometry={entry.geometry}>
              <meshStandardMaterial color={colors.body} roughness={0.48} metalness={0.03} />
            </mesh>
            <mesh geometry={geometries.capGeometry} position={entry.start}>
              <meshStandardMaterial color={colors.body} roughness={0.48} />
            </mesh>
            <mesh geometry={geometries.capGeometry} position={entry.end}>
              <meshStandardMaterial color={colors.body} roughness={0.48} />
            </mesh>
          </group>
        ))}
      </group>
      <mesh position={[0, -0.83, -0.16]} rotation={[-Math.PI / 2, 0, 0]} geometry={shadowGeometry}>
        <meshBasicMaterial color={colors.shadow} transparent opacity={0.28} />
      </mesh>
    </>
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

  useEffect(() => {
    if (ready || failed) return undefined;
    const timeout = setTimeout(() => setFailed(true), 3000);
    return () => clearTimeout(timeout);
  }, [ready, failed]);

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
      rotation.current.x = MathUtils.clamp(rotation.current.x + gesture.dy * 0.004, -0.61, 0.61);
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
      <View style={[styles.fallback, { height, backgroundColor: themeColors.background }]}>
        <Letter2D strokes={pointList} width={110} height={height - 44} color={themeColors.body} mirrored={mirrored} />
        <ThemedText variant="caption" style={styles.center}>Tampilan 3D tidak tersedia di perangkat ini</ThemedText>
      </View>
    );
  }

  return (
    <View
      {...responder.panHandlers}
      accessible
      accessibilityLabel={`Model tiga dimensi huruf ${symbol}. Seret untuk memutar, ketuk dua kali untuk mengatur ulang.`}
      style={[styles.viewer, { height, backgroundColor: themeColors.background }]}
    >
      <Canvas
        style={{ flex: 1 }}
        camera={{ position: [0, 0, 3.6], near: 0.1, far: 20 }}
        onCreated={() => setReady(true)}
      >
        <CanvasBoundary onError={() => setFailed(true)}>
          <LetterMeshes
            strokes={pointList}
            mirrored={mirrored}
            autoRotate={autoRotate}
            reducedMotion={reduceMotion}
            rotation={rotation}
            interacting={interacting}
            velocity={velocity}
            colors={themeColors}
            darkMode={theme.theme === 'dark'}
          />
        </CanvasBoundary>
      </Canvas>
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
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
