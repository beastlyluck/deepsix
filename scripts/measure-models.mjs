globalThis.ProgressEvent = class ProgressEvent extends Event {
  constructor(type, init = {}) {
    super(type);
    this.lengthComputable = !!init?.lengthComputable;
    this.loaded = init?.loaded ?? 0;
    this.total = init?.total ?? 0;
  }
};

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SkeletonUtils } from 'three-stdlib';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const models = {
  goku: 'http://127.0.0.1:5174/models/_raw/goku/scene.gltf',
  vegeta: 'http://127.0.0.1:5174/models/vegeta.glb',
  zoro: 'http://127.0.0.1:5174/models/_raw/zoro/scene.gltf',
  itachi: 'http://127.0.0.1:5174/models/itachi.glb',
  optimus: 'http://127.0.0.1:5174/models/_raw/optimus/scene.gltf',
  spiderman: 'http://127.0.0.1:5174/models/spiderman.glb',
  krishna: 'http://127.0.0.1:5174/models/krishna.glb',
};

function meshWorldBox(mesh) {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  if (!mesh.geometry.boundingBox) return null;
  const box = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
  const size = new THREE.Vector3();
  box.getSize(size);
  return { name: mesh.name || mesh.type, h: size.y, w: size.x, d: size.z, skinned: !!mesh.isSkinnedMesh };
}

function measure(obj) {
  obj.updateMatrixWorld(true);
  const parts = [];
  obj.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const p = meshWorldBox(o);
    if (p && Number.isFinite(p.h)) parts.push(p);
  });
  parts.sort((a, b) => b.h - a.h);
  const world = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  world.getSize(size);
  return { worldH: size.y, worldMinY: world.min.y, worldMaxY: world.max.y, parts: parts.slice(0, 8), partCount: parts.length };
}

const loader = new GLTFLoader();
loader.setPath('');

for (const [id, url] of Object.entries(models)) {
  try {
    const gltf = await loader.loadAsync(url);
    const raw = gltf.scene;
    raw.updateMatrixWorld(true);
    const cloned = SkeletonUtils.clone(raw);
    cloned.updateMatrixWorld(true);
    const bones = [];
    cloned.traverse((o) => {
      if (o.isBone) bones.push(o.name);
    });
    const clips = (gltf.animations || []).map((a) => a.name);
    const rawM = measure(raw);
    const cloneM = measure(cloned);
    console.log('\n====', id, '====');
    console.log('clips', clips);
    console.log('bones', bones.slice(0, 20), 'count', bones.length);
    console.log('raw worldH', rawM.worldH.toFixed(4), 'minY', rawM.worldMinY.toFixed(4), 'maxY', rawM.worldMaxY.toFixed(4), 'meshes', rawM.partCount);
    console.log('clone worldH', cloneM.worldH.toFixed(4), 'minY', cloneM.worldMinY.toFixed(4), 'maxY', cloneM.worldMaxY.toFixed(4));
    console.log('top meshes', rawM.parts.map((p) => `${p.name}:${p.h.toFixed(3)}${p.skinned ? '*skin' : ''}`).join(' | '));
    const scales = [];
    raw.traverse((o) => {
      if (Math.abs(o.scale.x - 1) > 0.001) scales.push(`${o.name || o.type} scale=${o.scale.x.toFixed(4)}`);
    });
    console.log('non1 scales', scales.slice(0, 12));
  } catch (e) {
    console.log(id, 'LOAD FAIL', e.message);
  }
}
