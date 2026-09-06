import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { CharacterModel } from './ModelRig';
import { FigureAura } from './FigureAura';
import { ParticleField } from './ParticleField';
import { ScenicBackdrop, scenePlates } from './ScenicBackdrop';

function Sudarshana() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.z = clock.getElapsedTime() * 2.2;
      ref.current.position.y = 1.62 + Math.sin(clock.getElapsedTime() * 1.4) * 0.06;
    }
  });
  return (
    <group ref={ref} position={[1.22, 1.62, 0.25]}>
      <mesh>
        <torusGeometry args={[0.3, 0.02, 12, 56]} />
        <meshStandardMaterial color="#FFD54F" emissive="#FFC107" emissiveIntensity={2.1} metalness={0.85} roughness={0.16} />
      </mesh>
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 8]}>
          <boxGeometry args={[0.48, 0.014, 0.014]} />
          <meshStandardMaterial color="#FFE082" emissive="#FFD54F" emissiveIntensity={1.2} />
        </mesh>
      ))}
      <pointLight color="#FFD54F" intensity={0.7} distance={3} />
    </group>
  );
}

export function KrishnaScene() {
  const chroma = useMemo(() => new THREE.Vector2(0.0005, 0.00035), []);

  return (
    <>
      <color attach="background" args={['#c9843a']} />
      <ambientLight intensity={0.38} />
      <spotLight position={[2.8, 5.4, 3.6]} angle={0.42} penumbra={0.75} intensity={1.45} color="#fff3d4" castShadow />
      <spotLight position={[-2.8, 2.8, -1.8]} angle={0.55} penumbra={0.9} intensity={0.55} color="#FF8F00" />
      <pointLight position={[1.4, 1.8, 1.1]} color="#FFD54F" intensity={0.45} distance={4} />
      <Suspense fallback={null}>
        <ScenicBackdrop src={scenePlates.krishna} cover />
        <Environment preset="sunset" background={false} />
      </Suspense>
      <group position={[0, -0.22, 0]}>
        <CharacterModel character="krishna" sway />
        <Suspense fallback={null}>
          <FigureAura id="krishna" />
        </Suspense>
        <Sudarshana />
      </group>
      <ParticleField />
      <Sparkles count={64} scale={[8, 5.4, 8]} size={2.4} speed={0.22} color="#FFD54F" />
      <EffectComposer>
        <Bloom intensity={0.38} luminanceThreshold={0.48} luminanceSmoothing={0.35} mipmapBlur />
        <ChromaticAberration offset={chroma} radialModulation modulationOffset={0.3} />
        <Vignette eskil={false} offset={0.18} darkness={0.48} />
      </EffectComposer>
    </>
  );
}
