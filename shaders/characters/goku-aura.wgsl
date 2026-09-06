struct Uniforms {
  time: f32,
  formLevel: f32,
  resolution: vec2<f32>,
  cameraPos: vec3<f32>,
  formColors: array<vec3<f32>, 9>,
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

@fragment
fn fs_main(@location(0) worldPos: vec3<f32>, @location(1) normal: vec3<f32>, @location(2) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let time = uniforms.time;
  let formLevel = uniforms.formLevel;
  let formIndex = i32(formLevel * 8.0);
  let formColor = uniforms.formColors[formIndex];

  let dist = length(worldPos);
  let noise = fbm(worldPos * 2.0 + vec3<f32>(time * 0.5, time * 0.3, time * 0.7), 5);
  let noise2 = fbm(worldPos * 4.0 - vec3<f32>(time * 0.3, time * 0.5, time * 0.2), 4);

  let auraIntensity = 1.0 - smoothstep(0.0, 3.0, dist);
  let turbulence = noise * 0.5 + noise2 * 0.25;

  let pulse = sin(time * 3.0 + dist * 5.0) * 0.5 + 0.5;
  let kiWaves = sin(dist * 10.0 - time * 5.0) * 0.5 + 0.5;

  let baseColor = mix(formColor, vec3<f32>(1.0, 1.0, 0.8), pulse * 0.3);
  let color = baseColor * auraIntensity * (0.5 + turbulence + kiWaves * 0.3);
  color *= 1.0 + formLevel * 2.0;

  let alpha = auraIntensity * (0.3 + turbulence * 0.3 + pulse * 0.2);

  return vec4<f32>(color, alpha);
}