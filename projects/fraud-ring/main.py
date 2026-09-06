"""Fraud ring, explained: shared devices, shared addresses, shared velocity.

Accounts linked through shared devices and addresses form an entity graph. Graph
features (shared-entity degree, component size, triangles) are added to a tabular
baseline, a logistic model is scored by PR-AUC on a holdout, and flagged components
are rendered as case packs: nodes, the edges that bind them, and one sentence a
reviewer can argue with. PaySim/Elliptic-shaped synthetic data; runs offline.
"""
import json
import os
from collections import defaultdict
from itertools import combinations

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, precision_recall_curve
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

SEED = 61
N_ACCOUNTS, N_RINGS, N_FAMILIES = 3000, 12, 60
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")


def make_accounts(rng):
    """Legit accounts (some families sharing an address/device), plus rings sharing many entities."""
    device = [[f"d{i}"] for i in range(N_ACCOUNTS)]
    address = [[f"a{i}"] for i in range(N_ACCOUNTS)]
    tx = rng.gamma(2, 1.2, N_ACCOUNTS); age = rng.integers(30, 2000, N_ACCOUNTS)
    fraud, group = np.zeros(N_ACCOUNTS, int), np.full(N_ACCOUNTS, -1)
    idx = rng.permutation(N_ACCOUNTS)
    p = 0
    for f in range(N_FAMILIES):                                             # families: shared address, one device
        members = idx[p:p + rng.integers(2, 5)]; p += len(members)
        for m in members:
            address[m] = [f"fam_a{f}"]
            if rng.random() < 0.5:
                device[m] = [f"fam_d{f}"]
            group[m] = 1000 + f
    for r in range(N_RINGS):                                                # rings: many shared devices, new, fast
        members = idx[p:p + rng.integers(5, 9)]; p += len(members)
        devs = [f"ring_d{r}_{j}" for j in range(rng.integers(2, 4))]
        for m in members:
            device[m] = [str(d) for d in rng.choice(devs, rng.integers(1, 3), replace=False)]
            address[m] = [f"ring_a{r}"] if rng.random() < 0.7 else [f"a{m}"]
            tx[m] = rng.gamma(6, 1.5); age[m] = rng.integers(3, 60); fraud[m] = 1; group[m] = r
    solo = (group == -1) & (rng.random(N_ACCOUNTS) < 0.012)                # a few lone fraudsters, no graph signal
    fraud[solo] = 1
    return pd.DataFrame({"account": np.arange(N_ACCOUNTS), "fraud": fraud, "group": group, "device": device,
                         "address": address, "tx_per_day": tx, "avg_amount": rng.lognormal(4.2, 0.7, N_ACCOUNTS),
                         "age_days": age})


def build_edges(acc):
    edges = defaultdict(set)
    for kind in ["device", "address"]:
        owners = defaultdict(list)
        for a, ents in zip(acc["account"], acc[kind]):
            for e in ents:
                owners[e].append(int(a))
        for accounts in owners.values():
            for a, b in combinations(sorted(accounts), 2):
                edges[(a, b)].add(kind)
    return edges


def graph_features(acc, edges):
    adj = defaultdict(set)
    for a, b in edges:
        adj[a].add(b); adj[b].add(a)
    comp = {}
    for a in acc["account"]:                       # connected components by iterative DFS
        stack = [a] if a not in comp else []
        while stack:
            v = stack.pop()
            if v not in comp:
                comp[v] = a; stack.extend(adj[v] - set(comp))
    size = pd.Series(comp).map(pd.Series(comp).value_counts())
    feats = pd.DataFrame(index=acc["account"])
    feats["shared_degree"] = [len(adj[a]) for a in feats.index]
    feats["component_size"] = [size[a] for a in feats.index]
    feats["triangles"] = [sum(len(adj[a] & adj[u]) for u in adj[a]) / 2 for a in feats.index]
    feats["shared_devices"] = [sum("device" in edges[tuple(sorted((a, u)))] for u in adj[a]) for a in feats.index]
    return feats.reset_index(drop=True), comp, adj


