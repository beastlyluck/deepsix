// WGSL Shader Sources - Common utilities and character-specific shaders
// Each shader is a complete WGSL source that can be compiled independently

export const CommonWGSL = `
struct Uniforms {
  time: f32,
  resolution: vec2<f32>,
  cameraPos: vec3<f32>,
  cameraDir: vec3<f32>,
  characterParams: vec4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
}

@vertex
fn vs_main(
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
) -> VertexOutput {
  var output: VertexOutput;
  output.worldPos = position;
  output.normal = normal;
  output.uv = uv;
  output.position = vec4<f32>(position, 1.0);
  return output;
}

fn hash11(p: vec2<f32>) -> f32 {
  return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453);
}

fn hash13(p: vec3<f32>) -> f32 {
  return fract(sin(dot(p, vec3<f32>(127.1, 311.7, 74.7))) * 43758.5453);
}

fn noise3D(p: vec3<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(
      mix(hash13(i + vec3<f32>(0, 0, 0)), hash13(i + vec3<f32>(1, 0, 0)), u.x),
      mix(hash13(i + vec3<f32>(0, 1, 0)), hash13(i + vec3<f32>(1, 1, 0)), u.x),
      u.y
    ),
    mix(
      mix(hash13(i + vec3<f32>(0, 0, 1)), hash13(i + vec3<f32>(1, 0, 1)), u.x),
      mix(hash13(i + vec3<f32>(0, 1, 1)), hash13(i + vec3<f32>(1, 1, 1)), u.x),
      u.y
    ),
    u.z
  );
}

fn fbm(p: vec3<f32>, octaves: i32) -> f32 {
  var value = 0.0;
  var amplitude = 1.0;
  var frequency = 1.0;
  var maxValue = 0.0;
  for (var i = 0; i < octaves; i++) {
    value += amplitude * noise3D(p * frequency);
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value / maxValue;
}

fn rotateY(p: vec3<f32>, angle: f32) -> vec3<f32> {
  let c = cos(angle);
  let s = sin(angle);
  return vec3<f32>(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

fn rotateX(p: vec3<f32>, angle: f32) -> vec3<f32> {
  let c = cos(angle);
  let s = sin(angle);
  return vec3<f32>(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

fn sdSphere(p: vec3<f32>, r: f32) -> f32 {
  return length(p) - r;
}

fn sdBox(p: vec3<f32>, b: vec3<f32>) -> f32 {
  let d = abs(p) - b;
  return length(max(d, vec3<f32>(0.0))) + min(max(d.x, max(d.y, d.z)), 0.0);
}

fn sdCylinder(p: vec3<f32>, h: vec2<f32>) -> f32 {
  let d = vec2<f32>(length(p.xz) - h.x, abs(p.y) - h.y);
  return min(max(d.x, d.y), 0.0) + length(max(d, vec2<f32>(0.0)));
}

fn opSmoothUnion(d1: f32, d2: f32, k: f32) -> f32 {
  let h = max(k - abs(d1 - d2), 0.0);
  return min(d1, d2) - h * h * h / (6.0 * k * k);
}
`;

