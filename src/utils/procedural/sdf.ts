// Signed Distance Functions for procedural geometry in shaders
// These are GLSL/WGSL compatible functions

export const sdfFunctions = `
// 3D Primitives
float sdSphere(vec3 p, float r) { return length(p) - r; }
float sdBox(vec3 p, vec3 b) { vec3 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0); }
float sdCylinder(vec3 p, vec2 h) { vec2 d = vec2(length(p.xz) - h.x, abs(p.y) - h.y); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }
float sdCone(vec3 p, vec2 c) { float q = length(p.xz); return max(c.x * q + c.y * p.y, -p.y - c.y); }
float sdPlane(vec3 p, vec3 n, float h) { return dot(p, n) + h; }
float sdTorus(vec3 p, vec2 t) { vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }

// Operations
float opUnion(float d1, float d2) { return min(d1, d2); }
float opSubtraction(float d1, float d2) { return max(-d1, d2); }
float opIntersection(float d1, float d2) { return max(d1, d2); }
float opSmoothUnion(float d1, float d2, float k) { float h = max(k - abs(d1 - d2), 0.0); return min(d1, d2) - h * h * h / (6.0 * k * k); }
float opSmoothSubtraction(float d1, float d2, float k) { float h = max(k - abs(d1 + d2), 0.0); return max(d1, -d2) + h * h * h / (6.0 * k * k); }
float opSmoothIntersection(float d1, float d2, float k) { float h = max(k - abs(d1 - d2), 0.0); return max(d1, d2) + h * h * h / (6.0 * k * k); }

// Transformations
float sdTransform(vec3 p, mat4 m, float (*primitive)(vec3)) { return primitive((inverse(m) * vec4(p, 1.0)).xyz); }
vec3 repeat(vec3 p, vec3 c) { return mod(p, c) - 0.5 * c; }
vec3 repeatAngular(vec3 p, float n) { float a = atan(p.x, p.z) * n; return vec3(length(p.xz), p.y, a); }

// Deformations
float sdTwist(vec3 p, float k) { float c = cos(k * p.y); float s = sin(k * p.y); mat2 m = mat2(c, -s, s, c); p.xz *= m; return sdBox(p, vec3(1.0)); }
float sdBend(vec3 p, float k) { float c = cos(k * p.x); float s = sin(k * p.x); mat2 m = mat2(c, -s, s, c); p.zy *= m; return sdBox(p, vec3(1.0)); }

// Character-specific SDFs
float sdKatana(vec3 p) {
  vec3 blade = vec3(0.015, 1.75, 0.003);
  float d = sdBox(p, blade);
  // Tip
  d = opUnion(d, sdCone(p - vec3(0.0, 1.75, 0.0), vec2(0.015, 0.05)));
  // Fuller
  d = opSubtraction(d, sdBox(p - vec3(0.0, -0.5, 0.0), vec3(0.008, 0.6, 0.002)));
  return d;
}

float sdSharingan(vec3 p, float tomoeRotation) {
  // Central pupil
  float d = sdSphere(p, 0.15);
  // Tomoe (comma shapes)
  for (int i = 0; i < 3; i++) {
    float angle = tomoeRotation + float(i) * 2.094; // 120 degrees
    float c = cos(angle);
    float s = sin(angle);
    vec3 tp = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
    tp -= vec3(0.25, 0.0, 0.0);
    float tomoe = sdSphere(tp, 0.08);
    tomoe = opUnion(tomoe, sdSphere(tp - vec3(0.15, 0.0, 0.0), 0.04));
    d = opSmoothUnion(d, tomoe, 0.05);
  }
  return d;
}

float sdOptimusChest(vec3 p) {
  // Simplified chest plate
  float d = sdBox(p, vec3(0.4, 0.3, 0.15));
  // Window
  d = opSubtraction(d, sdBox(p - vec3(0.0, 0.0, 0.1), vec3(0.15, 0.15, 0.05)));
  return d;
}

float sdWebStrand(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a;
  vec3 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

// Normal calculation
vec3 calcNormal(vec3 p, float (*scene)(vec3)) {
  const float eps = 0.001;
  vec2 h = vec2(eps, 0);
  return normalize(vec3(
    scene(p + h.xyy) - scene(p - h.xyy),
    scene(p + h.yxy) - scene(p - h.yxy),
    scene(p + h.yyx) - scene(p - h.yyx)
  ));
}

// Ray marching
float rayMarch(vec3 ro, vec3 rd, float (*scene)(vec3), float maxDist, int maxSteps) {
  float t = 0.0;
  for (int i = 0; i < maxSteps; i++) {
    vec3 p = ro + rd * t;
    float d = scene(p);
    if (d < 0.001) return t;
    t += d;
    if (t > maxDist) break;
  }
  return maxDist;
}
`;

// TypeScript versions for CPU-side calculations
export function sdSphere(p: THREE.Vector3, r: number): number {
  return p.length() - r;
}

export function sdBox(p: THREE.Vector3, b: THREE.Vector3): number {
  const d = new THREE.Vector3().copy(p).applyMatrix4(new THREE.Matrix4().makeScale(1, 1, 1)).sub(b);
  const absD = new THREE.Vector3(Math.abs(d.x), Math.abs(d.y), Math.abs(d.z));
  const maxD = new THREE.Vector3(Math.max(absD.x, 0), Math.max(absD.y, 0), Math.max(absD.z, 0));
  return maxD.length() + Math.min(Math.max(absD.x, Math.max(absD.y, absD.z)), 0);
}

export function sdCylinder(p: THREE.Vector3, h: THREE.Vector2): number {
  const d = new THREE.Vector2(new THREE.Vector2(p.x, p.z).length() - h.x, Math.abs(p.y) - h.y);
  return Math.min(Math.max(d.x, d.y), 0) + new THREE.Vector2(Math.max(d.x, 0), Math.max(d.y, 0)).length();
}

export function opSmoothUnion(d1: number, d2: number, k: number): number {
  const h = Math.max(k - Math.abs(d1 - d2), 0);
  return Math.min(d1, d2) - h * h * h / (6 * k * k);
}

export function opSmoothSubtraction(d1: number, d2: number, k: number): number {
  const h = Math.max(k - Math.abs(d1 + d2), 0);
  return Math.max(d1, -d2) + h * h * h / (6 * k * k);
}

import * as THREE from 'three';
