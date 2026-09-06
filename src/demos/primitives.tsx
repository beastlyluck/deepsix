import type { ReactNode } from 'react';

/** Shared props every project demo receives. Demos render on paper (light) comic panels. */
export interface DemoProps {
  accent: string;
  expanded?: boolean;
}

export const INK = '#151515';
export const INK_SOFT = 'rgba(21,21,21,0.55)';
export const GRID = 'rgba(21,21,21,0.12)';

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v: number) => String(v),
  accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  accent: string;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between font-ui text-[11px] uppercase tracking-wider text-ink/60">
        <span>{label}</span>
        <span className="font-semibold text-ink">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="demo-slider mt-1 w-full"
        style={{ accentColor: accent }}
        onClick={(e) => e.stopPropagation()}
      />
    </label>
  );
}

export function Toggle({ label, value, onChange, accent }: { label: string; value: boolean; onChange: (v: boolean) => void; accent: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChange(!value);
      }}
      className="flex items-center gap-2 rounded-full border border-ink/20 bg-white/60 px-3 py-1 font-ui text-[11px] uppercase tracking-wider text-ink"
    >
      <span className="inline-block h-3 w-3 rounded-full border border-ink/40" style={{ background: value ? accent : 'transparent' }} />
      {label}
    </button>
  );
}

export function Stat({ label, value, tone = 'ink' }: { label: string; value: string | number; tone?: 'ink' | 'good' | 'warn' | 'bad' }) {
  const color = tone === 'good' ? '#1B5E20' : tone === 'warn' ? '#B26A00' : tone === 'bad' ? '#B71C1C' : INK;
  return (
    <div className="rounded border border-ink/15 bg-white/60 px-3 py-2">
      <div className="font-display text-2xl leading-none" style={{ color }}>
        {value}
      </div>
      <div className="mt-1 font-ui text-[10px] uppercase tracking-wider text-ink/55">{label}</div>
    </div>
  );
}

export function Controls({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

export function DemoFrame({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-3" onClick={(e) => e.stopPropagation()}>
      {children}
      {footer && <div className="font-ui text-[11px] leading-relaxed text-ink/65">{footer}</div>}
    </div>
  );
}

/* ───────────── SVG charts ───────────── */

export interface Series {
  name: string;
  values: number[];
  color: string;
  dashed?: boolean;
  width?: number;
}

export function LineChart({
  series,
  height = 220,
  yMin,
  yMax,
  markerX,
  markerLabel,
  band,
  xLabels,
}: {
  series: Series[];
  height?: number;
  yMin?: number;
  yMax?: number;
  markerX?: number;
  markerLabel?: string;
  band?: { lower: number[]; upper: number[]; color: string };
  xLabels?: string[];
}) {
  const W = 640;
  const H = height;
  const pad = { l: 42, r: 12, t: 12, b: xLabels ? 40 : 26 };
  const n = Math.max(...series.map((s) => s.values.length));
  const all = series.flatMap((s) => s.values).concat(band ? band.lower.concat(band.upper) : []);
  const lo = yMin ?? Math.min(...all);
  const hi = yMax ?? Math.max(...all);
  const span = hi - lo || 1;
  const x = (i: number) => pad.l + (i / Math.max(1, n - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / span) * (H - pad.t - pad.b);
  const path = (vals: number[]) => vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const ticks = 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const v = lo + (span * i) / ticks;
        return (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={GRID} />
            <text x={pad.l - 6} y={y(v) + 3} fontSize="10" textAnchor="end" fill={INK_SOFT} fontFamily="JetBrains Mono, monospace">
              {Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(Math.abs(span) < 5 ? 2 : 0)}
            </text>
          </g>
        );
      })}
      {band && (
        <path
          d={`${path(band.upper)} ${band.lower
            .map((v, i) => `L${x(band.lower.length - 1 - i).toFixed(1)},${y(band.lower[band.lower.length - 1 - i]).toFixed(1)}`)
            .join(' ')} Z`}
          fill={band.color}
          opacity={0.18}
        />
      )}
      {markerX !== undefined && (
        <g>
          <line x1={x(markerX)} x2={x(markerX)} y1={pad.t} y2={H - pad.b} stroke={INK} strokeDasharray="4 4" opacity={0.6} />
          {markerLabel && (
            <text x={x(markerX) + 5} y={pad.t + 10} fontSize="10" fill={INK} fontFamily="JetBrains Mono, monospace">
              {markerLabel}
            </text>
          )}
        </g>
      )}
      {series.map((s) => (
        <path
          key={s.name}
          d={path(s.values)}
          fill="none"
          stroke={s.color}
          strokeWidth={s.width ?? 2.2}
          strokeDasharray={s.dashed ? '6 5' : undefined}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      {xLabels &&
        xLabels.map((l, i) =>
          i % Math.ceil(xLabels.length / 8) === 0 ? (
            <text key={i} x={x(i)} y={H - 24} fontSize="10" textAnchor="middle" fill={INK_SOFT} fontFamily="JetBrains Mono, monospace">
              {l}
            </text>
          ) : null
        )}
      <g fontSize="10" fontFamily="JetBrains Mono, monospace">
        {series.map((s, i) => (
          <g key={s.name} transform={`translate(${pad.l + i * 120}, ${H - 8})`}>
            <line x1={0} x2={18} y1={-4} y2={-4} stroke={s.color} strokeWidth={2.2} strokeDasharray={s.dashed ? '5 4' : undefined} />
            <text x={22} y={0} fill={INK}>
              {s.name}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

export function Bars({
  items,
  height = 200,
  accent,
  highlight,
}: {
  items: { label: string; value: number; color?: string }[];
  height?: number;
  accent: string;
  highlight?: (i: number) => boolean;
}) {
  const W = 640;
  const pad = { l: 40, r: 12, t: 10, b: 40 };
  const max = Math.max(...items.map((i) => i.value), 1);
  const bw = (W - pad.l - pad.r) / items.length;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img">
      {items.map((it, i) => {
        const h = ((height - pad.t - pad.b) * it.value) / max;
        const xPos = pad.l + i * bw + bw * 0.15;
        return (
          <g key={it.label}>
            <rect x={xPos} y={height - pad.b - h} width={bw * 0.7} height={h} fill={it.color ?? accent} opacity={highlight && !highlight(i) ? 0.35 : 0.9} />
            <text x={xPos + bw * 0.35} y={height - pad.b - h - 4} fontSize="10" textAnchor="middle" fill={INK} fontFamily="JetBrains Mono, monospace">
              {Number.isInteger(it.value) ? it.value : it.value.toFixed(2)}
            </text>
            <text x={xPos + bw * 0.35} y={height - pad.b + 14} fontSize="10" textAnchor="middle" fill={INK_SOFT} fontFamily="JetBrains Mono, monospace">
              {it.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Deterministic pseudo-random (mulberry32) so demos are stable across renders. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rand: () => number) {
  const u = 1 - rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
