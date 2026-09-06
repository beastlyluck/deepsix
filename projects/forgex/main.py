"""ForgeX entry. One shift of pick cycles, three injected faults, late fusion.

    python main.py
    python main.py --quick
"""
import json
import os
import sys
import time

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, ".."))

from arm.kinematics import joint_xyz, payload_moment, pick_cycle
from arm.physics import current_from_motion, residual, thermal_step
from detect.fusion import fit, score_one
from edge.actuator import bench, dump
from safety.fsm import run as run_fsm
from sensors import acoustic, current, vision

OUT = os.path.join(HERE, "outputs")
N_AC, N_CU = 9, 4


def cycle_row(rng, kind):
    wear = {"bearing": 0.85, "thermal": 0.15, "leak": 0.1, "ok": 0.05}[kind]
    leak = 0.9 if kind == "leak" else 0.0
    blur = 0.5 if kind == "leak" else 0.05 * wear
    ripple = 0.35 if kind == "bearing" else 0.04
    rth = 2.4 if kind == "thermal" else 1.0
    coulomb = 1.8 if kind == "bearing" else 1.0
    qs, currents, temps = [], [], [24.0]
    for k in range(24):
        q = pick_cycle(k / 24, wear)
        q_prev = pick_cycle(max(k - 1, 0) / 24, wear)
        qdot = (q - q_prev) * 24
        qdd = qdot * 0.4
        pred = current_from_motion(qdot, qdd, payload_moment(q), coulomb)
        meas = pred + rng.normal(0, 0.08, 6)
        if kind == "bearing":
            meas[1] += 0.55 * np.sign(qdot[1] + 1e-6)
        temps.append(thermal_step(temps[-1], meas, 0.04, rth))
        qs.append(q)
        currents.append(meas)
    qs, currents = np.array(qs), np.array(currents)
    pred = np.array([current_from_motion(
        (qs[i] - qs[max(i - 1, 0)]) * 24, np.zeros(6), payload_moment(qs[i]), 1.0
    ) for i in range(len(qs))])
    per, rms = residual(currents, pred)
    wav = acoustic.record(rng, 4000, wear=wear, knock=0.4 if kind == "bearing" else 0.0)
    cur = current.record(rng, 800, pred.mean(0), ripple=ripple, stall=0.0)
    img = vision.frame(rng, leak=leak, blur=blur, off_axis=0.15 * wear)
    fa, fc, fv = acoustic.features(wav), current.features(cur), vision.features(img)
    x = np.concatenate([fa, fc, fv]) + rng.normal(0, 0.04, fa.size + fc.size + fv.size)
    y = 0 if kind == "ok" else 1
    f, t, spec = acoustic.spectrogram(wav)
    return {
        "x": x, "y": y, "kind": kind, "residual": rms, "per_joint": per,
        "temp": temps[-1], "xyz": joint_xyz(qs[-1]), "q": qs[-1],
        "fft": spec.mean(1)[:48].tolist(), "score": None,
    }


def main(quick=False):
    os.makedirs(OUT, exist_ok=True)
    t0 = time.perf_counter()
    rng = np.random.default_rng(11)
    n_ok = 80 if quick else 160
    kinds = ["ok"] * n_ok + ["bearing"] * 18 + ["thermal"] * 14 + ["leak"] * 12
    rng.shuffle(kinds)
    rows = [cycle_row(rng, k) for k in kinds]
    X = np.stack([r["x"] for r in rows])
    y = np.array([r["y"] for r in rows])
    art = fit(X, y, N_AC, N_CU, seed=11)
    for r, p in zip(rows, art["proba"]):
        r["score"] = float(p)
    # Interlock is scored on a later shift, not on the labelled fit set.
    shift_kinds = ["ok"] * (40 if quick else 70) + ["bearing"] * 4 + ["ok"] * 8 + ["leak"] * 3 + ["ok"] * 10
    shift = [cycle_row(rng, k) for k in shift_kinds]
    scores, residuals, stalls = [], [], []
    for r in shift:
        p, _ = score_one(art, r["x"])
        r["score"] = p
        scores.append(p)
        residuals.append(max(0.0, r["temp"] - 38.0) if r["kind"] == "thermal" else r["residual"])
        stalls.append(0)
    fsm = run_fsm(scores, residuals, stalls)
    rows_board = shift
    weights = dump(os.path.join(OUT, "weights.json"), art["clf"], art["scaler"])
    us = bench(weights, rows[0]["x"])
    dash = {
        "ablation": art["ablation"],
        "n": len(rows),
        "faults": {k: int(sum(1 for r in rows if r["kind"] == k)) for k in ("ok", "bearing", "thermal", "leak")},
        "latency_us": round(us, 2),
        "fsm_end": fsm[-1]["state"],
        "holds": int(sum(1 for s in fsm if s["state"] == "HOLD")),
        "estops": int(sum(1 for s in fsm if s["state"] == "ESTOP")),
        "timeline": [{"i": i, "kind": shift[i]["kind"], "score": round(shift[i]["score"], 3),
                      "state": fsm[i]["state"], "temp": round(shift[i]["temp"], 1),
                      "residual": round(shift[i]["residual"], 3)} for i in range(len(shift))],
        "arm": [{"kind": shift[i]["kind"], "xyz": np.round(shift[i]["xyz"], 3).tolist(),
                 "q": np.round(shift[i]["q"], 3).tolist(), "score": round(shift[i]["score"], 3),
                 "fft": [round(v, 4) for v in shift[i]["fft"]]}
                for i in range(0, len(shift), max(1, len(shift) // 5))],
    }
    summary = {
        "auc_all": art["ablation"]["all"]["auc"],
        "auc_acoustic": art["ablation"]["acoustic"]["auc"],
        "auc_vision": art["ablation"]["vision"]["auc"],
        "auc_current": art["ablation"]["current"]["auc"],
        "latency_us": dash["latency_us"],
        "holds": dash["holds"],
        "estops": dash["estops"],
    }
    print("ForgeX")
    for k, v in summary.items():
        print(f"  {k:<16} {v}")
    print(f"  elapsed          {time.perf_counter() - t0:.1f}s")
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(summary, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(dash, f)
    import build_site
    build_site.write()


if __name__ == "__main__":
    main(quick="--quick" in sys.argv)
