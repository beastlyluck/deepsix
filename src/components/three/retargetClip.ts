import * as THREE from 'three';

const MIXAMO_TO_VEGETA: { from: RegExp; to: RegExp }[] = [
  { from: /mixamorig:?Hips/i, to: /^WAIST_/i },
  { from: /mixamorig:?Spine2/i, to: /^SPINE3_/i },
  { from: /mixamorig:?Spine1/i, to: /^SPINE2_/i },
  { from: /mixamorig:?Spine(?!\d)/i, to: /^SPINE1_/i },
  { from: /mixamorig:?Neck/i, to: /^NECK_/i },
  { from: /mixamorig:?Head(?!Top)/i, to: /^HEAD_/i },
  { from: /mixamorig:?LeftShoulder/i, to: /^CLAVICLE_L_/i },
  { from: /mixamorig:?RightShoulder/i, to: /^CLAVICLE_R_/i },
  { from: /mixamorig:?LeftArm/i, to: /^SHOULDER_L_/i },
  { from: /mixamorig:?RightArm/i, to: /^SHOULDER_R_/i },
  { from: /mixamorig:?LeftForeArm/i, to: /^ELBOW_L_/i },
  { from: /mixamorig:?RightForeArm/i, to: /^ELBOW_R_/i },
  { from: /mixamorig:?LeftHandThumb1/i, to: /^F_THUMB1_L_/i },
  { from: /mixamorig:?LeftHandThumb2/i, to: /^F_THUMB2_L_/i },
  { from: /mixamorig:?LeftHandThumb3/i, to: /^F_THUMB3_L_/i },
  { from: /mixamorig:?RightHandThumb1/i, to: /^F_THUMB1_R_/i },
  { from: /mixamorig:?RightHandThumb2/i, to: /^F_THUMB2_R_/i },
  { from: /mixamorig:?RightHandThumb3/i, to: /^F_THUMB3_R_/i },
  { from: /mixamorig:?LeftHandIndex1/i, to: /^F_FORE1_L_/i },
  { from: /mixamorig:?LeftHandIndex2/i, to: /^F_FORE2_L_/i },
  { from: /mixamorig:?LeftHandIndex3/i, to: /^F_FORE3_L_/i },
  { from: /mixamorig:?RightHandIndex1/i, to: /^F_FORE1_R_/i },
  { from: /mixamorig:?RightHandIndex2/i, to: /^F_FORE2_R_/i },
  { from: /mixamorig:?RightHandIndex3/i, to: /^F_FORE3_R_/i },
  { from: /mixamorig:?LeftHandMiddle1/i, to: /^F_MIDDLE1_L_/i },
  { from: /mixamorig:?LeftHandMiddle2/i, to: /^F_MIDDLE2_L_/i },
  { from: /mixamorig:?LeftHandMiddle3/i, to: /^F_MIDDLE3_L_/i },
  { from: /mixamorig:?RightHandMiddle1/i, to: /^F_MIDDLE1_R_/i },
  { from: /mixamorig:?RightHandMiddle2/i, to: /^F_MIDDLE2_R_/i },
  { from: /mixamorig:?RightHandMiddle3/i, to: /^F_MIDDLE3_R_/i },
  { from: /mixamorig:?LeftHandRing1/i, to: /^F_MEDICINAL1_L_/i },
  { from: /mixamorig:?LeftHandRing2/i, to: /^F_MEDICINAL2_L_/i },
  { from: /mixamorig:?LeftHandRing3/i, to: /^F_MEDICINAL3_L_/i },
  { from: /mixamorig:?RightHandRing1/i, to: /^F_MEDICINAL1_R_/i },
  { from: /mixamorig:?RightHandRing2/i, to: /^F_MEDICINAL2_R_/i },
  { from: /mixamorig:?RightHandRing3/i, to: /^F_MEDICINAL3_R_/i },
  { from: /mixamorig:?LeftHandPinky1/i, to: /^F_LITTLE1_L_/i },
  { from: /mixamorig:?LeftHandPinky2/i, to: /^F_LITTLE2_L_/i },
  { from: /mixamorig:?LeftHandPinky3/i, to: /^F_LITTLE3_L_/i },
  { from: /mixamorig:?RightHandPinky1/i, to: /^F_LITTLE1_R_/i },
  { from: /mixamorig:?RightHandPinky2/i, to: /^F_LITTLE2_R_/i },
  { from: /mixamorig:?RightHandPinky3/i, to: /^F_LITTLE3_R_/i },
  { from: /mixamorig:?LeftHand(?![A-Za-z])/i, to: /^WRIST_L_/i },
  { from: /mixamorig:?RightHand(?![A-Za-z])/i, to: /^WRIST_R_/i },
  { from: /mixamorig:?LeftUpLeg/i, to: /^THIGH_L_/i },
  { from: /mixamorig:?RightUpLeg/i, to: /^THIGH_R_/i },
  { from: /mixamorig:?LeftLeg/i, to: /^CLANK_L_/i },
  { from: /mixamorig:?RightLeg/i, to: /^CLANK_R_/i },
  { from: /mixamorig:?LeftFoot/i, to: /^TOE1_L_/i },
  { from: /mixamorig:?RightFoot/i, to: /^TOE1_R_/i },
];

