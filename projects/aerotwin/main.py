"""AeroTwin entry. Trains, audits sim-to-real, builds the manual index,
exports the edge artefact, writes telemetry for the dashboard.

    python main.py            full run (~1-2 min CPU)
    python main.py --quick    fewer iterations
"""
import hashlib
import json
import os
import sys
import time

import torch

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, ".."))
from edge.export import export
from rag.corpus import build, planted_queries
from rag.index import Index, evaluate
from rl.s2r import audit, summarise

OUT = os.path.join(HERE, "outputs")
DT = 0.02


def reason_for(act, wind, err, gap):
    if wind > 1.6:
        return "gust"
    if err > 0.8:
        return "formation"
    if gap < 1.6:
        return "spacing"
    return "nominal"


def write_telemetry(log, path, stride=2):
    """Batch 0 only. One JSON line per step with every drone in it."""
    frames = []
    with open(path, "w") as f:
        for k, (pos, eul, act, wind, err) in enumerate(log[::stride]):
            p, e, a, w, er = pos[0], eul[0], act[0], wind[0], err[0]
            dp = p.unsqueeze(1) - p.unsqueeze(0)
            gap = (dp.norm(dim=-1) + torch.eye(p.shape[0]) * 1e3).min(dim=-1).values
            drones = []
            for i in range(p.shape[0]):
                drones.append({
                    "id": f"D{i}", "p": [round(float(x), 3) for x in p[i]],
                    "eul": [round(float(x), 4) for x in e[i]],
                    "a": [round(float(x), 3) for x in a[i]],
                    "wind": round(float(w[i].norm()), 3), "err": round(float(er[i].norm()), 3),
                    "reason": reason_for(a[i], float(w[i].norm()), float(er[i].norm()), float(gap[i])),
                })
            frame = {"t": round(k * stride * DT, 3), "drones": drones}
            frames.append(frame)
            f.write(json.dumps(frame) + "\n")
    return frames


def main(quick=False):
    os.makedirs(OUT, exist_ok=True)
    t0 = time.perf_counter()
    iters = 60 if quick else 160
    rows, keep = audit(seeds=(0, 1) if quick else (0, 1, 2), iters=iters)
    summary = summarise(rows)
    pol, log, losses = keep["domain_randomised"]
    pt, size, trace_gap = export(pol, os.path.join(OUT, "edge"))
    sha = hashlib.sha1(open(pt, "rb").read()).hexdigest()[:12]

    index = Index(build())
    recall, per_family = evaluate(index, planted_queries())
    sample = index.query("motor running hot what do we do")

    frames = write_telemetry(log, os.path.join(OUT, "telemetry.jsonl"))
    results = {
        "policy_sha": sha, "torchscript_bytes": size, "trace_max_abs_diff": trace_gap,
        "s2r": summary, "s2r_rows": rows,
        "rag_recall_at_3": round(recall, 3), "rag_recall_by_family": per_family,
        "rag_sample": sample, "chunks": len(index.chunks),
        "train_seconds": round(time.perf_counter() - t0, 1),
    }
    dash = {**results, "frames": frames, "loss_curve": [round(l, 4) for l in losses[::2]],
            "nominal_loss_curve": [round(l, 4) for l in keep["nominal"][2][::2]]}
    json.dump(results, open(os.path.join(OUT, "results.json"), "w"), indent=2)
    json.dump(dash, open(os.path.join(OUT, "dashboard.json"), "w"))

    print("AeroTwin")
    for name, s in summary.items():
        print(f"  {name:<18} real RMSE {s['real_rmse_mean_m']} m  gap {s['gap_mean_m']} ± {s['gap_std_m']} m")
    print(f"  edge artefact      {os.path.basename(pt)} {size} B sha {sha} trace diff {trace_gap:.1e}")
    print(f"  manual recall@3    {recall:.2f} {per_family}")
    print(f"  wrote {OUT}")


if __name__ == "__main__":
    main(quick="--quick" in sys.argv)
    import build_site
    build_site.write()
