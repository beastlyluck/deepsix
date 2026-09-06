"""Simplified graph convolution with scipy sparse ops.

Message passing is S^k X for k = 0..K with S = D^-1/2 (A + I) D^-1/2, hops
concatenated (SIGN-style) rather than the pure S^K X of SGC, because a bus's
own loading matters as much as its neighbourhood's. No learned weights in the
propagation: the whole thing is a few sparse matmuls followed by a logistic
regression. It runs on a substation PC in milliseconds and K=0 is the exact
ablation for "did the graph help".

Labels come from the cascade simulator: node lost service in the contingency.
Split is by scenario so the same outage never appears in train and test.
"""
import numpy as np
from scipy.sparse import diags, identity
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from grid.powerflow import cascade, solve


def propagator(grid):
    A = grid.adjacency() + identity(grid.N)
    d = np.asarray(A.sum(1)).ravel()
    Dm = diags(1 / np.sqrt(d))
    return (Dm @ A @ Dm).tocsr()


def node_features(grid, inj, trip):
    """Pre-cascade features only. Nothing here peeks at the outcome."""
    mask = np.ones(grid.M, bool)
    mask[list(trip)] = False
    flow, _ = solve(grid, inj, mask)
    loading = np.abs(flow) / grid.limit
    A = grid.incidence()
    inc_load = np.abs(A.T) @ (loading * mask)         # sum of loading on incident live lines
    inc_max = np.zeros(grid.N)
    for e, (a, b) in enumerate(grid.edges):
        if mask[e]:
            inc_max[a] = max(inc_max[a], loading[e])
            inc_max[b] = max(inc_max[b], loading[e])
    deg = np.asarray(grid.adjacency(mask).sum(1)).ravel()
    near_trip = np.zeros(grid.N)
    for e in trip:
        near_trip[grid.edges[e]] = 1
    return np.column_stack([inj, np.abs(inj), deg, inc_load, inc_max, near_trip, (loading[mask] > 0.9).sum() * np.ones(grid.N)])


def build_dataset(grid, scenarios):
    X, y, groups = [], [], []
    for g, (inj, trip, h, scale) in enumerate(scenarios):
        lost, *_ = cascade(grid, inj, trip)
        X.append(node_features(grid, inj, trip))
        y.append(lost.astype(int))
        groups.append(np.full(grid.N, g))
    return np.stack(X), np.stack(y), np.concatenate(groups)


def hops(S, feats, K):
    """[X, SX, S^2X, ...] concatenated along features."""
    out, cur = [feats], feats
    for _ in range(K):
        cur = S @ cur
        out.append(cur)
    return np.concatenate(out, axis=-1)


def fit_eval(grid, X, y, k_values=(0, 1, 2, 3), test_frac=0.3, seed=0):
    S = propagator(grid)
    rng = np.random.default_rng(seed)
    n_scn = X.shape[0]
    test = rng.random(n_scn) < test_frac
    out, models = [], {}
    for K in k_values:
        Xp = np.stack([hops(S, X[s], K) for s in range(n_scn)])
        d = Xp.shape[-1]
        Xtr, ytr = Xp[~test].reshape(-1, d), y[~test].ravel()
        Xte, yte = Xp[test].reshape(-1, d), y[test].ravel()
        clf = make_pipeline(StandardScaler(), LogisticRegression(max_iter=3000, C=0.5, class_weight="balanced")).fit(Xtr, ytr)
        p = clf.predict_proba(Xte)[:, 1]
        out.append({"K": K, "auc": round(roc_auc_score(yte, p), 3), "ap": round(average_precision_score(yte, p), 3),
                    "positives": int(yte.sum()), "n": int(len(yte))})
        models[K] = clf
    return out, models, S


def score_nodes(clf, S, K, feats):
    return clf.predict_proba(hops(S, feats, K))[:, 1]


def edge_criticality(grid, scenarios, n=150):
    """How often each line trips in a cascade it did not start. Drives edge colouring."""
    count = np.zeros(grid.M)
    for inj, trip, *_ in scenarios[:n]:
        _, _, _, tripped, _ = cascade(grid, inj, trip)
        for e in tripped:
            if e not in trip:
                count[e] += 1
    return count / n
