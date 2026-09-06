import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { FigureId } from '../../data/figureModels';
import { Logo3D } from './Logo3D';

const COLORS: Record<FigureId, string> = {
  itachi: '#F44336',
  goku: '#FFD54F',
  vegeta: '#42A5F5',
  zoro: '#66BB6A',
  optimus: '#EF5350',
  spiderman: '#FF9800',
  krishna: '#FFD54F',
  thor: '#3d9dff',
  batman: '#f0c14b',
  ironman: '#1aa6b8',
  luffy: '#ff7a1a',
  kratos: '#ff6a1a',
  naruto: '#3dba6e',
};

function SharinganRing() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.z = clock.getElapsedTime() * 0.55;
  });
  return (
    <group ref={g} position={[0, 1.15, -0.35]}>
      <mesh>
        <torusGeometry args={[0.34, 0.018, 10, 48]} />
        <meshStandardMaterial color="#7f1d1d" emissive="#F44336" emissiveIntensity={2.4} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos((i * Math.PI * 2) / 3) * 0.2, Math.sin((i * Math.PI * 2) / 3) * 0.2, 0]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshStandardMaterial color="#1a0505" emissive="#b71c1c" emissiveIntensity={1.6} />
        </mesh>
      ))}
    </group>
  );
}

function Feathers() {
  const group = useRef<THREE.Group>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        x: Math.sin(i * 1.7) * 0.9,
        z: Math.cos(i * 1.3) * 0.9,
        delay: i * 0.18,
        spin: 0.8 + (i % 5) * 0.2,
      })),
    []
  );
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.children.forEach((child, i) => {
      const s = seeds[i];
      const u = (t * 0.35 + s.delay) % 2.4;
      child.position.set(s.x + Math.sin(t + i) * 0.12, 1.7 - u * 0.75, s.z);
      child.rotation.set(u * s.spin, t * 0.4, u * 1.2);
    });
  });
  return (
    <group ref={group}>
      {seeds.map((_, i) => (
        <mesh key={i} scale={[0.07, 0.018, 0.03]}>
          <sphereGeometry args={[1, 6, 4]} />
          <meshStandardMaterial color="#1a0505" emissive="#7f1d1d" emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function KiRings({ color = '#FFD54F' }: { color?: string }) {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (a.current) {
      a.current.scale.setScalar(0.7 + (t % 1.6) * 0.55);
      (a.current.material as THREE.MeshStandardMaterial).opacity = 0.45 - (t % 1.6) * 0.22;
    }
    if (b.current) {
      b.current.scale.setScalar(0.55 + ((t + 0.8) % 1.6) * 0.55);
      (b.current.material as THREE.MeshStandardMaterial).opacity = 0.4 - ((t + 0.8) % 1.6) * 0.2;
    }
  });
  return (
    <group position={[0, 0.7, 0]}>
      <mesh ref={a} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.42, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={b} rotation={[-Math.PI / 2, 0, 0.4]}>
        <ringGeometry args={[0.28, 0.34, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function SlashArcs() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.getElapsedTime();
    g.current.rotation.y = Math.sin(t * 3.2) * 0.9;
    g.current.rotation.z = Math.sin(t * 2.4) * 0.25;
    g.current.children.forEach((child, i) => {
      child.rotation.x = t * (1.4 + i * 0.3);
    });
  });
  return (
    <group ref={g} position={[0, 0.85, 0]}>
      {[0.55, 0.7, 0.85].map((r, i) => (
        <mesh key={i} rotation={[0.4 + i * 0.2, i * 0.7, 0.15]}>
          <torusGeometry args={[r, 0.008, 8, 48, Math.PI * 0.7]} />
          <meshStandardMaterial color="#A5D6A7" emissive="#66BB6A" emissiveIntensity={2.2} />
        </mesh>
      ))}
    </group>
  );
}

function MechScan() {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ring.current) return;
    const t = clock.getElapsedTime();
    ring.current.position.y = 0.15 + ((t * 0.55) % 1.5);
    (ring.current.material as THREE.MeshStandardMaterial).opacity = 0.55;
  });
  return (
    <group>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.34, 40]} />
        <meshStandardMaterial color="#29B6F6" emissive="#29B6F6" emissiveIntensity={2} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <pointLight position={[-0.22, 1.32, 0.42]} color="#29B6F6" intensity={0.55} distance={2.6} />
      <pointLight position={[0.22, 1.32, 0.42]} color="#EF5350" intensity={0.4} distance={2.6} />
    </group>
  );
}

