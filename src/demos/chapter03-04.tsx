import { useMemo, useState } from 'react';
import { Bars, Controls, DemoFrame, LineChart, Slider, Stat, gaussian, rng, INK, type DemoProps } from './primitives';

/* ─── 03 · Retention uplift (Qini) ─────────────────────────────────────── */
export function UpliftDemo({ accent }: DemoProps) {
  const [frac, setFrac] = useState(0.2);
  const curve = useMemo(() => {
    const rand = rng(13);
    const N = 2000;
    // customers with true uplift: heterogeneous; scored by a noisy model
    const cust = Array.from({ length: N }, () => {
      const persuadable = rand() < 0.22;
      const uplift = persuadable ? 0.35 + rand() * 0.3 : rand() < 0.15 ? -0.1 : 0.02;
      const score = uplift + gaussian(rand) * 0.15;
      return { uplift, score };
    }).sort((a, b) => b.score - a.score);
    const pts: number[] = [];
    let cum = 0;
    for (let i = 0; i < N; i++) {
      cum += cust[i].uplift;
      if (i % 40 === 0) pts.push(cum);
    }
    pts.push(cum);
    const total = cum;
    const random = pts.map((_, i) => (total * i) / (pts.length - 1));
    const k = Math.min(pts.length - 1, Math.round(frac * (pts.length - 1)));
    const qini = (pts[k] - random[k]) / total;
    const captured = pts[k] / total;
    return { pts, random, k, qini, captured };
  }, [frac]);

  return (
    <DemoFrame footer="Customers are ranked by predicted incremental save (T-learner). The Qini curve is cumulative incremental saves vs. random targeting. The area between them is what the model is worth.">
      <Controls>
        <Slider label="Targeting fraction" min={0.05} max={1} step={0.05} value={frac} onChange={setFrac} accent={accent} format={(v) => `${Math.round(v * 100)}%`} />
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Saves captured" value={`${Math.round(curve.captured * 100)}%`} tone="good" />
          <Stat label="Budget spent" value={`${Math.round(frac * 100)}%`} tone={frac > 0.6 ? 'warn' : 'ink'} />
          <Stat label="Qini @ frac" value={curve.qini.toFixed(2)} tone={curve.qini > 0.1 ? 'good' : 'warn'} />
        </div>
      </Controls>
      <LineChart
        series={[
          { name: 'Uplift model', values: curve.pts, color: accent },
          { name: 'Random targeting', values: curve.random, color: INK, dashed: true },
        ]}
        markerX={curve.k}
        markerLabel={`target ${Math.round(frac * 100)}%`}
        xLabels={curve.pts.map((_, i) => (i % 10 === 0 ? `${Math.round((i / (curve.pts.length - 1)) * 100)}%` : ''))}
      />
    </DemoFrame>
  );
}

/* ─── 03 · Fare synthetic control ──────────────────────────────────────── */
export function SyntheticControlDemo({ accent }: DemoProps) {
  const [event, setEvent] = useState(14);
  const data = useMemo(() => {
    const rand = rng(17);
    const T = 24;
    const donors = Array.from({ length: 6 }, (_, d) => Array.from({ length: T }, (_, t) => 100 + 6 * Math.sin(t / 3 + d) + 0.6 * t + gaussian(rand) * 1.2));
    // treated = convex combination of donors + effect after event
    const w = [0.35, 0.25, 0.2, 0.1, 0.07, 0.03];
    const synthetic = Array.from({ length: T }, (_, t) => donors.reduce((s, d, i) => s + w[i] * d[t], 0));
    const treated = synthetic.map((v, t) => v * (t >= event ? 0.936 : 1) + gaussian(rand) * 0.9);
    const post = treated.slice(event).map((v, i) => v - synthetic[event + i]);
    const att = post.length ? post.reduce((a, b) => a + b, 0) / post.length / (synthetic[event] || 1) : 0;
    const pre = treated.slice(0, event).map((v, i) => (v - synthetic[i]) ** 2);
    const rmspe = Math.sqrt(pre.reduce((a, b) => a + b, 0) / Math.max(1, pre.length)) / 100;
    const placebo = donors[0].map((v, t) => v + (t >= event ? gaussian(rand) * 0.4 : 0));
    return { treated, synthetic, att, rmspe, placebo, donorRef: donors[0] };
  }, [event]);

  return (
    <DemoFrame footer="Weights over 18 donor routes are chosen to match the treated city before the event. The dashed line is the city that did not change its fare. Placebo-in-space runs the same recipe on a donor that never changed anything.">
      <Controls>
        <Slider label="Fare change month" min={8} max={20} value={event} onChange={setEvent} accent={accent} format={(v) => `m${v}`} />
        <div className="grid grid-cols-3 gap-2">
          <Stat label="ATT boardings" value={`${(data.att * 100).toFixed(1)}%`} tone="bad" />
          <Stat label="Pre-fit RMSPE" value={data.rmspe.toFixed(3)} tone="good" />
          <Stat label="Placebo gap" value={`${((data.placebo[23] - data.donorRef[23]) / data.donorRef[23] * 100).toFixed(1)}%`} tone="good" />
        </div>
      </Controls>
      <LineChart
        series={[
          { name: 'Treated city', values: data.treated, color: INK, width: 2.4 },
          { name: 'Synthetic control', values: data.synthetic, color: accent, dashed: true },
        ]}
        markerX={event}
        markerLabel="fare change"
        xLabels={Array.from({ length: 24 }, (_, i) => `m${i}`)}
      />
    </DemoFrame>
  );
}

