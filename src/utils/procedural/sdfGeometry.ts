import * as THREE from 'three';

export interface SDFPrimitive {
  type: 'sphere' | 'box' | 'cylinder' | 'cone' | 'torus' | 'plane' | 'octahedron';
  params: Record<string, number | undefined>;
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  operation?: 'union' | 'subtraction' | 'intersection' | 'smoothUnion' | 'smoothSubtraction';
  smoothness?: number;
}

export interface SDFMaterial {
  color: THREE.Color;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
  transparent?: boolean;
  opacity?: number;
  wireframe?: boolean;
}

export interface SDFGeometryOptions {
  resolution?: number;
  bounds?: THREE.Box3;
  material?: SDFMaterial;
}

// Helper: component-wise absolute value for Vector3
function absVec3(v: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z));
}

// Helper: manual lerp for Vector3
function lerpVec3(a: THREE.Vector3, b: THREE.Vector3, t: number): THREE.Vector3 {
  return new THREE.Vector3(
    a.x + (b.x - a.x) * t,
    a.y + (b.y - a.y) * t,
    a.z + (b.z - a.z) * t
  );
}

// Helper: manual lerp for Euler
function lerpEuler(a: THREE.Euler, b: THREE.Euler, t: number): THREE.Euler {
  return new THREE.Euler(
    a.x + (b.x - a.x) * t,
    a.y + (b.y - a.y) * t,
    a.z + (a.z - a.z) * t,
    a.order
  );
}

function sdfSphere(p: THREE.Vector3, r: number): number {
  return p.length() - r;
}

function sdfBox(p: THREE.Vector3, b: THREE.Vector3): number {
  const d = absVec3(p.clone()).sub(b);
  const maxD = new THREE.Vector3(Math.max(d.x, 0), Math.max(d.y, 0), Math.max(d.z, 0));
  return Math.min(Math.max(d.x, Math.max(d.y, d.z)), 0) + maxD.length();
}

function sdfCylinder(p: THREE.Vector3, h: THREE.Vector2): number {
  const d = new THREE.Vector2(new THREE.Vector2(p.x, p.z).length() - h.x, Math.abs(p.y) - h.y);
  return Math.min(Math.max(d.x, d.y), 0) + new THREE.Vector2(Math.max(d.x, 0), Math.max(d.y, 0)).length();
}

function sdfCone(p: THREE.Vector3, c: THREE.Vector2): number {
  const q = new THREE.Vector2(new THREE.Vector2(p.x, p.z).length(), p.y);
  return Math.max(c.x * q.x + c.y * q.y, -q.y - c.y);
}

function sdfTorus(p: THREE.Vector3, t: THREE.Vector2): number {
  const q = new THREE.Vector2(new THREE.Vector2(p.x, p.z).length() - t.x, p.y);
  return q.length() - t.y;
}

function sdfPlane(p: THREE.Vector3, n: THREE.Vector3, h: number): number {
  return p.dot(n) + h;
}

function sdfOctahedron(p: THREE.Vector3, r: number): number {
  // Octahedron SDF: max(|x|, |y|, |z|) + |x| + |y| + |z| - r * sqrt(3)
  const ax = Math.abs(p.x), ay = Math.abs(p.y), az = Math.abs(p.z);
  return Math.max(ax, ay, az) + ax + ay + az - r * Math.sqrt(3);
}

function opUnion(d1: number, d2: number): number {
  return Math.min(d1, d2);
}

function opSubtraction(d1: number, d2: number): number {
  return Math.max(-d1, d2);
}

function opIntersection(d1: number, d2: number): number {
  return Math.max(d1, d2);
}

function opSmoothUnion(d1: number, d2: number, k: number): number {
  const h = Math.max(k - Math.abs(d1 - d2), 0);
  return Math.min(d1, d2) - h * h * h / (6 * k * k);
}

function opSmoothSubtraction(d1: number, d2: number, k: number): number {
  const h = Math.max(k - Math.abs(d1 + d2), 0);
  return Math.max(d1, -d2) + h * h * h / (6 * k * k);
}

