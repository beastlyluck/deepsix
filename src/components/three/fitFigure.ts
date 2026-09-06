import * as THREE from 'three';

export function resetLocal(root: THREE.Object3D) {
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.scale.set(1, 1, 1);
}

export function rebindSkins(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.SkinnedMesh;
    if (!mesh.isSkinnedMesh || !mesh.skeleton) return;
    mesh.frustumCulled = false;
    mesh.bind(mesh.skeleton, mesh.bindMatrix);
    mesh.skeleton.update();
  });
}

function spanY(box: THREE.Box3) {
  const h = box.max.y - box.min.y;
  return Number.isFinite(h) && h > 0 ? h : 0;
}

function plausible(h: number) {
  return h >= 0.5 && h <= 8;
}

function meshBox(mesh: THREE.Mesh) {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  if (!mesh.geometry.boundingBox) return null;
  const box = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
  const h = spanY(box);
  if (h < 1e-5) return null;
  return { box, h, skinned: Boolean((mesh as THREE.SkinnedMesh).isSkinnedMesh) };
}

function unionNear(parts: { box: THREE.Box3; h: number }[]) {
  const union = new THREE.Box3();
  if (!parts.length) return union;
  const tallest = Math.max(...parts.map((p) => p.h));
  parts.forEach((p) => {
    if (p.h >= tallest * 0.18) union.union(p.box);
  });
  if (union.isEmpty()) union.copy(parts[0].box);
  return union;
}

function gather(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const skinned: { box: THREE.Box3; h: number }[] = [];
  const other: { box: THREE.Box3; h: number }[] = [];
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    if (/sphere|dot|particle|camera|light|helper|target/i.test(mesh.name)) return;
    const part = meshBox(mesh);
    if (!part) return;
    if (part.skinned) skinned.push(part);
    else other.push(part);
  });
  return { skinned, other };
}

/** Prefer the skinned body so phoenix / VFX meshes do not dwarf the figure. */
function bindBox(root: THREE.Object3D) {
  const { skinned, other } = gather(root);
  const body = unionNear(skinned);
  if (plausible(spanY(body))) return body;
  return unionNear([...skinned, ...other]);
}

function posedBox(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const { skinned } = gather(root);
  const body = unionNear(skinned);
  if (plausible(spanY(body))) return body;
  return new THREE.Box3().setFromObject(root);
}

/** Deformed skinned AABB after the mixer has run — used to catch explode/collapse poses. */
export function posedSkinnedBox(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  let any = false;
  root.traverse((o) => {
    const mesh = o as THREE.SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    box.expandByObject(mesh);
    any = true;
  });
  return any && !box.isEmpty() ? box : new THREE.Box3().setFromObject(root);
}

function pickBox(root: THREE.Object3D) {
  const bind = bindBox(root);
  const posed = posedBox(root);
  const bindH = spanY(bind);
  const posedH = spanY(posed);

  if (plausible(posedH)) return posed;
  if (plausible(bindH)) return bind;

  const options = [
    { box: posed, h: posedH },
    { box: bind, h: bindH },
  ].filter((o) => o.h > 1e-5);

  const correctable = options.find((o) => (o.h < 0.45 && plausible(o.h * 100)) || (o.h > 40 && plausible(o.h * 0.01)));
  if (correctable) return correctable.box;
  return posedH >= bindH ? posed : bind;
}

/**
 * Fit a figure to targetHeight.
 * Prefers the deformed skinned AABB when it is a real person-sized height,
 * so Mixamo Goku is not mistaken for a 7cm bind-pose shard.
 */
export function fitStanding(root: THREE.Object3D, targetHeight: number) {
  resetLocal(root);
  root.updateMatrixWorld(true);

  let box = pickBox(root);
  let h = spanY(box);

  if (h > 0 && h < 0.45) {
    root.scale.setScalar(100);
    root.updateMatrixWorld(true);
    box = pickBox(root);
    h = spanY(box);
  } else if (h > 40) {
    root.scale.setScalar(0.01);
    root.updateMatrixWorld(true);
    box = pickBox(root);
    h = spanY(box);
  }

  if (!h || h < 0.05) h = 1;
  root.scale.multiplyScalar(targetHeight / h);
  root.updateMatrixWorld(true);

  const posed = posedBox(root);
  const posedH = spanY(posed);
  if (posedH > targetHeight * 1.45 || (posedH > 0.15 && posedH < targetHeight * 0.6)) {
    root.scale.multiplyScalar(targetHeight / posedH);
    root.updateMatrixWorld(true);
  }

  box = posedBox(root);
  if (spanY(box) < 0.2) box = pickBox(root);
  if (!box.isEmpty()) {
    root.position.x -= (box.min.x + box.max.x) / 2;
    root.position.z -= (box.min.z + box.max.z) / 2;
    root.position.y -= box.min.y;
  }

  tameEffectMeshes(root);
}

function isFireMesh(mesh: THREE.Object3D) {
  const label = `${mesh.name} ${mesh.parent?.name ?? ''}`;
  return mesh.name === '0' || /fire|phoenix|flame|fx/i.test(label);
}

/** Shrink giant VFX so they stay in frame. Keep Itachi's clip fire visible. */
export function tameEffectMeshes(root: THREE.Object3D, maxHeight = 2.6) {
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) return;
    const box = new THREE.Box3().setFromObject(mesh);
    const h = spanY(box);
    const fire = isFireMesh(mesh);
    if (fire) {
      mesh.visible = true;
      mesh.frustumCulled = false;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        const m = mat as THREE.MeshPhysicalMaterial;
        if (!m) return;
        if (m.emissive && !m.map) m.emissive.set('#ff6d00');
        if ('emissiveIntensity' in m) m.emissiveIntensity = Math.min(m.emissiveIntensity ?? 2, 2.8);
        m.transparent = true;
        m.depthWrite = false;
        m.side = THREE.DoubleSide;
        m.needsUpdate = true;
      });
      return;
    }
    if (h > 6) {
      mesh.visible = false;
      return;
    }
    if (h > maxHeight) mesh.scale.multiplyScalar(maxHeight / h);
  });
}

export function makeVisible(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.visible = true;
    if (!mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((mat) => {
      const m = mat as THREE.MeshStandardMaterial;
      if ('color' in m && m.color && !m.map && m.color.r + m.color.g + m.color.b < 0.08) m.color.set('#c8c8c8');
      if ('envMapIntensity' in m && (m.envMapIntensity ?? 0) < 0.4) m.envMapIntensity = 0.55;
      m.side = THREE.DoubleSide;
      m.needsUpdate = true;
    });
  });
}

export function reportFit(id: string, root: THREE.Object3D, bones = 0) {
  if (typeof window === 'undefined') return;
  root.updateMatrixWorld(true);
  const box = posedBox(root);
  const size = new THREE.Vector3();
  if (!box.isEmpty()) box.getSize(size);
  else new THREE.Box3().setFromObject(root).getSize(size);
  const store = ((window as unknown as { __FIG?: Record<string, unknown> }).__FIG ??= {});
  store[id] = {
    scale: Number(root.scale.x.toFixed(5)),
    h: Number(size.y.toFixed(3)),
    minY: Number(box.min.y.toFixed(3)),
    maxY: Number(box.max.y.toFixed(3)),
    bones,
  };
}