/* ─── 03 · Warehouse twin (event-driven sim) ───────────────────────────── */
function simulate(packers: number, arrivalsPerHr: number, seed: number) {
  const rand = rng(seed);
  const exp = (mean: number) => -Math.log(1 - rand()) * mean;
  const horizon = 8 * 60; // minutes
  type Ev = { t: number; kind: 'arrive' | 'done'; id: number };
  const q: Ev[] = [];
  const push = (e: Ev) => {
    q.push(e);
    q.sort((a, b) => a.t - b.t);
  };
  let t = 0;
  let id = 0;
  push({ t: exp(60 / arrivalsPerHr), kind: 'arrive', id: id++ });
  const waiting: { id: number; t: number }[] = [];
  let busy = 0;
  let served = 0;
  let late = 0;
  let waitSum = 0;
  let busyMinutes = 0;
  let lastT = 0;
  while (q.length && q[0].t < horizon) {
    const e = q.shift()!;
    busyMinutes += busy * (e.t - lastT);
    lastT = e.t;
    t = e.t;
    if (e.kind === 'arrive') {
      waiting.push({ id: e.id, t });
      push({ t: t + exp(60 / arrivalsPerHr), kind: 'arrive', id: id++ });
    } else {
      busy--;
    }
    while (busy < packers && waiting.length) {
      const job = waiting.shift()!;
      const wait = t - job.t;
      waitSum += wait;
      if (wait > 20) late++;
      served++;
      busy++;
      push({ t: t + 4 + exp(5), kind: 'done', id: job.id });
    }
  }
  return {
    served,
    lateRate: served ? late / served : 0,
    avgWait: served ? waitSum / served : 0,
    util: busyMinutes / (horizon * packers),
    queueEnd: waiting.length,
  };
}

export function WarehouseSimDemo({ accent }: DemoProps) {
  const [packers, setPackers] = useState(3);
  const [arrivals, setArrivals] = useState(18);
  const res = useMemo(() => simulate(packers, arrivals, 31), [packers, arrivals]);
  const alt = useMemo(() => simulate(packers + 1, arrivals, 31), [packers, arrivals]);
  return (
    <DemoFrame footer="An 8-hour shift, exponential arrivals, 4 + Exp(5) minute pack time, late if waiting > 20 min. Same seed for every scenario so comparisons are fair.">
      <Controls>
        <Slider label="Packers on shift" min={1} max={6} value={packers} onChange={setPackers} accent={accent} />
        <Slider label="Orders per hour" min={6} max={40} value={arrivals} onChange={setArrivals} accent={accent} />
      </Controls>
      <div className="grid grid-cols-4 gap-2">
        <Stat label="Orders packed" value={res.served} />
        <Stat label="Late rate" value={`${(res.lateRate * 100).toFixed(0)}%`} tone={res.lateRate > 0.2 ? 'bad' : res.lateRate > 0.08 ? 'warn' : 'good'} />
        <Stat label="Avg wait (min)" value={res.avgWait.toFixed(1)} tone={res.avgWait > 15 ? 'warn' : 'ink'} />
        <Stat label="Utilisation" value={`${Math.round(res.util * 100)}%`} tone={res.util > 0.92 ? 'warn' : 'good'} />
      </div>
      <div className="rounded border border-dashed px-3 py-2 font-ui text-[11px] text-ink/75" style={{ borderColor: accent }}>
        Scenario: +1 packer → late rate {(alt.lateRate * 100).toFixed(0)}% (from {(res.lateRate * 100).toFixed(0)}%), utilisation {Math.round(alt.util * 100)}%.
        {res.queueEnd > 0 && ` ${res.queueEnd} orders still in queue at shift end.`}
      </div>
    </DemoFrame>
  );
}

