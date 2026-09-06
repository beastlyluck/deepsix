// Orthographic terminal map on canvas. Quay at the bottom, yard behind it, gate at the top.
(function () {
  const C = window.CASE || {};
  const cv = document.getElementById("port"), ctx = cv.getContext("2d");
  const M = C.map;
  if (!M) return;
  const W = cv.width, H = cv.height;
  const xmax = Math.max(...M.blocks.map(b => b[0])) + M.block_w, ymax = M.gate[1] + 40;
  const sx = (W - 40) / (xmax + 40), sy = (H - 60) / ymax;
  let iso = true;

  // world (x,y) -> screen. y grows away from the quay; quay drawn at bottom, water below it.
  function P(x, y) {
    if (!iso) return [20 + x * sx, H - 40 - y * sy];
    const shear = 0.18;
    return [20 + x * sx + y * sy * shear, H - 40 - y * sy * 0.92];
  }
  function poly(pts, fill, stroke) {
    ctx.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
    ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  const occCol = f => f < 0.5 ? `rgba(63,193,201,${0.15 + f})` : f < 0.85 ? `rgba(255,176,102,${0.3 + f * 0.5})` : `rgba(255,122,26,${0.6 + 0.4 * f})`;

  window.Port = {
    setIso(v) { iso = v; },
    render(snap, agvs, lifts) {
      ctx.clearRect(0, 0, W, H);
      // land
      poly([[0, 40], [xmax + 40, 40], [xmax + 40, ymax], [0, ymax]], "#13284a");
      // roads
      ctx.lineWidth = 1;
      M.roads.forEach(([a, b]) => { const p = P(a[0], a[1]), q = P(b[0], b[1]); ctx.strokeStyle = "#1e3a63"; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); });
      // blocks
      M.blocks.forEach((b, i) => {
        const f = snap.occ[i] / M.cap, w = M.block_w / 2, h = M.block_h / 2;
        poly([[b[0] - w, b[1] - h], [b[0] + w, b[1] - h], [b[0] + w, b[1] + h], [b[0] - w, b[1] + h]], occCol(f), "#2a4d80");
        if (iso) { // stack height
          const hh = 14 * f, q = P(b[0] - w, b[1] + h), r = P(b[0] + w, b[1] + h);
          ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fillRect(q[0], q[1] - hh, r[0] - q[0], hh);
        }
        const c = P(b[0], b[1]); ctx.fillStyle = "#dbe6f5"; ctx.font = "9px Consolas, monospace"; ctx.textAlign = "center";
        ctx.fillText(`B${i} ${Math.round(100 * f)}%`, c[0], c[1] + 3);
      });
      // quay + cranes
      poly([[0, 0], [xmax + 40, 0], [xmax + 40, 40], [0, 40]], "#334a6b");
      M.cranes.forEach((c, i) => {
        const q = P(c[0], c[1]); const busy = snap.queue[i] > 0;
        ctx.fillStyle = busy ? "#ff7a1a" : "#7f95b8"; ctx.fillRect(q[0] - 7, q[1] - 26, 14, 26);
        ctx.fillStyle = "#dbe6f5"; ctx.fillRect(q[0] - 22, q[1] - 30, 44, 3);
        ctx.fillStyle = "#dbe6f5"; ctx.font = "9px Consolas, monospace"; ctx.textAlign = "center"; ctx.fillText("STS" + i, q[0], q[1] + 12);
      });
      // vessels at berths
      (snap.berths || []).forEach((v, b) => { if (!v) return; const x0 = 20 + b * 510, q = P(x0, -18), r = P(x0 + 480, -4);
        ctx.fillStyle = "#1c2c47"; ctx.fillRect(q[0], r[1], r[0] - q[0], q[1] - r[1] + 6); ctx.fillStyle = "#ffb066"; ctx.font = "10px Consolas, monospace"; ctx.textAlign = "left"; ctx.fillText(v, q[0] + 6, q[1] + 2); });
      // gate
      const g = P(M.gate[0], M.gate[1]); ctx.fillStyle = "#52d273"; ctx.fillRect(g[0] - 30, g[1] - 5, 60, 10); ctx.fillStyle = "#0a1628"; ctx.font = "9px Consolas"; ctx.textAlign = "center"; ctx.fillText("GATE", g[0], g[1] + 3);
      // AGVs
      agvs.forEach(([xy, busy, blk], i) => {
        const p = P(xy[0], xy[1]);
        ctx.fillStyle = busy ? "#ff7a1a" : "#3fc1c9"; ctx.fillRect(p[0] - 4, p[1] - 3, 8, 6);
        if (busy && blk != null) { const t = P(M.blocks[blk][0], M.blocks[blk][1]); ctx.strokeStyle = "rgba(255,122,26,0.25)"; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(t[0], t[1]); ctx.stroke(); }
      });
      // recent lifts flash at the crane
      lifts.forEach(l => { const q = P(M.cranes[l.crane][0], M.cranes[l.crane][1]); ctx.strokeStyle = "#ffb066"; ctx.beginPath(); ctx.arc(q[0], q[1] - 30, 9, 0, 7); ctx.stroke(); });
    }
  };
})();
