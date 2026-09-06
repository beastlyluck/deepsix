import * as THREE from 'three';
import type { FigureId } from '../../data/figureModels';

export type BoneRec = { bone: THREE.Bone; restE: THREE.Euler; restP: THREE.Vector3 };
export type BoneMap = Map<string, BoneRec>;

function find(bones: BoneMap, re: RegExp) {
  const out: BoneRec[] = [];
  bones.forEach((v, name) => {
    if (re.test(name)) out.push(v);
  });
  return out;
}

function setOff(b: BoneRec, x: number, y: number, z: number) {
  b.bone.rotation.set(b.restE.x + x, b.restE.y + y, b.restE.z + z);
}

export function collectBones(root: THREE.Object3D): BoneMap {
  const map: BoneMap = new Map();
  const add = (bone: THREE.Object3D, overwrite = false) => {
    if (!bone.name) return;
    if (map.has(bone.name) && !overwrite) return;
    map.set(bone.name, { bone: bone as THREE.Bone, restE: bone.rotation.clone(), restP: bone.position.clone() });
  };
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) add(o);
    const mesh = o as THREE.SkinnedMesh;
    if (mesh.isSkinnedMesh && mesh.skeleton) mesh.skeleton.bones.forEach((b) => add(b, true));
  });
  return map;
}

export interface BodyMotion {
  y: number;
  rx: number;
  ry: number;
  rz: number;
  z: number;
}

const ZERO: BodyMotion = { y: 0, rx: 0, ry: 0, rz: 0, z: 0 };

export function applyCycle(id: FigureId, bones: BoneMap, t: number, perform: boolean): BodyMotion {
  if (!perform) return idleStance(id, bones, t);
  switch (id) {
    case 'goku':
      return gokuMotion(bones, t);
    case 'vegeta':
      return vegetaMotion(bones, t);
    case 'zoro':
      return zoroMotion(bones, t);
    case 'itachi':
      return itachiMotion(bones, t);
    case 'optimus':
      return optimusMotion(bones, t);
    case 'spiderman':
      return spiderMotion(bones, t);
    case 'krishna':
      return krishnaMotion(bones, t);
    default:
      return ZERO;
  }
}

function dropZoroArms(bones: BoneMap, punch = 0) {
  const L = find(bones, /Bip001 L UpperArm/i);
  const R = find(bones, /Bip001 R UpperArm/i);
  L.forEach((b) => setOff(b, 0.35 + punch * 0.9, 0.2, 0.75));
  R.forEach((b) => setOff(b, 0.3 - punch * 0.9, -0.15, -0.65));
}

function idleStance(id: FigureId, bones: BoneMap, t: number): BodyMotion {
  if (id === 'goku') return { y: Math.sin(t * 1.4) * 0.02, rx: 0, ry: 0, rz: 0, z: 0 };
  if (id === 'zoro') {
    dropZoroArms(bones);
    return { y: Math.sin(t * 1.2) * 0.015, rx: 0, ry: 0.12, rz: 0, z: 0 };
  }
  if (id === 'optimus') return optimusMotion(bones, t);
  const L = find(bones, /leftarm|shoulder_l|joint13/i);
  const R = find(bones, /rightarm|shoulder_r|joint14/i);
  L.forEach((b) => setOff(b, -0.35, 0, 0.25));
  R.forEach((b) => setOff(b, -0.35, 0, -0.25));
  return { y: Math.sin(t * 1.4) * 0.02, rx: 0, ry: 0, rz: 0, z: 0 };
}

