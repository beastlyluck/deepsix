import { useMemo, useRef, type ReactElement } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CharacterKey } from '../../data/openDataSources';

/**
 * Original, procedural figures that echo the six manga splash pages in public/manga/.
 * No licensed models: each is a silhouette built from primitives, coloured to match the art.
 */

function Skin({ color }: { color: string }) {
  return <meshPhysicalMaterial color={color} roughness={0.5} metalness={0.02} sheen={0.4} sheenColor="#ffd8c0" clearcoat={0.1} />;
}

function Cloth({ color, roughness = 0.68, metalness = 0.05 }: { color: string; roughness?: number; metalness?: number }) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />;
}

function Metal({ color, emissive = '#000000', intensity = 0, roughness = 0.2 }: { color: string; emissive?: string; intensity?: number; roughness?: number }) {
  return <meshPhysicalMaterial color={color} metalness={0.92} roughness={roughness} emissive={emissive} emissiveIntensity={intensity} clearcoat={0.6} />;
}

function Gold({ intensity = 0.35 }: { intensity?: number }) {
  return <Metal color="#FFD700" emissive="#FFD700" intensity={intensity} roughness={0.18} />;
}

function Glow({ color, intensity = 0.8, opacity = 0.22 }: { color: string; intensity?: number; opacity?: number }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />;
}

type Pose = 'idle' | 'crouch' | 'guard' | 'power';

function Humanoid({
  skin,
  torso,
  limbs,
  hips,
  pose = 'idle',
  bulk = 1,
}: {
  skin: string;
  torso: string;
  limbs: string;
  hips: string;
  pose?: Pose;
  bulk?: number;
}) {
  const squat = pose === 'crouch' ? 0.12 : 0;
  const armX = pose === 'power' ? -1.1 : pose === 'guard' ? -0.8 : -0.2;
  const armX2 = pose === 'power' ? -1.1 : pose === 'guard' ? -0.55 : -0.12;
  const armZ = pose === 'power' ? 0.7 : 0.28;
  return (
    <>
      <mesh position={[0, 1.12 - squat, 0]} castShadow>
        <capsuleGeometry args={[0.26 * bulk, 0.46, 10, 20]} />
        <Cloth color={torso} />
      </mesh>
      <mesh position={[0, 0.78 - squat, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.16, 8, 16]} />
        <Cloth color={hips} />
      </mesh>
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.36 - squat * 0.4, 0]} rotation={[pose === 'crouch' ? 0.35 : 0, 0, x < 0 ? 0.04 : -0.04]} castShadow>
          <capsuleGeometry args={[0.085 * bulk, 0.42, 8, 14]} />
          <Cloth color={limbs} />
        </mesh>
      ))}
      <mesh position={[-0.4 * bulk, 1.28 - squat, 0]} rotation={[armX, 0, armZ]} castShadow>
        <capsuleGeometry args={[0.068 * bulk, 0.34, 8, 14]} />
        <Cloth color={limbs} />
      </mesh>
      <mesh position={[0.4 * bulk, 1.28 - squat, 0]} rotation={[armX2, 0, -armZ]} castShadow>
        <capsuleGeometry args={[0.068 * bulk, 0.34, 8, 14]} />
        <Cloth color={limbs} />
      </mesh>
      <mesh position={[0, 1.58 - squat, 0]} castShadow>
        <sphereGeometry args={[0.195, 36, 36]} />
        <Skin color={skin} />
      </mesh>
    </>
  );
}

function SpikyHair({ color, count, y = 1.72, spread = 0.045, height = 0.28, lean = -0.15, emissive }: { color: string; count: number; y?: number; spread?: number; height?: number; lean?: number; emissive?: string }) {
  const spikes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        pos: [((i % 7) - 3) * spread, y + (i % 5) * 0.035, ((i % 4) - 1.5) * 0.04] as [number, number, number],
        rot: [lean, 0, (i - count / 2) * 0.07] as [number, number, number],
        h: height + (i % 3) * 0.06,
      })),
    [count, y, spread, height, lean]
  );
  return (
    <>
      <mesh position={[0, 1.66, 0]} castShadow>
        <sphereGeometry args={[0.205, 24, 16, 0, Math.PI * 2, 0, 1.25]} />
        <Cloth color={color} roughness={0.55} />
      </mesh>
      {spikes.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={s.rot} castShadow>
          <coneGeometry args={[0.032, s.h, 7]} />
          <meshStandardMaterial color={color} emissive={emissive ?? '#000000'} emissiveIntensity={emissive ? 0.35 : 0} roughness={0.45} />
        </mesh>
      ))}
    </>
  );
}

