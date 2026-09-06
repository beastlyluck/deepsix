import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { gokuProjects } from './data/gokuProjects';
import { ProjectCard } from '../../../components/ui/ProjectCard';
import { ProjectModal } from '../../../components/ui/ProjectModal';
import { SpeedLines } from '../../../systems/manga/SpeedLines';
import { Halftone } from '../../../systems/manga/Halftone';
import { SFXText } from '../../../systems/manga/SFXText';

extend({ Html });

const forms = [
  { id: 'base', name: 'Base', kanji: 'ベース', multiplier: 1, color: '#2E2E2E', aura: '#FFB300', level: 0 },
  { id: 'ssj', name: 'Super Saiyan', kanji: '超サイヤ人', multiplier: 50, color: '#FFD700', aura: '#FFD700', level: 1 },
  { id: 'ssj2', name: 'Super Saiyan 2', kanji: '超サイヤ人2', multiplier: 100, color: '#FFD700', aura: '#FFF176', level: 2 },
  { id: 'ssj3', name: 'Super Saiyan 3', kanji: '超サイヤ人3', multiplier: 400, color: '#FFD700', aura: '#FFEB3B', level: 3 },
  { id: 'ssjg', name: 'Super Saiyan God', kanji: '超サイヤ人ゴッド', multiplier: 1000, color: '#E53935', aura: '#EF5350', level: 4 },
  { id: 'ssjb', name: 'Super Saiyan Blue', kanji: '超サイヤ人ブルー', multiplier: 5000, color: '#1E88E5', aura: '#64B5F6', level: 5 },
  { id: 'ssjbkk', name: 'SSJB Kaioken x10', kanji: '界王拳×10', multiplier: 50000, color: '#1E88E5', aura: '#E53935', level: 6 },
  { id: 'uisign', name: 'Ultra Instinct Sign', kanji: '身勝手の極意 兆', multiplier: 100000, color: '#BDBDBD', aura: '#E0E0E0', level: 7 },
  { id: 'mui', name: 'Mastered Ultra Instinct', kanji: '身勝手の極意', multiplier: 500000, color: '#FFFFFF', aura: '#FFD700', level: 8 },
];

interface AuraFieldProps {
  formLevel: number;
}

