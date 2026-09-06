// Perlin Noise Implementation
export class PerlinNoise {
  private perm: number[] = [];
  private permMod12: number[] = [];

  constructor(seed: number = Math.random() * 0xFFFFFFFF) {
    this.seed(seed);
  }

  seed(seed: number): void {
    const random = this.mulberry32(seed);
    const p = new Array(256).fill(0).map((_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    this.perm = [...p, ...p];
    this.permMod12 = this.perm.map(v => v % 12);
  }

  private mulberry32(a: number) {
    return () => {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  noise3D(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.perm[X] + Y;
    const AA = this.perm[A] + Z;
    const AB = this.perm[A + 1] + Z;
    const B = this.perm[X + 1] + Y;
    const BA = this.perm[B] + Z;
    const BB = this.perm[B + 1] + Z;

    return this.lerp(
      w,
      this.lerp(v, this.lerp(u, this.grad(this.permMod12[AA], x, y, z), this.grad(this.permMod12[BA], x - 1, y, z)),
        this.lerp(u, this.grad(this.permMod12[AB], x, y - 1, z), this.grad(this.permMod12[BB], x - 1, y - 1, z))),
      this.lerp(v, this.lerp(u, this.grad(this.permMod12[AA + 1], x, y, z - 1), this.grad(this.permMod12[BA + 1], x - 1, y, z - 1)),
        this.lerp(u, this.grad(this.permMod12[AB + 1], x, y - 1, z - 1), this.grad(this.permMod12[BB + 1], x - 1, y - 1, z - 1)))
    );
  }

  fbm(x: number, y: number, z: number, octaves: number = 6, persistence: number = 0.5, lacunarity: number = 2.0): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise3D(x * frequency, y * frequency, z * frequency);
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / maxValue;
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}

// Worley Noise (Cellular Noise)
export class WorleyNoise {
  private perm: number[] = [];

  constructor(seed: number = Math.random() * 0xFFFFFFFF) {
    this.seed(seed);
  }

  seed(seed: number): void {
    const random = this.mulberry32(seed);
    const p = new Array(256).fill(0).map((_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    this.perm = [...p, ...p];
  }

  private mulberry32(a: number) {
    return () => {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  noise3D(x: number, y: number, z: number): { f1: number; f2: number; id: number } {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);

    const xf = x - xi;
    const yf = y - yi;
    const zf = z - zi;

    let f1 = Infinity;
    let f2 = Infinity;
    let id = 0;

    for (let iz = -1; iz <= 1; iz++) {
      for (let iy = -1; iy <= 1; iy++) {
        for (let ix = -1; ix <= 1; ix++) {
          const h = this.hash(xi + ix, yi + iy, zi + iz);
          const px = h[0];
          const py = h[1];
          const pz = h[2];

          const dx = px - xf;
          const dy = py - yf;
          const dz = pz - zf;
          const d = dx * dx + dy * dy + dz * dz;

          if (d < f1) {
            f2 = f1;
            f1 = d;
            id = this.perm[(xi + ix + this.perm[(yi + iy + this.perm[zi + iz] & 255)] & 255)] & 255;
          } else if (d < f2) {
            f2 = d;
          }
        }
      }
    }

    return { f1: Math.sqrt(f1), f2: Math.sqrt(f2), id };
  }

  private hash(x: number, y: number, z: number): [number, number, number] {
    const h = this.perm[x & 255] + y;
    const h2 = this.perm[h & 255] + z;
    const h3 = this.perm[h2 & 255];
    return [
      (this.perm[h3 & 255] & 255) / 255,
      (this.perm[(h3 + 1) & 255] & 255) / 255,
      (this.perm[(h3 + 2) & 255] & 255) / 255,
    ];
  }
}

// Voronoi Noise
export function voronoiNoise(x: number, y: number, z: number, seed: number = 0): number {
  const worley = new WorleyNoise(seed);
  const { f1, f2 } = worley.noise3D(x, y, z);
  return f2 - f1;
}

// Utility functions
export function hash11(x: number): number {
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x * 0.0000001) % 1;
}

export function hash22(x: number, y: number): [number, number] {
  const k = new THREE.Vector2(x, y);
  const dot1 = k.dot(new THREE.Vector2(127.1, 311.7));
  const dot2 = k.dot(new THREE.Vector2(269.5, 183.3));
  return [
    fract(Math.sin(dot1) * 43758.5453),
    fract(Math.sin(dot2) * 43758.5453),
  ];
}

export function hash33(x: number, y: number, z: number): [number, number, number] {
  const k = new THREE.Vector3(x, y, z);
  const dot1 = k.dot(new THREE.Vector3(127.1, 311.7, 74.7));
  const dot2 = k.dot(new THREE.Vector3(269.5, 183.3, 246.1));
  const dot3 = k.dot(new THREE.Vector3(113.5, 271.9, 124.6));
  return [
    fract(Math.sin(dot1) * 43758.5453),
    fract(Math.sin(dot2) * 43758.5453),
    fract(Math.sin(dot3) * 43758.5453),
  ];
}

function fract(x: number): number {
  return x - Math.floor(x);
}

import * as THREE from 'three';
