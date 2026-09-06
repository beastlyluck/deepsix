"""BioSync entry.

    python main.py            full (~2 min CPU, numpy only)
    python main.py --quick

Order: cohort -> Parquet lake -> Neural ODE (numpy) vs ESN across dropout
levels -> imputation bake-off -> DP release + empirical check -> ONNX and
weights export -> dashboard payload.
"""
import json
import os
import shutil
import sys
import time

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, ".."))
from data.lake import coverage, write_patient
from edge.engine import Engine, save_weights
from edge.export_onnx import export
from mlops.impute import carve_gaps, forward_fill, linear, score_gaps
from models.esn import ESN
from models.evaluate import esn_errors, esn_fit, node_errors, persistence_errors, test_windows
from models.node import DT, EMB, init_params, predict, train
from models.windows import H, STEP, batcher, make_window, resample
from physio.sim import cohort
from privacy.dp import empirical_check, release

OUT = os.path.join(HERE, "outputs")
TRAIN_DAYS = 10


def main(quick=False):
    os.makedirs(OUT, exist_ok=True)
    t0 = time.perf_counter()
    rng = np.random.default_rng(0)
    patients = cohort(n_patients=12 if quick else 24, days=14)

    lake = os.path.join(OUT, "lake")
    shutil.rmtree(lake, ignore_errors=True)
    key = b"tenant-demo-key"
    for p in patients:
        write_patient(lake, p, key)
    cov = coverage(lake)

    # model matrix: dropout level x model x horizon
    matrix, node_models = {}, {}
    for drop in (0.0, 0.3, 0.6):
        series = {p["id"]: resample(p, extra_dropout=drop, rng=rng) for p in patients}
        theta = init_params(rng)
        emb = np.zeros((len(patients), EMB))
        hist = train(theta, emb, batcher(series, TRAIN_DAYS), iters=150 if quick else 500)
        wins = test_windows(series, TRAIN_DAYS, rng, per_patient=6 if quick else 12)
        esn = esn_fit(ESN(n_in=2 + 2 + 3, seed=1), series, TRAIN_DAYS, rng, n=200 if quick else 400)
        matrix[str(drop)] = {"node": node_errors(theta, emb, series, wins), "esn": esn_errors(esn, series, wins),
                             "persist": persistence_errors(series, wins), "node_loss": [round(h, 5) for h in hist]}
        node_models[drop] = (theta, emb, series)
        m = matrix[str(drop)]
        print(f"  dropout {drop:.1f}  60 min glucose RMSE  node {m['node']['60m']['glucose_rmse']}  esn {m['esn']['60m']['glucose_rmse']}"
              f"  persist {m['persist']['60m']['glucose_rmse']} mg/dL")

    # imputation bake-off on the clean-sampled series, extra gaps carved in
    theta, emb, series = node_models[0.0]
    imp = {"forward_fill": [], "linear": [], "node": []}
    for pid in list(series)[:8]:
        s = series[pid]
        y2, gaps = carve_gaps(s["y"], rng)
        imp["forward_fill"].append(score_gaps(s, forward_fill(y2, np.array([1.0, 0.7])), gaps))
        imp["linear"].append(score_gaps(s, linear(y2), gaps))
        filled = linear(y2)
        for start in range(0, len(y2) - H - 1, H):
            if gaps[start:start + H + 1].any():
                z0, u, _, _, _ = make_window({"u": s["u"], "y": y2}, pid, start)
                zs = predict(theta, emb, z0[None], u[:, None], np.array([pid]))[:, 0, :2]
                seg = gaps[start:start + H + 1]
                filled[start:start + H + 1][seg] = zs[seg]
        imp["node"].append(score_gaps(s, filled, gaps))
    imputation = {k: round(float(np.mean(v)), 2) for k, v in imp.items()}

    # privacy
    G = np.stack([p["G"] for p in patients])
    dp_rows = [empirical_check(G, eps, 1e-5, rng, trials=1500 if quick else 4000) for eps in (0.5, 1.0, 2.0)]
    noisy, true_curve, sig = release(G, 1.0, 1e-5, rng)

    # edge artefacts
    edge_dir = os.path.join(OUT, "edge")
    os.makedirs(edge_dir, exist_ok=True)
    export(theta, os.path.join(edge_dir, "dynamics.onnx"))
    save_weights(theta, emb, DT, os.path.join(edge_dir, "weights.npz"))
    eng = Engine(os.path.join(edge_dir, "weights.npz"))
    lat = eng.latency_us()
    # engine must agree with the training-time integrator
    pid = list(series)[0]
    z0, u, _, _, _ = make_window(series[pid], pid, 300)
    agree = float(np.abs(eng.rollout(z0, u, pid)[:, :2] - predict(theta, emb, z0[None], u[:, None], np.array([pid]))[:, 0, :2]).max())

    # one patient's day for the dashboard, with the replica overlaid
    day0 = (TRAIN_DAYS + 1) * 1440 // STEP
    s = series[pid]
    panes = []
    for start in range(day0, day0 + 1440 // STEP - H, H):
        z0, u, _, _, _ = make_window(s, pid, start)
        zs = predict(theta, emb, z0[None], u[:, None], np.array([pid]))[:, 0, :2]
        panes.append({"start": int(start), "pred": (zs * 100).round(1).tolist()})
    day = slice(day0, day0 + 1440 // STEP)
    results = {
        "patients": len(patients), "days": 14, "train_days": TRAIN_DAYS, "lake": cov,
        "matrix": {k: {m: v[m] for m in ("node", "esn", "persist")} for k, v in matrix.items()},
        "imputation_rmse": imputation,
        "dp": {"rows": dp_rows, "sigma_eps1": round(float(sig), 2)},
        "edge": {"latency_us_per_step": round(lat, 1), "engine_vs_train_max_abs": agree,
                 "onnx_bytes": os.path.getsize(os.path.join(edge_dir, "dynamics.onnx"))},
        "seconds": round(time.perf_counter() - t0, 1),
    }
    dash = {**results, "loss_curves": {k: v["node_loss"] for k, v in matrix.items()},
            "day": {"pid": int(pid), "cgm": np.where(np.isnan(s["y"][day, 0]), None, s["y"][day, 0] * 100).tolist(),
                    "hr": np.where(np.isnan(s["y"][day, 1]), None, s["y"][day, 1] * 100).tolist(),
                    "truth_g": (s["truth"][day, 0] * 100).round(1).tolist(), "truth_hr": (s["truth"][day, 1] * 100).round(1).tolist(),
                    "meal": s["u"][day, 0].round(3).tolist(), "act": s["u"][day, 1].round(2).tolist(),
                    "sleep": s["u"][day, 2].tolist(), "panes": panes, "day0": int(day0)},
            "dp_curve": {"true": true_curve.round(1).tolist(), "noisy": noisy.round(1).tolist()},
            "weights": {k: v.round(5).tolist() for k, v in theta.items()}, "emb": emb.round(5).tolist(), "dt": DT}
    json.dump(results, open(os.path.join(OUT, "results.json"), "w"), indent=2)
    json.dump(dash, open(os.path.join(OUT, "dashboard.json"), "w"))
    print("BioSync")
    print(f"  lake            {cov['rows']} rows, cgm observed {cov['cgm_observed']:.0%}, hr observed {cov['hr_observed']:.0%}")
    print(f"  imputation      {imputation}")
    print(f"  dp              " + "  ".join(f"eps={r['eps']} acc {r['attacker_acc']} <= {r['bound']}" for r in dp_rows))
    print(f"  edge            {lat:.0f} us/step, engine vs train diff {agree:.1e}")


if __name__ == "__main__":
    main(quick="--quick" in sys.argv)
    import build_site
    build_site.write()
