globalThis.self = globalThis;
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

const gltf = await new GLTFLoader().loadAsync('http://127.0.0.1:5174/models/new/itachi.glb');
gltf.scene.updateMatrixWorld(true);
gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
  const box = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
  const s = new THREE.Vector3();
  box.getSize(s);
  console.log(o.name, o.type, 'skinned', !!o.isSkinnedMesh, 'h', s.y.toFixed(3), 'w', s.x.toFixed(3));
});
