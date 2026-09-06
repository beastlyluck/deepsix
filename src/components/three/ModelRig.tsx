import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils, type GLTFLoader } from 'three-stdlib';
import { figureModels, type FigureId } from '../../data/figureModels';
import { ChapterFigure } from './ChapterFigure';
import { applyCycle, collectBones, type BoneMap } from './poseCycles';
import { fitStanding, makeVisible, posedSkinnedBox, rebindSkins, reportFit } from './fitFigure';
import { lockRootMotion } from './retargetClip';
import { paintSpecGlossMaps, registerSpecGloss } from './gltfSpecGloss';
import { characterMetadata } from '../../systems/manga/mangaTypes';
import type { CharacterKey } from '../../data/openDataSources';

function extendGltf(loader: GLTFLoader) {
  registerSpecGloss(loader);
}

function polishFigure(id: FigureId, root: THREE.Object3D) {
  if (id !== 'optimus') return;
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((mat) => {
      const m = mat as THREE.MeshStandardMaterial;
      if (m.map) {
        m.map.colorSpace = THREE.SRGBColorSpace;
        m.map.needsUpdate = true;
        m.color.set('#ffffff');
      }
      if ('emissive' in m && m.emissive) m.emissive.set('#000000');
      if ('emissiveIntensity' in m) m.emissiveIntensity = m.emissiveMap ? 0.25 : 0.03;
      if ('metalness' in m) m.metalness = 0.16;
      if ('roughness' in m) m.roughness = 0.52;
      if ('envMapIntensity' in m) m.envMapIntensity = 0.3;
      m.side = THREE.FrontSide;
      m.needsUpdate = true;
    });
  });
}

function stockNames(animations: THREE.AnimationClip[], preferred?: string[]) {
  const have = new Set(animations.map((a) => a.name));
  const picked = (preferred ?? []).filter((n) => have.has(n));
  if (picked.length) return picked;
  return animations.filter((a) => a.duration > 0.2 && !/walk|run|Default/i.test(a.name)).map((a) => a.name);
}

function useClonedScene(url: string) {
  const gltf = useGLTF(url, true, true, extendGltf);
  const clone = useMemo(() => {
    const c = SkeletonUtils.clone(gltf.scene) as THREE.Group;
    rebindSkins(c);
    return c;
  }, [gltf.scene]);
  return { clone, animations: gltf.animations, parser: (gltf as { parser?: import('three-stdlib').GLTFParser }).parser };
}

function GltfFigure({
  id,
  url,
  sway,
  perform = true,
}: {
  id: FigureId;
  url: string;
  sway: boolean;
  perform?: boolean;
}) {
  const spec = figureModels[id];
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const { clone, animations, parser } = useClonedScene(url);
  const clips = useMemo(() => animations.filter((a) => a.duration > 0.15).map((a) => lockRootMotion(a)), [animations]);
  const stabilize = useRef(0);
  const { actions } = useAnimations(clips, clone);
  const playlist = useMemo(() => stockNames(clips, spec.clips), [clips, spec.clips]);
  const hasStock = playlist.length > 0;
  const bones = useRef<BoneMap>(new Map());
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    if (!inner.current) return;
    let dead = false;
    const run = async () => {
      makeVisible(clone);
      if (id === 'optimus' && parser) await paintSpecGlossMaps(parser, clone);
      if (dead || !inner.current) return;
      polishFigure(id, clone);
      rebindSkins(clone);
      fitStanding(inner.current, spec.height);
      if (spec.yaw) inner.current.rotation.y += spec.yaw;
      bones.current = collectBones(clone);
      reportFit(id, inner.current, bones.current.size);
      stabilize.current = 0;
      setReady(true);
    };
    void run();
    return () => {
      dead = true;
    };
  }, [clone, spec.height, spec.yaw, id, parser]);

  useEffect(() => {
    const wanted = playlist.filter((n) => actions[n]);
    if (!wanted.length) return;
    let i = 0;
    const run = () => {
      Object.values(actions).forEach((a) => a?.fadeOut(0.16));
      const name = wanted[perform ? i % wanted.length : 0];
      const action = actions[name];
      if (!action) return;
      action.reset().fadeIn(0.16).setLoop(THREE.LoopRepeat, Infinity).play();
      if (id === 'optimus') action.timeScale = 0.45;
      i += 1;
    };
    run();
    const timer = wanted.length > 1 && perform ? window.setInterval(run, 4200) : 0;
    return () => {
      if (timer) window.clearInterval(timer);
      Object.values(actions).forEach((a) => a?.stop());
    };
  }, [actions, playlist, perform, id]);

  useFrame(({ clock }) => {
    if (!group.current || !inner.current || !ready) return;
    if (stabilize.current < 10) {
      stabilize.current += 1;
      if (stabilize.current >= 3) {
        const live = posedSkinnedBox(clone);
        const liveH = live.max.y - live.min.y;
        if (liveH > spec.height * 1.35 || (liveH > 0.2 && liveH < spec.height * 0.6)) {
          inner.current.scale.multiplyScalar(spec.height / liveH);
          inner.current.updateMatrixWorld(true);
          const grounded = posedSkinnedBox(clone);
          inner.current.position.x -= (grounded.min.x + grounded.max.x) / 2;
          inner.current.position.z -= (grounded.min.z + grounded.max.z) / 2;
          inner.current.position.y -= grounded.min.y;
          reportFit(id, inner.current, bones.current.size);
        }
      }
    }
    if (id === 'optimus') {
      Object.values(actions).forEach((a) => {
        if (a?.isRunning() && a.time > 5.4) a.time = 1.15;
      });
    }
    const t = clock.getElapsedTime();
    const body = hasStock
      ? { y: Math.sin(t * 1.15) * 0.01, rx: 0, ry: sway ? Math.sin(t * 0.18) * 0.06 : 0, rz: 0, z: 0 }
      : applyCycle(id, bones.current, t, perform);
    if (hasStock) {
      bones.current.forEach((rec, name) => {
        if (/hips|pelvis|waist/i.test(name)) rec.bone.position.copy(rec.restP);
      });
    }
    group.current.position.set(0, body.y, body.z ?? 0);
    group.current.rotation.set(body.rx, body.ry, body.rz);
  }, 1);

  return (
    <group ref={group}>
      <group ref={inner}>
        <primitive object={clone} />
      </group>
    </group>
  );
}

class ModelErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  render() {
    return this.state.err ? this.props.fallback : this.props.children;
  }
}

export function CharacterModel({ character, sway = true, perform = true }: { character: FigureId; sway?: boolean; perform?: boolean }) {
  const spec = figureModels[character];
  const fallback = character in characterMetadata ? <ChapterFigure character={character as CharacterKey} sway={sway} /> : null;

  if (!spec.url) return fallback;

  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GltfFigure id={character} url={spec.url} sway={sway} perform={perform} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

useGLTF.preload('/models/new/itachi.glb', true, true, extendGltf);
useGLTF.preload('/models/new/goku.glb', true, true, extendGltf);
useGLTF.preload('/models/new/vegeta.glb', true, true, extendGltf);
useGLTF.preload('/models/new/zoro.glb', true, true, extendGltf);
useGLTF.preload('/models/new/optimus.glb', true, true, extendGltf);
useGLTF.preload('/models/new/spiderman.glb', true, true, extendGltf);
useGLTF.preload('/models/krishna.glb', true, true, extendGltf);
