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
  goku: 'http://127.0.0.1:5174/models/_raw/goku/scene.gltf',
  vegeta: 'http://127.0.0.1:5174/models/vegeta.glb',
  spider: 'http://127.0.0.1:5174/models/spiderman.glb',
};

for (const [id, url] of Object.entries(urls)) {
  const gltf = await loader.loadAsync(url);
  const bones = [];
  gltf.scene.traverse((o) => {
    if (o.isBone) bones.push(o.name);
  });
  console.log('\n====', id, '====');
  console.log('clips', gltf.animations.map((a) => `${a.name} ${a.duration.toFixed(2)}s tracks=${a.tracks.length}`));
  console.log('bones', bones.join(', '));
  if (id === 'goku' && gltf.animations[0]) {
    console.log('idle tracks', gltf.animations[0].tracks.map((t) => t.name).slice(0, 40));
  }
  if (id === 'spider') {
    gltf.animations.forEach((a) => console.log(' spider track sample', a.name, a.tracks.slice(0, 6).map((t) => t.name)));
  }
}
