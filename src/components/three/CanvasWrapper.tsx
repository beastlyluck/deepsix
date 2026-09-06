import { useRef, useEffect, useState, Suspense, useCallback } from 'react';
import { Canvas, extend } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';
import * as THREE from 'three';
import { PerformanceMonitor } from '../../utils/performance';

extend({ EffectComposer, Bloom, Vignette, SMAA });

interface CanvasWrapperProps {
  children: React.ReactNode;
  cameraPosition?: [number, number, number];
  enablePostProcessing?: boolean;
  shadows?: boolean;
  toneMapping?: THREE.ToneMapping;
  onError?: (event: React.SyntheticEvent<HTMLCanvasElement>) => void;
}

export const CanvasWrapper: React.FC<CanvasWrapperProps> = ({
  children,
  cameraPosition = [0, 1.5, 5],
  enablePostProcessing = true,
  shadows = true,
  toneMapping = THREE.ACESFilmicToneMapping,
  onError,
}) => {
  const perfRef = useRef<PerformanceMonitor | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    perfRef.current = new PerformanceMonitor((fps: number, frameTime: number) => {
      if (fps < 30) console.warn(`Low FPS: ${fps.toFixed(1)} (${frameTime.toFixed(1)}ms)`);
    });
    return () => { perfRef.current = null; };
  }, []);

  const onCreated = useCallback((state: any) => {
    state.gl.shadowMap.enabled = shadows;
    state.gl.shadowMap.type = THREE.PCFSoftShadowMap;
    state.gl.toneMapping = toneMapping;
    state.gl.toneMappingExposure = 1.0;
    state.gl.outputColorSpace = THREE.SRGBColorSpace;
    state.gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (perfRef.current) {
      state.gl.setAnimationLoop(() => {
        perfRef.current!.tick();
        state.gl.render(state.scene, state.camera);
      });
    }
  }, [shadows, toneMapping]);

  return (
    <Canvas
      ref={canvasRef}
      camera={{ position: cameraPosition, fov: 50, near: 0.1, far: 1000 }}
      onCreated={onCreated}
      onError={onError as any}
      gl={{ preserveDrawingBuffer: false, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center font-ui text-paper/50">Loading manuscript...</div>}>
        {children}
        {enablePostProcessing && <PostProcessing />}
      </Suspense>
    </Canvas>
  );
};

function PostProcessing() {
  return (
    <EffectComposer multisampling={8} renderPriority={999}>
      <SMAA preset={0} />
      <Bloom intensity={0.3} luminanceThreshold={0.8} luminanceSmoothing={0.025} height={0.5} />
      <Vignette darkness={1.2} offset={0.3} />
    </EffectComposer>
  );
}