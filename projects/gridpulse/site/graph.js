// Network graph in plain SVG. Frame k of the chosen schedule drives edge and node colours.
(function () {
  const C = window.CASE || {};
  const svg = document.getElementById("graph");
  const NS = "http://www.w3.org/2000/svg";
  const nodes = C.nodes || [], edges = C.edges || [];
  const el = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

  const gE = el("g", {}), gN = el("g", {}), gL = el("g", {});
  svg.append(gE, gN, gL);

  const edgeEls = edges.map(e => {
    const a = nodes[e.a], b = nodes[e.b];
    const l = el("line", { x1: a.x, y1: 100 - a.y, x2: b.x, y2: 100 - b.y, "stroke-width": 0.35 + 1.6 * e.crit, stroke: "#2f6d4c" });
    gE.appendChild(l);
    return l;
  });

  const shape = { wind: "tri", solar: "diamond", battery: "square", substation: "hex", load: "circle" };
  function marker(n) {
    const x = n.x, y = 100 - n.y, r = n.kind === "load" ? 1.1 : 1.7;
    switch (shape[n.kind]) {
      case "tri": return el("polygon", { points: `${x},${y - r} ${x - r},${y + r} ${x + r},${y + r}` });
      case "diamond": return el("polygon", { points: `${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}` });
      case "square": return el("rect", { x: x - r, y: y - r, width: 2 * r, height: 2 * r });
      case "hex": return el("polygon", { points: [0, 1, 2, 3, 4, 5].map(i => `${x + r * Math.cos(i * Math.PI / 3)},${y + r * Math.sin(i * Math.PI / 3)}`).join(" ") });
      default: return el("circle", { cx: x, cy: y, r });
    }
  }
  const nodeEls = nodes.map(n => {
    const m = marker(n);
    m.setAttribute("stroke", "#9dffc4"); m.setAttribute("stroke-width", 0.25); m.setAttribute("fill", "#0d1112");
    m.style.cursor = "pointer";
    gN.appendChild(m);
    return m;
  });
  // label substations
  nodes.forEach(n => { if (n.kind === "substation") gL.appendChild(Object.assign(el("text", { x: n.x + 2.2, y: 100 - n.y + 0.8, "font-size": 2.2, fill: "#6f8a7c" }), { textContent: n.id === C.nodes.findIndex(m => m.kind === "substation") ? "S" + n.id + " tie" : "S" + n.id })); });

  const risk = r => r < 0.3 ? "#0d1112" : r < 0.6 ? "#3a3a10" : r < 0.8 ? "#8a5a12" : "#ff4d5e";
  const load = (l, open) => open ? "none" : l > 1 ? "#ff4d5e" : l > 0.7 ? "#ffc857" : l > 0.4 ? "#3dff8a" : "#2f6d4c";

  let hover = null;
  window.GridGraph = {
    render(frame) {
      const open = new Set(frame.open);
      edges.forEach((e, i) => {
        const l = edgeEls[i], isOpen = open.has(e.id);
        l.setAttribute("stroke", isOpen ? "#ff4d5e" : load(frame.loading[i], false));
        l.setAttribute("stroke-dasharray", isOpen ? "1.2 0.8" : "");
        l.setAttribute("opacity", isOpen ? 0.9 : 0.5 + 0.5 * Math.min(1, frame.loading[i]));
      });
      const lost = new Set(frame.lost);
      nodes.forEach((n, i) => {
        const m = nodeEls[i];
        m.setAttribute("fill", lost.has(i) ? "#000" : risk(frame.risk[i]));
        m.setAttribute("stroke", lost.has(i) ? "#ff4d5e" : frame.risk[i] > 0.5 ? "#ffc857" : "#9dffc4");
      });
      if (hover != null) window.GridGraph.inspect(hover, frame);
    },
    onHover(fn) { nodeEls.forEach((m, i) => { m.onmouseenter = () => { hover = i; fn(i); }; }); },
    inspect(i, frame) {
      const n = nodes[i];
      const inc = edges.map((e, j) => ({ e, j })).filter(o => o.e.a === i || o.e.b === i);
      document.getElementById("inspect").innerHTML =
        `<b>bus ${i}</b> ${n.kind}${n.kind === "load" ? " · peak " + n.peak + " MW" : ""}<br>` +
        `risk <b>${frame.risk[i].toFixed(3)}</b>${frame.lost.includes(i) ? " · <span style='color:#ff4d5e'>LOST</span>" : ""}<br>` +
        inc.map(o => `L${o.e.id} ${frame.open.includes(o.e.id) ? "open" : (100 * frame.loading[o.j]).toFixed(0) + "%"} lim ${o.e.limit}`).join("<br>");
    }
  };
})();
