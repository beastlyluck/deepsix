"""OceanicOS entry.

    python main.py            (~1 min)
    python main.py --quick

Order: layout -> vessel schedule -> DES under greedy -> fit spatio-temporal
congestion model on its snapshots -> DES under the assignment matrix with the
model in the loop -> benchmark -> hierarchical forecasts -> event store -> payload.
"""
import copy
import json
import os
import sys
import time

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, ".."))
from api.store import Store
from forecast.hierarchy import dwell_shrinkage, forecast_hierarchy
from forecast.stgnn import Congestion, fit_eval, set_geometry
from terminal.des import Terminal
from terminal.layout import Layout
from terminal.policy import Greedy, Matrix
from terminal.schedule import LINES, vessel_calls, weekly_history

OUT = os.path.join(HERE, "outputs")


def main(quick=False):
    os.makedirs(OUT, exist_ok=True)
    t0 = time.perf_counter()
    rng = np.random.default_rng(4)
    L = Layout()
    hours = 24 if quick else 48
    calls = vessel_calls(rng, hours=hours, cranes=L.Q)
    W = L.route_adjacency()
    nb = len(L.block_xy)
    set_geometry(L.block_xy, L.crane_xy, L.block_cap)

    greedy = Terminal(L, Greedy(), copy.deepcopy(calls), seed=1, horizon_s=hours * 3600).run()
    st_eval = fit_eval(greedy.snaps, W, nb, L.Q)
    cong = Congestion(W, nb, L.Q).fit(greedy.snaps)

    # dwell profile per line: a sample of each call's boxes, shrunk toward the terminal prior
    boxes_by_line = {ln: [] for ln in LINES}
    for v in greedy.vessels:
        boxes_by_line[v["line"]].extend(list(rng.lognormal(v["dwell_mu"], 0.45, 40)))
    prior_mu = float(np.mean([s["dwell_mu"] for s in LINES.values()]))
    dwell = dwell_shrinkage(boxes_by_line, prior_mu)
    dwell_fn = lambda box: np.exp(np.log(dwell[box.line]["shrunk_mean_days"])) * 86400

    matrix = Terminal(L, Matrix(L, congestion_fn=cong, dwell_fn=dwell_fn), copy.deepcopy(calls), seed=1, horizon_s=hours * 3600).run()
    bench = {"greedy": greedy.kpis(), "matrix": matrix.kpis()}

    hist = weekly_history(rng)
    hier = forecast_hierarchy(hist)

    store = Store(os.path.join(OUT, "events"))
    store.write_run("greedy", greedy)
    store.write_run("matrix", matrix)
    st_summary = store.summary()
    store.close()

    results = {
        "layout": {"cranes": L.Q, "blocks": nb, "agvs": len(greedy.agvs), "horizon_h": hours, "vessel_calls": len(calls)},
        "benchmark": bench, "stgnn_mae": st_eval, "dwell": dwell,
        "hierarchy_summary": {"mape_base": hier["mape_base"], "mape_reconciled": hier["mape_reconciled"],
                              "base_incoherence_boxes": hier["base_incoherence_boxes"]},
        "event_store": st_summary, "seconds": round(time.perf_counter() - t0, 1),
    }
    thin = lambda snaps: snaps[:: 2 if hours > 24 else 1]
    dash = {**results, "map": L.to_dict(),
            "runs": {"greedy": {"snaps": thin(greedy.snaps), "events": [e for e in greedy.log if e["kind"] in ("berth", "depart", "anchor")]},
                     "matrix": {"snaps": thin(matrix.snaps), "events": [e for e in matrix.log if e["kind"] in ("berth", "depart", "anchor")]}},
            "lifts": {"greedy": [e for e in greedy.log if e["kind"] == "lift"][::15], "matrix": [e for e in matrix.log if e["kind"] == "lift"][::15]},
            "calls": [{k: v for k, v in c.items() if k != "dwell_mu"} for c in calls],
            "hierarchy": hier}
    json.dump(results, open(os.path.join(OUT, "results.json"), "w"), indent=2)
    json.dump(dash, open(os.path.join(OUT, "dashboard.json"), "w"))

    print("OceanicOS")
    for name, k in bench.items():
        print(f"  {name:<8} {k['moves_per_hour']} moves/h  crane stall {k['crane_stall_min_per_crane']} min/crane  "
              f"agv empty {k['agv_empty_share']:.0%}  yard peak {k['yard_peak_saturation']:.0%}  turnaround {k['mean_turnaround_h']} h")
    print("  st model MAE (15m/30m/60m): " + "  ".join(f"{k}: {v['15m']}/{v['30m']}/{v['60m']}" for k, v in st_eval.items()))
    print(f"  hierarchy MAPE base {hier['mape_base']} -> reconciled {hier['mape_reconciled']}  base incoherence {hier['base_incoherence_boxes']} boxes/wk")
    print(f"  event store     {st_summary}")


if __name__ == "__main__":
    main(quick="--quick" in sys.argv)
    import build_site
    build_site.write()
