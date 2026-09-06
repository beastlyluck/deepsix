import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

const LOGO_URL = '/logo/logo.glb';
const TARGET_HEIGHT = 1.85;

export function Logo3D({
  scale = 1,
  spin = 0.35,
  wobble = 0.08,
  glow = 1,
}: {
  scale?: number;
  spin?: number;
  wobble?: number;
  glow?: number;
}) {
  const root = useRef<THREE.Group>(null);
  const gltf = useGLTF(LOGO_URL);
  const mark = useMemo(() => {
    const cloned = SkeletonUtils.clone(gltf.scene);
    cloned.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const fit = size.y > 0.01 ? TARGET_HEIGHT / size.y : 1;
    cloned.scale.setScalar(fit);
    cloned.position.set(-center.x * fit, -center.y * fit, -center.z * fit);
    cloned.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.frustumCulled = false;
    });
    return cloned;
  }, [gltf.scene]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!root.current) return;
    root.current.rotation.y = Math.sin(t * Math.max(spin, 0.0001) * 1.4) * 0.42;
    root.current.rotation.x = Math.sin(t * 0.7) * wobble;
    root.current.position.y = Math.sin(t * 1.1) * 0.04;
  });

  return (
    <group ref={root} scale={scale}>
      <primitive object={mark} />
      <pointLight color="#FFD700" intensity={1.6 * glow} distance={6} decay={2} position={[0, 0, 1.1]} />
    </group>
  );
}
