import * as THREE from 'three';
import type { GLTFLoader, GLTFLoaderPlugin, GLTFParser } from 'three-stdlib';

const NAME = 'KHR_materials_pbrSpecularGlossiness';

class SpecGlossPlugin implements GLTFLoaderPlugin {
  name = NAME;

  constructor(private parser: GLTFParser) {}

  getMaterialType(materialIndex: number) {
    const def = this.parser.json.materials?.[materialIndex];
    if (!def?.extensions?.[NAME]) return null;
    return THREE.MeshStandardMaterial;
  }

  extendMaterialParams(materialIndex: number, materialParams: Record<string, unknown>) {
    const ext = this.parser.json.materials?.[materialIndex]?.extensions?.[NAME] as
      | { diffuseFactor?: number[]; diffuseTexture?: { index: number } }
      | undefined;
    if (!ext) return Promise.resolve();

    const pending: Promise<unknown>[] = [];
    materialParams.color = new THREE.Color(1, 1, 1);
    materialParams.opacity = ext.diffuseFactor?.[3] ?? 1;
    materialParams.metalness = 0.16;
    materialParams.roughness = 0.5;
    materialParams.envMapIntensity = 0.35;
    materialParams.emissive = new THREE.Color(0, 0, 0);
    materialParams.emissiveIntensity = 0.08;

    if (ext.diffuseTexture) {
      pending.push(
        (this.parser.assignTexture as (p: object, n: string, d: object, c?: unknown) => Promise<void>)(
          materialParams,
          'map',
          ext.diffuseTexture,
          THREE.SRGBColorSpace
        )
      );
    }

    return Promise.all(pending);
  }
}

export function registerSpecGloss(loader: GLTFLoader) {
  loader.register((parser) => new SpecGlossPlugin(parser));
}

function dress(m: THREE.MeshStandardMaterial, tex: THREE.Texture) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  tex.needsUpdate = true;
  m.map = tex;
  m.color.set('#ffffff');
  if (m.emissive) m.emissive.set('#000000');
  m.emissiveIntensity = m.emissiveMap ? 0.22 : 0.03;
  m.metalness = 0.16;
  m.roughness = 0.5;
  m.envMapIntensity = 0.3;
  m.needsUpdate = true;
}

/** Bind spec-gloss albedo maps after parse is finished. */
export async function paintSpecGlossMaps(parser: GLTFParser, root: THREE.Object3D) {
  const defs = (parser.json.materials ?? []) as {
    name?: string;
    extensions?: Record<string, { diffuseTexture?: { index: number } }>;
  }[];

  const texByName = new Map<string, THREE.Texture>();
  await Promise.all(
    defs.map(async (def) => {
      const idx = def.extensions?.[NAME]?.diffuseTexture?.index;
      if (idx === undefined || !def.name) return;
      const tex = (await parser.getDependency('texture', idx)) as THREE.Texture | null;
      if (tex) texByName.set(def.name, tex);
    })
  );

  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((mat) => {
      const m = mat as THREE.MeshStandardMaterial;
      const tex = (m.name && texByName.get(m.name)) || (mesh.name && texByName.get(mesh.name));
      if (tex) dress(m, tex);
    });
  });
}
