import { useMemo, useState } from 'react';
import { Bars, Controls, DemoFrame, LineChart, Slider, Stat, Toggle, gaussian, rng, INK, type DemoProps } from './primitives';

/* ─── 01 · Ward twin ──────────────────────────────────────────────────── */
export function WardTwinDemo({ accent }: DemoProps) {
  const [arrivals, setArrivals] = useState(1.0);
  const data = useMemo(() => {
    const rand = rng(11);
    const hours = 72;
    const base = Array.from({ length: hours }, (_, h) => 232 + 18 * Math.sin(((h % 24) - 6) * (Math.PI / 12)) + (h % 24 > 18 ? 6 : 0));
    const twin = base.map((b) => b * (0.7 + 0.3 * arrivals));
    const lower = twin.map((v) => v - 7.5);
    const upper = twin.map((v) => v + 7.5);
    const real = base.map((b, i) => b * 1.0 + gaussian(rand) * 3.2 + (i > 48 ? 2 : 0));
    // drift gate: midnight census (hour % 24 === 0) outside band two nights running
    const midnights = [24, 48].map((h) => real[h] < lower[h] || real[h] > upper[h]);
    const mae = real.reduce((s, r, i) => s + Math.abs(r - twin[i]), 0) / hours;
    const coverage = real.filter((r, i) => r >= lower[i] && r <= upper[i]).length / hours;
    return { twin, lower, upper, real, drift: midnights.every(Boolean), mae, coverage };
  }, [arrivals]);

  return (
    <DemoFrame footer="Twin = negative-binomial occupancy sampled from a synthetic cohort. Real = nightly aggregated census, the only identifiable-free truth that flows back in.">
      <Controls>
        <Slider label="Arrival multiplier" min={0.8} max={1.3} step={0.01} value={arrivals} onChange={setArrivals} accent={accent} format={(v) => `${v.toFixed(2)}×`} />
        <div className="grid grid-cols-3 gap-2">
          <Stat label="MAE beds" value={data.mae.toFixed(1)} />
          <Stat label="Coverage" value={`${Math.round(data.coverage * 100)}%`} tone={data.coverage >= 0.75 ? 'good' : 'warn'} />
          <Stat label="Drift gate" value={data.drift ? 'OPEN' : 'closed'} tone={data.drift ? 'bad' : 'good'} />
        </div>
      </Controls>
      <LineChart
        series={[
          { name: 'Twin (median)', values: data.twin, color: accent },
          { name: 'Real census', values: data.real, color: INK, width: 1.6 },
        ]}
        band={{ lower: data.lower, upper: data.upper, color: accent }}
        xLabels={Array.from({ length: 72 }, (_, i) => (i % 24 === 0 ? `night ${i / 24 + 1}` : ''))}
      />
    </DemoFrame>
  );
}

/* ─── 01 · Night economy DiD ───────────────────────────────────────────── */
export function NightEconomyDemo({ accent }: DemoProps) {
  const [trams, setTrams] = useState(4);
  const data = useMemo(() => {
    const rand = rng(7);
    const weeks = 24;
    const cut = 12;
    const effect = -0.11 * ((8 - trams) / 4); // 8 trams/hr = no cut, 4 = -11%
    const control = Array.from({ length: weeks }, (_, w) => 100 + 4 * Math.sin(w / 2.5) + gaussian(rand) * 1.4);
    const treated = control.map((c, w) => c * 1.08 * (w >= cut ? 1 + effect : 1) + gaussian(rand) * 1.4);
    const pre = (arr: number[]) => arr.slice(0, cut).reduce((a, b) => a + b, 0) / cut;
    const post = (arr: number[]) => arr.slice(cut).reduce((a, b) => a + b, 0) / (weeks - cut);
    const did = post(treated) - pre(treated) - (post(control) - pre(control));
    return { control, treated, cut, did: did / pre(treated) };
  }, [trams]);

  return (
    <DemoFrame footer="Treated = precinct that lost late trams; control = matched strip with the same weather and calendar. DiD = (post−pre)treated − (post−pre)control.">
      <Controls>
        <Slider label="Trams per hour after 11pm" min={2} max={8} value={trams} onChange={setTrams} accent={accent} />
        <div className="grid grid-cols-2 gap-2">
          <Stat label="DiD spend" value={`${(data.did * 100).toFixed(1)}%`} tone={data.did < -0.05 ? 'bad' : data.did < 0 ? 'warn' : 'good'} />
          <Stat label="Parallel pre-trend" value="✓" tone="good" />
        </div>
      </Controls>
      <LineChart
        series={[
          { name: 'Treated precinct', values: data.treated, color: accent },
          { name: 'Matched control', values: data.control, color: INK, dashed: true },
        ]}
        markerX={data.cut}
        markerLabel="service cut"
        xLabels={Array.from({ length: 24 }, (_, i) => `w${i + 1}`)}
      />
    </DemoFrame>
  );
}

