import { Suspense, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Html, OrbitControls, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { FigureId } from '../../data/figureModels';
import { characterMetadata } from '../../systems/manga/mangaTypes';
import { isTwinFigure, twinFigureMetadata } from '../../data/twinFigures';
import { CharacterModel } from './ModelRig';
import { Logo3D } from './Logo3D';
import { ParticleField } from './ParticleField';

export type VaultPhase = 'logo' | 'figures';

const RING_RADIUS = 3.1;

function figureMeta(id: FigureId) {
  if (isTwinFigure(id)) return twinFigureMetadata[id];
  if (id === 'krishna') return { name: 'Krishna', kanji: 'कृष्ण', color: '#FFD54F', glowColor: '#FFD54F' };
  return characterMetadata[id];
}

export function figurePosition(index: number, count = 6): [number, number, number] {
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
  return [Math.cos(angle) * RING_RADIUS, 0, Math.sin(angle) * RING_RADIUS];
}

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function Pedestal({ color, active, hovered }: { color: string; active: boolean; hovered: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ring.current) {
      const m = ring.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, active ? 1.8 : hovered ? 1.1 : 0.45, 0.1);
      ring.current.rotation.z = clock.getElapsedTime() * (active ? 0.6 : 0.15);
    }
  });
  return (
    <group>
      <mesh position={[0, -0.14, 0]} receiveShadow>
        <cylinderGeometry args={[0.95, 1.05, 0.12, 48]} />
        <meshStandardMaterial color="#141414" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh ref={ring} position={[0, -0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.98, 1.06, 64]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function FigureStand({
  character,
  index,
  count,
  progress,
  selected,
  onSelect,
}: {
  character: FigureId;
  index: number;
  count: number;
  progress: MutableRefObject<number>;
  selected: FigureId | null;
  onSelect: (c: FigureId) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const meta = figureMeta(character);
  const pos = useMemo(() => figurePosition(index, count), [index, count]);
  const active = selected === character;

  useFrame(({ clock }) => {
    if (!group.current) return;
    const p = easeInOut(THREE.MathUtils.clamp((progress.current - index * 0.06) / 0.7, 0, 1));
    group.current.scale.setScalar(Math.max(0.001, p));
    group.current.position.set(pos[0] * (0.3 + 0.7 * p), -0.6 * (1 - p), pos[2] * (0.3 + 0.7 * p));
    const face = Math.atan2(pos[0], pos[2]);
    group.current.rotation.y = face + (active ? clock.getElapsedTime() * 0.35 : 0);
  });

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(character);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = '';
      }}
    >
      <Pedestal color={meta.color} active={active} hovered={hovered} />
      <group scale={character === 'optimus' ? 0.58 : character === 'itachi' ? 1.28 : character === 'luffy' ? 0.72 : 1}>
        {active ? <CharacterModel character={character} sway={false} perform /> : null}
      </group>
      <pointLight color={meta.glowColor} intensity={active ? 2.2 : 0.7} distance={4} decay={2} position={[0, 1.6, 0.8]} />
      <Html position={[0, 1.78, 0]} center distanceFactor={7} style={{ pointerEvents: 'none' }}>
        <div className="whitespace-nowrap text-center">
          <p className="font-kanji text-lg leading-none" style={{ color: meta.color }}>
            {meta.kanji}
          </p>
          <p className="font-display text-sm tracking-[0.2em] text-paper/80">{meta.name}</p>
        </div>
      </Html>
    </group>
  );
}

export function VaultScene({
  phase,
  figures,
  selected,
  onSelect,
}: {
  phase: VaultPhase;
  figures: FigureId[];
  selected: FigureId | null;
  onSelect: (c: FigureId | null) => void;
}) {
  const progress = useRef(0);
  const logo = useRef<THREE.Group>(null);
  const controls = useRef<OrbitControlsImpl>(null);
  const target = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const { camera } = useThree();

  useFrame((_, dt) => {
    const goal = phase === 'figures' ? 1 : 0;
    progress.current = THREE.MathUtils.damp(progress.current, goal, 2.2, dt);
    const p = progress.current;
    if (logo.current) {
      const s = Math.max(0.001, 1 - easeInOut(Math.min(1, p * 1.4)));
      logo.current.scale.setScalar(s);
      logo.current.position.y = 1.2 + p * 0.4;
      logo.current.rotation.y += dt * (0.4 + p * 6);
    }
    if (controls.current) {
      const dest = selected
        ? new THREE.Vector3(...figurePosition(Math.max(0, figures.indexOf(selected)), figures.length)).add(new THREE.Vector3(0, 1.0, 0))
        : new THREE.Vector3(0, 1, 0);
      target.lerp(dest, 1 - Math.exp(-dt * 3));
      controls.current.target.copy(target);
      controls.current.update();
    }
  });

  return (
    <>
      <color attach="background" args={['#08080a']} />
      <fog attach="fog" args={['#08080a', 9, 22]} />
      <ambientLight intensity={0.35} />
      <spotLight position={[4, 8, 4]} angle={0.5} penumbra={0.8} intensity={2.2} color="#fff3dc" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <spotLight position={[-5, 5, -3]} angle={0.6} penumbra={0.9} intensity={1.1} color="#ffd700" />
      <Suspense fallback={null}><Environment preset="night" /></Suspense>

      <group ref={logo} position={[0, 1.2, 0]} onClick={() => phase === 'logo' && onSelect(null)}>
        <Suspense fallback={null}>
          <Logo3D spin={0} wobble={0.05} glow={1.2} />
        </Suspense>
      </group>

      {figures.map((c, i) => (
        <FigureStand key={c} character={c} index={i} count={figures.length} progress={progress} selected={selected} onSelect={onSelect} />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow onClick={() => onSelect(null)}>
        <circleGeometry args={[7.5, 64]} />
        <meshStandardMaterial color="#0e0e10" roughness={0.9} metalness={0.15} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.19, 0]}>
        <ringGeometry args={[RING_RADIUS - 0.02, RING_RADIUS + 0.02, 128]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.35} transparent opacity={0.35} />
      </mesh>
      <ContactShadows position={[0, -0.19, 0]} opacity={0.6} scale={16} blur={2.4} far={4} />
      <ParticleField />
      <Sparkles count={60} scale={[12, 5, 12]} size={2} speed={0.25} color="#FFD700" position={[0, 2, 0]} />

      <OrbitControls
        ref={controls}
        enablePan={false}
        minDistance={2.5}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2 - 0.05}
        enableDamping
        dampingFactor={0.08}
        autoRotate={phase === 'logo'}
        autoRotateSpeed={0.6}
        camera={camera}
      />

      <EffectComposer>
        <Bloom intensity={0.78} luminanceThreshold={0.32} luminanceSmoothing={0.28} mipmapBlur />
        <Vignette eskil={false} offset={0.15} darkness={0.75} />
      </EffectComposer>
    </>
  );
}
