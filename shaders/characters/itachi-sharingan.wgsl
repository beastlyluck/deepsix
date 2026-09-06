struct Uniforms {
  time: f32,
  stage: f32,
  tomoeRotation: f32,
  resolution: vec2<f32>,
  cursorPos: vec2<f32>,
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

fn hash22(p: vec2<f32>) -> vec2<f32> {
  return fract(sin(vec2<f32>(dot(p, vec2<f32>(127.1, 311.7)), dot(p, vec2<f32>(269.5, 183.3)))) * 43758.5453);
}

fn noise2D(p: vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash22(i + vec2<f32>(0, 0)).x, hash22(i + vec2<f32>(1, 0)).x, u.x),
    mix(hash22(i + vec2<f32>(0, 1)).x, hash22(i + vec2<f32>(1, 1)).x, u.x),
    u.y
  );
}

fn fbm2D(p: vec2<f32>, octaves: i32) -> f32 {
  var value = 0.0;
  var amplitude = 1.0;
  var frequency = 1.0;
  var maxValue = 0.0;
  for (var i = 0; i < octaves; i++) {
    value += amplitude * noise2D(p * frequency);
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value / maxValue;
}

@fragment
fn fs_main(@location(0) worldPos: vec3<f32>, @location(1) normal: vec3<f32>, @location(2) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let time = uniforms.time;
  let stage = uniforms.stage;
  let tomoeRotation = uniforms.tomoeRotation;

  let uv2 = worldPos.xy;
  let dist = length(uv2);

  let pupilDist = sdCircle(uv2, 0.4);
  let pupil = 1.0 - smoothstep(0.02, 0.0, pupilDist);

  var tomoeMask = 0.0;
  let tomoeCount = select(3.0, 0.0, stage >= 3.0);
  if (stage < 3.0) {
    tomoeCount = stage + 1.0;
  }

  for (var i = 0; i < 3; i++) {
    let active = f32(i) < tomoeCount;
    if (active > 0.0) {
      let angle = tomoeRotation + f32(i) * 2.094395;
      let rotated = rotate2d(uv2 - vec2<f32>(0.3, 0.0), angle);
      let tomoeDist = sdTomoe(rotated, 0.12);
      let tomoeVal = 1.0 - smoothstep(0.02, 0.0, tomoeDist);
      tomoeMask = max(tomoeMask, tomoeVal);
    }
  }

  var mangekyouMask = 0.0;
  if (stage >= 3.0) {
    let angle = time * 0.5;
    for (var i = 0; i < 6; i++) {
      let a = angle + f32(i) * 1.047197;
      let rotated = rotate2d(uv2, a);
      let blade = 1.0 - smoothstep(0.05, 0.0, abs(rotated.x) - 0.02 + abs(rotated.y) * 3.0);
      mangekyouMask = max(mangekyouMask, blade);
    }
  }

  var amaterasuMask = 0.0;
  if (stage >= 6.0) {
    let cursorUV = uniforms.cursorPos * 2.0 - 1.0;
    let flameDist = length(uv2 - cursorUV);
    let flame = 1.0 - smoothstep(0.1, 0.0, flameDist - sin(time * 10.0 + flameDist * 20.0) * 0.02);
    amaterasuMask = max(amaterasuMask, flame);
  }

  var susanooMask = 0.0;
  if (stage >= 7.0) {
    let susanooDist = sdCircle(uv2, 0.8 + sin(time * 2.0) * 0.1);
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

  let genjutsuNoise = fbm2D(uv2 * 5.0 + vec2<f32>(time * 0.1, time * 0.05), 4);
  color += vec3<f32>(0.5, 0.0, 0.0) * genjutsuNoise * 0.3 * step(3.0, stage);

  let alpha = max(pupil, max(tomoeMask, max(mangekyouMask, max(amaterasuMask, susanooMask))));
  alpha += genjutsuNoise * 0.1 * step(3.0, stage);

  return vec4<f32>(color, alpha);
}