"""VIC ED flow entry. Writes the huddle pack and site/data.js."""
import json
import os
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from src.simulate import BAYS, CAMPUSES, simulate
from src.model import campus_report, fit_arrivals, flu_attribution, last_day_series

SEED = 19
OUT = os.path.join(HERE, "outputs")


def main():
    os.makedirs(OUT, exist_ok=True)
    rng = np.random.default_rng(SEED)
    df, winter = simulate(rng)
    _, mae, _ = fit_arrivals(df)
    report = campus_report(df, winter)
    attr = flu_attribution(df)
    austin = next(r for r in report if r["campus"] == "Austin")
    summary = {
        "arrival_mae": round(mae, 3),
        "campuses": report,
        "worst_ramp": max(report, key=lambda r: r["peak_ramping"])["campus"],
        "flu_flag": austin["midnight_residual"] > 4,
        "slots": int(len(df)),
    }
    dash = {
        **summary,
        "attribution": attr,
        "winter_midnight": {k: round(v, 1) for k, v in winter.items()},
        "series": last_day_series(df),
        "bays": BAYS,
    }
    with open(os.path.join(OUT, "results.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w", encoding="utf-8") as f:
        json.dump(dash, f)
    df.to_csv(os.path.join(OUT, "flow.csv"), index=False)

    fig, axes = plt.subplots(2, 2, figsize=(10, 6), sharex=True)
    last = df[df["day"] == 13]
    for ax, campus in zip(axes.ravel(), CAMPUSES):
        g = last[last["campus"] == campus]
        ax.plot(g["hour"], g["occupancy"], color="#1a1a1a", lw=1.4)
        ax.axhline(BAYS[campus], color="#b71c1c", ls="--", lw=0.9)
        ax.set_title(campus, fontsize=9)
        ax.set_ylabel("occ")
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    plt.close()
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