function Katana({ position, rotation, length = 1.0 }: { position: [number, number, number]; rotation: [number, number, number]; length?: number }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <capsuleGeometry args={[0.016, length, 6, 10]} />
        <Metal color="#D7DDE2" roughness={0.12} />
      </mesh>
      <mesh position={[0, -length / 2 - 0.02, 0]}>
        <boxGeometry args={[0.1, 0.02, 0.05]} />
        <Gold intensity={0.25} />
      </mesh>
      <mesh position={[0, -length / 2 - 0.14, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.22, 10]} />
        <Cloth color="#111" />
      </mesh>
    </group>
  );
}

/* ─── Chapter 01 · The Illusionist (red moon, black coat with gold filigree, long hair, katana) ─── */
function IllusionistFigure() {
  return (
    <group>
      <Humanoid skin="#E2B394" torso="#0c0505" limbs="#120606" hips="#1a0808" pose="guard" />
      {/* high-collar coat */}
      <mesh position={[0, 1.02, -0.1]} castShadow>
        <coneGeometry args={[0.58, 1.75, 18, 1, true]} />
        <Cloth color="#080202" roughness={0.78} />
      </mesh>
      <mesh position={[0, 1.5, -0.05]} rotation={[0.25, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.26, 0.22, 20, 1, true]} />
        <Cloth color="#0a0303" />
      </mesh>
      {/* gold filigree */}
      {[1.45, 1.2, 0.95].map((y, i) => (
        <mesh key={y} position={[0, y, -0.05]} rotation={[0.08, 0, 0]}>
          <torusGeometry args={[0.28 + i * 0.09, 0.006, 8, 48]} />
          <Gold intensity={0.5} />
        </mesh>
      ))}
      <mesh position={[0.18, 1.25, 0.22]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.012, 0.5, 0.01]} />
        <Gold intensity={0.5} />
      </mesh>
      {/* long black hair */}
      <mesh position={[0, 1.66, 0]} castShadow>
        <sphereGeometry args={[0.21, 24, 16, 0, Math.PI * 2, 0, 1.3]} />
        <Cloth color="#050505" roughness={0.6} />
      </mesh>
      {[-0.14, -0.05, 0.06, 0.15].map((x, i) => (
        <mesh key={x} position={[x, 1.3, -0.16 - Math.abs(x) * 0.2]} rotation={[0.18, 0, x * 0.6]} castShadow>
          <capsuleGeometry args={[0.035, 0.6 + (i % 2) * 0.1, 6, 10]} />
          <Cloth color="#070707" roughness={0.6} />
        </mesh>
      ))}
      {/* red eyes */}
      {[-0.065, 0.065].map((x) => (
        <group key={x} position={[x, 1.59, 0.17]}>
          <mesh>
            <circleGeometry args={[0.036, 24]} />
            <meshStandardMaterial color="#7f0000" emissive="#ff1744" emissiveIntensity={1.6} />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <torusGeometry args={[0.017, 0.004, 8, 20]} />
            <meshStandardMaterial color="#111" emissive="#ff5252" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}
      <Katana position={[-0.28, 0.9, 0.12]} rotation={[0.2, 0, 0.35]} length={0.95} />
      {/* red moon */}
      <mesh position={[0, 1.7, -1.5]}>
        <circleGeometry args={[1.05, 64]} />
        <meshStandardMaterial color="#5a0000" emissive="#b71c1c" emissiveIntensity={0.55} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ─── Chapter 02 · The Singularity (gold spikes, orange gi, blue sash, aura rings) ─── */
function SingularityFigure() {
  const rings = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (rings.current) rings.current.rotation.y = clock.getElapsedTime() * 0.9;
  });
  return (
    <group>
      <Humanoid skin="#E8B896" torso="#F57C00" limbs="#E8B896" hips="#F57C00" pose="power" bulk={1.12} />
      <mesh position={[0, 1.22, 0.12]} castShadow>
        <boxGeometry args={[0.36, 0.34, 0.1]} />
        <Cloth color="#1565C0" />
      </mesh>
      <mesh position={[0, 0.92, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.04, 10, 28]} />
        <Cloth color="#1565C0" />
      </mesh>
      {[-0.52, 0.52].map((x) => (
        <mesh key={x} position={[x, 1.02, 0.05]} rotation={[1.1, 0, x < 0 ? 0.7 : -0.7]}>
          <torusGeometry args={[0.075, 0.03, 8, 20]} />
          <Cloth color="#1565C0" />
        </mesh>
      ))}
      <SpikyHair color="#FFC107" count={26} height={0.34} lean={-0.35} emissive="#FFD54F" />
      <group ref={rings} position={[0, 1.0, 0]}>
        {[0.2, -0.15].map((tilt, i) => (
          <mesh key={i} rotation={[Math.PI / 2 + tilt, 0, i * 0.8]}>
            <torusGeometry args={[1.05 + i * 0.25, 0.012, 8, 96]} />
            <meshStandardMaterial color="#FFE082" emissive="#FFD54F" emissiveIntensity={1.4} transparent opacity={0.8} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 1.05, 0]} scale={[1, 1.55, 1]}>
        <sphereGeometry args={[0.95, 28, 28]} />
        <Glow color="#FFD54F" intensity={0.6} opacity={0.16} />
      </mesh>
    </group>
  );
}

/* ─── Chapter 03 · The Prince (black spikes, white/blue armour with gold trim, blue cape, lightning ring) ─── */
function PrinceFigure() {
  return (
    <group>
      <Humanoid skin="#E8B896" torso="#0D1B4A" limbs="#0D1B4A" hips="#0D1B4A" pose="guard" />
      {/* chest plate */}
      <mesh position={[0, 1.16, 0.1]} castShadow>
        <boxGeometry args={[0.54, 0.44, 0.22]} />
        <Metal color="#F5F5F5" roughness={0.25} />
      </mesh>
      {[-0.27, 0.27].map((x) => (
        <mesh key={x} position={[x, 1.02, 0.1]}>
          <boxGeometry args={[0.02, 0.44, 0.24]} />
          <Gold intensity={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 1.16, 0.22]}>
        <octahedronGeometry args={[0.09, 0]} />
        <Metal color="#1565C0" emissive="#2196F3" intensity={0.7} />
      </mesh>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 1.42, 0]} scale={[1, 0.6, 1]} castShadow>
          <sphereGeometry args={[0.14, 20, 14]} />
          <Metal color="#F5F5F5" roughness={0.25} />
        </mesh>
      ))}
      {/* cape */}
      <mesh position={[0, 0.95, -0.22]} rotation={[0.12, 0, 0]} scale={[1, 1, 0.35]} castShadow>
        <coneGeometry args={[0.55, 1.35, 16, 1, true]} />
        <Cloth color="#0D3B9C" roughness={0.75} />
      </mesh>
      <SpikyHair color="#0a0a0a" count={22} height={0.4} lean={-0.05} spread={0.05} />
      {/* gravity ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <torusGeometry args={[1.15, 0.016, 10, 72]} />
        <meshStandardMaterial color="#64B5F6" emissive="#2196F3" emissiveIntensity={0.9} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[Math.cos(i * 1.26) * 1.15, 0.3 + (i % 2) * 0.4, Math.sin(i * 1.26) * 1.15]} rotation={[0, 0, (i % 2 ? 1 : -1) * 0.4]}>
          <boxGeometry args={[0.012, 0.5, 0.012]} />
          <meshStandardMaterial color="#90CAF9" emissive="#42A5F5" emissiveIntensity={1.6} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Chapter 04 · The Swordsman (green tattered cloak, dark hair, three katanas) ─── */
function SwordsmanFigure() {
  return (
    <group>
      <Humanoid skin="#E0B090" torso="#151515" limbs="#1c1c1c" hips="#1B5E20" pose="guard" />
      <mesh position={[0, 1.05, -0.08]} castShadow>
        <coneGeometry args={[0.6, 1.5, 14, 1, true]} />
        <Cloth color="#3E5E2B" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.5, 0]} rotation={[0.15, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.28, 0.16, 16, 1, true]} />
        <Cloth color="#33512A" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.26, 0.045, 10, 28]} />
        <Cloth color="#43A047" />
      </mesh>
      <SpikyHair color="#1B3A1B" count={14} height={0.16} lean={-0.5} spread={0.05} />
      {/* scar over left eye */}
      <mesh position={[-0.06, 1.61, 0.18]} rotation={[0, 0, 0.9]}>
        <boxGeometry args={[0.09, 0.008, 0.01]} />
        <meshStandardMaterial color="#8D6E63" />
      </mesh>
      {/* three swords */}
      <Katana position={[0, 1.5, -0.15]} rotation={[0, 0, Math.PI / 2]} length={1.15} />
      <Katana position={[-0.34, 0.85, 0.1]} rotation={[0.15, 0, 0.45]} length={1.0} />
      <Katana position={[-0.42, 0.8, -0.05]} rotation={[0.1, 0, 0.7]} length={1.0} />
      {/* green slash trails */}
      {[0.35, -0.2].map((tilt, i) => (
        <mesh key={i} position={[0.6 - i * 1.2, 1.1 + i * 0.4, 0.3]} rotation={[0, 0, tilt]}>
          <torusGeometry args={[0.9, 0.006, 6, 40, 1.2]} />
          <meshStandardMaterial color="#69F0AE" emissive="#69F0AE" emissiveIntensity={1.4} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Chapter 05 · The Prime (red/blue plating, gold diamond emblem, gold visor) ─── */
function PrimeFigure() {
  return (
    <group>
      <mesh position={[0, 1.12, 0]} castShadow>
        <boxGeometry args={[0.74, 0.86, 0.5]} />
        <Metal color="#C62828" roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.2, 0.27]} castShadow>
        <boxGeometry args={[0.52, 0.3, 0.06]} />
        <meshPhysicalMaterial color="#90CAF9" metalness={0.3} roughness={0.05} transmission={0.35} thickness={0.2} />
      </mesh>
      <mesh position={[0, 0.98, 0.29]}>
        <octahedronGeometry args={[0.13, 0]} />
        <Gold intensity={0.9} />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.74, 0]} castShadow>
        <boxGeometry args={[0.38, 0.34, 0.38]} />
        <Metal color="#B0BEC5" roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.78, 0.2]}>
        <boxGeometry args={[0.3, 0.07, 0.04]} />
        <Gold intensity={1.4} />
      </mesh>
      <mesh position={[0, 1.94, 0]}>
        <boxGeometry args={[0.42, 0.08, 0.3]} />
        <Metal color="#1565C0" />
      </mesh>
      {[-0.14, 0.14].map((x) => (
        <mesh key={x} position={[x, 1.98, -0.02]}>
          <cylinderGeometry args={[0.02, 0.02, 0.24, 8]} />
          <Metal color="#ECEFF1" />
        </mesh>
      ))}
      {/* shoulders / arms */}
      {[-0.56, 0.56].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.5, 0]} castShadow>
            <boxGeometry args={[0.3, 0.22, 0.34]} />
            <Metal color="#C62828" />
          </mesh>
          <mesh position={[x, 1.1, 0]} castShadow>
            <boxGeometry args={[0.22, 0.66, 0.28]} />
            <Metal color="#0D47A1" />
          </mesh>
          <mesh position={[x, 0.74, 0]}>
            <boxGeometry args={[0.24, 0.1, 0.3]} />
            <Gold intensity={0.3} />
          </mesh>
        </group>
      ))}
      {/* legs */}
      {[-0.2, 0.2].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.42, 0]} castShadow>
            <boxGeometry args={[0.24, 0.58, 0.28]} />
            <Metal color="#0D47A1" />
          </mesh>
          <mesh position={[x, 0.08, 0.04]} castShadow>
            <boxGeometry args={[0.26, 0.14, 0.36]} />
            <Metal color="#C62828" />
          </mesh>
        </group>
      ))}
      {/* steam discharge */}
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.5, -0.25]} scale={[1, 1.4, 1]}>
          <sphereGeometry args={[0.16, 12, 12]} />
          <Glow color="#ECEFF1" intensity={0.2} opacity={0.14} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Chapter 06 · The Weaver (red/blue suit, gold diamond emblem, gold lenses, web) ─── */
