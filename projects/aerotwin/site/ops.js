// Dashboard wiring: replay telemetry, sparklines, corrective terminal, audit table.
(function () {
  const C = window.CASE || {};
  const frames = C.frames || [];
  const $ = id => document.getElementById(id);

  $("sha").textContent = C.policy_sha || "run main.py";
  const s2r = C.s2r || {};
  $("gap").textContent = s2r.domain_randomised ? s2r.domain_randomised.gap_mean_m + " m" : "—";
  $("gapn").textContent = s2r.nominal ? s2r.nominal.gap_mean_m + " m" : "—";
  $("recall").textContent = C.rag_recall_at_3 != null ? C.rag_recall_at_3 : "—";

  const sel = $("dsel");
  (frames[0] ? frames[0].drones : []).forEach((d, i) => {
    const o = document.createElement("option"); o.value = i; o.textContent = d.id; sel.appendChild(o);
  });

  // audit table
  const rows = C.s2r_rows || [];
  $("s2r").innerHTML = "<tr><th>policy</th><th>seed</th><th>sim RMSE</th><th>real RMSE</th><th>gap</th><th>worst</th></tr>" +
    rows.map(r => `<tr class="${r.policy === "domain_randomised" ? "dr" : ""}"><td>${r.policy}</td><td>${r.seed}</td><td>${r.sim_rmse_m}</td><td>${r.real_rmse_m}</td><td>${r.gap_m}</td><td>${r.real_worst_m}</td></tr>`).join("");

  // loss curve
  function curve(ctx, ys, color, w, h, mx) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.beginPath();
    ys.forEach((y, i) => { const x = i / Math.max(ys.length - 1, 1) * w, yy = h - (y / mx) * (h - 6) - 3; i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); });
    ctx.stroke();
  }
  const lc = $("loss").getContext("2d");
  const l1 = C.loss_curve || [], l0 = C.nominal_loss_curve || [];
  const mx = Math.max(...l1, ...l0, 1e-6);
  curve(lc, l0, "#7d8ba0", 440, 160, mx); curve(lc, l1, "#35c8ff", 440, 160, mx);

  // query panel: offline shows recorded sample
  function showQA(res) {
    $("qa").innerHTML = (res || []).map(r => `<div><b>${r.doc}</b> · ${r.family} · ${r.loc} · ${r.score}<br>${r.text}</div>`).join("");
  }
  showQA(C.rag_sample);
  $("q").onkeydown = e => { if (e.key === "Enter") showQA(C.rag_sample); };

  // replay
  let k = 0, playing = true, acc = 0;
  const spark = [$("s0"), $("s1"), $("s2"), $("s3"), $("s4")].map(c => c.getContext("2d"));
  const hist = [[], [], [], [], []];
  const seen = new Set();

  function pushLog(frame) {
    frame.drones.forEach(d => {
      if (d.reason === "nominal") return;
      const key = d.id + ":" + d.reason + ":" + Math.floor(frame.t);
      if (seen.has(key)) return; seen.add(key);
      const a = d.a.map(v => v.toFixed(2)).join(" ");
      $("term").textContent += `[${frame.t.toFixed(2).padStart(6)}] ${d.id} ${d.reason.padEnd(9)} a=(${a}) wind ${d.wind.toFixed(2)} err ${d.err.toFixed(2)}\n`;
      $("term").scrollTop = $("term").scrollHeight;
    });
  }

  function drawSpark(ctx, ys, color) {
    ctx.clearRect(0, 0, 260, 46);
    if (ys.length < 2) return;
    const mn = Math.min(...ys), mxx = Math.max(...ys), r = (mxx - mn) || 1;
    ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.beginPath();
    ys.forEach((y, i) => { const x = i / (ys.length - 1) * 260, yy = 43 - (y - mn) / r * 40; i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); });
    ctx.stroke();
  }

  function tick() {
    if (!frames.length) { window.AeroGL && window.AeroGL.render([], 0, +$("yaw").value); return requestAnimationFrame(tick); }
    if (playing) { acc += +$("spd").value; while (acc >= 3) { acc -= 3; k = (k + 1) % frames.length; if (k === 0) { seen.clear(); $("term").textContent = ""; hist.forEach(h => h.length = 0); } } }
    const f = frames[k], d = f.drones[+sel.value || 0];
    window.AeroGL.render(frames, k, +$("yaw").value);
    $("clock").textContent = "t = " + f.t.toFixed(2) + " s";
    const vals = [d.eul[0] * 57.3, d.eul[1] * 57.3, d.eul[2] * 57.3, d.wind, d.err];
    vals.forEach((v, i) => { hist[i].push(v); if (hist[i].length > 140) hist[i].shift(); drawSpark(spark[i], hist[i], i < 3 ? "#35c8ff" : i === 3 ? "#ffb347" : "#ff5e7a"); $("v" + i).textContent = v.toFixed(i < 3 ? 1 : 2) + (i < 3 ? "°" : ""); });
    pushLog(f);
    requestAnimationFrame(tick);
  }
  $("play").onclick = () => { playing = !playing; $("play").textContent = playing ? "pause" : "play"; };
  sel.onchange = () => hist.forEach(h => h.length = 0);
  tick();
})();
