"""Supplier risk web: the one delayed container that starves three hospitals.

A four-tier supply graph (vendors -> ports -> distribution centres -> hospitals), edge
betweenness centrality (networkx if available, else a Brandes BFS implementation),
a risk score combining betweenness, delay probability and volume, an edge-cut impact
count, and recall of high-impact delay events. Synthetic; runs offline.
"""
import json
import os
import time
from collections import defaultdict, deque

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

try:
    import networkx as nx
except ImportError:
    nx = None

SEED = 53
N_VENDORS, N_PORTS, N_DCS, N_HOSPITALS = 300, 12, 8, 40
TOP_K = 17
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")


def make_graph(rng):
    """Directed edges with volume (pallets/week) and delay probability. Ports are the choke points."""
    vendors = [f"V{i}" for i in range(N_VENDORS)]
    ports = [f"P{i}" for i in range(N_PORTS)]
    dcs = [f"D{i}" for i in range(N_DCS)]
    hosp = [f"H{i}" for i in range(N_HOSPITALS)]
    edges = {}
    port_w = rng.dirichlet(np.ones(N_PORTS) * 0.7)                    # a few ports carry most vendors
    for v in vendors:
        for p in rng.choice(ports, rng.integers(1, 3), replace=False, p=port_w):
            edges[(v, str(p))] = (rng.lognormal(2.5, 0.6), rng.beta(2, 12))
    for i, d in enumerate(dcs):                                        # every DC is fed by at least one port
        edges[(ports[i % N_PORTS], d)] = (rng.lognormal(4.5, 0.4), rng.beta(2, 10))
    for p in ports:
        for d in rng.choice(dcs, rng.integers(1, 3), replace=False):
            edges[(p, str(d))] = (rng.lognormal(4.5, 0.4), rng.beta(2, 10))
    for h in hosp:
        for d in rng.choice(dcs, rng.integers(1, 3), replace=False):
            edges[(str(d), h)] = (rng.lognormal(3.0, 0.5), rng.beta(1.5, 20))
    return vendors + ports + dcs + hosp, edges, vendors, hosp


def brandes_edge_betweenness(nodes, adj):
    """Unweighted directed edge betweenness (Brandes 2001) with plain BFS."""
    eb = defaultdict(float)
    for s in nodes:
        sigma, dist, pred, order = {s: 1.0}, {s: 0}, defaultdict(list), []
        q = deque([s])
        while q:
            v = q.popleft(); order.append(v)
            for w in adj[v]:
                if w not in dist:
                    dist[w] = dist[v] + 1; q.append(w)
                if dist[w] == dist[v] + 1:
                    sigma[w] = sigma.get(w, 0) + sigma[v]; pred[w].append(v)
        delta = defaultdict(float)
        for w in reversed(order):
            for v in pred[w]:
                c = sigma[v] / sigma[w] * (1 + delta[w])
                eb[(v, w)] += c; delta[v] += c
    return eb


def reachable_hospitals(adj, sources, hospitals, removed=None):
    seen, q = set(sources), deque(sources)
    while q:
        v = q.popleft()
        for w in adj[v]:
            if removed and (v, w) == removed:
                continue
            if w not in seen:
                seen.add(w); q.append(w)
    return set(hospitals) & seen


def main():
    rng = np.random.default_rng(SEED)
    os.makedirs(OUT, exist_ok=True)
    t0 = time.perf_counter()
    nodes, edges, vendors, hosp = make_graph(rng)
    adj = defaultdict(list)
    for (u, v) in edges:
        adj[u].append(v)
    if nx is not None:
        G = nx.DiGraph(); G.add_edges_from(edges)
        eb = nx.edge_betweenness_centrality(G, normalized=False)
        method = "networkx"
    else:
        eb = brandes_edge_betweenness(nodes, adj); method = "brandes_bfs_fallback"
    eb_max = max(eb.values())
    vol = {e: edges[e][0] for e in edges}
    baseline = reachable_hospitals(adj, vendors, hosp)
    impact = {e: len(baseline - reachable_hospitals(adj, vendors, hosp, removed=e)) for e in edges}
    score = {e: (eb.get(e, 0) / eb_max) * edges[e][1] * np.log1p(vol[e]) * (1 + impact[e]) for e in edges}
    ranked = sorted(score, key=score.get, reverse=True)
    critical = ranked[:TOP_K]
    top = critical[0]
    # 30 days of delay events on edges drawn by delay probability; high-impact = starves >= 1 hospital.
    probs = np.array([edges[e][1] for e in edges]); keys = list(edges)
    events = [keys[i] for i in rng.choice(len(keys), 200, p=probs / probs.sum())]
    high = [e for e in events if impact[e] >= 1]
    recall = len([e for e in high if e in set(critical)]) / max(len(high), 1)
    brief_s = time.perf_counter() - t0
    results = {"Nodes": len(nodes), "Critical edges": TOP_K, "Delay recall": round(recall, 2),
               "Brief time": f"{brief_s:.1f}s", "betweenness_method": method, "edges": len(edges),
               "top_edge": {"edge": list(top), "hospitals_starved_if_cut": impact[top], "delay_prob": round(edges[top][1], 3),
                            "volume": round(vol[top], 1)},
               "critical_edges": [{"edge": list(e), "score": round(score[e], 3), "starves": impact[e]} for e in critical],
               "high_impact_events": len(high), "events_simulated": len(events)}
    print("Supplier risk web")
    for k in ["Nodes", "Critical edges", "Delay recall", "Brief time", "betweenness_method", "edges"]:
        print(f"  {k:<20} {results[k]}")
    print(f"  cut {top[0]}->{top[1]} and {impact[top]} hospitals lose every inbound path")
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(results, f)

    tier = {n: "VPDH".index(n[0]) for n in nodes}
    pos = {}
    for t in range(4):
        layer = [n for n in nodes if tier[n] == t]
        for i, n in enumerate(layer):
            pos[n] = (t, (i + 0.5) / len(layer))
    inflow = defaultdict(float)
    for (u, v), (w, _) in edges.items():
        inflow[v] += w; inflow[u] += w
    fig, ax = plt.subplots(figsize=(12, 6))
    crit = set(critical)
    for (u, v), (w, p) in edges.items():
        ax.plot([pos[u][0], pos[v][0]], [pos[u][1], pos[v][1]], color="tab:red" if (u, v) in crit else "lightgray",
                lw=2.2 if (u, v) in crit else 0.4, alpha=0.9 if (u, v) in crit else 0.6, zorder=1)
    xs = [pos[n][0] for n in nodes]; ys = [pos[n][1] for n in nodes]
    ax.scatter(xs, ys, s=[6 + 0.05 * inflow[n] for n in nodes], c=[tier[n] for n in nodes], cmap="viridis", zorder=2)
    ax.set_xticks(range(4)); ax.set_xticklabels(["vendors", "ports", "distribution centres", "hospitals"])
    ax.set_yticks([]); ax.set_title(f"Supply web: {TOP_K} critical edges in red (size = volume)")
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    print(f"Wrote {OUT}/results.json and figure.png")


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