function AuraField({ formLevel }: AuraFieldProps) {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const { scene } = useThree();

  useEffect(() => {
    const geometry = new THREE.SphereGeometry(3, 64, 64);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        formLevel: { value: formLevel },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        void main() {
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float formLevel;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        
        float hash11(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float hash13(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        
        float noise3D(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          vec3 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(hash13(i + vec3(0,0,0)), hash13(i + vec3(1,0,0)), u.x),
                mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), u.x), u.y),
            mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), u.x),
                mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), u.x), u.y),
            u.z
          );
        }
        
        float fbm(vec3 p, int octaves) {
          float value = 0.0;
          float amplitude = 1.0;
          float frequency = 1.0;
          float maxValue = 0.0;
          for (int i = 0; i < 5; i++) {
            value += amplitude * noise3D(p * frequency);
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2.0;
          }
          return value / maxValue;
        }
        
        void main() {
          float dist = length(vWorldPos);
          float noise = fbm(vWorldPos * 2.0 + vec3(time * 0.5, time * 0.3, time * 0.7), 5);
          float noise2 = fbm(vWorldPos * 4.0 - vec3(time * 0.3, time * 0.5, time * 0.2), 4);
          
          float auraIntensity = 1.0 - smoothstep(0.0, 3.0, dist);
          float turbulence = noise * 0.5 + noise2 * 0.25;
          
          float pulse = sin(time * 3.0 + dist * 5.0) * 0.5 + 0.5;
          float kiWaves = sin(dist * 10.0 - time * 5.0) * 0.5 + 0.5;
          
          vec3 baseColor = vec3(1.0, 0.8, 0.2);
          if (formLevel >= 3.0) baseColor = vec3(1.0, 0.4, 0.0);
          if (formLevel >= 4.0) baseColor = vec3(1.0, 0.2, 0.0);
          if (formLevel >= 5.0) baseColor = vec3(0.2, 0.6, 1.0);
          if (formLevel >= 6.0) baseColor = vec3(0.0, 0.3, 1.0);
          if (formLevel >= 7.0) baseColor = vec3(0.8, 0.0, 1.0);
          if (formLevel >= 8.0) baseColor = vec3(1.0, 1.0, 1.0);
          
          vec3 color = mix(baseColor, vec3(1.0), pulse * 0.3 + kiWaves * 0.2);
          color *= 1.0 + formLevel * 0.5;
          
          float alpha = auraIntensity * (0.3 + turbulence * 0.3 + pulse * 0.2) * (1.0 + formLevel * 0.2);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });

    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;
    scene.add(mesh);

    return () => {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
    };
  }, [scene, formLevel]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.time.value = clock.getElapsedTime();
      material.uniforms.formLevel.value = formLevel;
      meshRef.current.rotation.y += 0.002;
      meshRef.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 2) * 0.15);
    }
  });

  return null;
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points | null>(null);
  const { scene } = useThree();

  useEffect(() => {
    const count = 8000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 4 * Math.cbrt(Math.random());
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
      colors[i * 3 + 2] = Math.random() * 0.3;
      
      sizes[i] = Math.random() * 0.15 + 0.05;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      depthWrite: false,
    });
    
    const points = new THREE.Points(geometry, material);
    pointsRef.current = points;
    scene.add(points);
    
    return () => {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
    };
  }, [scene]);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001;
      const positions = pointsRef.current.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(clock.getElapsedTime() * 3 + i * 0.01) * 0.0015;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return null;
}

interface GokuCharacterProps {
  currentForm: number;
}

function GokuCharacter({ currentForm }: GokuCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const hairRef = useRef<THREE.Group>(null);
  const { scene } = useThree();

  useEffect(() => {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    const dirLight = new THREE.DirectionalLight(0xFFB300, 1.5);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(ambientLight, dirLight);

    return () => {
      scene.remove(ambientLight, dirLight);
    };
  }, [scene]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.4;
      groupRef.current.position.y = 1 + Math.sin(clock.getElapsedTime() * 1.5) * 0.2;
    }
    if (hairRef.current) {
      hairRef.current.children.forEach((child, i) => {
        child.rotation.x = Math.sin(clock.getElapsedTime() * 4 + i) * 0.08;
        child.rotation.z = Math.cos(clock.getElapsedTime() * 3 + i) * 0.08;
      });
    }
  });

  const form = forms[currentForm];

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <AuraField formLevel={form.level} />
      <ParticleField />
      
      <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#FFDBAC" roughness={0.8} />
      </mesh>

      <group ref={hairRef} position={[0, 1.3, 0]}>
        {Array.from({ length: currentForm >= 4 ? 200 : currentForm >= 3 ? 150 : currentForm >= 2 ? 100 : 80 }).map((_, i) => (
          <mesh key={i} castShadow receiveShadow position={[
            (Math.random() - 0.5) * (currentForm >= 3 ? 1.2 : 0.8),
            0.1 + Math.random() * (currentForm >= 3 ? 2.5 : currentForm >= 2 ? 1.5 : 0.8),
            (Math.random() - 0.5) * (currentForm >= 3 ? 1.2 : 0.8)
          ]} rotation={[Math.random() * 0.5, 0, Math.random() * 0.5]}>
            <coneGeometry args={[0.025, currentForm >= 3 ? 2.5 : currentForm >= 2 ? 1.5 : 0.6, 8]} />
            <meshStandardMaterial
              color={form.color}
              emissive={form.color}
              emissiveIntensity={currentForm >= 7 ? 1.5 : 0.5}
              metalness={0.3}
              roughness={0.7}
            />
          </mesh>
        ))}
      </group>

      <mesh castShadow receiveShadow position={[0, 0, 0]} scale={[1.2, 1.8, 1]}>
        <cylinderGeometry args={[0.6, 0.4, 2, 16]} />
        <meshStandardMaterial color="#1B5E20" roughness={0.6} metalness={0.2} />
      </mesh>

      <mesh castShadow receiveShadow position={[-0.8, 1.2, 0.4]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh castShadow receiveShadow position={[0.8, 1.2, 0.4]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      <pointLight position={[0, 3, 2]} color={form.aura} intensity={3} distance={15} decay={2} />
    </group>
  );
}

