import { Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';

interface SceneBackdropProps {
  children: ReactNode;
  camera?: { position: [number, number, number]; fov?: number };
  /** Point the camera aims at. Figures stand on y=0 and are ~2 units tall. */
  lookAt?: [number, number, number];
  interactive?: boolean;
}

export function SceneBackdrop({
  children,
  camera = { position: [0, 1.35, 5.6], fov: 40 },
  lookAt = [0, 1.0, 0],
  interactive = false,
}: SceneBackdropProps) {
  return (
    <div className={`${interactive ? 'pointer-events-auto' : 'pointer-events-none'} absolute inset-0 z-0`} aria-hidden={!interactive}>
      <Canvas
        shadows
        camera={camera}
        dpr={[1, 1.6]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ camera: cam }) => cam.lookAt(...lookAt)}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}
