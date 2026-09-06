import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const positions = new Float32Array(1500 * 3).map(() => (Math.random() - 0.5) * 24);
const colors = new Float32Array(1500 * 3).map(() => Math.random() * 0.6 + 0.2);

export function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    const points = pointsRef.current;
    if (!points) return;
    points.rotation.y = clock.getElapsedTime() * 0.02;
    const attr = points.geometry.attributes.position;
    const array = attr.array as Float32Array;
    const t = clock.getElapsedTime();
    for (let i = 1; i < array.length; i += 3) {
      array[i] += Math.sin(t + i) * 0.0008;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={1500} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={1500} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}