function opSmoothIntersection(d1: number, d2: number, k: number): number {
  const h = Math.max(k - Math.abs(d1 - d2), 0);
  return Math.max(d1, d2) + h * h * h / (6 * k * k);
}

function rotateX(p: THREE.Vector3, angle: number): THREE.Vector3 {
  const c = Math.cos(angle), s = Math.sin(angle);
  return new THREE.Vector3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

function rotateY(p: THREE.Vector3, angle: number): THREE.Vector3 {
  const c = Math.cos(angle), s = Math.sin(angle);
  return new THREE.Vector3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

function rotateZ(p: THREE.Vector3, angle: number): THREE.Vector3 {
  const c = Math.cos(angle), s = Math.sin(angle);
  return new THREE.Vector3(c * p.x - s * p.y, s * p.x + c * p.y, p.z);
}

export function evaluateSDF(primitives: SDFPrimitive[], point: THREE.Vector3): { distance: number; materialIndex: number } {
  let minDist = Infinity;
  let minIndex = -1;

  primitives.forEach((prim, index) => {
    let p = point.clone();
    if (prim.position) p.sub(prim.position);
    if (prim.rotation) {
      p = rotateZ(rotateY(rotateX(p, prim.rotation.x), prim.rotation.y), prim.rotation.z);
    }

    let d = Infinity;
    switch (prim.type) {
      case 'sphere':
        d = sdfSphere(p, prim.params.r ?? 1);
        break;
      case 'box':
        d = sdfBox(p, new THREE.Vector3(prim.params.x ?? 1, prim.params.y ?? 1, prim.params.z ?? 1));
        break;
      case 'cylinder':
        d = sdfCylinder(p, new THREE.Vector2(prim.params.r ?? 1, prim.params.h ?? 1));
        break;
      case 'cone':
        d = sdfCone(p, new THREE.Vector2(prim.params.r ?? 1, prim.params.h ?? 1));
        break;
      case 'torus':
        d = sdfTorus(p, new THREE.Vector2(prim.params.r ?? 1, prim.params.t ?? 1));
        break;
      case 'plane':
        d = sdfPlane(p, new THREE.Vector3(prim.params.nx ?? 0, prim.params.ny ?? 0, prim.params.nz ?? 0), prim.params.h ?? 0);
        break;
      case 'octahedron':
        d = sdfOctahedron(p, prim.params.r ?? 1);
        break;
    }

    if (prim.operation === 'union') {
      minDist = Math.min(minDist, d);
    } else if (prim.operation === 'subtraction') {
      minDist = Math.max(-minDist, d);
    } else if (prim.operation === 'intersection') {
      minDist = Math.max(minDist, d);
    } else if (prim.operation === 'smoothUnion') {
      minDist = opSmoothUnion(minDist, d, prim.smoothness || 0.1);
    } else if (prim.operation === 'smoothSubtraction') {
      minDist = opSmoothSubtraction(minDist, d, prim.smoothness || 0.1);
    } else {
      if (index === 0) minDist = d;
      else minDist = Math.min(minDist, d);
    }

    if (d < minDist) minIndex = index;
  });

  return { distance: minDist, materialIndex: minIndex };
}

export function generateSDFMesh(
  primitives: SDFPrimitive[],
  materials: SDFMaterial[],
  options: SDFGeometryOptions = {}
): THREE.Mesh {
  const { resolution = 64, bounds = new THREE.Box3(new THREE.Vector3(-5, -5, -5), new THREE.Vector3(5, 5, 5)) } = options;

  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const materialIndices: number[] = [];

  const size = bounds.max.clone().sub(bounds.min);
  const step = size.x / resolution;

  const vertices = new Map<string, number>();
  const getVertexIndex = (x: number, y: number, z: number) => {
    const key = `${x},${y},${z}`;
    let idx = vertices.get(key);
    if (idx === undefined) {
      idx = vertices.size;
      vertices.set(key, idx);
      positions.push(x, y, z);
    }
    return idx;
  };

  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      for (let k = 0; k <= resolution; k++) {
        const x = bounds.min.x + i * step;
        const y = bounds.min.y + j * step;
        const z = bounds.min.z + k * step;

        const { distance, materialIndex } = evaluateSDF(primitives, new THREE.Vector3(x, y, z));

        if (Math.abs(distance) < step * 1.5) {
          getVertexIndex(x, y, z);
          materialIndices.push(materialIndex);
        }
      }
    }
  }

  const vertexArray = Array.from(vertices.keys()).map(key => key.split(',').map(Number));
  const posAttr = new Float32Array(positions);
  const matAttr = new Float32Array(materialIndices);

  geometry.setAttribute('position', new THREE.BufferAttribute(posAttr, 3));
  geometry.setAttribute('materialIndex', new THREE.BufferAttribute(matAttr, 1));

  geometry.computeVertexNormals();
  geometry.computeBoundingBox();

  const meshMaterials = materials.map(m => new THREE.MeshStandardMaterial({
    color: m.color,
    emissive: m.emissive || new THREE.Color(0x000000),
    emissiveIntensity: m.emissiveIntensity || 0,
    metalness: m.metalness || 0.5,
    roughness: m.roughness || 0.5,
    transparent: m.transparent || false,
    opacity: m.opacity || 1,
    wireframe: m.wireframe || false,
  }));

  return new THREE.Mesh(geometry, meshMaterials.length === 1 ? meshMaterials[0] : meshMaterials);
}

