import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface CameraRigProps {
  mode?: 'orbit' | 'first-person' | 'cinematic' | 'scroll-sync';
  target?: THREE.Vector3;
  distance?: number;
  scrollRange?: [number, number];
  onPositionChange?: (position: THREE.Vector3) => void;
}

export const CameraRig: React.FC<CameraRigProps> = ({
  mode = 'cinematic',
  target = new THREE.Vector3(0, 1, 0),
  distance = 5,
  scrollRange = [0, 1],
  onPositionChange,
}) => {
  const { camera, scene, size } = useThree();
  const rigRef = useRef<THREE.Group>(new THREE.Group());
  const pivotRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const targetRef = useRef(target.clone());
  const scrollProgress = useRef(0);

  useEffect(() => {
    rigRef.current.add(pivotRef.current);
    pivotRef.current.add(camera);
    scene.add(rigRef.current);

    camera.position.set(0, 1.5, distance);
    camera.lookAt(targetRef.current);

    return () => {
      scene.remove(rigRef.current);
    };
  }, [scene, camera, distance]);

  useFrame(({ clock }) => {
    if (mode === 'orbit') {
      const time = clock.getElapsedTime();
      rigRef.current.rotation.y = time * 0.05;
    } else if (mode === 'scroll-sync') {
      const [start, end] = scrollRange;
      const t = Math.max(0, Math.min(1, (scrollProgress.current - start) / (end - start)));

      rigRef.current.position.lerp(new THREE.Vector3(
        Math.sin(t * Math.PI * 2) * distance,
        1.5 + Math.sin(t * Math.PI) * 1,
        Math.cos(t * Math.PI * 2) * distance
      ), 0.1);

      camera.lookAt(targetRef.current);
    }

    if (onPositionChange) {
      onPositionChange(camera.position.clone());
    }
  });

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        scrollProgress.current = self.progress;
      },
    });
    return () => st.kill();
  }, []);

  const setTarget = (newTarget: THREE.Vector3) => {
    targetRef.current.copy(newTarget);
  };

  const setMode = (newMode: CameraRigProps['mode']) => {
    // Mode switching handled externally
  };

  return null; // Camera is managed imperatively
};

export const useCameraController = () => {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3());

  const lookAt = (target: THREE.Vector3, duration = 1) => {
    gsap.to(camera.position, {
      x: target.x,
      y: target.y + 1.5,
      z: target.z + 5,
      duration,
      ease: 'power3.inOut',
      onUpdate: () => camera.lookAt(targetRef.current),
    });
  };

  const orbit = (radius: number, height: number, duration: number) => {
    gsap.to({}, {
      duration,
      ease: 'none',
      onUpdate: function() {
        const progress = this.progress();
        const angle = progress * Math.PI * 2;
        camera.position.x = Math.sin(angle) * radius;
        camera.position.z = Math.cos(angle) * radius;
        camera.position.y = height;
        camera.lookAt(targetRef.current);
      },
    });
  };

  const shake = (intensity = 0.1, duration = 0.5) => {
    const originalPos = camera.position.clone();
    gsap.to(camera.position, {
      x: originalPos.x + (Math.random() - 0.5) * intensity,
      y: originalPos.y + (Math.random() - 0.5) * intensity,
      z: originalPos.z + (Math.random() - 0.5) * intensity,
      duration: 0.05,
      repeat: duration / 0.05,
      yoyo: true,
      ease: 'rough({strength: 3, points: 20})',
      onComplete: () => camera.position.copy(originalPos),
    });
  };

  return { lookAt, orbit, shake };
};