function CharacterFX({ id }: { id: FigureId }) {
  if (id === 'itachi')
    return (
      <>
        <SharinganRing />
        <Feathers />
      </>
    );
  if (id === 'goku') return <KiRings color="#FFD54F" />;
  if (id === 'vegeta') return <KiRings color="#42A5F5" />;
  if (id === 'zoro') return <SlashArcs />;
  if (id === 'optimus') return <MechScan />;
  if (id === 'thor') return <KiRings color="#3d9dff" />;
  if (id === 'ironman') return <MechScan />;
  if (id === 'kratos') return <SlashArcs />;
  if (id === 'naruto') return <KiRings color="#3dba6e" />;
  return null;
}

/** Ground rings, motes, and a readable 3D DEEPSIX mark — no body-covering light shaft. */
export function FigureAura({ id }: { id: FigureId }) {
  const color = COLORS[id];
  const dim = id === 'krishna';
  const ring = useRef<THREE.Group>(null);
  const ringB = useRef<THREE.Group>(null);
  const shards = useRef<THREE.Group>(null);
  const motes = useRef<THREE.Points>(null);
  const count = dim ? 36 : 64;

  const moteGeo = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.45 + Math.random() * 0.75;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.random() * 1.7;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring.current) ring.current.rotation.y = t * 0.55;
    if (ringB.current) ringB.current.rotation.y = -t * 0.35;
    if (shards.current) shards.current.rotation.y = -t * 0.7;
    if (motes.current) {
      const arr = motes.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] += id === 'itachi' ? 0.004 : 0.01;
        if (arr[i + 1] > 1.7) arr[i + 1] = 0;
      }
      motes.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      <group ref={ring}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <ringGeometry args={[0.72, 0.82, 64]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={dim ? 0.7 : 1.4} side={THREE.DoubleSide} transparent opacity={0.7} />
        </mesh>
      </group>
      <group ref={ringB}>
        <mesh rotation={[-Math.PI / 2, 0, 0.3]} position={[0, 0.03, 0]}>
          <ringGeometry args={[1.02, 1.06, 72]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={dim ? 0.35 : 0.7} side={THREE.DoubleSide} transparent opacity={0.35} />
        </mesh>
      </group>

      <group ref={shards} position={[0, 0.85, 0]}>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.2, Math.sin(i) * 0.25, Math.sin(a) * 1.2]} rotation={[0.4, a, 0.2]}>
              <octahedronGeometry args={[0.04, 0]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
            </mesh>
          );
        })}
      </group>

      <points ref={motes} geometry={moteGeo}>
        <pointsMaterial color={color} size={0.035} transparent opacity={dim ? 0.45 : 0.7} depthWrite={false} sizeAttenuation />
      </points>

      <CharacterFX id={id} />

      <group position={[-1.7, 1.15, 0.15]} scale={0.38}>
        <Logo3D spin={0.4} wobble={0.1} glow={1.35} />
      </group>

      <pointLight color={color} intensity={dim ? 0.55 : 1.4} distance={6} position={[0.6, 1.4, 1.3]} />
      <pointLight color="#fff4dc" intensity={dim ? 0.35 : 0.7} distance={5} position={[-1.1, 1.8, 0.7]} />
    </group>
  );
}