function gokuMotion(bones: BoneMap, t: number): BodyMotion {
  const phase = Math.floor(t / 3.2) % 3;
  const u = t % 3.2;
  const L = find(bones, /mixamorig:leftarm|leftarm/i).filter((b) => !/fore|hand/i.test(b.bone.name));
  const R = find(bones, /mixamorig:rightarm|rightarm/i).filter((b) => !/fore|hand/i.test(b.bone.name));
  const LF = find(bones, /leftforearm|l forearm/i);
  const RF = find(bones, /rightforearm|r forearm/i);
  const SP = find(bones, /spine2|spine1/i);

  if (!L.length && !R.length) {
    if (phase === 0) return { y: 0.05 + Math.abs(Math.sin(u * 6.2)) * 0.08, rx: Math.sin(u * 6.2) * 0.14, ry: 0, rz: Math.sin(u * 6.2) * 0.2, z: 0 };
    if (phase === 1) {
      const punch = Math.pow(Math.max(0, Math.sin(u * 7.2)), 1.6);
      return { y: punch * 0.07, rx: -0.14 * punch, ry: punch * 0.18, rz: -0.16 * punch, z: punch * 0.48 };
    }
    const throwK = u > 1.4 ? Math.min(1, (u - 1.4) * 3) : 0;
    return { y: 0.1 + throwK * 0.04, rx: -0.12 * throwK, ry: 0, rz: 0, z: throwK * 0.42 };
  }

  if (phase === 0) {
    const a = u * 6.2;
    L.forEach((b) => setOff(b, Math.sin(a) * 1.35 - 0.55, 0.15, 0.85));
    R.forEach((b) => setOff(b, Math.cos(a) * 1.35 - 0.55, -0.15, -0.85));
    LF.forEach((b) => setOff(b, -0.85 + Math.sin(a) * 0.45, 0, 0));
    RF.forEach((b) => setOff(b, -0.85 + Math.cos(a) * 0.45, 0, 0));
    SP.forEach((b) => setOff(b, 0.12, Math.sin(a) * 0.1, 0));
    return { y: 0.03 + Math.abs(Math.sin(a)) * 0.04, rx: 0, ry: Math.sin(t * 1.2) * 0.12, rz: 0, z: 0 };
  }
  if (phase === 1) {
    const punch = Math.pow(Math.max(0, Math.sin(u * 7.2)), 1.6);
    L.forEach((b) => setOff(b, -0.55, 0.2, 0.95 - punch * 0.3));
    R.forEach((b) => setOff(b, -0.2 - punch * 1.7, -0.35 * punch, -0.15 + punch * 0.2));
    RF.forEach((b) => setOff(b, -0.15 + punch * 0.9, 0, 0));
    SP.forEach((b) => setOff(b, 0.18 * punch, 0.4 * punch, 0));
    return { y: punch * 0.05, rx: -0.08 * punch, ry: -0.2 + punch * 0.45, rz: 0, z: punch * 0.28 };
  }
  const charge = Math.min(1, u / 1.1);
  const throwK = u > 1.4 ? Math.min(1, (u - 1.4) * 3) : 0;
  L.forEach((b) => setOff(b, -2.1 * charge + throwK * 1.8, 0, 0.2));
  R.forEach((b) => setOff(b, -2.1 * charge + throwK * 1.8, 0, -0.2));
  SP.forEach((b) => setOff(b, 0.28 * charge - throwK * 0.4, 0, 0));
  return { y: 0.04 + charge * 0.08, rx: -0.06 * throwK, ry: Math.sin(t * 0.4) * 0.08, rz: 0, z: throwK * 0.22 };
}

function vegetaMotion(bones: BoneMap, t: number): BodyMotion {
  const phase = Math.floor(t / 6.5) % 2;
  const u = t % 6.5;
  const SL = find(bones, /shoulder_l/i);
  const SR = find(bones, /shoulder_r/i);
  const EL = find(bones, /elbow_l/i);
  const ER = find(bones, /elbow_r/i);
  const SP = find(bones, /spine2|spine1/i);
  const TL = find(bones, /thigh_l/i);
  const TR = find(bones, /thigh_r/i);
  const CL = find(bones, /clank_l/i);
  const CR = find(bones, /clank_r/i);

  if (phase === 0) {
    const cycle = u * 5.6;
    const jabR = Math.pow(Math.max(0, Math.sin(cycle)), 2);
    const jabL = Math.pow(Math.max(0, Math.sin(cycle + Math.PI)), 2);
    SR.forEach((b) => setOff(b, -0.25 - jabR * 1.55, -0.85 * jabR, -0.15));
    SL.forEach((b) => setOff(b, -0.25 - jabL * 1.55, 0.85 * jabL, 0.15));
    ER.forEach((b) => setOff(b, -1.15 + jabR * 1.05, 0, 0));
    EL.forEach((b) => setOff(b, -1.15 + jabL * 1.05, 0, 0));
    SP.forEach((b) => setOff(b, 0.08, (jabR - jabL) * 0.35, 0));
    return { y: 0.02, rx: 0, ry: (jabR - jabL) * 0.18, rz: 0, z: Math.max(jabR, jabL) * 0.2 };
  }

  const dip = 0.5 - 0.5 * Math.cos(u * 5.4);
  SL.forEach((b) => setOff(b, 0.15, 0, 1.45));
  SR.forEach((b) => setOff(b, 0.15, 0, -1.45));
  EL.forEach((b) => setOff(b, -0.2 - dip * 0.35, 0, 0));
  ER.forEach((b) => setOff(b, -0.2 - dip * 0.35, 0, 0));
  SP.forEach((b) => setOff(b, 0.55 + dip * 0.55, 0, 0));
  TL.forEach((b) => setOff(b, 0.15, 0, 0.06));
  TR.forEach((b) => setOff(b, 0.15, 0, -0.06));
  CL.forEach((b) => setOff(b, dip * 0.25, 0, 0));
  CR.forEach((b) => setOff(b, dip * 0.25, 0, 0));
  return { y: -0.02 - dip * 0.22, rx: 0, ry: 0, rz: 0, z: 0 };
}