export const CharacterWGSLShaders = {
  gokuAura: `
${CommonWGSL}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) normal: vec3<f32>,
}

@vertex
fn vs_main(
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
) -> VertexOutput {
  var output: VertexOutput;
  output.worldPos = position;
  output.normal = normal;
  output.position = vec4<f32>(position, 1.0);
  return output;
}

fn gokuAuraScene(p: vec3<f32>) -> f32 {
  let time = uniforms.time;
  let formLevel = uniforms.characterParams.x;
  
  let baseDist = length(p) - 2.5;
  let noise = fbm(p * 2.0 + vec3<f32>(time * 0.5, time * 0.3, time * 0.7), 5);
  let noise2 = fbm(p * 4.0 - vec3<f32>(time * 0.3, time * 0.5, time * 0.2), 4);
  
  let pulse = sin(time * 3.0 + length(p) * 5.0) * 0.5 + 0.5;
  let kiWaves = sin(length(p) * 10.0 - time * 5.0) * 0.5 + 0.5;
  
  let auraIntensity = 1.0 - smoothstep(0.0, 3.0, length(p));
  let turbulence = noise * 0.5 + noise2 * 0.25;
  
  return baseDist - auraIntensity * (0.5 + turbulence + kiWaves * 0.3) * (1.0 + formLevel);
}

@fragment
fn fs_main(@location(0) worldPos: vec3<f32>, @location(1) normal: vec3<f32>) -> @location(0) vec4<f32> {
  let time = uniforms.time;
  let formLevel = uniforms.characterParams.x;
  
  let dist = gokuAuraScene(worldPos);
  let noise = fbm(worldPos * 2.0 + vec3<f32>(time * 0.5, time * 0.3, time * 0.7), 5);
  
  let auraIntensity = 1.0 - smoothstep(0.0, 3.0, length(worldPos));
  let turbulence = noise * 0.5 + noise2 * 0.25;
  
  let pulse = sin(time * 3.0 + length(worldPos) * 5.0) * 0.5 + 0.5;
  let kiWaves = sin(length(worldPos) * 10.0 - time * 5.0) * 0.5 + 0.5;
  
  let baseColor = vec3<f32>(1.0, 0.8, 0.2);
  if (formLevel >= 3.0) { baseColor = vec3<f32>(1.0, 0.4, 0.0); }
  if (formLevel >= 4.0) { baseColor = vec3<f32>(1.0, 0.2, 0.0); }
  if (formLevel >= 5.0) { baseColor = vec3<f32>(0.2, 0.6, 1.0); }
  if (formLevel >= 6.0) { baseColor = vec3<f32>(0.0, 0.3, 1.0); }
  if (formLevel >= 7.0) { baseColor = vec3<f32>(0.8, 0.0, 1.0); }
  if (formLevel >= 8.0) { baseColor = vec3<f32>(1.0, 1.0, 1.0); }
  
  let color = mix(baseColor, vec3<f32>(1.0), pulse * 0.3 + kiWaves * 0.2);
  color *= 1.0 + formLevel * 0.5;
  
  let alpha = auraIntensity * (0.3 + turbulence * 0.3 + pulse * 0.2) * (1.0 + formLevel * 0.2);
  
  return vec4<f32>(color, alpha);
}
`,

  itachiSharingan: `
${CommonWGSL}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) normal: vec3<f32>,
}

@vertex
fn vs_main(
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
) -> VertexOutput {
  var output: VertexOutput;
  output.worldPos = position;
  output.normal = normal;
  output.position = vec4<f32>(position, 1.0);
  return output;
}

fn sdCircle(p: vec2<f32>, r: f32) -> f32 {
  return length(p) - r;
}

fn sdTomoe(p: vec2<f32>, size: f32) -> f32 {
  let circle = sdCircle(p, size);
  let tail = sdCircle(p - vec2<f32>(size * 1.5, 0.0), size * 0.5);
  return min(circle, tail);
}

fn rotate2d(p: vec2<f32>, angle: f32) -> vec2<f32> {
  let c = cos(angle);
  let s = sin(angle);
  return vec2<f32>(c * p.x - s * p.y, s * p.x + c * p.y);
}

fn itachiScene(p: vec3<f32>) -> f32 {
  let time = uniforms.time;
  let stage = uniforms.characterParams.x;
  let tomoeRotation = uniforms.characterParams.y;
  
  let uv = p.xy;
  let dist = length(uv);
  
  let pupilDist = sdCircle(uv, 0.4);
  let pupil = 1.0 - smoothstep(0.02, 0.0, pupilDist);
  
  var tomoeMask = 0.0;
  let tomoeCount = select(3.0, 0.0, stage >= 3.0);
  if (stage < 3.0) { tomoeCount = stage + 1.0; }
  
  for (var i = 0; i < 3; i++) {
    let active = f32(i) < tomoeCount;
    if (active > 0.0) {
      let angle = tomoeRotation + f32(i) * 2.094395;
      let rotated = rotate2d(uv - vec2<f32>(0.3, 0.0), angle);
      let tomoeDist = sdTomoe(rotated, 0.12);
      let tomoeVal = 1.0 - smoothstep(0.02, 0.0, tomoeDist);
      tomoeMask = max(tomoeMask, tomoeVal * active);
    }
  }
  
  var mangekyouMask = 0.0;
  if (stage >= 3.0) {
    let angle = time * 0.5;
    for (var i = 0; i < 6; i++) {
      let a = angle + f32(i) * 1.047197;
      let rotated = rotate2d(uv, a);
      let blade = 1.0 - smoothstep(0.05, 0.0, abs(rotated.x) - 0.02 + abs(rotated.y) * 3.0);
      mangekyouMask = max(mangekyouMask, blade);
    }
  }
  
  var amaterasuMask = 0.0;
  if (stage >= 6.0) {
    let cursorUV = uniforms.characterParams.zw;
    let flameDist = length(uv - cursorUV);
    let flame = 1.0 - smoothstep(0.1, 0.0, flameDist - sin(time * 10.0 + flameDist * 20.0) * 0.02);
    amaterasuMask = max(amaterasuMask, flame);
  }
  
  var susanooMask = 0.0;
  if (stage >= 7.0) {
    let susanooDist = sdCircle(uv, 0.8 + sin(time * 2.0) * 0.1);
    susanooMask = 1.0 - smoothstep(0.05, 0.0, susanooDist);
  }
  
  let baseDist = sdCircle(uv, 0.5) - max(pupil, max(tomoeMask, max(mangekyouMask, max(amaterasuMask, susanooMask))));
  return baseDist;
}

@fragment
fn fs_main(@location(0) worldPos: vec3<f32>, @location(1) normal: vec3<f32>) -> @location(0) vec4<f32> {
  let time = uniforms.time;
  let stage = uniforms.characterParams.x;
  
  let uv = worldPos.xy;
  let dist = length(uv);
  
  let pupilDist = sdCircle(uv, 0.4);
  let pupil = 1.0 - smoothstep(0.02, 0.0, pupilDist);
  
  var tomoeMask = 0.0;
  let tomoeCount = select(3.0, 0.0, stage >= 3.0);
  if (stage < 3.0) { tomoeCount = stage + 1.0; }
  
  for (var i = 0; i < 3; i++) {
    let active = f32(i) < tomoeCount;
    if (active > 0.0) {
      let angle = tomoeRotation + f32(i) * 2.094395;
      let rotated = rotate2d(uv - vec2<f32>(0.3, 0.0), angle);
      let tomoeDist = sdTomoe(rotated, 0.12);
      let tomoeVal = 1.0 - smoothstep(0.02, 0.0, tomoeDist);
      tomoeMask = max(tomoeMask, tomoeVal * active);
    }
  }
  
  var mangekyouMask = 0.0;
  if (stage >= 3.0) {
    let angle = time * 0.5;
    for (var i = 0; i < 6; i++) {
      let a = angle + f32(i) * 1.047197;
      let rotated = rotate2d(uv, a);
      let blade = 1.0 - smoothstep(0.05, 0.0, abs(rotated.x) - 0.02 + abs(rotated.y) * 3.0);
      mangekyouMask = max(mangekyouMask, blade);
    }
  }
  
  var amaterasuMask = 0.0;
  if (stage >= 6.0) {
    let cursorUV = uniforms.characterParams.zw;
    let flameDist = length(uv - cursorUV);
    let flame = 1.0 - smoothstep(0.1, 0.0, flameDist - sin(time * 10.0 + flameDist * 20.0) * 0.02);
    amaterasuMask = max(amaterasuMask, flame);
  }
  
  var susanooMask = 0.0;
  if (stage >= 7.0) {
    let susanooDist = sdCircle(uv, 0.8 + sin(time * 2.0) * 0.1);
    susanooMask = 1.0 - smoothstep(0.05, 0.0, susanooDist);
  }
  
  let baseColor = vec3<f32>(0.8, 0.0, 0.0);
  let glowColor = vec3<f32>(1.0, 0.2, 0.2);
  
  var color = vec3<f32>(0.0);
  color += baseColor * pupil;
  color += glowColor * tomoeMask * 2.0;
  color += glowColor * mangekyouMask * 3.0;
  color += vec3<f32>(1.0, 0.4, 0.0) * amaterasuMask * 4.0;
  color += vec3<f32>(1.0, 0.8, 0.0) * susanooMask * 2.0;
  
  let genjutsuNoise = fbm(worldPos.xyz * 5.0 + vec3<f32>(time * 0.1, time * 0.05, 0.0), 4);
  color += vec3<f32>(0.5, 0.0, 0.0) * genjutsuNoise * 0.3 * step(3.0, stage);
  
  let alpha = max(pupil, max(tomoeMask, max(mangekyouMask, max(amaterasuMask, susanooMask))));
  alpha += genjutsuNoise * 0.1 * step(3.0, stage);
  
  return vec4<f32>(color, alpha);
}
`,

  vegetaGravity: `
${CommonWGSL}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) normal: vec3<f32>,
}

@vertex
fn vs_main(
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
) -> VertexOutput {
  var output: VertexOutput;
  output.worldPos = position;
  output.normal = normal;
  output.position = vec4<f32>(position, 1.0);
  return output;
}

fn vegetaGravityScene(p: vec3<f32>) -> f32 {
  let time = uniforms.time;
  let intensity = uniforms.characterParams.x;
  
  var dist = length(p) - 3.0;
  
  for (var i = 0; i < 5; i++) {
    let ringRadius = 2.0 + f32(i) * 0.5;
    let ringDist = abs(length(p.xz) - ringRadius) - 0.05 * intensity;
    let heightDist = abs(p.y) - 1.5;
    let ring = max(ringDist, heightDist);
    dist = opSmoothUnion(dist, ring, 0.2);
  }
  
  let centerSphere = length(p) - 0.5;
  dist = opSmoothUnion(dist, centerSphere, 0.1);
  
  return dist;
}

@fragment
fn fs_main(@location(0) worldPos: vec3<f32>, @location(1) normal: vec3<f32>) -> @location(0) vec4<f32> {
  let time = uniforms.time;
  let intensity = uniforms.characterParams.x;
  
  var color = vec3<f32>(0.0);
  var alpha = 0.0;
  
  for (var i = 0; i < 5; i++) {
    let ringRadius = 2.0 + f32(i) * 0.5;
    let distToRing = abs(length(worldPos.xz) - ringRadius - sin(time * 0.5 + f32(i)) * 0.1);
    let heightDist = abs(worldPos.y) - 1.5;
    let ringAlpha = 1.0 - smoothstep(0.1, 0.0, max(distToRing, heightDist) * intensity);
    
    let ringColor = mix(vec3<f32>(0.1, 0.4, 1.0), vec3<f32>(0.0, 0.8, 1.0), f32(i) / 5.0);
    color += ringColor * ringAlpha * (1.0 - f32(i) * 0.15);
    alpha = max(alpha, ringAlpha);
  }
  
  let centerDist = length(worldPos) - 0.5;
  let centerAlpha = 1.0 - smoothstep(0.1, 0.0, centerDist) * intensity;
  color += vec3<f32>(0.0, 0.6, 1.0) * centerAlpha * 2.0;
  alpha = max(alpha, centerAlpha);
  
  let particles = fbm(worldPos * 3.0 + vec3<f32>(time * 0.3, time * 0.5, time * 0.2), 4);
  color += vec3<f32>(0.0, 0.8, 1.0) * particles * 0.2 * intensity;
  alpha += particles * 0.1 * intensity;
  
  return vec4<f32>(color, alpha);
}
`,

  spidermanWeb: `
${CommonWGSL}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) normal: vec3<f32>,
}

@vertex
fn vs_main(
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
) -> VertexOutput {
  var output: VertexOutput;
  output.worldPos = position;
  output.normal = normal;
  output.position = vec4<f32>(position, 1.0);
  return output;
}

@fragment
fn fs_main(@location(0) worldPos: vec3<f32>, @location(1) normal: vec3<f32>) -> @location(0) vec4<f32> {
  let time = uniforms.time;
  
  var alpha = 0.0;
  var color = vec3<f32>(1.0);
  
  for (var i = 0; i < 12; i++) {
    let angle = f32(i) * 0.523599;
    let dir = vec2<f32>(cos(angle), sin(angle));
    let dist = abs(worldPos.x * dir.y - worldPos.z * dir.x);
    let along = worldPos.x * dir.x + worldPos.z * dir.y;
    let strandAlpha = 1.0 - smoothstep(0.03, 0.0, dist) * smoothstep(-5.0, 5.0, along);
    alpha = max(alpha, strandAlpha);
  }
  
  let centerDist = length(worldPos.xz) - 0.3;
  let centerAlpha = 1.0 - smoothstep(0.1, 0.0, centerDist);
  alpha = max(alpha, centerAlpha * 0.5);
  
  let pulse = sin(time * 3.0 + length(worldPos.xz) * 5.0) * 0.5 + 0.5;
  color = mix(vec3<f32>(0.8, 0.8, 1.0), vec3<f32>(1.0), pulse * 0.5);
  
  let spideySense = sin(time * 10.0 + length(worldPos) * 3.0) * 0.5 + 0.5;
  color += vec3<f32>(1.0, 0.5, 0.0) * spideySense * 0.3;
  
  return vec4<f32>(color, alpha * 0.8);
}
`,

  zoroSlash: `
${CommonWGSL}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
}

@vertex
fn vs_main(
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
) -> VertexOutput {
  var output: VertexOutput;
  output.worldPos = position;
  output.normal = normal;
  output.uv = uv;
  output.position = vec4<f32>(position, 1.0);
  return output;
}

fn zoroSlashScene(p: vec3<f32>) -> f32 {
  let time = uniforms.time;
  
  let blade = sdBox(p, vec3<f32>(0.015, 1.75, 0.003));
  let tip = sdCone(p - vec3<f32>(0.0, 1.75, 0.0), vec2<f32>(0.015, 0.05));
  let d = opSmoothUnion(blade, tip, 0.01);
  
  let fuller = sdBox(p - vec3<f32>(0.0, -0.5, 0.0), vec3<f32>(0.008, 0.6, 0.002));
  d = max(d, -fuller);
  
  let guard = sdBox(p - vec3<f32>(0.0, -0.02, 0.0), vec3<f32>(0.06, 0.006, 0.045));
  d = opSmoothUnion(d, guard, 0.01);
  
  return d;
}

@fragment
fn fs_main(@location(0) worldPos: vec3<f32>, @location(1) normal: vec3<f32>, @location(2) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let time = uniforms.time;
  let d = zoroSlashScene(worldPos);
  
  let slashTrail = sin(worldPos.y * 20.0 - time * 15.0) * 0.5 + 0.5;
  let edgeGlow = 1.0 - smoothstep(0.001, 0.0, abs(d)) * slashTrail;
  
  let metalColor = vec3<f32>(0.7, 0.7, 0.75);
  let edgeColor = vec3<f32>(0.2, 1.0, 0.4);
  let color = mix(metalColor, edgeColor, edgeGlow * 0.5);
  
  let alpha = 1.0 - smoothstep(0.005, 0.0, abs(d));
  
  return vec4<f32>(color, alpha);
}
`,

  optimusTransform: `
${CommonWGSL}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) normal: vec3<f32>,
}

@vertex
fn vs_main(
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
) -> VertexOutput {
  var output: VertexOutput;
  output.worldPos = position;
  output.normal = normal;
  output.position = vec4<f32>(position, 1.0);
  return output;
}

fn optimusScene(p: vec3<f32>, progress: f32) -> f32 {
  let truckCab = sdBox(p - vec3<f32>(0.0, 1.0, -1.0), vec3<f32>(0.75, 0.6, 1.5));
  let truckTrailer = sdBox(p - vec3<f32>(0.0, 0.4, 1.5), vec3<f32>(0.75, 0.4, 3.0));
  let truck = opSmoothUnion(truckCab, truckTrailer, 0.1);
  
  let robotTorso = sdBox(p - vec3<f32>(0.0, 1.2, 0.0), vec3<f32>(0.75, 1.0, 0.4));
  let robotHead = sdSphere(p - vec3<f32>(0.0, 2.5, 0.0), 0.5);
  let robotArms = opSmoothUnion(
    sdBox(p - vec3<f32>(-1.05, 1.2, 0.0), vec3<f32>(0.3, 1.0, 0.2)),
    sdBox(p - vec3<f32>(1.05, 1.2, 0.0), vec3<f32>(0.3, 1.0, 0.2)),
    0.1
  );
  let robotLegs = opSmoothUnion(
    sdBox(p - vec3<f32>(-0.45, 0.2, 0.0), vec3<f32>(0.3, 1.0, 0.2)),
    sdBox(p - vec3<f32>(0.45, 0.2, 0.0), vec3<f32>(0.3, 1.0, 0.2)),
    0.1
  );
  let robot = opSmoothUnion(opSmoothUnion(robotTorso, robotHead, 0.1), opSmoothUnion(robotArms, robotLegs, 0.1), 0.1);
  
  return mix(truck, robot, progress);
}

@fragment
fn fs_main(@location(0) worldPos: vec3<f32>, @location(1) normal: vec3<f32>) -> @location(0) vec4<f32> {
  let time = uniforms.time;
  let progress = uniforms.characterParams.x;
  
  let d = optimusScene(worldPos, progress);
  let alpha = 1.0 - smoothstep(0.01, 0.0, d);
  
  let truckColor = vec3<f32>(0.8, 0.1, 0.1);
  let robotColor = vec3<f32>(0.8, 0.1, 0.1);
  let accentColor = vec3<f32>(0.0, 0.2, 0.8);
  let goldColor = vec3<f32>(1.0, 0.8, 0.0);
  
  let color = mix(truckColor, robotColor, progress);
  color = mix(color, accentColor, step(0.5, progress) * step(progress, 0.7));
  color = mix(color, goldColor, step(0.7, progress) * sin(time * 5.0) * 0.5 + 0.5);
  
  let panelLines = sin(worldPos.x * 20.0) * sin(worldPos.y * 20.0) * sin(worldPos.z * 20.0);
  color += vec3<f32>(0.1) * panelLines * 0.1;
  
  return vec4<f32>(color, alpha);
}
`,
} as const;

export type ShaderName = keyof typeof CharacterWGSLShaders;

export function getShaderSource(name: ShaderName): string {
  return CharacterWGSLShaders[name] || '';
}

export function getAllShaderNames(): ShaderName[] {
  return Object.keys(CharacterWGSLShaders) as ShaderName[];
}