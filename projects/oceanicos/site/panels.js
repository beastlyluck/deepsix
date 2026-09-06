// Replay control, gauges, heatmap, event stream, benchmark tables, forecasts.
(function () {
  const C = window.CASE || {};
  const $ = id => document.getElementById(id);
  if (!C.runs) { $("k-mph").textContent = "run main.py"; return; }
  const B = C.benchmark, M = C.map;
  let run = "matrix", k = 0, playing = false;
  const snaps = () => C.runs[run].snaps, ev = () => C.runs[run].events, lifts = () => C.lifts[run];
  const hhmm = s => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"); };

  function kpis() {
    const b = B[run];
    $("hz").textContent = C.layout.horizon_h;
    $("k-mph").textContent = b.moves_per_hour;
    $("k-stall").textContent = b.crane_stall_min_per_crane;
    $("k-empty").textContent = Math.round(100 * b.agv_empty_share) + "%";
    $("k-yard").textContent = Math.round(100 * b.yard_peak_saturation) + "%";
    $("k-turn").textContent = b.mean_turnaround_h ? b.mean_turnaround_h + " h" : "—";
  }

  function gauge(id, val, max, label, color) {
    const c = $(id), ctx = c.getContext("2d"); ctx.clearRect(0, 0, 140, 90);
    ctx.lineWidth = 10; ctx.strokeStyle = "#1e3358"; ctx.beginPath(); ctx.arc(70, 70, 50, Math.PI, 2 * Math.PI); ctx.stroke();
    ctx.strokeStyle = color; ctx.beginPath(); ctx.arc(70, 70, 50, Math.PI, Math.PI + Math.PI * Math.min(val / max, 1)); ctx.stroke();
    ctx.fillStyle = "#dbe6f5"; ctx.font = "16px Consolas, monospace"; ctx.textAlign = "center"; ctx.fillText(Math.round(val), 70, 66);
    ctx.fillStyle = "#7f95b8"; ctx.font = "10px sans-serif"; ctx.fillText(label, 70, 84);
  }
  function heat(snap) {
    const c = $("heat"), ctx = c.getContext("2d"), cols = M.cols, rows = M.rows, w = 300 / cols, h = 150 / rows;
    ctx.clearRect(0, 0, 300, 150);
    snap.occ.forEach((o, i) => { const f = o / M.cap, r = Math.floor(i / cols), cc = i % cols;
      ctx.fillStyle = f < 0.5 ? `rgba(63,193,201,${0.2 + f})` : f < 0.85 ? `rgba(255,176,102,${0.4 + f * 0.5})` : `rgba(255,122,26,${0.7 + 0.3 * f})`;
      ctx.fillRect(cc * w + 1, (rows - 1 - r) * h + 1, w - 2, h - 2);
      ctx.fillStyle = "#0a1628"; ctx.font = "10px Consolas"; ctx.textAlign = "center"; ctx.fillText(Math.round(100 * f), cc * w + w / 2, (rows - 1 - r) * h + h / 2 + 4); });
  }
  function show() {
    const S = snaps(), s = S[k], prev = S[Math.max(k - 12, 0)];
    const dt = Math.max((s.t - prev.t) / 3600, 1 / 12);
    const recent = lifts().filter(l => l.t <= s.t && l.t > s.t - 300);
    window.Port.render(s, s.agv, recent);
    $("clock").textContent = hhmm(s.t);
    $("scrub").max = S.length - 1; $("scrub").value = k;
    gauge("g1", (s.moves - prev.moves) / dt, 220, "moves/h (1 h)", "#ff7a1a");
    gauge("g2", s.agv.filter(a => a[1]).length / s.agv.length * 100, 100, "AGV busy %", "#3fc1c9");
    heat(s);
    $("berths").innerHTML = (s.berths || []).map((v, i) => `<span>berth ${i}: <b>${v || "—"}</b></span>`).join("") + `<span>at anchor: <b>${s.anchored || 0}</b></span>`;
    const lines = [];
    ev().filter(e => e.t <= s.t).slice(-6).forEach(e => lines.push(`${hhmm(e.t)}  ${e.kind.toUpperCase().padEnd(7)} ${e.vessel}${e.kind === "berth" ? " berth " + e.berth + " STS" + e.cranes.join(",") + " " + e.boxes + " boxes" : e.kind === "depart" ? " " + e.hours + " h" : ""}`));
    lifts().filter(l => l.t <= s.t).slice(-14).forEach(l => lines.push(`${hhmm(l.t)}  LIFT    STS${l.crane} → AGV${String(l.agv).padStart(2, "0")} → B${l.block}  ${l.box}`));
    $("log").textContent = lines.join("\n"); $("log").scrollTop = 1e9;
    $("evn").textContent = `(${C.event_store.events.toLocaleString()} in store)`;
  }
  $("scrub").oninput = e => { k = +e.target.value; show(); };
  $("play").onclick = () => { playing = !playing; $("play").textContent = playing ? "pause" : "play"; };
  $("iso").onchange = e => { window.Port.setIso(e.target.checked); show(); };
  document.querySelectorAll(".seg button").forEach(b => b.onclick = () => { document.querySelectorAll(".seg button").forEach(x => x.classList.remove("on")); b.classList.add("on"); run = b.dataset.r; kpis(); show(); });
  setInterval(() => { if (playing) { k = (k + 1) % snaps().length; show(); } }, 120);
  kpis(); k = Math.floor(snaps().length * 0.55); show();

  // benchmark
  const rows = [["moves_per_hour", "moves / hour", 1], ["crane_stall_min_per_crane", "crane stall, min / crane", -1], ["agv_empty_share", "AGV empty travel share", -1], ["yard_peak_saturation", "yard peak saturation", -1], ["mean_turnaround_h", "mean turnaround, h", -1]];
  $("bench").innerHTML = "<tr><th>metric</th><th>greedy</th><th>matrix</th></tr>" + rows.map(([key, name, sgn]) => {
    const g = B.greedy[key], m = B.matrix[key]; const best = sgn * (m - g) > 0 ? "m" : sgn * (m - g) < 0 ? "g" : "";
    const fmt = v => v == null ? "—" : key.includes("share") || key.includes("saturation") ? Math.round(100 * v) + "%" : v;
    return `<tr><td>${name}</td><td class="${best === "g" ? "best" : ""}">${fmt(g)}</td><td class="${best === "m" ? "best" : ""}">${fmt(m)}</td></tr>`; }).join("");

  // st model
  const ST = C.stgnn_mae, hs = ["15m", "30m", "60m"];
  $("st").innerHTML = "<tr><th>model</th>" + hs.map(h => `<th>${h}</th>`).join("") + "</tr>" + Object.entries(ST).map(([n, v]) => `<tr><td>${n}</td>` + hs.map(h => { const best = Math.min(...Object.values(ST).map(x => x[h])); return `<td class="${v[h] === best ? "best" : ""}">${v[h]}</td>`; }).join("") + "</tr>").join("");

  // hierarchy
  const Hh = C.hierarchy, hc = $("hier").getContext("2d");
  const total = Hh.history.total, fcB = Hh.base[0], fcR = Hh.reconciled[0], act = Hh.actual[0];
  const all = total.concat(act), lo = Math.min(...all) * 0.9, hi = Math.max(...all) * 1.08, n = total.length + act.length;
  const X = i => 30 + 400 * i / (n - 1), Y = v => 160 - 150 * (v - lo) / (hi - lo);
  hc.clearRect(0, 0, 440, 170);
  hc.strokeStyle = "#7f95b8"; hc.lineWidth = 1.2; hc.beginPath(); total.forEach((v, i) => i ? hc.lineTo(X(i), Y(v)) : hc.moveTo(X(i), Y(v))); hc.stroke();
  hc.strokeStyle = "#dbe6f5"; hc.setLineDash([2, 2]); hc.beginPath(); act.forEach((v, i) => i ? hc.lineTo(X(total.length + i), Y(v)) : hc.moveTo(X(total.length + i), Y(v))); hc.stroke(); hc.setLineDash([]);
  hc.strokeStyle = "#3fc1c9"; hc.beginPath(); fcB.forEach((v, i) => i ? hc.lineTo(X(total.length + i), Y(v)) : hc.moveTo(X(total.length + i), Y(v))); hc.stroke();
  hc.strokeStyle = "#ff7a1a"; hc.lineWidth = 1.8; hc.beginPath(); fcR.forEach((v, i) => i ? hc.lineTo(X(total.length + i), Y(v)) : hc.moveTo(X(total.length + i), Y(v))); hc.stroke();
  hc.fillStyle = "#7f95b8"; hc.font = "10px sans-serif"; hc.textAlign = "left"; hc.fillText("terminal total, 52 w history · dashed actual · teal base · orange reconciled", 30, 12);
  $("hiert").innerHTML = "<tr><th>level</th><th>base MAPE</th><th>reconciled</th></tr>" + ["total", "line", "service"].map(l => `<tr><td>${l}</td><td>${Hh.mape_base[l]}%</td><td>${Hh.mape_reconciled[l]}%</td></tr>`).join("");
  $("incoh").textContent = Hh.base_incoherence_boxes;

  // dwell
  $("dwell").innerHTML = "<tr><th>line</th><th>n</th><th>raw mean d</th><th>shrunk d</th><th>P(&gt;5 d)</th></tr>" + Object.entries(C.dwell).map(([l, d]) => `<tr><td>${l}</td><td>${d.n}</td><td>${d.raw_mean_days ?? "—"}</td><td>${d.shrunk_mean_days}</td><td>${d.p_dwell_gt_5d}</td></tr>`).join("");
})();