function zoroMotion(bones: BoneMap, t: number): BodyMotion {
  const phase = Math.floor(t / 5.5) % 3;
  const slash = Math.sin(t * 6.2);
  dropZoroArms(bones, phase === 1 ? slash : 0);
  if (phase === 0) return { y: Math.sin(t * 1.15) * 0.02, rx: 0, ry: 0.16 + Math.sin(t * 0.45) * 0.1, rz: 0, z: 0 };
  if (phase === 1) return { y: 0.03, rx: 0, ry: slash * 0.4, rz: 0, z: 0 };
  return { y: -0.015, rx: 0, ry: 0.28, rz: 0, z: 0 };
}

function itachiMotion(bones: BoneMap, t: number): BodyMotion {
  const L = find(bones, /leftarm|l upperarm|shoulder_l|arm_l/i);
  const R = find(bones, /rightarm|r upperarm|shoulder_r|arm_r/i);
  L.forEach((b) => setOff(b, -0.75, 0.25, 0.8));
  R.forEach((b) => setOff(b, 0.1, -0.08, -0.22));
  return { y: Math.sin(t * 1.05) * 0.02, rx: 0.03, ry: Math.sin(t * 0.32) * 0.28, rz: 0, z: 0 };
}

function optimusMotion(bones: BoneMap, t: number): BodyMotion {
  const L = find(bones, /joint13_028/i);
  const LF = find(bones, /joint16_030/i);
  const R = find(bones, /joint14_012/i);
  const RF = find(bones, /joint15_014/i);
  const SP = find(bones, /spines2_05|spines3_06/i);
  const NK = find(bones, /neck_043|head_044/i);
  const breath = Math.sin(t * 1.3) * 0.04;
  R.forEach((b) => setOff(b, -1.55, -0.15, -0.05));
  RF.forEach((b) => setOff(b, -0.15, 0, 0));
  L.forEach((b) => setOff(b, 0.12, 0, 0.18));
  LF.forEach((b) => setOff(b, 0.05, 0, 0));
  SP.forEach((b) => setOff(b, -0.08 + breath, 0, 0));
  NK.forEach((b) => setOff(b, -0.12, 0, 0));
  return { y: breath * 0.4, rx: 0, ry: Math.sin(t * 0.22) * 0.08, rz: 0, z: 0 };
}

function spiderMotion(bones: BoneMap, t: number): BodyMotion {
  const L = find(bones, /mixamorig:leftarm|leftarm/i).filter((b) => !/fore|hand/i.test(b.bone.name));
  const R = find(bones, /mixamorig:rightarm|rightarm/i).filter((b) => !/fore|hand/i.test(b.bone.name));
  const phase = Math.floor(t / 5) % 3;
  if (phase === 0) {
    L.forEach((b) => setOff(b, -2.1, 0, 0.35));
    R.forEach((b) => setOff(b, 0.3, 0, -0.5));
    return { y: 0.12 + Math.sin(t * 3) * 0.06, rx: 0.2, ry: Math.sin(t * 0.8) * 0.15, rz: 0, z: 0 };
  }
  if (phase === 1) {
    L.forEach((b) => setOff(b, -1.0, 0, 1.0));
    R.forEach((b) => setOff(b, -1.0, 0, -1.0));
    return { y: 0.02, rx: 0.25, ry: 0, rz: 0, z: 0 };
  }
  L.forEach((b) => setOff(b, -0.35, 0, 0.4));
  R.forEach((b) => setOff(b, -2.2, 0, 0));
  return { y: 0.1 + Math.abs(Math.sin(t * 4)) * 0.1, rx: -0.08, ry: 0.1, rz: 0, z: 0 };
}

function krishnaMotion(bones: BoneMap, t: number): BodyMotion {
  const phase = Math.floor(t / 5.5) % 3;
  if (phase === 0) return { y: 0.08 + Math.sin(t * 1.2) * 0.05, rx: 0, ry: Math.sin(t * 0.25) * 0.35, rz: 0, z: 0 };
  if (phase === 1) return { y: 0.14 + Math.sin(t * 1.5) * 0.04, rx: 0.04, ry: Math.sin(t * 0.35) * 0.5, rz: 0, z: 0 };
  return { y: 0.06, rx: 0.06, ry: -0.3 + Math.sin(t * 0.4) * 0.12, rz: 0, z: 0 };
}
