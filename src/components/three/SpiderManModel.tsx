import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const TEX = {
  body: '/models/spiderman/SMAdvanced_Body_D.png',
  head: '/models/spiderman/SMAdvanced_Head_D.png',
  legs: '/models/spiderman/SMAdvanced_Legs_D.png',
  gloves: '/models/spiderman/SMAdvanced_Gloves_D.png',
  shoes: '/models/spiderman/SMAdvanced_Shoes_D.png',
  emblem: '/models/spiderman/SMAdvanced_Spider_D.png',
  shooter: '/models/spiderman/SMAdvanced_Webshooter_D.png',
};

function Suit({ map, roughness = 0.32, metalness = 0.18 }: { map: THREE.Texture; roughness?: number; metalness?: number }) {
  return <meshStandardMaterial map={map} roughness={roughness} metalness={metalness} envMapIntensity={1.4} />;
}

/**
 * PlayStation-suit Spider-Man from the user's suit textures (source is a .blend).
 * Crouched web-ready pose, live web, and suit glow.
 */
export function SpiderManModel() {
  const maps = useTexture(TEX);
  useMemo(() => {
    Object.values(maps).forEach((m) => {
      m.colorSpace = THREE.SRGBColorSpace;
      m.wrapS = m.wrapT = THREE.RepeatWrapping;
      m.anisotropy = 8;
    });
  }, [maps]);

  const root = useRef<THREE.Group>(null);
  const web = useRef<THREE.Group>(null);
  const emblem = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (root.current) {
      root.current.position.y = 0.08 + Math.sin(t * 2.6) * 0.07;
      root.current.rotation.y = Math.sin(t * 0.4) * 0.48;
      root.current.rotation.z = Math.sin(t * 1.9) * 0.05;
    }
    if (web.current) {
      web.current.rotation.z = Math.sin(t * 3.2) * 0.1;
      web.current.scale.setScalar(1 + Math.sin(t * 6) * 0.04);
    }
    if (emblem.current) {
      const mat = emblem.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.55 + Math.sin(t * 4) * 0.25;
    }
  });

  return (
    <group ref={root} position={[0, 0.06, 0]} rotation={[0.22, 0.15, 0]}>
      <mesh position={[0, 1.02, 0.02]} rotation={[0.38, 0, 0]} castShadow>
        <capsuleGeometry args={[0.21, 0.4, 12, 24]} />
        <Suit map={maps.body} />
      </mesh>
      <mesh ref={emblem} position={[0, 1.08, 0.22]} rotation={[0.15, 0, 0]}>
        <planeGeometry args={[0.22, 0.22]} />
        <meshStandardMaterial map={maps.emblem} transparent emissive="#B71C1C" emissiveIntensity={0.6} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.78, 0.04]} rotation={[0.55, 0, 0]} castShadow>
        <capsuleGeometry args={[0.19, 0.12, 8, 16]} />
        <Suit map={maps.body} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.4, 0.1]} castShadow>
        <sphereGeometry args={[0.168, 36, 36]} />
        <Suit map={maps.head} roughness={0.24} metalness={0.1} />
      </mesh>
      {[-0.052, 0.052].map((x) => (
        <mesh key={x} position={[x, 1.42, 0.24]} scale={[1.05, 1.25, 0.32]}>
          <sphereGeometry args={[0.048, 20, 14]} />
          <meshStandardMaterial color="#FFD54F" emissive="#FFC107" emissiveIntensity={1.8} />
        </mesh>
      ))}
      <mesh position={[-0.4, 1.16, 0.2]} rotation={[1.05, 0, 1.05]} castShadow>
        <capsuleGeometry args={[0.055, 0.3, 8, 14]} />
        <Suit map={maps.body} />
      </mesh>
      <mesh position={[-0.58, 1.34, 0.42]} rotation={[0.4, 0, 0.55]} castShadow>
        <capsuleGeometry args={[0.048, 0.22, 8, 12]} />
        <Suit map={maps.gloves} />
      </mesh>
      <mesh position={[-0.66, 1.46, 0.52]} castShadow>
        <boxGeometry args={[0.07, 0.05, 0.09]} />
        <Suit map={maps.shooter} metalness={0.45} />
      </mesh>
      <mesh position={[0.4, 1.24, 0.02]} rotation={[-0.55, 0, -1.2]} castShadow>
        <capsuleGeometry args={[0.055, 0.3, 8, 14]} />
        <Suit map={maps.body} />
      </mesh>
      <mesh position={[0.62, 1.02, 0.2]} rotation={[0.25, 0, -0.35]} castShadow>
        <capsuleGeometry args={[0.048, 0.2, 8, 12]} />
        <Suit map={maps.gloves} />
      </mesh>
      <mesh position={[-0.13, 0.46, 0.14]} rotation={[0.95, 0, 0.14]} castShadow>
        <capsuleGeometry args={[0.07, 0.34, 8, 12]} />
        <Suit map={maps.legs} />
      </mesh>
      <mesh position={[0.16, 0.4, 0.2]} rotation={[1.15, 0, -0.12]} castShadow>
        <capsuleGeometry args={[0.07, 0.34, 8, 12]} />
        <Suit map={maps.legs} />
      </mesh>
      <mesh position={[-0.16, 0.16, 0.32]} rotation={[0.2, 0, 0.1]} castShadow>
        <boxGeometry args={[0.1, 0.06, 0.16]} />
        <Suit map={maps.shoes} roughness={0.45} />
      </mesh>
      <mesh position={[0.2, 0.12, 0.4]} rotation={[0.25, 0, -0.08]} castShadow>
        <boxGeometry args={[0.1, 0.06, 0.16]} />
        <Suit map={maps.shoes} roughness={0.45} />
      </mesh>

      <group ref={web} position={[-0.7, 1.52, 0.58]}>
        <mesh rotation={[0.55, 0, 0.35]}>
          <cylinderGeometry args={[0.007, 0.004, 2.8, 8]} />
          <meshStandardMaterial color="#fff" emissive="#E3F2FD" emissiveIntensity={1.1} transparent opacity={0.78} />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[0, 0.15, 0]} rotation={[0.2, (i * Math.PI) / 3, 0.4]}>
            <torusGeometry args={[0.16 + i * 0.05, 0.0035, 6, 28]} />
            <meshStandardMaterial color="#fff" emissive="#90CAF9" emissiveIntensity={0.55} transparent opacity={0.4} />
          </mesh>
        ))}
      </group>
      <pointLight color="#FF6D00" intensity={2.2} distance={5} position={[0, 1.25, 0.7]} />
      <pointLight color="#1565C0" intensity={1.1} distance={4} position={[0.4, 0.8, 0.4]} />
    </group>
  );
}