interface CharacterSDFMap {
  [key: string]: {
    [variant: string]: (params?: any) => SDFPrimitive[];
  };
}

export const CharacterSDFs: Record<string, Record<string, (params?: any) => SDFPrimitive[]>> = {
  zoro: {
    katana: (length = 3.5, width = 0.03) => [
      { type: 'box' as const, params: { x: width / 2, y: length / 2, z: 0.003 }, operation: 'union' as const },
      { type: 'cone' as const, params: { r: width / 2 * 0.3, h: 0.1 }, position: new THREE.Vector3(0, length / 2 - 0.05, 0), operation: 'union' as const },
      { type: 'box' as const, params: { x: width * 2, y: 0.004, z: width * 1.5 }, position: new THREE.Vector3(0, -length * 0.02, 0), operation: 'union' as const },
      { type: 'cylinder' as const, params: { r: width * 1.2, h: length * 0.25 }, position: new THREE.Vector3(0, -length * 0.35, 0), operation: 'union' as const },
      { type: 'sphere' as const, params: { r: width * 1.5 }, position: new THREE.Vector3(0, -length * 0.48, 0), operation: 'union' as const },
    ],
    asura: (count = 9) => {
      const blades: SDFPrimitive[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        blades.push({
          type: 'box',
          params: { x: 0.015, y: 1.75, z: 0.003 },
          position: new THREE.Vector3(Math.cos(angle) * 0.5, 1, Math.sin(angle) * 0.5),
          rotation: new THREE.Euler(0, angle, Math.PI / 6),
          operation: 'union',
        });
      }
      return blades;
    },
  },

  goku: {
    aura: (formLevel = 0) => {
      const layers = [
        { radius: 2.5, intensity: 0.8, color: '#FFB300' },
        { radius: 3.0, intensity: 0.5, color: '#FFD700' },
        { radius: 3.5, intensity: 0.3, color: '#FFF176' },
      ];
      return layers.map((l, i) => ({
        type: 'sphere' as const,
        params: { r: l.radius },
        operation: i === 0 ? 'union' : 'smoothUnion' as const,
        smoothness: 0.3,
      }));
    },
    hair: (formLevel = 0) => {
      const styles = [
        { count: 50, length: 0.4, spiky: false },
        { count: 100, length: 0.6, spiky: true },
        { count: 150, length: 1.2, spiky: true },
        { count: 200, length: 2.5, spiky: true },
      ];
      const style = styles[Math.min(formLevel, 3)];
      const strands: SDFPrimitive[] = [];
      for (let i = 0; i < style.count; i++) {
        const angle = (i / style.count) * Math.PI * 2;
        const r = 0.3 + Math.random() * 0.2;
        strands.push({
          type: 'cone',
          params: { r: 0.02, h: style.length },
          position: new THREE.Vector3(Math.cos(angle) * r, 1.3 + Math.random() * 0.3, Math.sin(angle) * r),
          rotation: new THREE.Euler(-Math.PI / 2 + (Math.random() - 0.5) * 0.3, angle, 0),
          operation: 'union',
        });
      }
      return strands;
    },
  },

  itachi: {
    sharingan: (stage = 0) => {
      const primitives: SDFPrimitive[] = [
        { type: 'sphere', params: { r: 0.15 }, operation: 'union' },
      ];

      if (stage < 3) {
        for (let i = 0; i <= stage; i++) {
          const angle = i * 2.094;
          primitives.push(
            { type: 'torus', params: { r: 0.25, t: 0.08 }, rotation: new THREE.Euler(0, 0, angle), operation: 'union' },
            { type: 'sphere', params: { r: 0.04 }, position: new THREE.Vector3(Math.cos(angle) * 0.25, 0, Math.sin(angle) * 0.25), operation: 'union' }
          );
        }
      } else if (stage === 3) {
        for (let i = 0; i < 6; i++) {
          const angle = i * 1.047;
          primitives.push({
            type: 'box', params: { x: 0.02, y: 0.25, z: 0.01 },
            rotation: new THREE.Euler(0, 0, angle),
            operation: 'union',
          });
        }
      } else if (stage >= 4) {
        for (let i = 0; i < 8; i++) {
          primitives.push({
            type: 'torus', params: { r: 0.2 + i * 0.03, t: 0.02 },
            operation: 'union',
          });
        }
      }
      return primitives;
    },
    susanoo: () => {
      const primitives: SDFPrimitive[] = [];
      primitives.push({ type: 'octahedron', params: { r: 1 }, operation: 'union' });
      primitives.push({ type: 'octahedron', params: { r: 1.5 }, operation: 'union' });
      primitives.push({ type: 'octahedron', params: { r: 2.5 }, operation: 'union' });
      primitives.push({ type: 'octahedron', params: { r: 4 }, operation: 'union' });
      return primitives;
    },
    amaterasu: () => {
      const flames: SDFPrimitive[] = [];
      for (let i = 0; i < 50; i++) {
        flames.push({
          type: 'cone',
          params: { r: 0.05 + Math.random() * 0.1, h: 0.5 + Math.random() * 1 },
          position: new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3),
          rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
          operation: 'union',
        });
      }
      return flames;
    },
  },

  optimus: {
    truck: () => [
      { type: 'box', params: { x: 1.5, y: 0.8, z: 3 }, operation: 'union' },
      { type: 'box', params: { x: 1.2, y: 1.2, z: 1.5 }, position: new THREE.Vector3(0, 1.4, -1), operation: 'union' },
      { type: 'cylinder', params: { r: 0.3, h: 0.5 }, position: new THREE.Vector3(-1.2, 0.4, 1.5), rotation: new THREE.Euler(Math.PI / 2, 0, 0), operation: 'union' },
      { type: 'cylinder', params: { r: 0.3, h: 0.5 }, position: new THREE.Vector3(1.2, 0.4, 1.5), rotation: new THREE.Euler(Math.PI / 2, 0, 0), operation: 'union' },
      { type: 'cylinder', params: { r: 0.3, h: 0.5 }, position: new THREE.Vector3(-1.2, 0.4, -1.5), rotation: new THREE.Euler(Math.PI / 2, 0, 0), operation: 'union' },
      { type: 'cylinder', params: { r: 0.3, h: 0.5 }, position: new THREE.Vector3(1.2, 0.4, -1.5), rotation: new THREE.Euler(Math.PI / 2, 0, 0), operation: 'union' },
    ],
    robot: () => [
      { type: 'box', params: { x: 1.5, y: 2, z: 0.8 }, position: new THREE.Vector3(0, 1.2, 0), operation: 'union' },
      { type: 'sphere', params: { r: 0.5 }, position: new THREE.Vector3(0, 2.5, 0), operation: 'union' },
      { type: 'box', params: { x: 0.3, y: 1.2, z: 0.4 }, position: new THREE.Vector3(-0.7, 1.8, 0), operation: 'union' },
      { type: 'box', params: { x: 0.3, y: 1.2, z: 0.4 }, position: new THREE.Vector3(0.7, 1.8, 0), operation: 'union' },
      { type: 'box', params: { x: 0.3, y: 1.2, z: 0.4 }, position: new THREE.Vector3(-0.7, 0.2, 0), operation: 'union' },
      { type: 'box', params: { x: 0.3, y: 1.2, z: 0.4 }, position: new THREE.Vector3(0.7, 0.2, 0), operation: 'union' },
      { type: 'cylinder', params: { r: 0.2, h: 0.4 }, position: new THREE.Vector3(-0.7, 0.2, 1.2), rotation: new THREE.Euler(Math.PI / 2, 0, 0), operation: 'union' },
      { type: 'cylinder', params: { r: 0.2, h: 0.4 }, position: new THREE.Vector3(0.7, 0.2, 1.2), rotation: new THREE.Euler(Math.PI / 2, 0, 0), operation: 'union' },
      { type: 'cylinder', params: { r: 0.2, h: 0.4 }, position: new THREE.Vector3(-0.7, 0.2, -1.2), rotation: new THREE.Euler(Math.PI / 2, 0, 0), operation: 'union' },
      { type: 'cylinder', params: { r: 0.2, h: 0.4 }, position: new THREE.Vector3(0.7, 0.2, -1.2), rotation: new THREE.Euler(Math.PI / 2, 0, 0), operation: 'union' },
      { type: 'box', params: { x: 0.8, y: 0.3, z: 0.8 }, position: new THREE.Vector3(0, 2.5, 0.6), operation: 'union' },
    ],
    transform: (progress: number) => {
      const truck = CharacterSDFs.optimus.truck();
      const robot = CharacterSDFs.optimus.robot();
      return truck.map((t, i) => ({
        ...t,
        position: lerpVec3(t.position || new THREE.Vector3(), robot[i]?.position || new THREE.Vector3(), progress),
        rotation: lerpEuler(t.rotation || new THREE.Euler(), robot[i]?.rotation || new THREE.Euler(), progress),
      }));
    },
  },

  vegeta: {
    gravityField: (intensity = 1) => {
      const rings: SDFPrimitive[] = [];
      for (let i = 0; i < 5; i++) {
        rings.push({
          type: 'torus',
          params: { r: 2 + i * 0.5, t: 0.05 * intensity },
          operation: i === 0 ? 'union' : 'smoothUnion',
          smoothness: 0.2,
        });
      }
      return rings;
    },
    armor: () => [
      { type: 'box', params: { x: 1.2, y: 1.8, z: 0.6 }, position: new THREE.Vector3(0, 1, 0), operation: 'union' },
      { type: 'sphere', params: { r: 0.5 }, position: new THREE.Vector3(0, 2.3, 0), operation: 'union' },
      { type: 'box', params: { x: 0.3, y: 1.2, z: 0.3 }, position: new THREE.Vector3(-0.8, 1.5, 0), operation: 'union' },
      { type: 'box', params: { x: 0.3, y: 1.2, z: 0.3 }, position: new THREE.Vector3(0.8, 1.5, 0), operation: 'union' },
      { type: 'box', params: { x: 0.3, y: 1.2, z: 0.3 }, position: new THREE.Vector3(-0.8, 0.3, 0), operation: 'union' },
      { type: 'box', params: { x: 0.3, y: 1.2, z: 0.3 }, position: new THREE.Vector3(0.8, 0.3, 0), operation: 'union' },
    ],
    ultraEgo: () => {
      const primitives: SDFPrimitive[] = [];
      primitives.push({ type: 'sphere', params: { r: 1.5 }, operation: 'union' });
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        primitives.push({
          type: 'cone',
          params: { r: 0.1, h: 0.5 },
          position: new THREE.Vector3(Math.cos(angle) * 1.5, (Math.random() - 0.5) * 2, Math.sin(angle) * 1.5),
          rotation: new THREE.Euler(0, angle, 0),
          operation: 'union',
        });
      }
      return primitives;
    },
  },

  spiderman: {
    web: (params: { anchorA: THREE.Vector3; anchorB: THREE.Vector3; segments?: number }) => {
      const { anchorA, anchorB, segments = 20 } = params;
      const strands: SDFPrimitive[] = [];
      const mid = new THREE.Vector3().addVectors(anchorA, anchorB).multiplyScalar(0.5);
      mid.y -= anchorA.distanceTo(anchorB) * 0.15;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const invT = 1 - t;
        const x = invT * invT * anchorA.x + 2 * invT * t * mid.x + t * t * anchorB.x;
        const y = invT * invT * anchorA.y + 2 * invT * t * mid.y + t * t * anchorB.y;
        const z = invT * invT * anchorA.z + 2 * invT * t * mid.z + t * t * anchorB.z;

        if (i < segments) {
          const nextT = (i + 1) / segments;
          const nextInvT = 1 - nextT;
          const nx = nextInvT * nextInvT * anchorA.x + 2 * nextInvT * nextT * mid.x + nextT * nextT * anchorB.x;
          const ny = nextInvT * nextInvT * anchorA.y + 2 * nextInvT * nextT * mid.y + nextT * nextT * anchorB.y;
          const nz = nextInvT * nextInvT * anchorA.z + 2 * nextInvT * nextT * mid.z + nextT * nextT * anchorB.z;

          const dir = new THREE.Vector3(nx - x, ny - y, nz - z);
          const len = dir.length();
          const center = new THREE.Vector3((x + nx) / 2, (y + ny) / 2, (z + nz) / 2);

          strands.push({
            type: 'cylinder',
            params: { r: 0.015, h: len },
            position: center,
            rotation: new THREE.Euler(
              Math.acos(dir.y / len),
              0,
              Math.atan2(dir.x, dir.z)
            ),
            operation: 'union',
          });
        }
      }
      return strands;
    },
    webNetwork: (params: { center: THREE.Vector3; radius?: number; strands?: number }) => {
      const { center, radius = 5, strands = 12 } = params;
      const webStrands: SDFPrimitive[] = [];
      for (let i = 0; i < strands; i++) {
        const angle = (i / strands) * Math.PI * 2;
        const end = new THREE.Vector3(
          center.x + Math.cos(angle) * radius,
          center.y + (Math.random() - 0.5) * 2,
          center.z + Math.sin(angle) * radius
        );
        webStrands.push(...CharacterSDFs.spiderman.web({ anchorA: center, anchorB: end, segments: 10 }));
      }
      return webStrands;
    },
    spideySense: (params: { radius?: number }) => {
      const { radius = 3 } = params;
      return [{
        type: 'sphere',
        params: { r: radius },
        operation: 'union',
      }];
    },
  },
};

export function createCharacterGeometry(character: keyof typeof CharacterSDFs, variant: string, params: any = {}) {
  const sdfLib = CharacterSDFs[character];
  if (!sdfLib || !sdfLib[variant]) return null;

  const primitives = sdfLib[variant](params);
  return generateSDFMesh(primitives, [
    { color: new THREE.Color(0x2E7D32), emissive: new THREE.Color(0x4CAF50), emissiveIntensity: 0.3, metalness: 0.8, roughness: 0.2 },
  ]);
}