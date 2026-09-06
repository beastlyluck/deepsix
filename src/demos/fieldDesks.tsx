import { useMemo, useState } from 'react';
import { Bars, Controls, DemoFrame, LineChart, Slider, Stat, INK, type DemoProps } from './primitives';

export function VicEdFlowDemo({ accent }: DemoProps) {
  const [load, setLoad] = useState(1.45);
  const data = useMemo(() => {
    const campuses = ['Alfred', 'RMH', 'Clayton', 'Austin'];
    const baseOcc = [0.6, 0.61, 0.62, 0.54];
    const occ = campuses.map((_, i) => {
      const extra = i === 3 ? 0.32 * (load - 1) : 0.04 * (load - 1);
      return Math.min(1, baseOcc[i] + extra);
    });
    const ramp = campuses.map((_, i) => (i === 3 ? Math.max(0, Math.round((load - 1.05) * 90)) : i === 1 ? 6 : 0));
    const wait = occ.map((o, i) => 21 + (o > 0.9 ? 70 : 2) + ramp[i] * 0.9);
    return { campuses, occ, ramp, wait, austin: wait[3] };
  }, [load]);

  return (
    <DemoFrame footer="Austin is the flu campus. The other three barely move. Risk starts when wait crosses 90 minutes.">
      <Controls>
        <Slider label="Austin arrival load" min={1} max={1.8} step={0.01} value={load} onChange={setLoad} accent={accent} format={(v) => `${v.toFixed(2)}×`} />
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Austin wait" value={`${data.austin.toFixed(0)} min`} tone={data.austin >= 90 ? 'bad' : 'warn'} />
          <Stat label="Austin ramp" value={data.ramp[3]} tone={data.ramp[3] > 20 ? 'bad' : 'good'} />
          <Stat label="Flu flag" value={data.ramp[3] > 40 ? 'on' : 'off'} tone={data.ramp[3] > 40 ? 'bad' : 'good'} />
        </div>
      </Controls>
      <Bars accent={accent} items={data.campuses.map((c, i) => ({ label: c, value: data.ramp[i] }))} />
    </DemoFrame>
  );
}

export function RentAtlasDemo({ accent }: DemoProps) {
  const [cut, setCut] = useState(1.0);
  const rows = useMemo(
    () =>
      [
        { label: 'Dandenong', stress: 1.59 },
        { label: 'Footscray', stress: 1.35 },
        { label: 'Thomastown', stress: 1.22 },
        { label: 'Sunshine', stress: 1.22 },
        { label: 'St Kilda', stress: 1.14 },
        { label: 'Preston', stress: 0.98 },
        { label: 'Brunswick', stress: 0.91 },
        { label: 'Fitzroy', stress: 0.84 },
      ].filter((r) => r.stress >= cut),
    [cut]
  );

  return (
    <DemoFrame footer="Stress = weekly rent × 52 / (0.3 × household income). Above 1 the listing eats the rule of thumb.">
      <Controls>
        <Slider label="Show stress at least" min={0.8} max={1.5} step={0.01} value={cut} onChange={setCut} accent={accent} format={(v) => v.toFixed(2)} />
        <Stat label="SA2s on the list" value={rows.length} />
      </Controls>
      <Bars accent={accent} items={rows.map((r) => ({ label: r.label.slice(0, 8), value: r.stress }))} />
    </DemoFrame>
  );
}

export function GridPeakDemo({ accent }: DemoProps) {
  const [hour, setHour] = useState(17.5);
  const data = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => h);
    const demand = hours.map((h) => 4200 + 900 * Math.sin(((h - 8) * Math.PI) / 24) ** 2 + (h >= 16 && h <= 20 ? 400 : 0));
    const price = hours.map((h) => {
      const heat = h >= 16 && h <= 20 ? 2.1 : 1;
      const trip = Math.abs(h - 18) < 1.2 ? 12 : 1;
      return (45 + 0.01 * (demand[h] - 4500)) * heat * trip;
    });
    const i = Math.round(hour);
    return { hours, demand, price, now: price[i], trip: Math.abs(hour - 18) < 1.2 };
  }, [hour]);

  return (
    <DemoFrame footer="Dashed demand, solid price. Day 18 around 17:30–19:00 is the unit trip. Everything else is heat.">
      <Controls>
        <Slider label="Hour" min={0} max={23} step={0.5} value={hour} onChange={setHour} accent={accent} format={(v) => `${v.toFixed(1)}:00`} />
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Price" value={`$${data.now.toFixed(0)}`} tone={data.now > 400 ? 'bad' : 'ink'} />
          <Stat label="Event" value={data.trip ? 'unit trip' : 'heat / quiet'} tone={data.trip ? 'bad' : 'good'} />
        </div>
      </Controls>
      <LineChart
        series={[
          { name: 'Demand', values: data.demand, color: INK, dashed: true },
          { name: 'Price', values: data.price, color: accent },
        ]}
        markerX={Math.round(hour)}
        xLabels={data.hours.map((h) => String(h))}
      />
    </DemoFrame>
  );
}

export function InvoiceLeakDemo({ accent }: DemoProps) {
  const [k, setK] = useState(8);
  const data = useMemo(() => {
    const labels = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0];
    const prec = labels.slice(0, k).reduce((s, x) => s + x, 0) / k;
    const curve = labels.map((_, i) => labels.slice(0, i + 1).reduce((s, x) => s + x, 0) / (i + 1));
    return { prec, curve };
  }, [k]);

  return (
    <DemoFrame footer="First eight rows are planted duplicates (D*). Precision falls once the wide block starts adding cousins.">
      <Controls>
        <Slider label="k" min={4} max={20} value={k} onChange={setK} accent={accent} />
        <Stat label={`Precision @ ${k}`} value={data.prec.toFixed(2)} tone={data.prec >= 0.6 ? 'good' : 'warn'} />
      </Controls>
      <LineChart series={[{ name: 'precision', values: data.curve, color: accent }]} yMin={0} yMax={1} markerX={k - 1} />
    </DemoFrame>
  );
}
