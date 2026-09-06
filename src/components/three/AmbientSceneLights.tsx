import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function AmbientSceneLights({ color = 0xffd700, intensity = 1.4 }: { color?: number; intensity?: number }) {
  const { scene } = useThree();

  useEffect(() => {
    const ambient = new THREE.AmbientLight(0x404040, 0.45);
    const dir = new THREE.DirectionalLight(color, intensity);
    dir.position.set(5, 10, 7);
    scene.add(ambient, dir);
    return () => {
      scene.remove(ambient, dir);
    };
  }, [scene, color, intensity]);

  return null;
}