def main():
    rng = np.random.default_rng(SEED)
    os.makedirs(OUT, exist_ok=True)
    acc = make_accounts(rng)
    edges = build_edges(acc)
    gf, comp, adj = graph_features(acc, edges)
    tab = acc[["tx_per_day", "avg_amount", "age_days"]].reset_index(drop=True)
    X_tab, X_all, y = tab.values, pd.concat([tab, gf], axis=1).values, acc["fraud"].values
    tr, te = train_test_split(np.arange(N_ACCOUNTS), test_size=0.4, random_state=SEED, stratify=y)
    aucs, curves = {}, {}
    for name, X in [("tabular_only", X_tab), ("tabular+graph", X_all)]:
        sc = StandardScaler().fit(X[tr])
        clf = LogisticRegression(max_iter=2000, C=0.5).fit(sc.transform(X[tr]), y[tr])
        prob = clf.predict_proba(sc.transform(X[te]))[:, 1]
        aucs[name] = round(float(average_precision_score(y[te], prob)), 3)
        curves[name] = precision_recall_curve(y[te], prob)[:2]
    p_all = clf.predict_proba(sc.transform(X_all))[:, 1]
    acc["score"] = p_all
    flagged = acc[acc["score"] > 0.5]

    # Case packs: components with >= 2 flagged accounts. False family: a flagged component with no fraud.
    packs, false_family = [], 0
    for cid, g in flagged.groupby(flagged["account"].map(comp)):
        if len(g) < 2:
            continue
        members = sorted(int(a) for a in g["account"])
        binds = [(a, b, sorted(edges[(a, b)])) for a, b in combinations(members, 2) if (a, b) in edges]
        shared = {kind for *_, kinds in binds for kind in kinds}
        sentence = (f"Accounts {members[:6]} share {' and '.join(sorted(shared)) or 'no entity'}, average "
                    f"{g['tx_per_day'].mean():.1f} tx/day, and are {g['age_days'].mean():.0f} days old on average.")
        truth = int(acc.loc[acc['account'].isin(members), 'fraud'].sum())
        if truth == 0:
            false_family += 1
        packs.append({"component": int(cid), "nodes": members, "edges": [[a, b, k] for a, b, k in binds][:12],
                      "sentence": sentence, "true_fraud_in_pack": truth})
    n_alerts, review_alert = len(flagged), 6.0                      # minutes per alert reviewed alone
    review_pack = 6.0 + 2.0 * float(np.mean([len(p["nodes"]) for p in packs])) if packs else 6.0
    packed_nodes = sum(len(p["nodes"]) for p in packs)
    reduction = 1 - (len(packs) * review_pack + (n_alerts - packed_nodes) * review_alert) / (n_alerts * review_alert)
    results = {"PR-AUC": aucs["tabular+graph"], "Cases packed": len(packs), "Review time": f"{-reduction:+.0%}",
               "False family": false_family, "pr_auc_by_features": aucs, "alerts": n_alerts, "fraud_rate": round(float(y.mean()), 3),
               "review_assumptions_min": {"per_alert": review_alert, "per_pack": round(float(review_pack), 1)},
               "case_packs": packs[:6]}
    print("Fraud ring, explained")
    for k in ["PR-AUC", "Cases packed", "Review time", "False family", "pr_auc_by_features", "alerts"]:
        print(f"  {k:<20} {results[k]}")
    print("  example pack:", packs[0]["sentence"] if packs else "none")
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(results, f)

    fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))
    for name, (pr, rc) in curves.items():
        axes[0].plot(rc, pr, label=f"{name} (AP {aucs[name]})")
    axes[0].set_xlabel("recall"); axes[0].set_ylabel("precision"); axes[0].set_title("Holdout PR curves"); axes[0].legend()
    if packs:
        nodes = packs[0]["nodes"][:8]; ang = np.linspace(0, 2 * np.pi, len(nodes), endpoint=False)
        pos = {n: (np.cos(a), np.sin(a)) for n, a in zip(nodes, ang)}
        for a, b, kinds in packs[0]["edges"]:
            if a in pos and b in pos:
                axes[1].plot([pos[a][0], pos[b][0]], [pos[a][1], pos[b][1]], color="tab:red" if "device" in kinds else "tab:blue", lw=1.5)
        axes[1].scatter([pos[n][0] for n in nodes], [pos[n][1] for n in nodes], s=300, c="white", edgecolors="k", zorder=3)
        for n in nodes:
            axes[1].annotate(str(n), pos[n], ha="center", va="center", fontsize=8, zorder=4)
        axes[1].set_title("Case pack 1 (red = shared device, blue = shared address)"); axes[1].axis("off")
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    print(f"Wrote {OUT}/results.json and figure.png")


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
