import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { itachiProjects } from './data/itachiProjects';
import { ProjectCard } from '../../../components/ui/ProjectCard';
import { ProjectModal } from '../../../components/ui/ProjectModal';
import { SpeedLines } from '../../../systems/manga/SpeedLines';
import { Halftone } from '../../../systems/manga/Halftone';
import { SFXText } from '../../../systems/manga/SFXText';

extend({ Html });

const sharinganStages = [
  { id: 'base', name: 'Base', tomoe: 1, color: '#B71C1C', glow: '#F44336', desc: 'Awakening', level: 0 },
  { id: '2tomoe', name: '2 Tomoe', tomoe: 2, color: '#C62828', glow: '#EF5350', desc: 'Development', level: 1 },
  { id: '3tomoe', name: '3 Tomoe (Mature)', tomoe: 3, color: '#B71C1C', glow: '#E53935', desc: 'Mastery', level: 2 },
  { id: 'ms', name: 'Mangekyou', tomoe: 0, color: '#8B0000', glow: '#FF1744', desc: 'Trauma', pattern: 'pinwheel', level: 3 },
  { id: 'ems', name: 'Eternal Mangekyou', tomoe: 0, color: '#660000', glow: '#FF5252', desc: 'Transcendence', pattern: 'symmetric', level: 4 },
  { id: 'tsukuyomi', name: 'Tsukuyomi', tomoe: 0, color: '#000000', glow: '#B71C1C', desc: 'Time Illusion', level: 5 },
  { id: 'amaterasu', name: 'Amaterasu', tomoe: 0, color: '#1A0000', glow: '#FF6D00', desc: 'Black Flames', level: 6 },
  { id: 'susanoo', name: 'Susanoo Complete', tomoe: 0, color: '#4A0000', glow: '#FFD700', desc: 'Divine Protection', level: 7 },
];

