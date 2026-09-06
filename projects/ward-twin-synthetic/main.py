"""Ward Twin entry: fit, gate, privacy table, dashboard payload.

Run from this folder. Writes outputs/ and site/data.js. Does not overwrite
the hand-built board at site/index.html.
"""
import json
import os
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from src.simulate import TRAIN_DAYS, WARDS, WARD_NAMES, make_ward_data, synthetic_cohort
from src.glm import design, fit_nb_glm, nb_interval, pit_values
from src.gate import midnight_gate, ward_scorecard

SEED = 7
OUT = os.path.join(HERE, "outputs")


def main():
    rng = np.random.default_rng(SEED)
    os.makedirs(OUT, exist_ok=True)
    df = make_ward_data(rng)
    train = df[df["t"] < TRAIN_DAYS * 24]
    test = df[df["t"] >= TRAIN_DAYS * 24].copy()

    beta, alpha = fit_nb_glm(design(train), train["beds"].values.astype(float))
    test["pred"] = np.exp(design(test) @ beta)
    test["lo"], test["hi"] = nb_interval(test["pred"].values, alpha)
    mae = float(np.abs(test["beds"] - test["pred"]).mean())
    coverage = float(((test["beds"] >= test["lo"]) & (test["beds"] <= test["hi"])).mean())
    pit = pit_values(test["beds"].values, test["pred"].values, alpha)
    pit_hist, _ = np.histogram(pit, bins=10, range=(0, 1))

    flags, streaks, nights = midnight_gate(test)
    score = ward_scorecard(test)
    safe, k_achieved, suppressed, cells = synthetic_cohort(rng)

    results = {
        "MAE (beds)": round(mae, 2),
        "Coverage 80%": f"{coverage:.0%}",
        "Re-ident. risk": f"k>={k_achieved}",
        "Wards": WARDS,
        "dispersion_alpha": round(alpha, 4),
        "suppressed_rows": int(suppressed),
        "drift_gate_tripped": flags,
        "gates_open": int(sum(flags.values())),
    }
    print("Ward Twin results")
    for key, val in results.items():
        print(f"  {key:<20} {val}")

    series = {}
    for w in range(WARDS):
        g = test[test["ward"] == w].sort_values("t")
        series[str(w)] = {
            "name": WARD_NAMES[w],
            "t": g["t"].astype(int).tolist(),
            "beds": g["beds"].astype(int).tolist(),
            "pred": np.round(g["pred"], 2).tolist(),
            "lo": np.round(g["lo"], 2).tolist(),
            "hi": np.round(g["hi"], 2).tolist(),
        }

    dash = {
        "mae": round(mae, 2),
        "cov": f"{coverage:.0%}",
        "k": f"k>={k_achieved}",
        "gates": int(sum(flags.values())),
        "alpha": round(alpha, 4),
        "suppressed": int(suppressed),
        "wards": WARD_NAMES,
        "scorecard": score.to_dict(orient="records"),
        "flags": {WARD_NAMES[int(k)]: v for k, v in flags.items()},
        "nights": nights.round(2).to_dict(orient="records"),
        "cells": cells.to_dict(orient="records"),
        "pit": pit_hist.astype(int).tolist(),
        "series": series,
    }
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(dash, f)
    test.to_csv(os.path.join(OUT, "holdout.csv"), index=False)
    safe.to_csv(os.path.join(OUT, "cohort_k10.csv"), index=False)

    w0 = test[test["ward"] == 0]
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.fill_between(w0["t"], w0["lo"], w0["hi"], color="tab:blue", alpha=0.2, label="80% interval")
    ax.plot(w0["t"], w0["pred"], color="tab:blue", label="NB GLM mean")
    ax.plot(w0["t"], w0["beds"], color="k", lw=0.8, label="census (synthetic)")
    ax.set_title("Ward A medical: hourly occupancy, 14-day holdout")
    ax.set_xlabel("hour index")
    ax.set_ylabel("occupied beds")
    ax.legend(loc="upper left")
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    print(f"Wrote {OUT}/results.json, dashboard.json, figure.png")


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