function collectBoneNames(root: THREE.Object3D) {
  const names: string[] = [];
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) names.push(o.name);
  });
  return names;
}

function mapMixamo(src: string, names: string[]) {
  for (const rule of MIXAMO_TO_VEGETA) {
    if (!rule.from.test(src)) continue;
    const hit = names.find((n) => rule.to.test(n));
    if (hit) return hit;
  }
  return null;
}

function boneMap(root: THREE.Object3D) {
  const bones = new Map<string, THREE.Bone>();
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) bones.set(o.name, o as THREE.Bone);
  });
  return bones;
}

/**
 * Replay Goku's Idle on Vegeta as bind-to-bind offsets:
 * vegetaPose = vegetaBind * inverse(gokuBind) * gokuIdleKey
 */
export function retargetMixamoIdle(clip: THREE.AnimationClip, target: THREE.Object3D, source: THREE.Object3D) {
  const names = collectBoneNames(target);
  const destBones = boneMap(target);
  const srcBones = boneMap(source);

  const tracks: THREE.KeyframeTrack[] = [];
  const q = new THREE.Quaternion();
  const rel = new THREE.Quaternion();

  clip.tracks.forEach((track) => {
    if (!track.name.endsWith('.quaternion')) return;
    const srcName = track.name.slice(0, track.name.indexOf('.'));
    if (/Hips|Spine|UpLeg|Leg|Foot|Toe|Neck|Head/i.test(srcName) && !/ForeArm/i.test(srcName)) return;
    const destName = mapMixamo(srcName, names);
    const dest = destName ? destBones.get(destName) : undefined;
    const srcBone = srcBones.get(srcName) ?? [...srcBones.values()].find((b) => b.name.replace(/:/g, '') === srcName.replace(/:/g, ''));
    if (!dest || !srcBone) return;

    const restSrc = srcBone.quaternion.clone();
    const restDst = dest.quaternion.clone();
    const src = track.values;
    const out = new Float32Array(src.length);
    for (let i = 0; i < src.length; i += 4) {
      q.set(src[i], src[i + 1], src[i + 2], src[i + 3]);
      rel.copy(restSrc).invert().multiply(q);
      const mapped = restDst.clone().multiply(rel);
      out[i] = mapped.x;
      out[i + 1] = mapped.y;
      out[i + 2] = mapped.z;
      out[i + 3] = mapped.w;
    }
    tracks.push(new THREE.QuaternionKeyframeTrack(`${destName}.quaternion`, Array.from(track.times), out));
  });

  return new THREE.AnimationClip('Idle', clip.duration, tracks);
}

/** Drop root / locomotion so figures stay on the podium. Keep other bone binds. */
export function lockRootMotion(clip: THREE.AnimationClip, stripAllPositions = false) {
  const tracks = clip.tracks.filter((t) => {
    const root = /hips|pelvis|waist|root|armature/i.test(t.name);
    if (t.name.endsWith('.position') && (stripAllPositions || root)) return false;
    if (t.name.endsWith('.scale') && root) return false;
    return true;
  });
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}
