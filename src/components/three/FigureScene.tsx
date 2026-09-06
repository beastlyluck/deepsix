import { Suspense, useMemo } from 'react';
import { ContactShadows, Environment, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { FigureId } from '../../data/figureModels';
import { characterMetadata } from '../../systems/manga/mangaTypes';
import { twinFigureMetadata, isTwinFigure } from '../../data/twinFigures';
import { AmbientSceneLights } from './AmbientSceneLights';
import { CharacterModel } from './ModelRig';
import { FigureAura } from './FigureAura';
import { ParticleField } from './ParticleField';
import { ScenicBackdrop, scenePlates } from './ScenicBackdrop';

const FOG: Partial<Record<FigureId, string>> = {
  itachi: '#140808',
  goku: '#2a1a0c',
  vegeta: '#0a1220',
  zoro: '#0c1610',
  optimus: '#1a100c',
  spiderman: '#0c1018',
  thor: '#070b14',
  batman: '#07080c',
  ironman: '#0a1014',
  luffy: '#0b0e16',
  kratos: '#120806',
  naruto: '#0a120e',
  krishna: '#1a1408',
};

function figureColor(id: FigureId) {
  if (isTwinFigure(id)) return twinFigureMetadata[id].glowColor;
  if (id === 'krishna') return '#FFD54F';
  return characterMetadata[id].glowColor;
}

function figureParticle(id: FigureId) {
  if (isTwinFigure(id)) return twinFigureMetadata[id].particleColor;
  if (id === 'krishna') return '#FFF176';
  return characterMetadata[id].particleColor;
}

export function FigureScene({ id }: { id: FigureId }) {
  const chroma = useMemo(() => new THREE.Vector2(0.0007, 0.00045), []);
  const fog = FOG[id] ?? '#08080a';
  const glow = figureColor(id);
  const hot = id === 'optimus' || id === 'ironman' || id === 'kratos';

  return (
    <>
      <color attach="background" args={[fog]} />
      <fog attach="fog" args={[fog, 18, 36]} />
      <AmbientSceneLights color={new THREE.Color(glow).getHex()} intensity={hot ? 0.8 : 0.85} />
      <spotLight
        position={[2.4, 4.8, 3.2]}
        angle={0.4}
        penumbra={0.7}
        intensity={1.55}
        color="#fff4e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <spotLight position={[-3, 2.8, -2]} angle={0.5} penumbra={0.8} intensity={0.55} color={glow} />
      <pointLight position={[0, 2.4, 1.6]} intensity={0.45} color={glow} distance={7} />
      <pointLight position={[0.4, 1.4, 2.2]} intensity={hot ? 1.15 : 0.7} color="#fff6ea" distance={6} />
      <Suspense fallback={null}>
        <ScenicBackdrop src={scenePlates[id]} />
        <Environment preset="night" background={false} />
      </Suspense>
      <group position={[0, -0.18, 0]}>
        <CharacterModel character={id} />
        <Suspense fallback={null}>
          <FigureAura id={id} />
        </Suspense>
      </group>
      <ParticleField />
      <Sparkles count={48} scale={[8, 5.5, 8]} size={2.2} speed={0.35} color={figureParticle(id)} />
      <ContactShadows position={[0, -0.02, 0]} opacity={0.55} scale={9} blur={2.4} far={3.2} color="#000000" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.021, 0]} receiveShadow>
        <circleGeometry args={[4.2, 48]} />
        <meshStandardMaterial color="#111111" roughness={0.92} metalness={0.08} transparent opacity={0.72} />
      </mesh>
      <EffectComposer>
        <Bloom intensity={hot ? 0.12 : 0.32} luminanceThreshold={hot ? 0.82 : 0.5} luminanceSmoothing={0.32} mipmapBlur />
        <ChromaticAberration offset={chroma} radialModulation modulationOffset={0.35} />
        <Vignette eskil={false} offset={0.14} darkness={0.62} />
      </EffectComposer>
    </>
  );
}
