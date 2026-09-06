struct Uniforms {
  time: f32,
  intensity: f32,
  resolution: vec2<f32>,
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

fn sdSphere(p: vec3<f32>, r: f32) -> f32 {
  return length(p) - r;
}

fn sdBox(p: vec3<f32>, b: vec3<f32>) -> f32 {
  let d = abs(p) - b;
  return length(max(d, vec3<f32>(0.0))) + min(max(d.x, max(d.y, d.z)), 0.0);
}

fn opSmoothUnion(d1: f32, d2: f32, k: f32) -> f32 {
  let h = max(k - abs(d1 - d2), 0.0);
  return min(d1, d2) - h * h * h / (6.0 * k * k);
}

@fragment
fn fs_main(@location(0) worldPos: vec3<f32>, @location(1) normal: vec3<f32>, @location(2) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let time = uniforms.time;
  let intensity = uniforms.intensity;

  let dist = length(worldPos);
  let noise = fbm(worldPos * 2.0 + vec3<f32>(time * 0.5, time * 0.3, time * 0.7), 5);

  let baseAlpha = 1.0 - smoothstep(0.0, 2.0, dist);
  let alpha = baseAlpha * (0.3 + noise * 0.5) * intensity;

  let color = vec3<f32>(1.0, 0.8, 0.2) * (0.5 + noise * 0.5);
  color += vec3<f32>(1.0, 0.4, 0.0) * sin(dist * 10.0 - time * 5.0) * 0.5 + 0.5;

  return vec4<f32>(color, alpha);
}