export function GokuScene() {
  const [currentForm, setCurrentForm] = React.useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const progress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      const formIndex = Math.min(Math.floor(progress * (forms.length - 1)), forms.length - 1);
      setCurrentForm(formIndex);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const form = forms[currentForm];

  return (
    <>
      <AuraField formLevel={form.level} />
      <ParticleField />
      <GokuCharacter currentForm={currentForm} />
    </>
  );
}

export function GokuPage() {
  const [openProject, setOpenProject] = React.useState<typeof gokuProjects[0] | null>(null);
  const [currentForm, setCurrentForm] = React.useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const progress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      const formIndex = Math.min(Math.floor(progress * (forms.length - 1)), forms.length - 1);
      setCurrentForm(formIndex);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-ink">
      <Halftone opacity={0.02} size={30} />
      <SpeedLines intensity={0.3} color="#FFB300" direction="radial" />
      <Navigation />
      <ScrollProgress />

      <Canvas
        camera={{ position: [0, 1.5, 8], fov: 50 }}
        gl={{ preserveDrawingBuffer: false, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center font-ui text-paper/50">Charging ki...</div>}>
          <GokuScene />
        </Suspense>
      </Canvas>

      <div className="relative z-10">
        <section className="min-h-screen flex items-center justify-center px-6" aria-label="Goku Chapter">
          <div className="max-w-7xl mx-auto w-full">
            <div className="text-center mb-16">
              <p className="font-kanji text-4xl mb-2" style={{ color: '#FFB300' }}>超賽亞人</p>
              <h1 className="font-display text-5xl md:text-7xl text-gold mb-4" style={{ textShadow: '0 0 30px #FFB300' }}>
                THE SAIYAN SINGULARITY
              </h1>
              <p className="font-body text-lg text-paper/70 max-w-2xl mx-auto">
                Power levels scale exponentially with training. From Base to Mastered Ultra Instinct —
                witness the transformation of compute into consciousness.
              </p>
            </div>

            <div className="space-y-8">
              {forms.map((form, i) => (
                <div
                  key={form.id}
                  className={`manga-panel p-6 transition-all duration-500 ${
                    i <= currentForm ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
                  }`}
                  style={{ borderLeftColor: form.aura, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-display text-xl text-ink"
                        style={{ backgroundColor: form.color }}>
                        {i + 1}
                      </div>
                      <div>
                        <h2 className="font-display text-2xl" style={{ color: form.color }}>{form.name}</h2>
                        <p className="font-kanji text-lg" style={{ color: form.aura }}>{form.kanji}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-3xl text-gold">{form.multiplier.toLocaleString()}×</div>
                      <div className="font-ui text-xs text-paper/50">BASE POWER</div>
                    </div>
                  </div>

                  {i < gokuProjects.length && (
                    <ProjectCard
                      project={gokuProjects[i]}
                      index={i}
                      onOpen={setOpenProject}
                    />
                  )}

                  {i === forms.length - 1 && (
                    <SFXText
                      text="ULTRA INSTINCT"
                      color="#FFD700"
                      size="lg"
                      trigger="mount"
                      className="mt-4"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <SFXText text="KACHOW" color="#FFB300" size="xl" trigger="mount" />
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