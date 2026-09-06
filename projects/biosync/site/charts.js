// Panes, matrix, DP, and the what-if assistant.
(function () {
  const C = window.CASE || {};
  const $ = id => document.getElementById(id);
  if (!C.day) { $("k-node").textContent = "run main.py"; return; }
  const D = C.day, N = D.cgm.length, M = C.matrix;
  const g = id => $(id).getContext("2d");

  $("pid").textContent = "P" + String(D.pid).padStart(3, "0");
  $("k-node").textContent = M["0.0"].node["60m"].glucose_rmse + " mg/dL";
  $("k-esn").textContent = M["0.0"].esn["60m"].glucose_rmse + " mg/dL";
  $("k-drop").textContent = M["0.6"].node["60m"].glucose_rmse + " mg/dL";
  $("k-lat").textContent = C.edge.latency_us_per_step + " µs";
  $("k-dp").textContent = "1.0 · σ " + C.dp.sigma_eps1 + " mg/dL";

  // ---- helpers
  function frame(ctx, W, H, ymin, ymax, unit) {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "#eef2f4"; ctx.fillStyle = "#94a3ad"; ctx.font = "10px Inter, sans-serif"; ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) { const y = 8 + (H - 26) * i / 4; ctx.beginPath(); ctx.moveTo(36, y); ctx.lineTo(W - 6, y); ctx.stroke(); ctx.fillText(Math.round(ymax - (ymax - ymin) * i / 4) + unit, 32, y + 3); }
    ctx.textAlign = "center";
    for (let h = 0; h <= 24; h += 3) { ctx.fillText(h + ":00", 36 + (W - 42) * h / 24, H - 6); }
  }
  const sx = (W, i) => 36 + (W - 42) * i / (N - 1);
  const sy = (H, v, lo, hi) => 8 + (H - 26) * (1 - (v - lo) / (hi - lo));
  function line(ctx, ys, W, H, lo, hi, color, width, dash, offset) {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash || []); ctx.beginPath();
    let pen = false;
    ys.forEach((v, i) => { if (v == null) { pen = false; return; } const x = sx(W, i + (offset || 0)), y = sy(H, v, lo, hi); pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; });
    ctx.stroke(); ctx.setLineDash([]);
  }
  function dots(ctx, ys, W, H, lo, hi, color) {
    ctx.fillStyle = color;
    ys.forEach((v, i) => { if (v != null) { ctx.beginPath(); ctx.arc(sx(W, i), sy(H, v, lo, hi), 1.8, 0, 7); ctx.fill(); } });
  }
  function band(ctx, arr, W, H, color) {
    ctx.fillStyle = color;
    arr.forEach((v, i) => { if (v > 0) ctx.fillRect(sx(W, i), 8, (W - 42) / N + 0.5, H - 26); });
  }

  // ---- panes
  const cg = g("c-g"), Wg = 1100, Hg = 230;
  frame(cg, Wg, Hg, 40, 300, "");
  band(cg, D.sleep, Wg, Hg, "#f3f6f8");
  line(cg, D.truth_g, Wg, Hg, 40, 300, "#94a3ad", 1, [], 0);
  D.panes.forEach(p => line(cg, p.pred.map(v => v[0]), Wg, Hg, 40, 300, "#0891b2", 1.6, [], p.start - D.day0));
  dots(cg, D.cgm, Wg, Hg, 40, 300, "#1f2a30");
  cg.strokeStyle = "#d97706"; cg.setLineDash([3, 3]); cg.beginPath(); cg.moveTo(36, sy(Hg, 180, 40, 300)); cg.lineTo(Wg - 6, sy(Hg, 180, 40, 300)); cg.stroke();
  cg.beginPath(); cg.moveTo(36, sy(Hg, 70, 40, 300)); cg.lineTo(Wg - 6, sy(Hg, 70, 40, 300)); cg.stroke(); cg.setLineDash([]);

  const ch = g("c-hr"), Hh = 150;
  frame(ch, Wg, Hh, 40, 160, "");
  band(ch, D.sleep, Wg, Hh, "#f3f6f8");
  line(ch, D.truth_hr, Wg, Hh, 40, 160, "#94a3ad", 1, [], 0);
  D.panes.forEach(p => line(ch, p.pred.map(v => v[1]), Wg, Hh, 40, 160, "#0891b2", 1.6, [], p.start - D.day0));
  dots(ch, D.hr, Wg, Hh, 40, 160, "#1f2a30");

  const cu = g("c-u"), Hu = 90;
  frame(cu, Wg, Hu, 0, 1, "");
  band(cu, D.sleep, Wg, Hu, "#f3f6f8");
  line(cu, D.meal.map(v => Math.min(v, 1)), Wg, Hu, 0, 1, "#d97706", 1.4, [], 0);
  line(cu, D.act, Wg, Hu, 0, 1, "#0891b2", 1.4, [2, 2], 0);

  // ---- matrix
  const rows = Object.keys(M), hs = ["30m", "60m", "120m"], models = [["node", "Neural ODE"], ["esn", "Echo-state RNN"], ["persist", "Persistence"]];
  let html = "<tr><th>dropout</th><th>model</th>" + hs.map(h => `<th>${h} glucose</th>`).join("") + "<th>60m HR</th></tr>";
  rows.forEach(r => models.forEach(([k, name], i) => {
    html += `<tr><td>${i === 0 ? "+" + Math.round(100 * +r) + "%" : ""}</td><td>${name}</td>` +
      hs.map(h => { const v = M[r][k][h].glucose_rmse, best = Math.min(...models.map(([kk]) => M[r][kk][h].glucose_rmse)); return `<td class="${v === best ? "best" : ""}">${v}</td>`; }).join("") +
      `<td>${M[r][k]["60m"].hr_rmse}</td></tr>`;
  }));
  $("matrix").innerHTML = html;
  const I = C.imputation_rmse;
  $("imp").innerHTML = "<tr><th>method</th><th>RMSE</th><th>live?</th></tr>" +
    [["forward_fill", "forward fill", "yes"], ["linear", "linear interpolation", "no"], ["node", "replica rollout", "yes"]].map(([k, n, l]) => `<tr><td>${n}</td><td>${I[k]}</td><td>${l}</td></tr>`).join("");
  $("edge").innerHTML = `${C.edge.latency_us_per_step} µs per 5-min step in numpy · ONNX graph ${C.edge.onnx_bytes} B · engine vs training integrator max |Δ| ${C.edge.engine_vs_train_max_abs.toExponential(1)} · lake ${C.lake.rows.toLocaleString()} rows, CGM observed ${Math.round(100 * C.lake.cgm_observed)}%, HR ${Math.round(100 * C.lake.hr_observed)}%`;

  // ---- DP
  const cd = g("c-dp"), Wd = 440, Hd = 150;
  frame(cd, Wd, Hd, 80, 180, "");
  const dpx = i => 36 + (Wd - 42) * i / 23, dpy = v => sy(Hd, v, 80, 180);
  [["true", "#94a3ad", 1.2, []], ["noisy", "#0891b2", 1.6, []]].forEach(([k, c, w, d]) => { cd.strokeStyle = c; cd.lineWidth = w; cd.setLineDash(d); cd.beginPath(); C.dp_curve[k].forEach((v, i) => i ? cd.lineTo(dpx(i), dpy(v)) : cd.moveTo(dpx(i), dpy(v))); cd.stroke(); });
  $("dp").innerHTML = "<tr><th>ε</th><th>σ (mg/dL)</th><th>attacker acc</th><th>bound</th></tr>" + C.dp.rows.map(r => `<tr><td>${r.eps}</td><td>${r.sigma_mgdl}</td><td>${r.attacker_acc}</td><td>${r.bound}</td></tr>`).join("");

  // ---- what-if
  const cw = g("c-wi"), Hw = 200;
  const baseCarbs = (() => { // recover per-slot carbs from the proxy: c_t = q_t*100/e^{-1/8} - q_{t-1}*100
    const k = Math.exp(-5 / 40), out = []; let prev = 0;
    D.meal.forEach(q => { const c = Math.max(0, q * 100 / k - prev * 100); out.push(c); prev = q; }); return out;
  })();
  let scen = { carbs: baseCarbs.slice(), act: D.act.slice(), label: "baseline" };
  function project(sc) {
    const inputs = { meal: window.Replica.mealProxy(sc.carbs), act: sc.act, sleep: D.sleep };
    const z0 = [D.truth_g[0] / 100, D.truth_hr[0] / 100, 0, 0];
    return window.Replica.rollout(z0, inputs, D.pid, 0, null).map(z => z[0] * 100);
  }
  const baseline = project({ carbs: baseCarbs, act: D.act });
  function drawWI(sc) {
    frame(cw, Wg, Hw, 40, 300, "");
    band(cw, D.sleep, Wg, Hw, "#f3f6f8");
    line(cw, baseline, Wg, Hw, 40, 300, "#94a3ad", 1.2, [], 0);
    const p = project(sc);
    line(cw, p, Wg, Hw, 40, 300, "#0891b2", 1.8, [], 0);
    $("wi-label").textContent = sc.label + " · grey = baseline inputs, cyan = scenario · both are free-running 24 h projections, not anchored";
    return p;
  }
  drawWI(scen);

  function say(who, text) { const d = document.createElement("div"); d.className = who; d.innerHTML = text; $("chat").appendChild(d); $("chat").scrollTop = 1e9; }
  const slotOf = hhmm => { const [h, m] = hhmm.split(":").map(Number); return Math.round((h * 60 + (m || 0)) / 5); };
  const mealSlots = { breakfast: [slotOf("5:30"), slotOf("10:00")], lunch: [slotOf("11:00"), slotOf("14:30")], dinner: [slotOf("17:00"), slotOf("21:30")] };
  function handle(q) {
    q = q.toLowerCase().trim(); if (!q) return; say("u", q);
    if (/reset|baseline/.test(q)) { scen = { carbs: baseCarbs.slice(), act: D.act.slice(), label: "baseline" }; drawWI(scen); say("a", "Back to the logged day."); return; }
    let did = [];
    const meal = Object.keys(mealSlots).find(m => q.includes(m));
    if (meal && /skip|remove|no /.test(q)) { const [a, b] = mealSlots[meal]; for (let t = a; t < b; t++) scen.carbs[t] = 0; did.push(`removed ${meal}`); }
    else if (meal && /double|twice|big/.test(q)) { const [a, b] = mealSlots[meal]; for (let t = a; t < b; t++) scen.carbs[t] *= 2; did.push(`doubled ${meal} carbs`); }
    else if (meal && /half|small|light/.test(q)) { const [a, b] = mealSlots[meal]; for (let t = a; t < b; t++) scen.carbs[t] *= 0.5; did.push(`halved ${meal} carbs`); }
    const walk = q.match(/(walk|run|exercise|cycle)\D*(\d+)\s*min.*?(\d{1,2}(?::\d{2})?)/);
    if (walk) { const s = slotOf(walk[3]), n = Math.round(+walk[2] / 5), inten = walk[1] === "run" ? 0.9 : 0.5; for (let t = s; t < s + n; t++) if (t < N) scen.act[t] = inten; did.push(`${walk[1]} ${walk[2]} min at ${walk[3]}`); }
    if (!did.length) { say("a", "I can change meals (skip / double / halve breakfast, lunch, dinner) and add activity (\"walk 30 min at 15:00\"). The rest of the day stays as logged."); return; }
    scen.label = did.join(", ");
    const p = drawWI(scen);
    const peak = Math.max(...p), tir = Math.round(100 * p.filter(v => v >= 70 && v <= 180).length / p.length), bpeak = Math.max(...baseline), btir = Math.round(100 * baseline.filter(v => v >= 70 && v <= 180).length / baseline.length);
    const low = Math.min(...p);
    say("a", `<b>${scen.label}</b><br>Projected peak ${peak.toFixed(0)} mg/dL (baseline ${bpeak.toFixed(0)}), time in 70–180: ${tir}% (baseline ${btir}%), lowest ${low.toFixed(0)}.<br><span class="muted">Replica integrated client-side from the exported weights; a 24 h free run compounds error, so read the direction, not the digits.</span>`);
  }
  $("ask").onsubmit = e => { e.preventDefault(); handle($("q").value); $("q").value = ""; };
  document.querySelectorAll(".chips button").forEach(b => b.onclick = () => handle(b.dataset.q));
  say("a", "Ask about this patient's day. Try the chips, or \"skip dinner and run 20 min at 18:30\".");
})();