/* ─── 01 · Manuscript intel ledger ─────────────────────────────────────── */
const PAPERS = (() => {
  const rand = rng(3);
  const methods = ['Transformer', 'GBM', 'Bayesian', 'GNN', 'CNN', 'Causal'];
  const datasets = ['MIMIC', 'M5', 'EuroSAT', 'ogbn-arxiv', 'Telco', 'ImageNet-C'];
  return Array.from({ length: 60 }, (_, i) => ({
    id: i,
    method: methods[Math.floor(rand() * methods.length)],
    dataset: datasets[Math.floor(rand() * datasets.length)],
    ci: rand() < 0.42,
    code: rand() < 0.55,
  }));
})();

export function ManuscriptIntelDemo({ accent }: DemoProps) {
  const [ci, setCi] = useState(false);
  const [code, setCode] = useState(false);
  const rows = PAPERS.filter((p) => (!ci || p.ci) && (!code || p.code));
  const byMethod = ['Transformer', 'GBM', 'Bayesian', 'GNN', 'CNN', 'Causal'].map((m) => ({ label: m, value: rows.filter((r) => r.method === m).length }));
  return (
    <DemoFrame footer="Each row is a paper → method → dataset → whether a CI was reported and code released. Filters are the questions a supervisor actually asks.">
      <div className="flex flex-wrap items-center gap-2">
        <Toggle label="Reports confidence interval" value={ci} onChange={setCi} accent={accent} />
        <Toggle label="Code released" value={code} onChange={setCode} accent={accent} />
        <span className="ml-auto font-ui text-[11px] text-ink/60">{rows.length} / {PAPERS.length} papers</span>
      </div>
      <Bars items={byMethod} accent={accent} height={170} />
      <div className="max-h-28 overflow-auto rounded border border-ink/15 bg-white/60 font-ui text-[10px]">
        <table className="w-full">
          <tbody>
            {rows.slice(0, 12).map((r) => (
              <tr key={r.id} className="border-b border-ink/5">
                <td className="px-2 py-1 text-ink/70">paper-{String(r.id).padStart(3, '0')}</td>
                <td className="px-2 py-1">{r.method}</td>
                <td className="px-2 py-1">{r.dataset}</td>
                <td className="px-2 py-1">{r.ci ? 'CI ✓' : '—'}</td>
                <td className="px-2 py-1">{r.code ? 'code ✓' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoFrame>
  );
}

/* ─── 02 · Campus load forecast ────────────────────────────────────────── */
export function CampusLoadDemo({ accent }: DemoProps) {
  const [temp, setTemp] = useState(22);
  const data = useMemo(() => {
    const rand = rng(21);
    const hours = 48;
    const occupancy = (h: number) => (h % 24 >= 8 && h % 24 <= 18 ? 1 : 0.35);
    const actual = Array.from({ length: hours }, (_, h) => 420 * occupancy(h) + 9 * Math.max(0, temp - 20) ** 1.35 * occupancy(h) + gaussian(rand) * 12);
    // champion trained in winter: knows occupancy, underestimates cooling load
    const champion = Array.from({ length: hours }, (_, h) => 420 * occupancy(h) + 3 * Math.max(0, temp - 20) * occupancy(h));
    // challenger: has the temperature interaction
    const challenger = Array.from({ length: hours }, (_, h) => 420 * occupancy(h) + 8.6 * Math.max(0, temp - 20) ** 1.35 * occupancy(h));
    const mae = (f: number[]) => f.reduce((s, v, i) => s + Math.abs(v - actual[i]), 0) / hours;
    const champMae = mae(champion);
    const chalMae = mae(challenger);
    const swap = champMae > 28;
    return { actual, champion, challenger, champMae, chalMae, swap };
  }, [temp]);

  return (
    <DemoFrame footer="Champion was trained on winter data; the residual grows with heat. The gate compares the last 14 days of MAE to the winter band and swaps to the challenger when it breaks.">
      <Controls>
        <Slider label="Daily max temperature" min={14} max={40} value={temp} onChange={setTemp} accent={accent} format={(v) => `${v}°C`} />
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Champion MAE" value={data.champMae.toFixed(0)} tone={data.swap ? 'bad' : 'good'} />
          <Stat label="Challenger MAE" value={data.chalMae.toFixed(0)} tone="good" />
          <Stat label="Serving" value={data.swap ? 'CHALLENGER' : 'champion'} tone={data.swap ? 'warn' : 'ink'} />
        </div>
      </Controls>
      <LineChart
        series={[
          { name: 'Actual kWh', values: data.actual, color: INK, width: 1.6 },
          { name: 'Champion', values: data.champion, color: '#9E9E9E', dashed: true },
          { name: 'Challenger', values: data.challenger, color: accent },
        ]}
        xLabels={Array.from({ length: 48 }, (_, i) => (i % 12 === 0 ? `${i % 24}:00` : ''))}
      />
    </DemoFrame>
  );
}

/* ─── 02 · SKU hierarchy (MinT) ────────────────────────────────────────── */
export function SkuHierarchyDemo({ accent }: DemoProps) {
  const [reconcile, setReconcile] = useState(false);
  const tree = useMemo(() => {
    const rand = rng(5);
    const stores = ['Store A', 'Store B', 'Store C'];
    const leaves = stores.map((s) => ({
      name: s,
      actual: 300 + rand() * 120,
    }));
    const totalActual = leaves.reduce((a, l) => a + l.actual, 0);
    const baseLeaves = leaves.map((l) => l.actual * (1 + gaussian(rand) * 0.08));
    const baseTotal = totalActual * (1 + gaussian(rand) * 0.03);
    // MinT (identity-weighted → OLS) reconciliation for a 1-level hierarchy:
    // y~ = S (S'S)^-1 S' y_hat  where S = [1 1 1; I3]
    const sumLeaves = baseLeaves.reduce((a, b) => a + b, 0);
    const k = baseLeaves.length;
    const adjust = (baseTotal - sumLeaves) / (k + 1);
    const recLeaves = baseLeaves.map((v) => v + adjust);
    const recTotal = recLeaves.reduce((a, b) => a + b, 0);
    const err = (f: number[], a: number[]) => f.reduce((s, v, i) => s + Math.abs(v - a[i]), 0) / f.length;
    return {
      leaves,
      totalActual,
      base: { leaves: baseLeaves, total: baseTotal, gap: baseTotal - sumLeaves, err: err(baseLeaves.concat(baseTotal), leaves.map((l) => l.actual).concat(totalActual)) },
      rec: { leaves: recLeaves, total: recTotal, gap: recTotal - recLeaves.reduce((a, b) => a + b, 0), err: err(recLeaves.concat(recTotal), leaves.map((l) => l.actual).concat(totalActual)) },
    };
  }, []);
  const view = reconcile ? tree.rec : tree.base;

  return (
    <DemoFrame footer="Base forecasts are fitted independently at every level and never add up. MinT projects them onto the coherent subspace using the residual covariance, so leaves sum to the parent by construction.">
      <div className="flex flex-wrap items-center gap-3">
        <Toggle label="MinT reconciliation" value={reconcile} onChange={setReconcile} accent={accent} />
        <Stat label="Coherence gap" value={Math.abs(view.gap) < 0.01 ? '0' : view.gap.toFixed(1)} tone={Math.abs(view.gap) < 0.01 ? 'good' : 'bad'} />
        <Stat label="Mean abs error" value={view.err.toFixed(1)} tone={reconcile ? 'good' : 'warn'} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-4 rounded border-2 px-3 py-2 text-center" style={{ borderColor: accent }}>
          <div className="font-ui text-[10px] uppercase tracking-wider text-ink/55">Chain total</div>
          <div className="font-display text-3xl text-ink">{view.total.toFixed(0)}</div>
          <div className="font-ui text-[10px] text-ink/50">actual {tree.totalActual.toFixed(0)} · leaves sum {view.leaves.reduce((a, b) => a + b, 0).toFixed(0)}</div>
        </div>
        {tree.leaves.map((l, i) => (
          <div key={l.name} className="rounded border border-ink/20 bg-white/60 px-3 py-2 text-center first:col-start-1">
            <div className="font-ui text-[10px] uppercase tracking-wider text-ink/55">{l.name}</div>
            <div className="font-display text-2xl text-ink">{view.leaves[i].toFixed(0)}</div>
            <div className="font-ui text-[10px] text-ink/50">actual {l.actual.toFixed(0)}</div>
          </div>
        ))}
      </div>
    </DemoFrame>
  );
}

/* ─── 02 · Model watch desk (PSI) ──────────────────────────────────────── */
export function ModelWatchDemo({ accent }: DemoProps) {
  const [drift, setDrift] = useState(0.2);
  const windows = useMemo(() => {
    const rand = rng(9);
    const models = ['Churn v3', 'Load v7', 'Score v2'];
    return models.map((m, mi) =>
      Array.from({ length: 14 }, (_, w) => {
        const shift = drift * Math.max(0, (w - 6) / 7) * (mi === 1 ? 1.4 : mi === 2 ? 0.5 : 1);
        // PSI with 10 bins, reference uniform-ish vs shifted
        let psi = 0;
        for (let b = 0; b < 10; b++) {
          const ref = 0.1;
          const cur = Math.max(0.005, 0.1 + shift * (b < 5 ? -0.02 : 0.02) * (b - 4.5) + gaussian(rand) * 0.004);
          psi += (cur - ref) * Math.log(cur / ref);
        }
        return { model: m, w, psi };
      })
    );
  }, [drift]);
  const cell = (psi: number) => (psi < 0.1 ? '#A5D6A7' : psi < 0.25 ? '#FFE082' : '#EF9A9A');
  const paged = windows.flat().filter((c) => c.psi >= 0.25);
  return (
    <DemoFrame footer="PSI < 0.10 stable · 0.10–0.25 watch · ≥ 0.25 page the owner. The digest names the model, the window and the signed champion.">
      <Controls>
        <Slider label="Drift magnitude" min={0} max={1} step={0.05} value={drift} onChange={setDrift} accent={accent} format={(v) => v.toFixed(2)} />
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Red windows" value={paged.length} tone={paged.length ? 'bad' : 'good'} />
          <Stat label="Digest" value={paged.length ? paged[0].model : 'quiet'} tone={paged.length ? 'warn' : 'good'} />
        </div>
      </Controls>
      <div className="space-y-1">
        {windows.map((row) => (
          <div key={row[0].model} className="flex items-center gap-1">
            <span className="w-16 font-ui text-[10px] text-ink/70">{row[0].model}</span>
            {row.map((c) => (
              <span key={c.w} title={`w${c.w + 1} PSI ${c.psi.toFixed(3)}`} className="h-6 flex-1 rounded-sm border border-ink/10" style={{ background: cell(c.psi) }} />
            ))}
          </div>
        ))}
        <div className="flex items-center gap-1 pl-16 font-ui text-[9px] text-ink/50">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className="flex-1 text-center">
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    </DemoFrame>
  );
}
