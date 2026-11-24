import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { MathUtils, PlaneGeometry, SphereGeometry } from 'three';
import { createStrokeGeometries } from './strokeGeometry';

function LetterMeshes({ strokes, mirrored, autoRotate, reducedMotion, rotation, interacting, velocityRef, colors, darkMode }) {
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
    } else if (Math.abs(velocityRef.current.y) + Math.abs(velocityRef.current.x) > 0.001) {
      group.current.rotation.y += velocityRef.current.y * delta;
      group.current.rotation.x = MathUtils.clamp(group.current.rotation.x + velocityRef.current.x * delta, -0.61, 0.61);
      const decay = Math.pow(0.08, delta);
      velocityRef.current = { x: velocityRef.current.x * decay, y: velocityRef.current.y * decay };
    }
  });

  return (
    <>
      <color attach="background" args={[colors.background]} />
      <ambientLight intensity={darkMode ? 0.62 : 0.86} />
      <directionalLight position={[2.5, 3.5, 4.5]} intensity={darkMode ? 0.85 : 1.15} />
      <directionalLight position={[-2, 1, 3]} intensity={0.35} color="#ffffff" />
      <group ref={group} scale={[1, 1, 1]}>
        {geometries.entries.map((entry, index) => entry.type === 'dot' ? (
          <mesh key={`dot-${index}`} geometry={dotGeometry} position={entry.position}>
            <meshStandardMaterial color={colors.body} roughness={0.35} metalness={0.08} emissive={colors.body} emissiveIntensity={0.08} />
          </mesh>
        ) : (
          <group key={`line-${index}`}>
            <mesh geometry={entry.geometry}>
              <meshStandardMaterial color={colors.body} roughness={0.38} metalness={0.06} emissive={colors.body} emissiveIntensity={0.06} />
            </mesh>
            <mesh geometry={geometries.capGeometry} position={entry.start}>
              <meshStandardMaterial color={colors.body} roughness={0.38} metalness={0.06} />
            </mesh>
            <mesh geometry={geometries.capGeometry} position={entry.end}>
              <meshStandardMaterial color={colors.body} roughness={0.38} metalness={0.06} />
            </mesh>
          </group>
        ))}
      </group>
      <mesh position={[0, -0.83, -0.16]} rotation={[-Math.PI / 2, 0, 0]} geometry={shadowGeometry}>
        <meshBasicMaterial color={colors.shadow} transparent opacity={0.3} />
      </mesh>
    </>
  );
}

export function Letter3DScene({
  strokes,
  mirrored,
  autoRotate,
  reducedMotion,
  rotation,
  interacting,
  velocityRef,
  colors,
  darkMode,
  onReady,
}) {
  return (
    <Canvas
      style={{ flex: 1 }}
      camera={{ position: [0, 0, 3.6], near: 0.1, far: 20 }}
      onCreated={onReady}
    >
      <LetterMeshes
        strokes={strokes}
        mirrored={mirrored}
        autoRotate={autoRotate}
        reducedMotion={reducedMotion}
        rotation={rotation}
        interacting={interacting}
        velocityRef={velocityRef}
        colors={colors}
        darkMode={darkMode}
      />
    </Canvas>
  );
}