function SharinganEye() {
  const { scene } = useThree();
  const eyeRef = useRef<THREE.Group>(null);
  const pupilRef = useRef<THREE.Mesh>(null);
  const [stage, setStage] = useState<number>(0);

  useEffect(() => {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    const dirLight = new THREE.DirectionalLight(0xF44336, 1.5);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(ambientLight, dirLight);
    return () => { scene.remove(ambientLight, dirLight); };
  }, [scene]);

  useFrame(({ clock }) => {
    if (eyeRef.current) {
      eyeRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.3;
      eyeRef.current.rotation.x = Math.cos(clock.getElapsedTime() * 0.3) * 0.1;
    }
    if (pupilRef.current) {
      pupilRef.current.rotation.z += stage < 3 ? 0.01 * (stage + 1) : 0.02;
    }
  });

  const currentStage = sharinganStages[stage];

  return (
    <group ref={eyeRef} position={[0, 1, 0]}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshStandardMaterial color="#0D0D0D" metalness={0.1} roughness={0.9} />
      </mesh>

      <mesh ref={pupilRef} castShadow receiveShadow position={[0, 0, 1.51]} scale={[1, 1, 0.1]}>
        <circleGeometry args={[0.4, 64]} />
        <meshStandardMaterial color={currentStage.color} emissive={currentStage.glow} emissiveIntensity={0.5} metalness={0.5} roughness={0.5} />
      </mesh>

      {currentStage.tomoe > 0 && Array.from({ length: currentStage.tomoe }).map((_, i) => (
        <mesh key={i} castShadow receiveShadow position={[0, 0, 1.52]}>
          <torusGeometry args={[0.15, 0.04, 8, 32]} />
          <meshStandardMaterial color={currentStage.glow} emissive={currentStage.glow} emissiveIntensity={1} metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {stage === 3 && (
        <mesh castShadow receiveShadow position={[0, 0, 1.52]} rotation={[0, 0, Math.PI / 4]}>
          <shapeGeometry>
            <shape>
              <path d="M0 0 L0.4 0 L0.2 0.3 Z" />
            </shape>
          </shapeGeometry>
          <meshStandardMaterial color={currentStage.glow} emissive={currentStage.glow} emissiveIntensity={1} side={THREE.DoubleSide} />
        </mesh>
      )}

      {stage === 4 && Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} castShadow receiveShadow position={[0, 0, 1.52]}>
          <torusGeometry args={[0.2 + i * 0.05, 0.03, 8, 32]} />
          <meshStandardMaterial color={currentStage.glow} emissive={currentStage.glow} emissiveIntensity={1} transparent opacity={0.8 - i * 0.1} metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {stage === 5 && (
        <mesh castShadow receiveShadow position={[0, 0, 1.52]} scale={2}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#000000" emissive="#B71C1C" emissiveIntensity={1} transparent opacity={0.3} side={THREE.DoubleSide} wireframe />
        </mesh>
      )}

      {stage === 6 && (
        <group>
          <mesh castShadow receiveShadow position={[0, 0, 1.52]}>
            <sphereGeometry args={[1.5, 32, 32]} />
            <meshStandardMaterial color="#000000" emissive="#FF6D00" emissiveIntensity={1} transparent opacity={0.5} />
          </mesh>
          {Array.from({ length: 20 }).map((_, i) => (
            <mesh key={i} castShadow receiveShadow position={[
              (Math.random() - 0.5) * 3,
              (Math.random() - 0.5) * 3,
              (Math.random() - 0.5) * 3
            ]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color="#FF6D00" emissive="#FF6D00" emissiveIntensity={2} />
            </mesh>
          ))}
        </group>
      )}

      {stage === 7 && (
        <group position={[0, 0, 0]} scale={3}>
          <mesh castShadow receiveShadow>
            <octahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#4A0000" emissive="#FFD700" emissiveIntensity={0.5} transparent opacity={0.7} wireframe />
          </mesh>
          <mesh castShadow receiveShadow scale={1.5}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1} transparent opacity={0.3} wireframe />
          </mesh>
        </group>
      )}

      <pointLight position={[0, 3, 2]} color={currentStage.glow} intensity={2} distance={15} decay={2} />
    </group>
  );
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001;
      const positions = pointsRef.current.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(clock.getElapsedTime() * 2 + i * 0.01) * 0.001;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={3000} array={new Float32Array(3000 * 3).map(() => (Math.random() - 0.5) * 20)} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={3000} array={new Float32Array(3000 * 3).map((_, i) => i % 3 === 0 ? 1 : 0)} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

export function ItachiScene() {
  const [sharinganStage, setSharinganStage] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const progress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      const stage = Math.min(Math.floor(progress * (sharinganStages.length - 1)), sharinganStages.length - 1);
      setSharinganStage(stage);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <SharinganEye />
      <ParticleField />
    </>
  );
}

export function ItachiPage() {
  const [openProject, setOpenProject] = useState<typeof itachiProjects[0] | null>(null);
  const [sharinganStage, setSharinganStage] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const progress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      const stage = Math.min(Math.floor(progress * (sharinganStages.length - 1)), sharinganStages.length - 1);
      setSharinganStage(stage);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-ink">
      <Halftone opacity={0.03} size={25} color="#B71C1C" />
      <SpeedLines intensity={0.2} color="#B71C1C" direction="radial" />
      <Navigation />
      <ScrollProgress />

      <Canvas
        camera={{ position: [0, 1, 6], fov: 45 }}
        gl={{ preserveDrawingBuffer: false, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center font-ui text-paper/50">Awakening Sharingan...</div>}>
          <ItachiScene />
        </Suspense>
      </Canvas>

      <div className="relative z-10">
        <section className="min-h-screen flex items-center justify-center px-6" aria-label="Itachi Chapter">
          <div className="max-w-7xl mx-auto w-full">
            <div className="text-center mb-16">
              <p className="font-kanji text-4xl mb-2" style={{ color: '#B71C1C' }}>写輪眼</p>
              <h1 className="font-display text-5xl md:text-7xl text-gold mb-4" style={{ textShadow: '0 0 30px #B71C1C' }}>
                THE ILLUSIONIST'S TRUTH
              </h1>
              <p className="font-body text-lg text-paper/70 max-w-2xl mx-auto">
                The Sharingan sees through all illusions. From one tomoe to the Complete Susanoo —
                witness the evolution of generative models that bend reality.
              </p>
            </div>

            <div className="space-y-8">
              {sharinganStages.map((stage, i) => (
                <div key={stage.id} className={`manga-panel p-6 transition-all duration-500 ${i <= sharinganStage ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`} style={{ borderLeftColor: stage.glow, borderLeftWidth: '4px' }}>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-display text-xl text-ink" style={{ backgroundColor: stage.glow }}>{i + 1}</div>
                      <div>
                        <h2 className="font-display text-2xl" style={{ color: stage.glow }}>{stage.name}</h2>
                        <p className="font-ui text-sm text-paper/50">{stage.desc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-kanji text-2xl" style={{ color: stage.glow }}>
                        {stage.tomoe > 0 ? '勾玉'.repeat(stage.tomoe) : stage.pattern?.toUpperCase() || '神'}
                      </div>
                    </div>
                  </div>
                  {i < itachiProjects.length && <ProjectCard project={itachiProjects[i]} index={i} onOpen={setOpenProject} />}
                  {i === sharinganStages.length - 1 && <SFXText text="TSUKUYOMI" color="#B71C1C" size="lg" trigger="mount" className="mt-4" />}
                </div>
              ))}
            </div>
            <div className="mt-16 text-center"><SFXText text="WHOOSH" color="#B71C1C" size="xl" trigger="mount" /></div>
          </div>
        </section>
      </div>

      <ProjectModal project={openProject} onClose={() => setOpenProject(null)} isOpen={!!openProject} />
    </div>
  );
}

import { Navigation } from '../../../components/ui/Navigation';
import { ScrollProgress } from '../../../components/layout/ScrollProgress';