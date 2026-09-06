"""TerraTwin entry. Load toml, train FQI, race it against a setpoint PID.

    python main.py
    python main.py --quick
"""
import json
import os
import sys
import time
import tomllib

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, ".."))

from control.loop import run
from forecast.holt import forecast_towers
from rl.fqi import collect, fit

OUT = os.path.join(HERE, "outputs")


def load_cfg():
    with open(os.path.join(HERE, "config", "facility.toml"), "rb") as f:
        return tomllib.load(f)


def downsample(log, every=2):
    frames = []
    for row in log[::every]:
        frames.append({
            "t": row["t"],
            "temp": np.round(row["temp"], 2).tolist(),
            "rh": np.round(row["rh"], 3).tolist(),
            "ec": np.round(row["ec"], 2).tolist(),
            "ppfd": np.round(row["ppfd"], 1).tolist(),
            "I": np.round(row["I"], 2).tolist(),
            "yield": round(row["yield"], 3),
            "infected": round(row["infected"], 3),
            "energy": round(row["energy"], 4),
            "action": row["action"],
        })
    return frames


def main(quick=False):
    os.makedirs(OUT, exist_ok=True)
    t0 = time.perf_counter()
    cfg = load_cfg()
    rng = np.random.default_rng(4)
    rows = collect(cfg, rng, episodes=6 if quick else 14, horizon=28 if quick else 48)
    w = fit(rows, iters=6 if quick else 10)
    pid = run(cfg, np.random.default_rng(9), w=None, horizon=40 if quick else 64)
    fqi = run(cfg, np.random.default_rng(9), w=w, horizon=40 if quick else 64)
    y_fqi = np.array([[r["yield"]] * cfg["site"]["towers"] for r in fqi])
    fc = forecast_towers(y_fqi)
    summary = {
        "pid_yield": round(float(np.mean([r["yield"] for r in pid])), 3),
        "fqi_yield": round(float(np.mean([r["yield"] for r in fqi])), 3),
        "pid_energy": round(float(np.sum([r["energy"] for r in pid])), 3),
        "fqi_energy": round(float(np.sum([r["energy"] for r in fqi])), 3),
        "pid_infected_end": round(pid[-1]["infected"], 3),
        "fqi_infected_end": round(fqi[-1]["infected"], 3),
        "facility_mape": fc["facility_mape"],
        "n_trays": len(pid[0]["temp"]),
    }
    dash = {
        **summary,
        "cfg": {"towers": cfg["site"]["towers"], "layers": cfg["site"]["layers"],
                "slots": cfg["site"]["trays_per_layer"], "setpoints": cfg["setpoints"]},
        "pid": downsample(pid, 2),
        "fqi": downsample(fqi, 2),
        "mape_by_tower": fc["mape_by_tower"],
        "reward": cfg["reward"],
    }
    print("TerraTwin")
    for k, v in summary.items():
        print(f"  {k:<22} {v}")
    print(f"  elapsed               {time.perf_counter() - t0:.1f}s")
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(summary, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(dash, f)
    np.save(os.path.join(OUT, "q_weights.npy"), w)
    import build_site
    build_site.write()


if __name__ == "__main__":
    main(quick="--quick" in sys.argv)
