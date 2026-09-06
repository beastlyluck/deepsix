const C = window.CASE || {};
document.getElementById("auc").textContent = (C.ablation && C.ablation.all && C.ablation.all.auc) || "run main.py";
document.getElementById("us").textContent = C.latency_us ?? "—";
document.getElementById("hold").textContent = C.holds ?? "—";
document.getElementById("estop").textContent = C.estops ?? "—";

const ab = C.ablation || {};
document.getElementById("ab").innerHTML = "<tr><th>block</th><th>AUC</th><th>AP</th></tr>" +
  Object.entries(ab).map(([k, v]) => `<tr><td>${k}</td><td>${v.auc}</td><td>${v.ap}</td></tr>`).join("");
document.getElementById("tl").innerHTML = "<tr><th>#</th><th>kind</th><th>score</th><th>state</th></tr>" +
  (C.timeline || []).slice(0, 12).map(r =>
    `<tr><td>${r.i}</td><td>${r.kind}</td><td>${r.score}</td><td class="${r.state}">${r.state}</td></tr>`
  ).join("");

const poses = C.arm || [];
let idx = 0;
const host = document.getElementById("view");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0a09);
const cam = new THREE.PerspectiveCamera(42, host.clientWidth / 520, 0.05, 40);
cam.position.set(1.6, 1.1, 1.8);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(host.clientWidth, 520);
host.appendChild(renderer.domElement);
scene.add(new THREE.AmbientLight(0xffe0c0, 0.45));
const key = new THREE.DirectionalLight(0xff6a1a, 0.8);
key.position.set(2, 3, 1);
scene.add(key);
scene.add(new THREE.GridHelper(3, 12, 0x2a2218, 0x1a1510));

const links = [];
function colorFor(score) {
  if (score >= 0.65) return 0xe23b2f;
  if (score >= 0.35) return 0xff6a1a;
  return 0x8a8a8a;
}
function build(pose) {
  links.forEach(m => scene.remove(m));
  links.length = 0;
  const xyz = pose.xyz;
  for (let i = 0; i < xyz.length; i++) {
    const geo = new THREE.SphereGeometry(0.035, 16, 12);
    const mat = new THREE.MeshStandardMaterial({ color: colorFor(pose.score), roughness: 0.45, metalness: 0.4 });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(xyz[i][0], xyz[i][2], xyz[i][1]);
    scene.add(m);
    links.push(m);
    if (i > 0) {
      const a = new THREE.Vector3(xyz[i - 1][0], xyz[i - 1][2], xyz[i - 1][1]);
      const b = new THREE.Vector3(xyz[i][0], xyz[i][2], xyz[i][1]);
      const dir = b.clone().sub(a);
      const len = dir.length();
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, len, 10),
        new THREE.MeshStandardMaterial({ color: 0x3a3228, metalness: 0.5 })
      );
      cyl.position.copy(a.clone().add(b).multiplyScalar(0.5));
      cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      scene.add(cyl);
      links.push(cyl);
    }
  }
}
function fft(pose) {
  const c = document.getElementById("fft");
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#0e0c0a";
  ctx.fillRect(0, 0, c.width, c.height);
  const bins = pose.fft || [];
  const mx = Math.max(...bins, 0.01);
  ctx.fillStyle = "#ff6a1a";
  bins.forEach((v, i) => {
    const h = (v / mx) * 110;
    ctx.fillRect(4 + i * 6, 118 - h, 5, h);
  });
}
function show(i) {
  if (!poses.length) return;
  idx = (i + poses.length) % poses.length;
  const p = poses[idx];
  build(p);
  fft(p);
  document.getElementById("scv").textContent = p.score.toFixed(3);
  document.getElementById("scm").style.width = (p.score * 100) + "%";
  const st = (C.timeline && C.timeline[idx] && C.timeline[idx].state) || (p.score >= 0.65 ? "HOLD" : "NORMAL");
  const el = document.getElementById("st");
  el.textContent = st;
  el.className = st;
}
document.getElementById("prev").onclick = () => show(idx - 1);
document.getElementById("next").onclick = () => show(idx + 1);

let drag = false, lx = 0;
host.addEventListener("mousedown", e => { drag = true; lx = e.clientX; });
window.addEventListener("mouseup", () => { drag = false; });
window.addEventListener("mousemove", e => {
  if (!drag) return;
  cam.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), (e.clientX - lx) * 0.01);
  cam.lookAt(0, 0.3, 0);
  lx = e.clientX;
});
function tick() {
  renderer.render(scene, cam);
  requestAnimationFrame(tick);
}
cam.lookAt(0, 0.3, 0);
show(0);
tick();
