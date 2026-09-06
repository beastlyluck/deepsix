import * as THREE from 'three';

function bone(root: THREE.Object3D, re: RegExp) {
  let found: THREE.Bone | undefined;
  root.traverse((o) => {
    if (found || !(o as THREE.Bone).isBone) return;
    if (re.test(o.name)) found = o as THREE.Bone;
  });
  return found;
}

function track(b: THREE.Bone, times: number[], eulers: THREE.Euler[]) {
  const values: number[] = [];
  eulers.forEach((e) => {
    const q = b.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(e));
    values.push(q.x, q.y, q.z, q.w);
  });
  return new THREE.QuaternionKeyframeTrack(`${b.name}.quaternion`, times, values);
}

export function buildGokuClips(root: THREE.Object3D): THREE.AnimationClip[] {
  const rArm = bone(root, /mixamorig:RightArm(?!Fore)/i);
  const lArm = bone(root, /mixamorig:LeftArm(?!Fore)/i);
  const rFore = bone(root, /mixamorig:RightForeArm/i);
  const lFore = bone(root, /mixamorig:LeftForeArm/i);
  const spine = bone(root, /mixamorig:Spine2/i);
  if (!rArm || !lArm) return [];

  const punch = new THREE.AnimationClip('Punch', 1.05, [
    track(rArm, [0, 0.18, 0.38, 0.7, 1.05], [
      new THREE.Euler(0, 0, 0),
      new THREE.Euler(-0.4, -0.2, -0.15),
      new THREE.Euler(-1.65, -0.45, 0.1),
      new THREE.Euler(-0.3, 0, 0),
      new THREE.Euler(0, 0, 0),
    ]),
    ...(rFore
      ? [
          track(rFore, [0, 0.18, 0.38, 0.7, 1.05], [
            new THREE.Euler(0, 0, 0),
            new THREE.Euler(-1.1, 0, 0),
            new THREE.Euler(0.2, 0, 0),
            new THREE.Euler(-0.4, 0, 0),
            new THREE.Euler(0, 0, 0),
          ]),
        ]
      : []),
    ...(spine
      ? [
          track(spine, [0, 0.38, 1.05], [
            new THREE.Euler(0, 0, 0),
            new THREE.Euler(0.15, 0.35, 0),
            new THREE.Euler(0, 0, 0),
          ]),
        ]
      : []),
    track(lArm, [0, 0.38, 1.05], [
      new THREE.Euler(0, 0, 0),
      new THREE.Euler(-0.5, 0.2, 0.7),
      new THREE.Euler(0, 0, 0),
    ]),
  ]);

  const warmup = new THREE.AnimationClip('Warmup', 2.0, [
    track(lArm, [0, 0.5, 1.0, 1.5, 2.0], [
      new THREE.Euler(0, 0, 0),
      new THREE.Euler(-1.2, 0, 0.9),
      new THREE.Euler(-0.2, 0, 0.4),
      new THREE.Euler(-1.2, 0, 0.9),
      new THREE.Euler(0, 0, 0),
    ]),
    track(rArm, [0, 0.5, 1.0, 1.5, 2.0], [
      new THREE.Euler(0, 0, 0),
      new THREE.Euler(-0.2, 0, -0.4),
      new THREE.Euler(-1.2, 0, -0.9),
      new THREE.Euler(-0.2, 0, -0.4),
      new THREE.Euler(0, 0, 0),
    ]),
    ...(lFore && rFore
      ? [
          track(lFore, [0, 1.0, 2.0], [new THREE.Euler(0, 0, 0), new THREE.Euler(-0.7, 0, 0), new THREE.Euler(0, 0, 0)]),
          track(rFore, [0, 1.0, 2.0], [new THREE.Euler(0, 0, 0), new THREE.Euler(-0.7, 0, 0), new THREE.Euler(0, 0, 0)]),
        ]
      : []),
  ]);

  const kame = new THREE.AnimationClip('Kame', 2.2, [
    track(lArm, [0, 0.7, 1.3, 1.7, 2.2], [
      new THREE.Euler(0, 0, 0),
      new THREE.Euler(-2.2, 0.15, 0.25),
      new THREE.Euler(-2.3, 0.1, 0.2),
      new THREE.Euler(-0.3, 0, 0.1),
      new THREE.Euler(0, 0, 0),
    ]),
    track(rArm, [0, 0.7, 1.3, 1.7, 2.2], [
      new THREE.Euler(0, 0, 0),
      new THREE.Euler(-2.2, -0.15, -0.25),
      new THREE.Euler(-2.3, -0.1, -0.2),
      new THREE.Euler(-0.3, 0, -0.1),
      new THREE.Euler(0, 0, 0),
    ]),
    ...(spine
      ? [
          track(spine, [0, 1.3, 1.7, 2.2], [
            new THREE.Euler(0, 0, 0),
            new THREE.Euler(0.25, 0, 0),
            new THREE.Euler(-0.1, 0, 0),
            new THREE.Euler(0, 0, 0),
          ]),
        ]
      : []),
  ]);

  return [warmup, punch, kame];
}

export function tintGokuForm(root: THREE.Object3D, form: 'base' | 'ssj' | 'ui') {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const hair = /hair|tex4/i.test(mesh.name);
    if (!hair) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((mat) => {
      const m = mat as THREE.MeshStandardMaterial;
      if (!('color' in m) || !m.color) return;
      if (form === 'ssj') {
        m.color.set('#FFD54F');
        if ('emissive' in m) {
          m.emissive.set('#FFC107');
          m.emissiveIntensity = 0.85;
        }
      } else if (form === 'ui') {
        m.color.set('#F5F5F5');
        if ('emissive' in m) {
          m.emissive.set('#ECEFF1');
          m.emissiveIntensity = 0.55;
        }
      } else {
        m.color.set('#1a120c');
        if ('emissive' in m) {
          m.emissive.set('#000000');
          m.emissiveIntensity = 0;
        }
      }
    });
  });
}
