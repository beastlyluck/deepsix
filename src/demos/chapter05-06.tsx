import { useEffect, useMemo, useState } from 'react';
import { Controls, DemoFrame, Slider, Stat, gaussian, rng, INK, type DemoProps } from './primitives';

/* ─── 05 · Nightly analytics fabric ────────────────────────────────────── */
type NodeState = 'idle' | 'running' | 'pass' | 'fail' | 'skipped';
const DAG = [
  { id: 'stg_enrolments', layer: 0, tests: 4 },
  { id: 'stg_invoices', layer: 0, tests: 3 },
  { id: 'stg_meters', layer: 0, tests: 3 },
  { id: 'int_students', layer: 1, tests: 5 },
  { id: 'int_billing', layer: 1, tests: 6 },
  { id: 'mart_active_students', layer: 2, tests: 7 },
  { id: 'mart_late_invoices', layer: 2, tests: 8 },
  { id: 'mart_energy_intensity', layer: 2, tests: 6 },
];
const DEPS: Record<string, string[]> = {
  int_students: ['stg_enrolments'],
  int_billing: ['stg_invoices'],
  mart_active_students: ['int_students'],
  mart_late_invoices: ['int_billing', 'int_students'],
  mart_energy_intensity: ['stg_meters'],
};

export function NightlyFabricDemo({ accent }: DemoProps) {
  const [breakNode, setBreakNode] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, NodeState>>(() => Object.fromEntries(DAG.map((n) => [n.id, 'idle'])));
  const [running, setRunning] = useState(false);
  const [published, setPublished] = useState<'yesterday' | 'today'>('yesterday');

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    const order = [...DAG].sort((a, b) => a.layer - b.layer);
    const failed = new Set<string>();
    (async () => {
      for (const n of order) {
        if (cancelled) return;
        const upstreamFailed = (DEPS[n.id] ?? []).some((d) => failed.has(d));
        setStates((s) => ({ ...s, [n.id]: upstreamFailed ? 'skipped' : 'running' }));
        await new Promise((r) => setTimeout(r, 260));
        if (cancelled) return;
        const fail = !upstreamFailed && n.id === breakNode;
        if (fail || upstreamFailed) failed.add(n.id);
        setStates((s) => ({ ...s, [n.id]: upstreamFailed ? 'skipped' : fail ? 'fail' : 'pass' }));
      }
      setPublished(failed.size ? 'yesterday' : 'today');
      setRunning(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [running, breakNode]);

  const run = () => {
    setStates(Object.fromEntries(DAG.map((n) => [n.id, 'idle'])));
    setPublished('yesterday');
    setRunning(true);
  };
  const color = (s: NodeState) => (s === 'pass' ? '#A5D6A7' : s === 'fail' ? '#EF9A9A' : s === 'running' ? '#FFE082' : s === 'skipped' ? '#E0E0E0' : 'rgba(255,255,255,0.6)');
  const tests = DAG.reduce((a, n) => a + n.tests, 0);

  return (
    <DemoFrame footer={`${DAG.length} models, ${tests} contracts. A failed contract blocks publish for that mart and everything downstream; the previous snapshot stays live. Click a model to plant a failing test, then run.`}>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={run} disabled={running} className="rounded px-3 py-1.5 font-ui text-[11px] uppercase tracking-wider text-white disabled:opacity-50" style={{ background: accent }}>
          {running ? 'Running…' : 'Run nightly'}
        </button>
        <span className="font-ui text-[11px] text-ink/60">{breakNode ? `Failing test planted in ${breakNode}` : 'All contracts healthy'}</span>
        <div className="ml-auto flex gap-2">
          <Stat label="Dashboards show" value={published === 'today' ? 'TODAY' : 'YESTERDAY'} tone={published === 'today' ? 'good' : 'warn'} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((layer) => (
          <div key={layer} className="space-y-2">
            <p className="font-ui text-[10px] uppercase tracking-wider text-ink/50">{['staged', 'intermediate', 'marts'][layer]}</p>
            {DAG.filter((n) => n.layer === layer).map((n) => (
              <button
                key={n.id}
                onClick={() => setBreakNode((b) => (b === n.id ? null : n.id))}
                className="w-full rounded border px-2 py-2 text-left font-ui text-[10px] leading-tight transition-colors"
                style={{ background: color(states[n.id]), borderColor: breakNode === n.id ? '#B71C1C' : 'rgba(21,21,21,0.2)', color: INK }}
              >
                <div className="font-semibold">{n.id}</div>
                <div className="text-ink/60">
                  {n.tests} tests · {states[n.id]}
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </DemoFrame>
  );
}

/* ─── 05 · Score API ───────────────────────────────────────────────────── */
export function ScoreApiDemo({ accent }: DemoProps) {
  const [util, setUtil] = useState(0.42);
  const [late, setLate] = useState(1);
  const [income, setIncome] = useState(68);
  const [age, setAge] = useState(34);
  const out = useMemo(() => {
    // logistic score with fixed coefficients (stand-in for the XGBoost + SHAP service)
    const contribs = [
      { feature: 'revolving_utilisation', value: util, contrib: 2.6 * (util - 0.35) },
      { feature: 'times_90d_late_2y', value: late, contrib: 0.9 * late - 0.4 },
      { feature: 'monthly_income_k', value: income, contrib: -0.018 * (income - 60) },
      { feature: 'age', value: age, contrib: -0.012 * (age - 40) },
    ];
    const logit = -1.9 + contribs.reduce((a, c) => a + c.contrib, 0);
    const p = 1 / (1 + Math.exp(-logit));
    const reasons = [...contribs].sort((a, b) => Math.abs(b.contrib) - Math.abs(a.contrib)).slice(0, 3).map((c) => ({ code: c.feature, direction: c.contrib > 0 ? 'raises_risk' : 'lowers_risk', shap: Number(c.contrib.toFixed(3)) }));
    return { p, reasons };
  }, [util, late, income, age]);
  const json = JSON.stringify({ score: Number((1 - out.p).toFixed(3)), default_probability: Number(out.p.toFixed(3)), reasons: out.reasons, model_sha: '3f9a1c2', latency_ms: 11 }, null, 2);

  return (
    <DemoFrame footer="POST /score → {score, reasons, model_sha}. Reason codes are the top-3 SHAP contributions. The SHA is what lets ops roll back before lunch.">
      <Controls>
        <Slider label="Revolving utilisation" min={0} max={1} step={0.01} value={util} onChange={setUtil} accent={accent} format={(v) => `${Math.round(v * 100)}%`} />
        <Slider label="Times 90d late (2y)" min={0} max={6} value={late} onChange={setLate} accent={accent} />
        <Slider label="Monthly income" min={20} max={200} value={income} onChange={setIncome} accent={accent} format={(v) => `$${v}k`} />
        <Slider label="Age" min={19} max={80} value={age} onChange={setAge} accent={accent} />
      </Controls>
      <div className="grid gap-3 sm:grid-cols-[1fr_1.3fr]">
        <div className="grid grid-cols-2 gap-2 content-start">
          <Stat label="Score" value={(1 - out.p).toFixed(3)} tone={out.p > 0.5 ? 'bad' : out.p > 0.25 ? 'warn' : 'good'} />
          <Stat label="p(default)" value={`${(out.p * 100).toFixed(1)}%`} />
          <Stat label="p95 latency" value="11 ms" />
          <Stat label="Canary Δ AUC" value="< 0.01" tone="good" />
        </div>
        <pre className="max-h-56 overflow-auto rounded border border-ink/15 bg-ink px-3 py-2 font-ui text-[10px] leading-relaxed text-paper">{json}</pre>
      </div>
    </DemoFrame>
  );
}

/* ─── 05 · Executive KPI twin ──────────────────────────────────────────── */
export function ExecKpiDemo({ accent }: DemoProps) {
  const [noise, setNoise] = useState(0.4);
  const kpis = useMemo(() => {
    const rand = rng(53);
    const defs = [
      { name: 'Growth', owner: 'Enrolments', base: 4.2, unit: '%' },
      { name: 'Quality', owner: 'Academic ops', base: 91, unit: '%' },
      { name: 'Risk', owner: 'Finance', base: 2.1, unit: '%' },
      { name: 'Cost', owner: 'Facilities', base: 118, unit: 'k' },
      { name: 'Surprise', owner: 'Analytics', base: 0, unit: 'σ' },
    ];
    return defs.map((d, i) => {
      const series = Array.from({ length: 12 }, (_, t) => d.base + (i === 4 ? 0 : d.base * 0.03) * Math.sin(t / 2 + i) + gaussian(rand) * (i === 4 ? noise : d.base * 0.02 * noise));
      const expected = Array.from({ length: 12 }, (_, t) => d.base + (i === 4 ? 0 : d.base * 0.03) * Math.sin(t / 2 + i));
      const bandW = i === 4 ? 1.0 : Math.max(0.05, d.base * 0.05);
      const last = series[11];
      const resid = last - expected[11];
      const out = Math.abs(resid) > bandW;
      return { ...d, series, expected, bandW, last, resid, out };
    });
  }, [noise]);
  const red = kpis.filter((k) => k.out).length;

  return (
    <DemoFrame footer="Each KPI has a definition, an owner and an expected band from the metrics layer. The residual is the twin. Red means: bring it up in the meeting.">
      <Controls>
        <Slider label="World noise" min={0} max={2} step={0.05} value={noise} onChange={setNoise} accent={accent} format={(v) => v.toFixed(2)} />
        <div className="grid grid-cols-2 gap-2">
          <Stat label="KPIs" value={kpis.length} />
          <Stat label="Out of band" value={red} tone={red ? 'bad' : 'good'} />
        </div>
      </Controls>
      <div className="grid grid-cols-5 gap-2">
        {kpis.map((k) => (
          <div key={k.name} className="rounded border px-2 py-2" style={{ borderColor: k.out ? '#B71C1C' : 'rgba(21,21,21,0.2)', background: k.out ? '#FFCDD2' : 'rgba(255,255,255,0.6)' }}>
            <div className="font-ui text-[9px] uppercase tracking-wider text-ink/55">{k.name}</div>
            <div className="font-display text-xl text-ink">
              {k.last.toFixed(k.unit === 'k' ? 0 : 1)}
              <span className="text-xs">{k.unit}</span>
            </div>
            <svg viewBox="0 0 100 28" className="mt-1 w-full">
              <polyline fill="none" stroke={INK} strokeOpacity={0.25} strokeWidth={1} points={k.expected.map((v, t) => `${(t / 11) * 100},${14 - ((v - k.base) / (k.bandW * 3)) * 12}`).join(' ')} />
              <polyline fill="none" stroke={k.out ? '#B71C1C' : accent} strokeWidth={1.6} points={k.series.map((v, t) => `${(t / 11) * 100},${Math.max(1, Math.min(27, 14 - ((v - k.base) / (k.bandW * 3)) * 12))}`).join(' ')} />
            </svg>
            <div className="font-ui text-[9px] text-ink/50">{k.owner}</div>
          </div>
        ))}
      </div>
    </DemoFrame>
  );
}

/* ─── 06 · Shared graph ────────────────────────────────────────────────── */
interface GNode {
  id: string;
  x: number;
  y: number;
  kind: string;
  group?: number;
}
interface GEdge {
  a: string;
  b: string;
  w?: number;
}

function reachable(nodes: GNode[], edges: GEdge[], from: string, cut: Set<string>) {
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (cut.has(`${e.a}|${e.b}`)) return;
    adj.get(e.a)!.push(e.b);
    adj.get(e.b)!.push(e.a);
  });
  const seen = new Set<string>([from]);
  const q = [from];
  while (q.length) {
    const v = q.shift()!;
    for (const w of adj.get(v)!) if (!seen.has(w)) (seen.add(w), q.push(w));
  }
  return seen;
}

function betweenness(nodes: GNode[], edges: GEdge[], cut: Set<string>) {
  // Brandes, unweighted
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (cut.has(`${e.a}|${e.b}`)) return;
    adj.get(e.a)!.push(e.b);
    adj.get(e.b)!.push(e.a);
  });
  const cb = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  for (const s of nodes) {
    const stack: string[] = [];
    const pred = new Map<string, string[]>(nodes.map((n) => [n.id, []]));
    const sigma = new Map<string, number>(nodes.map((n) => [n.id, 0]));
    const dist = new Map<string, number>(nodes.map((n) => [n.id, -1]));
    sigma.set(s.id, 1);
    dist.set(s.id, 0);
    const q = [s.id];
    while (q.length) {
      const v = q.shift()!;
      stack.push(v);
      for (const w of adj.get(v)!) {
        if (dist.get(w)! < 0) (dist.set(w, dist.get(v)! + 1), q.push(w));
        if (dist.get(w) === dist.get(v)! + 1) (sigma.set(w, sigma.get(w)! + sigma.get(v)!), pred.get(w)!.push(v));
      }
    }
    const delta = new Map<string, number>(nodes.map((n) => [n.id, 0]));
    while (stack.length) {
      const w = stack.pop()!;
      for (const v of pred.get(w)!) delta.set(v, delta.get(v)! + (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!));
      if (w !== s.id) cb.set(w, cb.get(w)! + delta.get(w)!);
    }
  }
  return cb;
}

function GraphSvg({
  nodes,
  edges,
  cut,
  onEdge,
  nodeFill,
  nodeStroke,
  edgeStroke,
  onNode,
  labels = true,
}: {
  nodes: GNode[];
  edges: GEdge[];
  cut: Set<string>;
  onEdge?: (key: string) => void;
  onNode?: (id: string) => void;
  nodeFill: (n: GNode) => string;
  nodeStroke?: (n: GNode) => string;
  edgeStroke?: (e: GEdge) => string;
  labels?: boolean;
}) {
  const pos = new Map(nodes.map((n) => [n.id, n]));
  return (
    <svg viewBox="0 0 640 300" className="w-full select-none">
      {edges.map((e) => {
        const a = pos.get(e.a)!;
        const b = pos.get(e.b)!;
        const key = `${e.a}|${e.b}`;
        const isCut = cut.has(key);
        return (
          <g key={key} onClick={() => onEdge?.(key)} className={onEdge ? 'cursor-pointer' : undefined}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={14} />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={isCut ? '#B71C1C' : edgeStroke?.(e) ?? 'rgba(21,21,21,0.35)'} strokeWidth={isCut ? 1 : 1.6 + (e.w ?? 0)} strokeDasharray={isCut ? '4 4' : undefined} />
          </g>
        );
      })}
      {nodes.map((n) => (
        <g key={n.id} onClick={() => onNode?.(n.id)} className={onNode ? 'cursor-pointer' : undefined}>
          <circle cx={n.x} cy={n.y} r={n.kind === 'hub' ? 13 : 9} fill={nodeFill(n)} stroke={nodeStroke?.(n) ?? INK} strokeWidth={1.4} />
          {labels && (
            <text x={n.x} y={n.y - 14} fontSize="9" textAnchor="middle" fill={INK} fontFamily="JetBrains Mono, monospace">
              {n.id}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ─── 06 · Supplier risk web ───────────────────────────────────────────── */
const SUPPLY_NODES: GNode[] = [
  { id: 'Vendor-A', x: 60, y: 60, kind: 'vendor' },
  { id: 'Vendor-B', x: 60, y: 150, kind: 'vendor' },
  { id: 'Vendor-C', x: 60, y: 240, kind: 'vendor' },
  { id: 'Port-Shanghai', x: 200, y: 105, kind: 'hub' },
  { id: 'Port-Singapore', x: 200, y: 215, kind: 'hub' },
  { id: 'Port-Melbourne', x: 340, y: 150, kind: 'hub' },
  { id: 'DC-West', x: 470, y: 80, kind: 'dc' },
  { id: 'DC-East', x: 470, y: 220, kind: 'dc' },
  { id: 'Hosp-1', x: 590, y: 50, kind: 'hospital' },
  { id: 'Hosp-2', x: 590, y: 150, kind: 'hospital' },
  { id: 'Hosp-3', x: 590, y: 250, kind: 'hospital' },
];
const SUPPLY_EDGES: GEdge[] = [
  { a: 'Vendor-A', b: 'Port-Shanghai', w: 1 },
  { a: 'Vendor-B', b: 'Port-Shanghai' },
  { a: 'Vendor-B', b: 'Port-Singapore' },
  { a: 'Vendor-C', b: 'Port-Singapore', w: 1 },
  { a: 'Port-Shanghai', b: 'Port-Melbourne', w: 2 },
  { a: 'Port-Singapore', b: 'Port-Melbourne', w: 1 },
  { a: 'Port-Melbourne', b: 'DC-West', w: 1 },
  { a: 'Port-Melbourne', b: 'DC-East', w: 1 },
  { a: 'DC-West', b: 'Hosp-1' },
  { a: 'DC-West', b: 'Hosp-2' },
  { a: 'DC-East', b: 'Hosp-2' },
  { a: 'DC-East', b: 'Hosp-3' },
];

export function SupplierRiskDemo({ accent }: DemoProps) {
  const [cut, setCut] = useState<Set<string>>(new Set());
  const bc = useMemo(() => betweenness(SUPPLY_NODES, SUPPLY_EDGES, cut), [cut]);
  const maxBc = Math.max(...bc.values(), 1);
  const supplied = useMemo(() => {
    const fromVendors = SUPPLY_NODES.filter((n) => n.kind === 'vendor').map((v) => reachable(SUPPLY_NODES, SUPPLY_EDGES, v.id, cut));
    return new Set(SUPPLY_NODES.filter((n) => n.kind === 'hospital' && fromVendors.some((r) => r.has(n.id))).map((n) => n.id));
  }, [cut]);
  const starved = SUPPLY_NODES.filter((n) => n.kind === 'hospital' && !supplied.has(n.id));
  const top = [...bc.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <DemoFrame footer="Node size = hub; fill = betweenness centrality (darker = more paths run through it). Click an edge to cut it and watch which hospitals lose supply. Click again to restore.">
      <div className="flex flex-wrap items-center gap-2">
        <Stat label="Most central" value={top?.[0] ?? '—'} />
        <Stat label="Edges cut" value={cut.size} tone={cut.size ? 'warn' : 'ink'} />
        <Stat label="Hospitals starved" value={starved.length} tone={starved.length ? 'bad' : 'good'} />
        {cut.size > 0 && (
          <button onClick={() => setCut(new Set())} className="ml-auto rounded border border-ink/30 px-2 py-1 font-ui text-[10px] uppercase tracking-wider text-ink">
            restore all
          </button>
        )}
      </div>
      <GraphSvg
        nodes={SUPPLY_NODES}
        edges={SUPPLY_EDGES}
        cut={cut}
        onEdge={(k) =>
          setCut((c) => {
            const n = new Set(c);
            n.has(k) ? n.delete(k) : n.add(k);
            return n;
          })
        }
        nodeFill={(n) => {
          if (n.kind === 'hospital') return supplied.has(n.id) ? '#A5D6A7' : '#EF9A9A';
          const t = (bc.get(n.id) ?? 0) / maxBc;
          return `rgba(${hexToRgb(accent)}, ${0.15 + 0.85 * t})`;
        }}
      />
    </DemoFrame>
  );
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/* ─── 06 · Collaboration map ───────────────────────────────────────────── */
const COLLAB = (() => {
  const rand = rng(61);
  const groups = [
    { cx: 120, cy: 150, n: 9 },
    { cx: 330, cy: 90, n: 8 },
    { cx: 330, cy: 220, n: 7 },
    { cx: 540, cy: 150, n: 9 },
  ];
  const nodes: GNode[] = [];
  const edges: GEdge[] = [];
  groups.forEach((g, gi) => {
    for (let i = 0; i < g.n; i++) {
      const ang = (i / g.n) * Math.PI * 2;
      nodes.push({ id: `${'ABCD'[gi]}${i + 1}`, x: g.cx + Math.cos(ang) * (38 + rand() * 18), y: g.cy + Math.sin(ang) * (32 + rand() * 14), kind: 'author', group: gi });
    }
    const ids = nodes.filter((n) => n.group === gi).map((n) => n.id);
    ids.forEach((a, i) => ids.slice(i + 1).forEach((b) => rand() < 0.35 && edges.push({ a, b })));
  });
  const bridges: GEdge[] = [
    { a: 'A3', b: 'B5' },
    { a: 'B2', b: 'D4' },
    { a: 'C1', b: 'D7' },
    { a: 'A6', b: 'C4' },
  ];
  return { nodes, edges: edges.concat(bridges), bridges };
})();

export function CollabMapDemo({ accent }: DemoProps) {
  const [hover, setHover] = useState<number | null>(null);
  const bridgeNodes = new Set(COLLAB.bridges.flatMap((b) => [b.a, b.b]));
  const palette = ['#B71C1C', '#1565C0', '#2E7D32', accent];
  const modularity = 0.46;
  return (
    <DemoFrame footer="Co-authorship projected from author lists, Leiden communities, and bridge ranking. Bridges are the people who connect otherwise separate labs. Hover a community to isolate it.">
      <div className="flex flex-wrap items-center gap-2">
        {['Lab A', 'Lab B', 'Lab C', 'Lab D'].map((l, i) => (
          <button key={l} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover((h) => (h === i ? null : i))} className="rounded-full border px-3 py-1 font-ui text-[10px] uppercase tracking-wider" style={{ borderColor: palette[i], color: palette[i], background: hover === i ? `${palette[i]}22` : 'transparent' }}>
            {l}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <Stat label="Communities" value={4} />
          <Stat label="Bridges" value={COLLAB.bridges.length} />
          <Stat label="Modularity" value={modularity} />
        </div>
      </div>
      <GraphSvg
        nodes={COLLAB.nodes}
        edges={COLLAB.edges}
        cut={new Set()}
        labels={false}
        nodeFill={(n) => (hover === null || n.group === hover ? palette[n.group ?? 0] : 'rgba(21,21,21,0.12)')}
        nodeStroke={(n) => (bridgeNodes.has(n.id) ? '#FFD700' : INK)}
        edgeStroke={(e) => (COLLAB.bridges.includes(e) ? '#FFD700' : 'rgba(21,21,21,0.2)')}
      />
    </DemoFrame>
  );
}

/* ─── 06 · Fraud ring case pack ────────────────────────────────────────── */
const FRAUD_NODES: GNode[] = [
  { id: 'acct-102', x: 90, y: 80, kind: 'acct' },
  { id: 'acct-117', x: 90, y: 220, kind: 'acct' },
  { id: 'acct-133', x: 230, y: 40, kind: 'acct' },
  { id: 'acct-140', x: 230, y: 260, kind: 'acct' },
  { id: 'device-7f', x: 230, y: 150, kind: 'hub' },
  { id: 'addr-Elm-12', x: 380, y: 90, kind: 'hub' },
  { id: 'acct-151', x: 380, y: 230, kind: 'acct' },
  { id: 'acct-168', x: 520, y: 60, kind: 'acct' },
  { id: 'acct-172', x: 520, y: 160, kind: 'acct' },
  { id: 'acct-190', x: 520, y: 260, kind: 'acct' },
];
const FRAUD_EDGES: GEdge[] = [
  { a: 'acct-102', b: 'device-7f' },
  { a: 'acct-117', b: 'device-7f' },
  { a: 'acct-133', b: 'device-7f' },
  { a: 'acct-140', b: 'device-7f' },
  { a: 'acct-133', b: 'addr-Elm-12' },
  { a: 'acct-151', b: 'addr-Elm-12' },
  { a: 'acct-168', b: 'addr-Elm-12' },
  { a: 'acct-151', b: 'device-7f' },
  { a: 'acct-172', b: 'acct-168' },
  { a: 'acct-190', b: 'acct-172' },
];
const RING = new Set(['acct-102', 'acct-117', 'acct-133', 'acct-140', 'acct-151', 'device-7f']);

export function FraudRingDemo({ accent }: DemoProps) {
  const [sel, setSel] = useState<string | null>(null);
  const reach = sel ? reachable(FRAUD_NODES, FRAUD_EDGES, sel, new Set()) : null;
  const ringHit = sel ? [...RING].filter((r) => reach?.has(r)).length : 0;
  const inRing = sel ? RING.has(sel) : false;
  return (
    <DemoFrame footer="Edges are shared devices and shared addresses. A community that looks like a family until five accounts share one device and a velocity spike. The case pack is the six nodes and one sentence.">
      <GraphSvg
        nodes={FRAUD_NODES}
        edges={FRAUD_EDGES}
        cut={new Set()}
        onNode={(id) => setSel((s) => (s === id ? null : id))}
        nodeFill={(n) => (sel === n.id ? '#FFD700' : RING.has(n.id) ? `rgba(${hexToRgb(accent)}, 0.75)` : 'rgba(255,255,255,0.8)')}
        nodeStroke={(n) => (reach?.has(n.id) ? '#B71C1C' : INK)}
        edgeStroke={(e) => (RING.has(e.a) && RING.has(e.b) ? accent : 'rgba(21,21,21,0.25)')}
      />
      <div className="rounded border bg-white/70 px-3 py-2 font-body text-sm text-ink" style={{ borderColor: accent }}>
        {sel ? (
          <>
            <p className="font-ui text-[10px] uppercase tracking-wider text-ink/55">Case pack · {sel}</p>
            <p className="mt-1">
              {inRing
                ? `${sel} shares device-7f with ${ringHit - 2} other accounts opened within 9 days; two also share addr-Elm-12. PR-AUC-ranked risk 0.91. Recommend: hold payouts, request ID.`
                : `${sel} touches the ring only through addr-Elm-12 (${ringHit} ring nodes reachable). Likely a genuine household member. Recommend: no action, monitor velocity.`}
            </p>
          </>
        ) : (
          <p className="text-ink/60">Select a node to build its case pack.</p>
        )}
      </div>
    </DemoFrame>
  );
}
