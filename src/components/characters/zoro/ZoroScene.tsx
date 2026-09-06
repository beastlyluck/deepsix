import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { zoroProjects } from './data/zoroProjects';
import { ProjectCard } from '../../../components/ui/ProjectCard';
import { ProjectModal } from '../../../components/ui/ProjectModal';
import { SpeedLines } from '../../../systems/manga/SpeedLines';
import { Halftone } from '../../../systems/manga/Halftone';
import { SFXText } from '../../../systems/manga/SFXText';

extend({ Html });

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001;
      const positions = pointsRef.current.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) positions[i + 1] += Math.sin(clock.getElapsedTime() * 2 + i * 0.01) * 0.001;
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={2000} array={new Float32Array(2000 * 3).map(() => (Math.random() - 0.5) * 15)} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={2000} array={new Float32Array(2000 * 3).map((_, i) => i % 3 === 1 ? 1 : 0)} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function ZoroScene() {
  const { scene } = useThree();
  const zoroRef = useRef<THREE.Group>(null);
  const katanaRefs = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    const dirLight = new THREE.DirectionalLight(0x4CAF50, 1.5);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(ambientLight, dirLight);
    return () => { scene.remove(ambientLight, dirLight); };
  }, [scene]);

  useFrame(({ clock }) => {
    if (zoroRef.current) zoroRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.4;
    katanaRefs.current.forEach((katana, i) => {
      if (katana) {
        katana.rotation.z = Math.sin(clock.getElapsedTime() * 3 + i) * 0.02;
        katana.position.y = Math.sin(clock.getElapsedTime() * 2 + i) * 0.05;
      }
    });
  });

  return (
    <>
      <group ref={zoroRef} position={[0, 0, 0]}>
        <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#FFDBAC" roughness={0.8} />
        </mesh>

        <mesh castShadow receiveShadow position={[0, 0, 0]} scale={[1.2, 1.8, 1]}>
          <cylinderGeometry args={[0.6, 0.4, 2, 16]} />
          <meshStandardMaterial color="#2E7D32" roughness={0.6} metalness={0.2} />
        </mesh>

        <mesh castShadow receiveShadow position={[-0.7, 1.2, 0.4]} rotation={[0, 0, -0.3]}>
          <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
          <meshStandardMaterial color="#BDBDBD" metalness={0.9} roughness={0.1} emissive="#E0E0E0" emissiveIntensity={0.5} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 1.1, 0.5]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
          <meshStandardMaterial color="#BDBDBD" metalness={0.9} roughness={0.1} emissive="#E0E0E0" emissiveIntensity={0.5} />
        </mesh>
        <mesh castShadow receiveShadow position={[0.7, 1.2, 0.4]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
          <meshStandardMaterial color="#BDBDBD" metalness={0.9} roughness={0.1} emissive="#E0E0E0" emissiveIntensity={0.5} />
        </mesh>

        <group position={[-1.5, 1, 0]} rotation={[0, 0, -0.5]}>
          <mesh ref={(el) => { katanaRefs.current[0] = el!; }} castShadow receiveShadow>
            <cylinderGeometry args={[0.015, 0.015, 3.5, 8]} />
            <meshStandardMaterial color="#757575" metalness={0.9} roughness={0.1} emissive="#9E9E9E" emissiveIntensity={0.3} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 1.75, 0]}>
            <coneGeometry args={[0.03, 0.1, 8]} />
            <meshStandardMaterial color="#757575" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>

        <group position={[0, 1, 0]} rotation={[0, 0, 0]}>
          <mesh ref={(el) => { katanaRefs.current[1] = el!; }} castShadow receiveShadow>
            <cylinderGeometry args={[0.015, 0.015, 3.5, 8]} />
            <meshStandardMaterial color="#757575" metalness={0.9} roughness={0.1} emissive="#9E9E9E" emissiveIntensity={0.3} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 1.75, 0]}>
            <coneGeometry args={[0.03, 0.1, 8]} />
            <meshStandardMaterial color="#757575" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>

        <group position={[1.5, 1, 0]} rotation={[0, 0, 0.5]}>
          <mesh ref={(el) => { katanaRefs.current[2] = el!; }} castShadow receiveShadow>
            <cylinderGeometry args={[0.015, 0.015, 3.5, 8]} />
            <meshStandardMaterial color="#757575" metalness={0.9} roughness={0.1} emissive="#9E9E9E" emissiveIntensity={0.3} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 1.75, 0]}>
            <coneGeometry args={[0.03, 0.1, 8]} />
            <meshStandardMaterial color="#757575" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>

        <pointLight position={[0, 3, 2]} color="#4CAF50" intensity={2} distance={15} decay={2} />
      </group>
      <ParticleField />
    </>
  );
}

export function ZoroPage() {
  const [openProject, setOpenProject] = useState<typeof zoroProjects[0] | null>(null);

  return (
    <div className="relative min-h-screen bg-ink">
      <Halftone opacity={0.02} size={30} />
      <SpeedLines intensity={0.3} color="#2E7D32" direction="horizontal" />
      <Navigation />
      <ScrollProgress />
      <Canvas camera={{ position: [0, 1.5, 8], fov: 50 }} gl={{ preserveDrawingBuffer: false, powerPreference: 'high-performance' }}>
        <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center font-ui text-paper/50">Sharpening blades...</div>}>
          <ZoroScene />
        </Suspense>
      </Canvas>
      <div className="relative z-10">
        <section className="min-h-screen flex items-center justify-center px-6" aria-label="Zoro Chapter">
          <div className="max-w-7xl mx-auto w-full">
            <div className="text-center mb-16">
              <p className="font-kanji text-4xl mb-2" style={{ color: '#2E7D32' }}>三刀流</p>
              <h1 className="font-display text-5xl md:text-7xl text-gold mb-4" style={{ textShadow: '0 0 30px #2E7D32' }}>
                THREE BLADES, ONE PATH
              </h1>
              <p className="font-body text-lg text-paper/70 max-w-2xl mx-auto">
                Precision in every strike. From single sword to Asura's nine blades — computer vision that detects what others miss.
              </p>
            </div>
            <div className="space-y-8">
              {zoroProjects.map((project, i) => (
                <div key={project.id} className="manga-panel p-6" style={{ borderLeftColor: '#4CAF50', borderLeftWidth: '4px' }}>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-display text-xl text-ink" style={{ backgroundColor: '#4CAF50' }}>
                        {i + 1}
                      </div>
                      <div>
                        <h2 className="font-display text-2xl" style={{ color: '#4CAF50' }}>{project.title}</h2>
                        <p className="font-ui text-sm text-paper/50">Sword Form {i + 1}</p>
                      </div>
                    </div>
                  </div>
                  <ProjectCard project={project} index={i} onOpen={setOpenProject} />
                </div>
              ))}
            </div>
            <div className="mt-16 text-center">
              <SFXText text="SLASH" color="#2E7D32" size="xl" trigger="mount" />
            </div>
          </div>
        </section>
      </div>
      <ProjectModal project={openProject} onClose={() => setOpenProject(null)} isOpen={!!openProject} />
    </div>
  );
}

import { Navigation } from '../../../components/ui/Navigation';
import { ScrollProgress } from '../../../components/layout/ScrollProgress';