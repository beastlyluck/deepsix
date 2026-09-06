"""Replay a dispatched day as 10-minute windows, through the feature store and
the SGC scorer, with one contingency injected mid-evening. This is what the
Flink job does live; here it is a loop so the dashboard has something to show.
"""
import numpy as np

from gnn.sgc import node_features, score_nodes
from grid.powerflow import cascade, solve
from grid.scenarios import injection

WINDOWS_PER_HOUR = 6


def hourly_injection(grid, sched, lay, profiles, h):
    load, solar, wind = profiles
    kind = np.array(grid.kind)
    inj = -grid.peak_load * load[h]
    inj[lay["loads"]] += sched["shed"][h]
    inj[lay["gens"]] += sched["gen"][h]
    inj[lay["batts"]] += sched["discharge"][h] - sched["charge"][h]
    inj[grid.slack] += sched["import"][h] - sched["export"][h]
    inj[grid.slack] -= inj.sum()
    return inj


def worst_contingency(grid, sched, lay, profiles, weak, hour=18):
    """The N-2 among the weak lines that loses most buses under `sched` at `hour`."""
    from itertools import combinations
    inj = hourly_injection(grid, sched, lay, profiles, hour)
    best, best_loss = None, -1
    for pair in combinations(sorted(int(w) for w in weak), 2):
        lost, _, _, tripped, _ = cascade(grid, inj, pair)
        score = lost.sum() * 100 + len(tripped)
        if score > best_loss:
            best, best_loss = pair, score
    return best


def run(grid, sched, lay, profiles, clf, S, K, store, model_sha, trip_hour=18, trip_line=None, rng=None):
    rng = rng or np.random.default_rng(7)
    frames, alerts = [], []
    active = set()                     # buses currently above threshold; alert on the rising edge only
    mask = np.ones(grid.M, bool)
    for h in range(24):
        for w in range(WINDOWS_PER_HOUR):
            t_min = h * 60 + w * 10
            inj = hourly_injection(grid, sched, lay, profiles, h) * (1 + rng.normal(0, 0.02, grid.N))
            inj[grid.slack] -= inj.sum()
            trip = ()
            if h == trip_hour and w == 0 and trip_line is not None:
                trip = tuple(int(e) for e in np.atleast_1d(trip_line))
                lost, mask, rounds, tripped, flow = cascade(grid, inj, trip)
            else:
                lost = np.zeros(grid.N, bool)
                tripped = []
                flow, _ = solve(grid, inj, mask)
            feats = node_features(grid, inj, tuple(np.where(~mask)[0]))
            risk = score_nodes(clf, S, K, feats)
            store.write_features([(int(b), t_min - 10, t_min, *[float(v) for v in feats[b, :7]], 1) for b in range(grid.N)])
            store.write_risk([(int(b), t_min, float(risk[b]), model_sha) for b in range(grid.N)])
            hot = set(int(b) for b in np.where(risk > 0.5)[0])
            for b in sorted(hot - active):
                alerts.append({"t_min": t_min, "bus": b, "risk": round(float(risk[b]), 3),
                               "severity": "CRITICAL" if risk[b] > 0.8 else "WARN",
                               "lines": [int(e) for e in np.where(~mask)[0]]})
            active = hot
            frames.append({
                "t_min": t_min, "hour": h,
                "loading": (np.abs(flow) / grid.limit).round(3).tolist(),
                "open": [int(e) for e in np.where(~mask)[0]],
                "risk": risk.round(3).tolist(),
                "lost": [int(b) for b in np.where(lost)[0]],
                "tripped": [int(e) for e in tripped],
                "soc": sched["soc"][h].round(2).tolist(),
            })
    return frames, alerts
