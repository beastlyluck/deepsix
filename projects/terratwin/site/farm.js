const C = window.CASE || {};
document.getElementById("fy").textContent = C.fqi_yield ?? "run main.py";
document.getElementById("py").textContent = C.pid_yield ?? "—";
document.getElementById("fi").textContent = C.fqi_infected_end ?? "—";
document.getElementById("pi").textContent = C.pid_infected_end ?? "—";
document.getElementById("rw").innerHTML = "<tr><th>term</th><th>w</th></tr>" +
  Object.entries(C.reward || {}).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
document.getElementById("mp").innerHTML = "<tr><th>tower</th><th>MAPE</th></tr>" +
  (C.mape_by_tower || []).map((v, i) => `<tr><td>${i}</td><td>${v}</td></tr>`).join("");

const cfg = C.cfg || { towers: 8, layers: 10, slots: 4 };
const scrub = document.getElementById("scrub");
const pol = document.getElementById("pol");
const field = document.getElementById("field");
let override = null;

function frames() { return (C[pol.value] || []); }
function color(v, key) {
  if (key === "I") return `rgb(${80 + 160 * v}, ${40}, ${40})`;
  if (key === "temp") {
    const t = (v - 18) / 10;
    return `rgb(${40 + 180 * t}, ${140 - 40 * t}, ${80})`;
  }
  if (key === "rh") return `rgb(40, ${80 + 140 * ((v - 0.5) / 0.35)}, 120)`;
  const t = (v - 80) / 260;
  return `rgb(${220 * t}, ${180}, ${80})`;
}
function draw() {
  const fr = frames();
  scrub.max = Math.max(0, fr.length - 1);
  const row = fr[+scrub.value] || fr[0];
  document.getElementById("tk").textContent = row ? row.t : "—";
  if (!row) return;
  const T = cfg.towers, L = cfg.layers, S = cfg.slots;
  const key = field.value;
  let vals = row[key].slice();
  if (override && override.field === key) {
    vals = vals.map((v, i) => {
      const layer = Math.floor(i / S) % L;
      if (override.layer != null && layer !== override.layer) return v;
      if (override.tower != null && Math.floor(i / (L * S)) !== override.tower) return v;
      return v * override.mult;
    });
  }
  const cw = 800 / T, ch = 400 / L;
  let svg = "";
  for (let t = 0; t < T; t++) {
    for (let k = 0; k < L; k++) {
      const i0 = (t * L + k) * S;
      const v = vals.slice(i0, i0 + S).reduce((a, b) => a + b, 0) / S;
      const y = 400 - (k + 1) * ch;
      svg += `<rect x="${t * cw + 2}" y="${y}" width="${cw - 4}" height="${ch - 2}" fill="${color(v, key)}" stroke="#0e1612"/>`;
    }
    svg += `<text x="${t * cw + cw / 2}" y="416" text-anchor="middle" fill="#7d9a86" font-size="11">${t}</text>`;
  }
  document.getElementById("grid").innerHTML = svg;
}
function parseWhat(s) {
  const raise = /^(raise|cut)\s+layer\s+(\d+)\s+(temp|rh|ppfd|ec)\s+(\d+)%/i.exec(s);
  if (raise) {
    const sign = raise[1].toLowerCase() === "raise" ? 1 : -1;
    return { layer: +raise[2], field: raise[3].toLowerCase(), mult: 1 + sign * (+raise[4] / 100) };
  }
  const seed = /^seed\s+tower\s+(\d+)/i.exec(s);
  if (seed) return { tower: +seed[1], field: "I", mult: 1, infect: true };
  return null;
}
document.getElementById("go").onclick = () => {
  const p = parseWhat(document.getElementById("prompt").value.trim());
  document.getElementById("parsed").textContent = p ? JSON.stringify(p) : "did not parse";
  override = p;
  if (p && p.infect) {
    const fr = frames()[+scrub.value];
    if (fr) {
      const L = cfg.layers, S = cfg.slots;
      for (let k = 0; k < L * S; k++) fr.I[p.tower * L * S + k] = 1;
    }
  }
  draw();
};
scrub.oninput = draw;
pol.onchange = () => { override = null; draw(); };
field.onchange = draw;
draw();
