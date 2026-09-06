// KPIs, replay control, alert drawer, PINN/GNN/dispatch panels.
(function () {
  const C = window.CASE || {};
  const $ = id => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; return e; };
  if (!C.frames) { $("k-grid").textContent = "run main.py"; return; }

  const d = C.dispatch, r = C.replay, g = C.gnn || [];
  const best = g.find(x => x.K === C.gnn_best_K) || {}, k0 = g.find(x => x.K === 0) || {};
  $("sha").textContent = C.model_sha;
  $("k-grid").textContent = `${C.buses} / ${C.lines}`;
  $("k-istar").textContent = (100 * C.pinn.sustainable_current_pu).toFixed(1) + "% of static";
  $("k-auc").textContent = `${best.auc} vs ${k0.auc}`;
  $("k-cost").textContent = `$${(d.cost_static / 1000).toFixed(1)}k → $${(d.cost_dynamic / 1000).toFixed(1)}k`;
  $("k-lost").textContent = `${r.static_lost_buses} → ${r.lost_buses}`;

  // replay
  let sched = "dyn", k = 0, playing = false;
  const frames = () => sched === "dyn" ? C.frames : C.frames_static;
  const alerts = () => sched === "dyn" ? C.alerts : C.alerts_static;
  const hhmm = m => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");

  function drawAlerts() {
    const t = frames()[k].t_min, list = alerts().filter(a => a.t_min <= t).slice(-60).reverse();
    $("acount").textContent = `(${list.length} of ${alerts().length})`;
    $("alerts").innerHTML = list.map(a => `<div class="${a.severity}"><span class="t">${hhmm(a.t_min)}</span> bus ${a.bus} ${a.severity} risk ${a.risk}${a.lines.length ? " · open L" + a.lines.join(", L") : ""}</div>`).join("") || "<span class='t'>no alerts yet</span>";
  }
  function show() {
    const f = frames()[k];
    window.GridGraph.render(f);
    $("clock").textContent = hhmm(f.t_min) + (f.tripped.length ? "  ⚡ N-" + C.replay.contingency.length + " L" + C.replay.contingency.join(", L") : "");
    $("scrub").value = k;
    drawAlerts();
  }
  $("scrub").oninput = e => { k = +e.target.value; show(); };
  $("play").onclick = () => { playing = !playing; $("play").textContent = playing ? "pause" : "play"; };
  document.querySelectorAll(".seg button").forEach(b => b.onclick = () => {
    document.querySelectorAll(".seg button").forEach(x => x.classList.remove("on")); b.classList.add("on");
    sched = b.dataset.s; show();
  });
  window.GridGraph.onHover(i => window.GridGraph.inspect(i, frames()[k]));
  setInterval(() => { if (playing) { k = (k + 1) % frames().length; show(); } }, 180);
  k = 6 * 18 - 2; show();

  // PINN panel
  const P = $("pinn"), prof = C.pinn_profiles || [];
  const W = 440, H = 180, ml = 34, mb = 22, pw = W - ml - 8, ph = H - mb - 8;
  const tmax = Math.max(140, ...prof.flatMap(p => p.ref));
  const sx = i => ml + i / 100 * pw, sy = T => 8 + ph - (T - 20) / (tmax - 20) * ph;
  P.append(el("line", { x1: ml, y1: sy(90), x2: W - 8, y2: sy(90), stroke: "#ff4d5e", "stroke-dasharray": "3 3", "stroke-width": 0.8 }));
  P.append(el("text", { x: W - 8, y: sy(90) - 3, fill: "#ff4d5e", "font-size": 9, "text-anchor": "end" }, "90 °C limit"));
  [25, 60, 100, 140].forEach(T => { if (T <= tmax) { P.append(el("text", { x: ml - 4, y: sy(T) + 3, fill: "#6f8a7c", "font-size": 9, "text-anchor": "end" }, T)); } });
  P.append(el("text", { x: ml + pw / 2, y: H - 6, fill: "#6f8a7c", "font-size": 9, "text-anchor": "middle" }, "position along span, sheltered section at 0.55"));
  const cols = ["#3dff8a", "#ffc857", "#ff4d5e"];
  prof.forEach((p, i) => {
    const path = a => a.map((T, j) => (j ? "L" : "M") + sx(j) + "," + sy(T)).join(" ");
    P.append(el("path", { d: path(p.ref), stroke: cols[i], fill: "none", "stroke-width": 1.4 }));
    P.append(el("path", { d: path(p.pinn), stroke: cols[i], fill: "none", "stroke-width": 1.2, "stroke-dasharray": "4 3", opacity: 0.9 }));
    P.append(el("text", { x: ml + 4, y: 16 + 11 * i, fill: cols[i], "font-size": 9 }, `I = ${p.I} pu`));
  });
  const ttl = C.pinn.time_to_limit_by_current || {};
  $("ttl").innerHTML = "<tr><th>loading</th>" + Object.keys(ttl).map(i => `<th>${i}</th>`).join("") + "</tr><tr><td>minutes to 90 °C</td>" +
    Object.values(ttl).map(v => `<td>${v == null ? "—" : Math.round(60 * v)}</td>`).join("") + "</tr>";

  // GNN table
  $("gnn").innerHTML = "<tr><th>K</th><th>AUC</th><th>AP</th><th>test nodes</th><th>lost</th></tr>" +
    g.map(x => `<tr class="${x.K === C.gnn_best_K ? "best" : ""}"><td>${x.K}</td><td>${x.auc}</td><td>${x.ap}</td><td>${x.n}</td><td>${x.positives}</td></tr>`).join("");
  const der = C.derated || [];
  const byLine = {};
  der.forEach(x => { byLine[x.line] = (byLine[x.line] || 0) + 1; });
  $("derated").innerHTML = `${der.length} line-hours capped at ${(100 * C.pinn.sustainable_current_pu).toFixed(0)}% across ${Object.keys(byLine).length} lines. ` +
    `Shed ${d.shed_static_mwh} → ${d.shed_dynamic_mwh} MWh, import ${d.import_mwh} MWh, curtailed ${d.curtailed_mwh} MWh.<br>` +
    Object.entries(byLine).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([l, n]) => `L${l}: ${n} h`).join(" · ");

  // dispatch stacked area
  const D = $("disp"), S = C.schedule, dem = C.demand_total;
  const DW = 440, DH = 200, dl = 34, db = 20, dw = DW - dl - 34, dh = DH - db - 8;
  const gen = S.gen.map(row => row.reduce((a, b) => a + b, 0)), dis = S.discharge.map(r => r.reduce((a, b) => a + b, 0));
  const imp = S["import"], shed = S.shed.map(r => r.reduce((a, b) => a + b, 0)), soc = S.soc.map(r => r.reduce((a, b) => a + b, 0));
  const ymax = Math.max(...dem) * 1.1, x = h => dl + h / 23 * dw, y = v => 8 + dh - v / ymax * dh;
  const layers = [[gen, "#3dff8a"], [dis, "#9dffc4"], [imp, "#ffc857"], [shed, "#ff4d5e"]];
  let base = new Array(24).fill(0);
  layers.forEach(([v, c]) => {
    const top = base.map((b, h) => b + v[h]);
    const dpath = top.map((t, h) => (h ? "L" : "M") + x(h) + "," + y(t)).join(" ") + " " + [...base.keys()].reverse().map(h => "L" + x(h) + "," + y(base[h])).join(" ") + " Z";
    D.append(el("path", { d: dpath, fill: c, opacity: 0.7 }));
    base = top;
  });
  D.append(el("path", { d: dem.map((v, h) => (h ? "L" : "M") + x(h) + "," + y(v)).join(" "), stroke: "#cfe3d6", fill: "none", "stroke-width": 1.2, "stroke-dasharray": "3 2" }));
  const socmax = Math.max(...soc) * 1.1 || 1;
  D.append(el("path", { d: soc.map((v, h) => (h ? "L" : "M") + x(h) + "," + (8 + dh - v / socmax * dh)).join(" "), stroke: "#ffffff", fill: "none", "stroke-width": 1 }));
  [0, 6, 12, 18, 23].forEach(h => D.append(el("text", { x: x(h), y: DH - 5, fill: "#6f8a7c", "font-size": 9, "text-anchor": "middle" }, h + ":00")));
  [0, 0.5, 1].forEach(f => D.append(el("text", { x: dl - 4, y: y(f * ymax) + 3, fill: "#6f8a7c", "font-size": 9, "text-anchor": "end" }, Math.round(f * ymax))));
  D.append(el("text", { x: DW - 4, y: 14, fill: "#fff", "font-size": 9, "text-anchor": "end" }, "SoC " + Math.round(socmax) + " MWh"));
  D.append(el("text", { x: dl + 4, y: 14, fill: "#cfe3d6", "font-size": 9 }, "dashed = demand"));
})();