function WeaverFigure() {
  return (
    <group>
      <Humanoid skin="#C62828" torso="#C62828" limbs="#0D47A1" hips="#0D47A1" pose="crouch" />
      <mesh position={[0, 1.02, 0.2]}>
        <octahedronGeometry args={[0.09, 0]} />
        <Gold intensity={0.9} />
      </mesh>
      <mesh position={[0, 0.78, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.02, 8, 24]} />
        <Gold intensity={0.4} />
      </mesh>
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 1.48, 0.175]} scale={[1, 1.25, 0.4]}>
          <sphereGeometry args={[0.055, 20, 14]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.9} />
        </mesh>
      ))}
      {/* web lines on suit */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[0, 1.15, 0.22]} rotation={[0, 0, (i * Math.PI) / 6]}>
          <boxGeometry args={[0.5, 0.004, 0.004]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      {/* web the figure hangs from */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} position={[0, 1.05, -0.4]} rotation={[0, 0, (i * Math.PI) / 7]}>
          <torusGeometry args={[0.6 + i * 0.09, 0.005, 8, 44]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} transparent opacity={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 2.4, -0.4]}>
        <cylinderGeometry args={[0.005, 0.005, 1.6, 6]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.4} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

const figures: Record<CharacterKey, () => ReactElement> = {
  itachi: IllusionistFigure,
  goku: SingularityFigure,
  vegeta: PrinceFigure,
  zoro: SwordsmanFigure,
  optimus: PrimeFigure,
  spiderman: WeaverFigure,
};

export function ChapterFigure({ character, sway = true }: { character: CharacterKey; sway?: boolean }) {
  const root = useRef<THREE.Group>(null);
  const Figure = useMemo(() => figures[character], [character]);

  useFrame(({ clock }) => {
    if (!root.current) return;
    const t = clock.getElapsedTime();
    root.current.position.y = -0.08 + Math.sin(t * 1.4) * 0.025;
    if (sway) root.current.rotation.y = Math.sin(t * 0.32) * 0.28;
  });

  return (
    <group ref={root}>
      <Figure />
    </group>
  );
}
