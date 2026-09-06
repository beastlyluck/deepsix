"""GridPulse entry.

    python main.py            full (~2 min CPU)
    python main.py --quick    fewer PINN iters and scenarios

Order: topology -> base power flow -> PINN thermal -> cascade dataset -> SGC ->
day-ahead LP (static, then PINN-derated) -> streamed replay into the feature store.
"""
import hashlib
import json
import os
import sys
import time

import numpy as np
import torch

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, ".."))
from dispatch.lp import solve as dispatch
from gnn.sgc import build_dataset, edge_criticality, fit_eval
from grid.powerflow import ptdf, solve
from grid.scenarios import day_profiles, injection, sample_contingencies
from grid.topology import Grid
from pinn.thermal import ThermalNet, compare, sustainable_current, time_to_limit, train
from stream.feature_store import FeatureStore
from stream.replay import run as replay, worst_contingency

OUT = os.path.join(HERE, "outputs")


class _NullStore:
    def write_features(self, rows):
        pass

    def write_risk(self, rows):
        pass


def main(quick=False):
    os.makedirs(OUT, exist_ok=True)
    t0 = time.perf_counter()
    rng = np.random.default_rng(3)
    torch.manual_seed(0)

    grid = Grid()
    load, solar, wind = day_profiles(rng)
    base = injection(grid, load[18], solar[18], wind[18])
    base_flow, _ = solve(grid, base, np.ones(grid.M, bool))
    weak = grid.set_limits(base_flow)
    P = ptdf(grid)

    net = ThermalNet()
    pinn_hist = train(net, iters=1200 if quick else 3000)
    pinn_rows = compare(net)
    ttl = {str(i): time_to_limit(net, i) for i in (0.7, 0.8, 0.85, 0.9, 0.95, 1.0, 1.1)}
    i_star = sustainable_current(net)

    scenarios = sample_contingencies(grid, rng, n=150 if quick else 400)
    X, y, _ = build_dataset(grid, scenarios)
    gnn_rows, models, S = fit_eval(grid, X, y)
    best = max(gnn_rows, key=lambda r: r["auc"])
    K = best["K"]
    crit = edge_criticality(grid, scenarios, n=60 if quick else 150)

    kind = np.array(grid.kind)
    gens = np.where(np.isin(kind, ["wind", "solar"]))[0]
    avail = np.column_stack([grid.cap[grid.kind[g]] * (wind if grid.kind[g] == "wind" else solar) for g in gens])
    demand = np.outer(load, grid.peak_load[kind == "load"])
    static_limits = np.tile(grid.limit, (24, 1))
    sched0, cost0, lay = dispatch(grid, P, avail, demand, static_limits)
    # lines the static schedule would run above the PINN's sustainable current get capped there
    dyn = static_limits.copy()
    derated = []
    for h in range(24):
        inj_h = np.zeros(grid.N)
        inj_h[lay["gens"]] += sched0["gen"][h]
        inj_h[lay["loads"]] -= demand[h] - sched0["shed"][h]
        inj_h[lay["batts"]] += sched0["discharge"][h] - sched0["charge"][h]
        inj_h[grid.slack] -= inj_h.sum()
        loading = np.abs(P @ inj_h) / grid.limit
        for e in np.where(loading > i_star)[0]:
            dyn[h, e] = grid.limit[e] * i_star
            derated.append({"hour": h, "line": int(e), "loading": round(float(loading[e]), 3),
                            "ttl": round(time_to_limit(net, float(loading[e])) or 1.0, 3)})
    sched, cost, lay = dispatch(grid, P, avail, demand, dyn)

    sha = hashlib.sha1(json.dumps(gnn_rows).encode()).hexdigest()[:10]
    trip = worst_contingency(grid, sched0, lay, (load, solar, wind), weak)
    store = FeatureStore(os.path.join(OUT, "feature_store"))
    frames, alerts = replay(grid, sched, lay, (load, solar, wind), models[K], S, K, store, sha, trip_line=trip)
    fs = store.summary()
    store.close()
    # counterfactual: same N-2 under the static schedule, not persisted
    frames0, alerts0 = replay(grid, sched0, lay, (load, solar, wind), models[K], S, K, _NullStore(), sha, trip_line=trip)

    results = {
        "buses": grid.N, "lines": grid.M, "weak_lines": [int(w) for w in weak],
        "pinn": {"final_residual": pinn_hist[-1], "rows": [{k: v for k, v in r.items() if not k.startswith("profile")} for r in pinn_rows],
                 "time_to_limit_by_current": ttl, "sustainable_current_pu": round(i_star, 4)},
        "gnn": gnn_rows, "gnn_best_K": K,
        "dispatch": {"cost_static": round(cost0, 1), "cost_dynamic": round(cost, 1),
                     "shed_static_mwh": round(float(sched0["shed"].sum()), 2), "shed_dynamic_mwh": round(float(sched["shed"].sum()), 2),
                     "import_mwh": round(float(sched["import"].sum()), 1), "curtailed_mwh": round(float((avail - sched["gen"]).sum()), 1),
                     "derated_line_hours": len(derated)},
        "replay": {"contingency": [int(e) for e in trip], "alerts": len(alerts), "lines_tripped": max((len(f["tripped"]) for f in frames), default=0),
                   "lost_buses": max((len(f["lost"]) for f in frames), default=0),
                   "static_alerts": len(alerts0), "static_lines_tripped": max((len(f["tripped"]) for f in frames0), default=0),
                   "static_lost_buses": max((len(f["lost"]) for f in frames0), default=0)},
        "feature_store": fs, "model_sha": sha, "seconds": round(time.perf_counter() - t0, 1),
    }
    dash = {**results,
            "nodes": [{"id": i, "kind": grid.kind[i], "x": round(float(grid.xy[i, 0]), 1), "y": round(float(grid.xy[i, 1]), 1),
                       "peak": round(float(grid.peak_load[i]), 2)} for i in range(grid.N)],
            "edges": [{"id": e, "a": int(a), "b": int(b), "limit": round(float(grid.limit[e]), 2), "crit": round(float(crit[e]), 3)}
                      for e, (a, b) in enumerate(grid.edges)],
            "frames": frames, "alerts": alerts, "frames_static": frames0, "alerts_static": alerts0, "derated": derated,
            "pinn_profiles": [{"I": r["I"], "ref": r["profile_ref"], "pinn": r["profile_pinn"]} for r in pinn_rows],
            "pinn_hist": pinn_hist,
            "schedule": {k: np.asarray(v).round(2).tolist() for k, v in sched.items()},
            "avail": avail.round(2).tolist(), "demand_total": demand.sum(1).round(2).tolist()}
    json.dump(results, open(os.path.join(OUT, "results.json"), "w"), indent=2)
    json.dump(dash, open(os.path.join(OUT, "dashboard.json"), "w"))

    print("GridPulse")
    print(f"  grid            {grid.N} buses, {grid.M} lines, weak {list(map(int, weak))}")
    print(f"  pinn            residual {pinn_hist[-1]:.2e}  rel L2 " + " ".join(f"I={r['I']}:{r['rel_l2']:.3f}" for r in pinn_rows)
          + f"  sustainable {i_star:.3f} pu")
    print("  gnn             " + "  ".join(f"K={r['K']} auc {r['auc']}" for r in gnn_rows))
    d = results["dispatch"]
    print(f"  dispatch        cost {d['cost_static']} -> {d['cost_dynamic']}  shed {d['shed_static_mwh']} -> {d['shed_dynamic_mwh']} MWh  derated {d['derated_line_hours']} line-hours")
    r = results["replay"]
    print(f"  replay          N-2 {list(trip)} at 18:00; static schedule: {r['static_lines_tripped']} lines tripped, {r['static_lost_buses']} buses lost; "
          f"derated: {r['lines_tripped']} tripped, {r['lost_buses']} lost, {len(alerts)} alerts, store {fs['engine']}")


if __name__ == "__main__":
    main(quick="--quick" in sys.argv)
    import build_site
    build_site.write()
