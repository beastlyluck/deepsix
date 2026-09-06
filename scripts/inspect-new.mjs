globalThis.self = globalThis;
globalThis.ProgressEvent = class ProgressEvent extends Event {
  constructor(type, init = {}) {
    super(type);
    this.lengthComputable = !!init?.lengthComputable;
    this.loaded = init?.loaded ?? 0;
    this.total = init?.total ?? 0;
  }
};

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const urls = {
  itachi: 'http://127.0.0.1:5174/models/new/itachi.glb',
  goku: 'http://127.0.0.1:5174/models/new/goku.glb',
  vegeta: 'http://127.0.0.1:5174/models/new/vegeta.glb',
  vegetaAlt: 'http://127.0.0.1:5174/models/new/vegeta-alt.glb',
  zoro: 'http://127.0.0.1:5174/models/new/zoro.glb',
  zoroTs: 'http://127.0.0.1:5174/models/new/zoro-timeskip.glb',
  optimus: 'http://127.0.0.1:5174/models/new/optimus.glb',
  spider: 'http://127.0.0.1:5174/models/new/spiderman.glb',
};

for (const [id, url] of Object.entries(urls)) {
  try {
    const gltf = await loader.loadAsync(url);
    let bones = 0;
    let meshes = 0;
    gltf.scene.traverse((o) => {
      if (o.isBone) bones += 1;
      if (o.isMesh) meshes += 1;
    });
    console.log('\n====', id, '====');
    console.log('bones', bones, 'meshes', meshes);
    console.log(
      'clips',
      gltf.animations.map((a) => `${JSON.stringify(a.name)} ${a.duration.toFixed(2)}s n=${a.tracks.length}`).join(' | ') || '(none)'
    );
  } catch (e) {
    console.log('\n====', id, 'FAIL', e.message);
  }
}
