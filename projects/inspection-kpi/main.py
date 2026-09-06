"""Inspection KPI board: defect PPM, Pareto and a stop-the-line rule.

The detector is only the sensor. This script scores it properly (AP@0.5 per defect
type with greedy IoU matching, averaged to mAP), then runs a station ledger over a
month of shifts with and without the rule "two fails at one station in a shift
freezes that station's all-clear", and reports PPM, Pareto and false stops.
Synthetic station logs shaped like MVTec AD; runs offline.
"""
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

SEED = 31
STATIONS, DAYS, SHIFTS = 8, 30, 3
UNITS_PER_SHIFT = 900
DEFECTS = ["scratch", "dent", "contamination", "misalignment", "crack"]
DEFECT_MIX = [0.40, 0.25, 0.18, 0.12, 0.05]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")


def average_precision(scores, is_tp, n_gt):
    """All-point interpolated AP from ranked detections."""
    order = np.argsort(-scores)
    tp = np.cumsum(is_tp[order]); fp = np.cumsum(~is_tp[order])
    recall = tp / max(n_gt, 1); precision = tp / np.maximum(tp + fp, 1)
    mrec = np.concatenate([[0], recall, [1]]); mpre = np.concatenate([[0], precision, [0]])
    for i in range(len(mpre) - 2, -1, -1):
        mpre[i] = max(mpre[i], mpre[i + 1])
    idx = np.where(mrec[1:] != mrec[:-1])[0]
    return float(np.sum((mrec[idx + 1] - mrec[idx]) * mpre[idx + 1]))


def detector_map(rng, n_images=1500):
    """Simulate detections against ground-truth boxes; greedy matching at IoU 0.5."""
    aps = {}
    for k, name in enumerate(DEFECTS):
        n_gt = rng.binomial(n_images, 0.06 * (1 + k * 0.2))
        quality = 0.9 - 0.06 * k                                   # small cracks are harder
        hit = rng.random(n_gt) < quality                           # misses produce no detection
        iou = rng.uniform(0.45, 0.95, hit.sum())                   # some hits are loosely localised
        tp_scores = rng.beta(5, 2, hit.sum())
        n_fp = rng.poisson(n_gt * 0.35)
        fp_scores = rng.beta(2, 4, n_fp)
        scores = np.concatenate([tp_scores, fp_scores])
        is_tp = np.concatenate([iou >= 0.5, np.zeros(n_fp, bool)])
        aps[name] = round(average_precision(scores, is_tp, n_gt), 3)
    return aps


def run_ledger(seed, stop_rule):
    """Month of shifts. Station defect rates drift upward; a stop resets the station."""
    rng = np.random.default_rng(seed)
    base_rate = rng.uniform(150, 350, STATIONS) * 1e-6                 # defects per unit (150-350 PPM)
    rate = base_rate.copy()
    rows, stops, false_stops = [], 0, 0
    for day in range(DAYS):
        for shift in range(SHIFTS):
            rate *= np.exp(rng.normal(0.01, 0.03, STATIONS))          # wear: rates creep up
            for s in range(STATIONS):
                true_def = rng.poisson(rate[s] * UNITS_PER_SHIFT)
                detected = rng.binomial(true_def, 0.8) + rng.poisson(0.08)   # misses and false alarms
                types = rng.choice(DEFECTS, detected, p=DEFECT_MIX)
                frozen = False
                if stop_rule and detected >= 2:
                    frozen = True; stops += 1
                    if true_def == 0:
                        false_stops += 1
                    rate[s] = base_rate[s]                             # maintenance resets the station
                rows.append({"day": day, "shift": shift, "station": s, "units": UNITS_PER_SHIFT,
                             "true_defects": true_def, "detected": detected, "frozen": frozen,
                             **{t: int((types == t).sum()) for t in DEFECTS}})
    return pd.DataFrame(rows), stops, false_stops


def main():
    rng = np.random.default_rng(SEED)
    os.makedirs(OUT, exist_ok=True)
    aps = detector_map(rng)
    off, _, _ = run_ledger(SEED, stop_rule=False)
    on, stops, false_stops = run_ledger(SEED, stop_rule=True)
    ppm_off = off["true_defects"].sum() / off["units"].sum() * 1e6
    ppm_on = on["true_defects"].sum() / on["units"].sum() * 1e6
    pareto = on[DEFECTS].sum().sort_values(ascending=False)
    by_station = on.groupby("station")["true_defects"].sum() / on.groupby("station")["units"].sum() * 1e6
    results = {"mAP@0.5": round(float(np.mean(list(aps.values()))), 3), "PPM (-)": f"{1 - ppm_on / ppm_off:.0%}",
               "Stations": STATIONS, "False stop": f"{false_stops}/mo", "ap_per_defect": aps,
               "ppm_without_rule": round(float(ppm_off), 1), "ppm_with_rule": round(float(ppm_on), 1),
               "stops_per_month": int(stops), "pareto_counts": {k: int(v) for k, v in pareto.items()},
               "ppm_by_station": {int(k): round(float(v), 1) for k, v in by_station.items()}}
    print("Inspection KPI board")
    for k in ["mAP@0.5", "PPM (-)", "Stations", "False stop", "ppm_without_rule", "ppm_with_rule", "stops_per_month"]:
        print(f"  {k:<18} {results[k]}")
    print("  Pareto:", results["pareto_counts"])
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(results, f)

    fig, axes = plt.subplots(1, 3, figsize=(15, 4))
    cum = pareto.cumsum() / pareto.sum() * 100
    axes[0].bar(pareto.index, pareto.values, color="tab:blue"); ax2 = axes[0].twinx()
    ax2.plot(pareto.index, cum.values, color="tab:red", marker="o"); ax2.set_ylim(0, 105)
    axes[0].set_title("Defect Pareto (detected, month)"); axes[0].tick_params(axis="x", rotation=30)
    daily_off = off.groupby("day")["true_defects"].sum() / (STATIONS * SHIFTS * UNITS_PER_SHIFT) * 1e6
    daily_on = on.groupby("day")["true_defects"].sum() / (STATIONS * SHIFTS * UNITS_PER_SHIFT) * 1e6
    axes[1].plot(daily_off, color="gray", label="no stop rule"); axes[1].plot(daily_on, color="tab:green", label="stop rule on")
    axes[1].set_title("Daily PPM"); axes[1].legend()
    axes[2].bar(by_station.index.astype(str), by_station.values, color="tab:orange")
    axes[2].set_title("PPM by station (rule on)"); axes[2].set_xlabel("station")
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    print(f"Wrote {OUT}/results.json and figure.png")


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
