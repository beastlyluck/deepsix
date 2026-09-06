"""Faculty collaboration map: who actually writes with whom.

Author-paper bipartite graph projected to a weighted co-authorship graph, community
detection (networkx greedy modularity if available, else weighted label propagation),
modularity computed from the partition, and a ranked list of bridge authors who connect
otherwise separate communities. ArXiv-shaped synthetic author lists; runs offline.
"""
import json
import os
from collections import Counter, defaultdict

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

try:
    import networkx as nx
except ImportError:
    nx = None

SEED = 59
N_AUTHORS, N_PAPERS, N_GROUPS = 600, 1600, 14
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")


def make_papers(rng):
    """Authors sit in latent labs; most papers stay in-lab, some cross labs, a few authors roam."""
    lab = rng.integers(0, N_GROUPS, N_AUTHORS)
    roamer = rng.random(N_AUTHORS) < 0.08
    by_lab = defaultdict(list)
    for a, g in enumerate(lab):
        by_lab[g].append(a)
    papers = []
    for _ in range(N_PAPERS):
        g = rng.integers(0, N_GROUPS)
        k = rng.integers(2, 6)
        team = list(rng.choice(by_lab[g], min(k, len(by_lab[g])), replace=False))
        if rng.random() < 0.35:                                           # cross-lab paper
            team.append(int(rng.choice(np.where(roamer | (lab == rng.integers(0, N_GROUPS)))[0])))
        papers.append([int(a) for a in set(team)])
    return papers, lab


def project(papers):
    """Bipartite projection: edge weight = number of shared papers."""
    w = Counter()
    for team in papers:
        for i in range(len(team)):
            for j in range(i + 1, len(team)):
                a, b = sorted((team[i], team[j]))
                w[(a, b)] += 1
    return w


def label_propagation(adj, rng, iters=30):
    labels = {v: v for v in adj}
    for _ in range(iters):
        changed = False
        for v in rng.permutation(list(adj)):
            score = Counter()
            for u, w in adj[v].items():
                score[labels[u]] += w
            if score:
                best = max(score, key=lambda l: (score[l], -l))
                if best != labels[v]:
                    labels[v] = best; changed = True
        if not changed:
            break
    relabel = {c: i for i, c in enumerate(sorted(set(labels.values())))}
    return {v: relabel[c] for v, c in labels.items()}


def modularity(adj, comm):
    """Weighted Newman modularity computed directly from the partition."""
    m = sum(w for v in adj for w in adj[v].values()) / 2
    k = {v: sum(adj[v].values()) for v in adj}
    q = 0.0
    for v in adj:
        for u, w in adj[v].items():
            if comm[u] == comm[v]:
                q += w - k[v] * k[u] / (2 * m)
    return q / (2 * m)


def main():
    rng = np.random.default_rng(SEED)
    os.makedirs(OUT, exist_ok=True)
    papers, lab = make_papers(rng)
    weights = project(papers)
    adj = defaultdict(dict)
    for (a, b), w in weights.items():
        adj[a][b] = w; adj[b][a] = w
    if nx is not None:
        G = nx.Graph()
        G.add_weighted_edges_from([(a, b, w) for (a, b), w in weights.items()])
        comms = nx.community.greedy_modularity_communities(G, weight="weight", resolution=1.0)
        comm = {v: i for i, c in enumerate(comms) for v in c}; method = "networkx_greedy_modularity"
    else:
        comm = label_propagation(adj, rng); method = "label_propagation_fallback"
    Q = modularity(adj, comm)
    sizes = Counter(comm.values())
    real = [c for c, n in sizes.items() if n >= 5]

    # Bridges: authors whose co-authors span several communities (participation coefficient).
    bridges = []
    for v in adj:
        share = Counter()
        for u, w in adj[v].items():
            share[comm[u]] += w
        tot = sum(share.values())
        pc = 1 - sum((s / tot) ** 2 for s in share.values())
        if len(share) >= 3 and pc >= 0.5 and tot >= 8:
            bridges.append({"author": int(v), "participation": round(pc, 3), "communities": len(share), "coauthor_weight": int(tot)})
    bridges.sort(key=lambda b: (-b["participation"], -b["coauthor_weight"]))
    isolated = [c for c in real if all(comm[u] == c for v in adj if comm[v] == c for u in adj[v])]
    results = {"Authors": len(adj), "Communities": len(real), "Bridges": len(bridges), "Modularity": round(Q, 3),
               "method": method, "papers": len(papers), "coauthor_edges": len(weights),
               "isolated_communities": len(isolated), "top_bridges": bridges[:10],
               "community_sizes": sorted(sizes.values(), reverse=True)[:20]}
    print("Faculty collaboration map")
    for k in ["Authors", "Communities", "Bridges", "Modularity", "method", "isolated_communities"]:
        print(f"  {k:<22} {results[k]}")
    print("  top bridges:", [b["author"] for b in bridges[:8]])
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(results, f)

    nodes = list(adj)
    if nx is not None:
        pos = nx.spring_layout(G, seed=SEED, k=0.08)
    else:                                                                    # circle per community
        pos, cs = {}, sorted(set(comm.values()))
        for v in nodes:
            ci = cs.index(comm[v]); ang = 2 * np.pi * ci / len(cs)
            pos[v] = (3 * np.cos(ang) + rng.normal(0, 0.4), 3 * np.sin(ang) + rng.normal(0, 0.4))
    fig, ax = plt.subplots(figsize=(9, 8))
    for (a, b), w in weights.items():
        ax.plot([pos[a][0], pos[b][0]], [pos[a][1], pos[b][1]], color="lightgray", lw=0.3 + 0.1 * w, zorder=1)
    ax.scatter([pos[v][0] for v in nodes], [pos[v][1] for v in nodes], c=[comm[v] % 20 for v in nodes], cmap="tab20",
               s=[8 + 2 * len(adj[v]) for v in nodes], zorder=2)
    bset = [b["author"] for b in bridges]
    ax.scatter([pos[v][0] for v in bset], [pos[v][1] for v in bset], facecolors="none", edgecolors="k", s=90, lw=1.2, zorder=3)
    ax.set_title(f"Co-authorship, {len(real)} communities, modularity {Q:.2f}; circled = bridges"); ax.axis("off")
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    print(f"Wrote {OUT}/results.json and figure.png")


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