/* ─── 04 · Land-use change ─────────────────────────────────────────────── */
const CLASSES = ['Forest', 'Crop', 'Pasture', 'Urban', 'Water'];
const CLASS_COLOR: Record<string, string> = { Forest: '#2E7D32', Crop: '#C0CA33', Pasture: '#9CCC65', Urban: '#8D6E63', Water: '#4FC3F7' };

export function LandUseDemo({ accent }: DemoProps) {
  const [thresh, setThresh] = useState(0.8);
  const tiles = useMemo(() => {
    const rand = rng(41);
    const n = 12;
    return Array.from({ length: n * n }, (_, i) => {
      const r = Math.floor(i / n);
      const c = i % n;
      const before = c < 4 ? 'Forest' : c < 8 ? (r < 6 ? 'Crop' : 'Pasture') : r > 8 ? 'Water' : 'Urban';
      let after = before;
      if ((before === 'Crop' || before === 'Pasture') && c >= 6 && rand() < 0.45) after = 'Urban';
      if (before === 'Forest' && c === 3 && rand() < 0.3) after = 'Crop';
      const conf = after !== before ? 0.55 + rand() * 0.45 : 0.75 + rand() * 0.25;
      return { before, after, conf };
    });
  }, []);
  const unsure = tiles.filter((t) => t.conf < thresh).length;
  const transitions = CLASSES.map((from) => CLASSES.map((to) => tiles.filter((t) => t.before === from && t.after === to && t.conf >= thresh).length));
  const toUrban = tiles.filter((t) => t.after === 'Urban' && t.before !== 'Urban' && t.conf >= thresh).length;

  return (
    <DemoFrame footer="Left: last year. Right: this year, hatched where the model is below the confidence threshold. Those tiles go to the planner as “unsure”, not into the hectare total.">
      <Controls>
        <Slider label="Confidence threshold" min={0.5} max={0.98} step={0.01} value={thresh} onChange={setThresh} accent={accent} format={(v) => v.toFixed(2)} />
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Unsure tiles" value={`${((unsure / tiles.length) * 100).toFixed(1)}%`} tone={unsure / tiles.length > 0.1 ? 'warn' : 'good'} />
          <Stat label="→ Urban (ha)" value={toUrban * 6.4} />
          <Stat label="Classes" value={CLASSES.length} />
        </div>
      </Controls>
      <div className="grid grid-cols-2 gap-3">
        {(['before', 'after'] as const).map((k) => (
          <div key={k}>
            <p className="mb-1 font-ui text-[10px] uppercase tracking-wider text-ink/55">{k === 'before' ? 'Last year' : 'This year'}</p>
            <div className="grid grid-cols-12 gap-[2px]">
              {tiles.map((t, i) => (
                <span
                  key={i}
                  className="aspect-square"
                  style={{
                    background: CLASS_COLOR[t[k]],
                    backgroundImage: k === 'after' && t.conf < thresh ? 'repeating-linear-gradient(45deg, rgba(0,0,0,0.55) 0 2px, transparent 2px 4px)' : undefined,
                    outline: k === 'after' && t.after !== t.before ? `1px solid ${accent}` : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="overflow-auto">
        <table className="w-full font-ui text-[10px]">
          <thead>
            <tr>
              <th className="px-1 text-left text-ink/50">from \ to</th>
              {CLASSES.map((c) => (
                <th key={c} className="px-1 text-right text-ink/50">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transitions.map((row, i) => (
              <tr key={CLASSES[i]}>
                <td className="px-1 text-ink/70">{CLASSES[i]}</td>
                {row.map((v, j) => (
                  <td key={j} className="px-1 text-right" style={{ color: i !== j && v ? accent : INK, fontWeight: i !== j && v ? 700 : 400 }}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoFrame>
  );
}

/* ─── 04 · Inspection KPI board ────────────────────────────────────────── */
export function InspectionKpiDemo({ accent }: DemoProps) {
  const [rate, setRate] = useState(1.0);
  const board = useMemo(() => {
    const rand = rng(43);
    const defects = ['Scratch', 'Dent', 'Misprint', 'Gap', 'Burr'];
    const pareto = defects.map((d, i) => ({ label: d, value: Math.round((120 / (i + 1)) * rate * (0.9 + rand() * 0.2)) }));
    const stations = Array.from({ length: 8 }, (_, s) => {
      const fails = Math.round(rand() * 1.4 * rate + (s === 5 ? 1.2 * rate : 0));
      return { id: s + 1, fails, frozen: fails >= 2 };
    });
    const inspected = 42000;
    const ppm = Math.round((pareto.reduce((a, b) => a + b.value, 0) / inspected) * 1e6);
    return { pareto, stations, ppm };
  }, [rate]);
  return (
    <DemoFrame footer="The detector is the sensor. The board is PPM, a Pareto of defect types, and a rule: two failures at one station in a shift freezes that station’s all-clear until a human resets it.">
      <Controls>
        <Slider label="Defect rate multiplier" min={0.4} max={2.5} step={0.05} value={rate} onChange={setRate} accent={accent} format={(v) => `${v.toFixed(2)}×`} />
        <div className="grid grid-cols-2 gap-2">
          <Stat label="PPM (shift)" value={board.ppm.toLocaleString()} tone={board.ppm > 9000 ? 'bad' : board.ppm > 6000 ? 'warn' : 'good'} />
          <Stat label="Stations frozen" value={board.stations.filter((s) => s.frozen).length} tone={board.stations.some((s) => s.frozen) ? 'bad' : 'good'} />
        </div>
      </Controls>
      <Bars items={board.pareto} accent={accent} height={150} />
      <div className="grid grid-cols-8 gap-1">
        {board.stations.map((s) => (
          <div key={s.id} className="rounded border px-1 py-2 text-center font-ui text-[10px]" style={{ borderColor: s.frozen ? '#B71C1C' : 'rgba(21,21,21,0.2)', background: s.frozen ? '#FFCDD2' : 'rgba(255,255,255,0.6)' }}>
            <div className="text-ink/60">S{s.id}</div>
            <div className="font-display text-lg text-ink">{s.fails}</div>
            <div className={s.frozen ? 'text-[#B71C1C]' : 'text-[#1B5E20]'}>{s.frozen ? 'STOP' : 'clear'}</div>
          </div>
        ))}
      </div>
    </DemoFrame>
  );
}

/* ─── 04 · Vision robustness audit ─────────────────────────────────────── */
export function RobustnessAuditDemo({ accent }: DemoProps) {
  const [tol, setTol] = useState(0.15);
  const [backbone, setBackbone] = useState(0);
  const backbones = ['ConvNeXt-T', 'ResNet-50', 'EfficientNet-B3', 'ViT-S'];
  const corruptions = ['Rain', 'Fog', 'Glare', 'JPEG', 'Motion blur', 'Low light'];
  const table = useMemo(() => {
    const rand = rng(47 + backbone);
    const base = [0.05, 0.08, 0.07, 0.06][backbone];
    return corruptions.map((c, ci) => [1, 2, 3].map((sev) => Math.min(0.6, base + sev * (0.045 + ci * 0.012) * (backbone === 1 ? 1.35 : 1) + rand() * 0.02)));
  }, [backbone]);
  const failing = table.flatMap((row, ci) => row.map((e, si) => ({ c: corruptions[ci], sev: si + 1, e })).filter((x) => x.e > tol));
  const firstFail = failing.sort((a, b) => a.sev - b.sev || b.e - a.e)[0];
  return (
    <DemoFrame footer="Error rate on a production-like set under ImageNet-C style corruptions at three severities. The deliverable is the sentence under the table, not the table.">
      <Controls>
        <Slider label="Acceptable error" min={0.05} max={0.4} step={0.01} value={tol} onChange={setTol} accent={accent} format={(v) => `${Math.round(v * 100)}%`} />
        <div className="flex flex-wrap gap-1">
          {backbones.map((b, i) => (
            <button
              key={b}
              onClick={() => setBackbone(i)}
              className="rounded border px-2 py-1 font-ui text-[10px]"
              style={{ borderColor: i === backbone ? accent : 'rgba(21,21,21,0.2)', background: i === backbone ? accent : 'transparent', color: i === backbone ? '#fff' : INK }}
            >
              {b}
            </button>
          ))}
        </div>
      </Controls>
      <table className="w-full font-ui text-[10px]">
        <thead>
          <tr>
            <th className="text-left text-ink/50">corruption</th>
            {[1, 2, 3].map((s) => (
              <th key={s} className="text-center text-ink/50">
                sev {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.map((row, ci) => (
            <tr key={corruptions[ci]}>
              <td className="py-[3px] text-ink/80">{corruptions[ci]}</td>
              {row.map((e, si) => (
                <td key={si} className="px-1 py-[3px]">
                  <div className="rounded px-2 py-1 text-center" style={{ background: e > tol ? '#EF9A9A' : e > tol * 0.75 ? '#FFE082' : '#A5D6A7', color: INK }}>
                    {(e * 100).toFixed(0)}%
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="rounded border-l-4 bg-white/60 px-3 py-2 font-body text-sm text-ink" style={{ borderColor: accent }}>
        {firstFail
          ? `Do not update inventory from this camera under ${firstFail.c.toLowerCase()} severity ≥ ${firstFail.sev} with ${backbones[backbone]}.`
          : `${backbones[backbone]} stays inside tolerance on every corruption at every severity.`}
      </p>
    </DemoFrame>
  );
}
