import * as THREE from 'three';

export function createKatanaGeometry(length: number = 3.5, width: number = 0.03, thickness: number = 0.006): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const halfWidth = width / 2;
  const halfThickness = thickness / 2;

  shape.moveTo(-halfWidth, -length / 2);
  shape.lineTo(halfWidth, -length / 2);
  shape.lineTo(halfWidth * 0.3, length / 2 - 0.1);
  shape.lineTo(0, length / 2);
  shape.lineTo(-halfWidth * 0.3, length / 2 - 0.1);
  shape.lineTo(-halfWidth, -length / 2);

  const extrudeSettings = {
    depth: thickness,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 0.001,
    bevelThickness: 0.001,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0, length / 2);

  const fuller = new THREE.CylinderGeometry(width * 0.6, width * 0.8, length * 0.6, 8, 1, true);
  fuller.rotateX(Math.PI / 2);
  fuller.translate(0, 0, -length * 0.2);

  const guard = new THREE.BoxGeometry(width * 4, thickness * 2, width * 1.5);
  guard.translate(0, 0, -length * 0.02);

  const handle = new THREE.CylinderGeometry(width * 1.2, width * 1.2, length * 0.25, 12);
  handle.rotateX(Math.PI / 2);
  handle.translate(0, 0, -length * 0.35);

  const pommel = new THREE.SphereGeometry(width * 1.5, 16, 16);
  pommel.translate(0, 0, -length * 0.48);

const merged = new THREE.BufferGeometry();
  const geometries = [
    { geom: geometry, matrix: new THREE.Matrix4() },
    { geom: fuller, matrix: new THREE.Matrix4() },
    { geom: guard, matrix: new THREE.Matrix4() },
    { geom: handle, matrix: new THREE.Matrix4() },
    { geom: pommel, matrix: new THREE.Matrix4() },
  ];

  // Manual merge instead of BufferGeometryUtils
  const mergedGeometries = geometries.map(g => g.geom.clone().applyMatrix4(g.matrix));
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  mergedGeometries.forEach(geom => {
    const pos = geom.getAttribute('position');
    const norm = geom.getAttribute('normal');
    const uv = geom.getAttribute('uv');

    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      }
    }
    if (norm) {
      for (let i = 0; i < norm.count; i++) {
        normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
      }
    }
    if (uv) {
      for (let i = 0; i < uv.count; i++) {
        uvs.push(uv.getX(i), uv.getY(i));
      }
    }
  });

  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length > 0) merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  if (uvs.length > 0) merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  return merged;
}

export function createWebGeometry(anchorA: THREE.Vector3, anchorB: THREE.Vector3, segments: number = 20): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const mid = new THREE.Vector3().addVectors(anchorA, anchorB).multiplyScalar(0.5);
  const sag = anchorA.distanceTo(anchorB) * 0.15;
  mid.y -= sag;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = new THREE.Vector3();
    const invT = 1 - t;
    point.x = invT * invT * anchorA.x + 2 * invT * t * mid.x + t * t * anchorB.x;
    point.y = invT * invT * anchorA.y + 2 * invT * t * mid.y + t * t * anchorB.y;
    point.z = invT * invT * anchorA.z + 2 * invT * t * mid.z + t * t * anchorB.z;
    points.push(point);
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeometry = new THREE.TubeGeometry(curve, segments, 0.02, 8, false);
  return tubeGeometry;
}

export function createAuraGeometry(radius: number = 2, layers: number = 5): THREE.BufferGeometry[] {
  return Array.from({ length: layers }, (_, i) => {
    const layerRadius = radius * (1 + i * 0.3);
    const geometry = new THREE.IcosahedronGeometry(layerRadius, 2);
    const positions = geometry.attributes.position;
    const displacement = new Float32Array(positions.count * 3);

    for (let j = 0; j < positions.count; j++) {
      const v = new THREE.Vector3().fromBufferAttribute(positions, j);
      const noise = Math.sin(v.x * 10) * Math.cos(v.y * 10) * Math.sin(v.z * 10);
      displacement[j * 3] = v.x + v.x * noise * 0.1;
      displacement[j * 3 + 1] = v.y + v.y * noise * 0.1;
      displacement[j * 3 + 2] = v.z + v.z * noise * 0.1;
    }
    geometry.setAttribute('displacement', new THREE.BufferAttribute(displacement, 3));
    return geometry;
  });
}

export function createParticleGeometry(count: number, radius: number = 10): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const lifetimes = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * Math.cbrt(Math.random());

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    velocities[i * 3] = (Math.random() - 0.5) * 0.1;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

    sizes[i] = Math.random() * 0.5 + 0.1;
    lifetimes[i] = Math.random();

    colors[i * 3] = Math.random();
    colors[i * 3 + 1] = Math.random();
    colors[i * 3 + 2] = Math.random();
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  return geometry;
}
