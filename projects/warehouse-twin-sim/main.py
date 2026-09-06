"""Warehouse Twin: a discrete-event simulation of a pick-face.

Event-driven (heapq) model of order arrivals, a picker pool, a pack-station pool and
a shift clock. A factorial design over pickers x packers x shift length x demand,
replicated, answers: does one extra packer beat two hours of overtime on late orders?
Synthetic pick logs calibrated to public time-and-motion ranges; runs offline.
"""
import heapq
import itertools
import json
import os
import time

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

SEED = 23
ARRIVAL_HOURS = 8           # orders arrive 06:00-14:00; a 10h shift is two hours of overtime
BASE_RATE = 20.0            # orders per hour at 1x demand (off-peak); midday peak is 2x this
DUE_HOURS = 1.25            # service promise from arrival (same-day carrier cut-off)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")


def simulate(rng, pickers, packers, shift_hours, demand_mult):
    """Run one shift. Times are in hours. Returns wait, utilisation and late-order KPIs.

    The order workload (arrivals, pick and pack durations) is drawn up front from `rng`,
    so scenarios seeded with the same replication share identical orders (common random
    numbers) and differ only in staffing and shift length.
    """
    t, arrivals = 0.0, []
    rate = BASE_RATE * demand_mult
    while True:                                                # non-homogeneous: midday peak
        t += rng.exponential(1 / (rate * (1 + 1.0 * np.sin(np.pi * t / ARRIVAL_HOURS))))
        if t >= ARRIVAL_HOURS:
            break
        arrivals.append(t)
    n = len(arrivals)
    lines = rng.integers(1, 9, n)
    pick_dur = (rng.lognormal(np.log(0.9), 0.35, n) + lines * rng.lognormal(np.log(0.45), 0.3, n)) / 60  # min -> h
    pack_dur = rng.lognormal(np.log(2.0), 0.3, n) / 60
    seq, events = itertools.count(), []
    for i, a in enumerate(arrivals):
        heapq.heappush(events, (a, next(seq), "arrive", i))
    free_pick, free_pack = pickers, packers
    pick_q, pack_q = [], []
    pick_busy = pack_busy = 0.0
    waits, done, late = [], 0, 0

    def start_pick(now, i):
        nonlocal free_pick, pick_busy
        free_pick -= 1; pick_busy += pick_dur[i]
        waits.append(now - arrivals[i])
        heapq.heappush(events, (now + pick_dur[i], next(seq), "picked", i))

    def start_pack(now, i):
        nonlocal free_pack, pack_busy
        free_pack -= 1; pack_busy += pack_dur[i]
        heapq.heappush(events, (now + pack_dur[i], next(seq), "packed", i))

    while events and events[0][0] <= shift_hours:
        now, _, kind, i = heapq.heappop(events)
        if kind == "arrive":
            start_pick(now, i) if free_pick else pick_q.append(i)
        elif kind == "picked":
            free_pick += 1
            if pick_q:
                start_pick(now, pick_q.pop(0))
            start_pack(now, i) if free_pack else pack_q.append(i)
        else:
            free_pack += 1; done += 1
            late += now > arrivals[i] + DUE_HOURS
            if pack_q:
                start_pack(now, pack_q.pop(0))
    unfinished = len(pick_q) + len(pack_q) + len(events)     # queued or in flight when the shift ends
    total = done + unfinished
    return {"orders": total, "late_rate": (late + unfinished) / total, "mean_wait_min": 60 * np.mean(waits) if waits else 0.0,
            "util_pick": pick_busy / (pickers * shift_hours), "util_pack": pack_busy / (packers * shift_hours)}


def main():
    os.makedirs(OUT, exist_ok=True)
    t0 = time.perf_counter()
    design = list(itertools.product([4, 5, 6], [2, 3], [8, 10], [1.0, 2.0], [0, 1]))   # 48 runs
    rows = []
    for pk, pc, sh, dm, rep in design:
        kpi = simulate(np.random.default_rng([SEED, rep]), pk, pc, sh, dm)   # common random numbers per rep
        rows.append({"pickers": pk, "packers": pc, "shift_h": sh, "demand": dm, "rep": rep, **kpi})
    df = pd.DataFrame(rows)
    runtime = time.perf_counter() - t0

    agg = df.groupby(["pickers", "packers", "shift_h", "demand"]).mean(numeric_only=True).drop(columns="rep")
    promo = agg.xs(2.0, level="demand")
    base = promo.loc[(5, 2, 8)]
    extra_packer = promo.loc[(5, 3, 8)]
    overtime = promo.loc[(5, 2, 10)]
    results = {"Late orders -": f"{1 - extra_packer['late_rate'] / base['late_rate']:.0%}",
               "Late orders - (overtime)": f"{1 - overtime['late_rate'] / base['late_rate']:.0%}",
               "Scenarios": len(design), "Util. pack": f"{extra_packer['util_pack']:.0%} (with 3rd packer; baseline {base['util_pack']:.0%})",
               "Runtime": f"{runtime:.1f}s",
               "promo_week_2x": {"baseline_5p_2k_8h": round(float(base["late_rate"]), 3),
                                 "extra_packer_5p_3k_8h": round(float(extra_packer["late_rate"]), 3),
                                 "overtime_5p_2k_10h": round(float(overtime["late_rate"]), 3)},
               "mean_wait_min_baseline": round(float(base["mean_wait_min"]), 1)}
    print("Warehouse Twin (discrete event)")
    for k, v in results.items():
        print(f"  {k:<26} {v}")
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(results, f)

    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    for (pc, sh), g in promo.reset_index().groupby(["packers", "shift_h"]):
        axes[0].plot(g["pickers"], g["late_rate"], marker="o", label=f"{pc} packers, {sh}h shift")
    axes[0].set_title("2x promo week: late-order rate"); axes[0].set_xlabel("pickers"); axes[0].legend()
    piv = agg.reset_index().pivot_table(index="pickers", columns="packers", values="util_pack", aggfunc="mean")
    im = axes[1].imshow(piv.values, cmap="viridis", vmin=0, vmax=1)
    axes[1].set_xticks(range(len(piv.columns))); axes[1].set_xticklabels(piv.columns)
    axes[1].set_yticks(range(len(piv.index))); axes[1].set_yticklabels(piv.index)
    axes[1].set_xlabel("packers"); axes[1].set_ylabel("pickers"); axes[1].set_title("Pack utilisation (all scenarios)")
    fig.colorbar(im, ax=axes[1])
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    print(f"Wrote {OUT}/results.json and figure.png")


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
