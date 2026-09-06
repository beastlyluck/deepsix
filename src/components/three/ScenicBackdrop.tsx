import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { FigureId } from '../../data/figureModels';

export const scenePlates: Record<FigureId, string> = {
  itachi: '/environments/env-itachi.png',
  goku: '/environments/env-goku.png',
  vegeta: '/environments/env-vegeta.png',
  zoro: '/environments/env-zoro.png',
  optimus: '/environments/env-optimus.png',
  spiderman: '/environments/env-spiderman.png',
  krishna: '/environments/env-krishna.png',
  thor: '/environments/env-thor.png',
  batman: '/environments/env-batman.png',
  ironman: '/environments/env-ironman.png',
  luffy: '/environments/env-luffy.png',
  kratos: '/environments/env-kratos.png',
  naruto: '/environments/env-naruto.png',
};

Object.values(scenePlates).forEach((src) => useTexture.preload(src));

export function ScenicBackdrop({
  src,
  position = [0, 1.65, -14],
  size = [32, 18],
  cover = false,
}: {
  src: string;
  position?: [number, number, number];
  size?: [number, number];
  cover?: boolean;
}) {
  const tex = useTexture(src);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const group = useRef<THREE.Group>(null);

  useFrame(({ camera, size: view }) => {
    if (!cover || !group.current) return;
    const dist = 16;
    const cam = camera as THREE.PerspectiveCamera;
    const viewH = 2 * Math.tan((cam.fov * Math.PI) / 360) * dist;
    const viewW = viewH * (view.width / Math.max(view.height, 1));
    const img = tex.image as { width?: number; height?: number } | undefined;
    const imgAspect = img?.width && img?.height ? img.width / img.height : 16 / 9;
    const viewAspect = viewW / viewH;
    const plate = group.current.children[0] as THREE.Mesh;
    if (imgAspect > viewAspect) {
      plate.scale.set(viewH * imgAspect, viewH, 1);
    } else {
      plate.scale.set(viewW, viewW / imgAspect, 1);
    }
    plate.position.set(0, 0, -dist);
    group.current.position.copy(camera.position);
    group.current.quaternion.copy(camera.quaternion);
  });

  if (cover) {
    return (
      <group ref={group} renderOrder={-2}>
        <mesh>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={tex} depthWrite={false} depthTest={false} toneMapped={false} />
        </mesh>
      </group>
    );
  }

  return (
    <mesh position={position} renderOrder={-2}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={tex} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
