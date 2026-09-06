"""SKU Hierarchy Reconciliation: store x SKU forecasts that add up to the chain total.

Five-level hierarchy (total > state > store > department > SKU), a global gradient
boosting base forecaster, MinT (shrinkage) reconciliation, WRMSSE scoring and a
coherence check. Demand is synthetic and M5-shaped; runs offline.
"""
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

try:
    from lightgbm import LGBMRegressor
    def make_gbm():
        return LGBMRegressor(n_estimators=200, learning_rate=0.05, verbose=-1, random_state=0)
except ImportError:
    from sklearn.ensemble import HistGradientBoostingRegressor
    def make_gbm():
        return HistGradientBoostingRegressor(max_iter=200, learning_rate=0.05, random_state=0)

SEED = 42
DAYS, H = 365, 28
STATES, STORES_PER_STATE, DEPTS_PER_STORE, SKUS_PER_DEPT = 2, 2, 3, 5
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")


def build_hierarchy():
    """Return bottom-series labels and the summing matrix S (all nodes x bottom)."""
    bottom, groups = [], {"total": [], "state": {}, "store": {}, "dept": {}}
    for s in range(STATES):
        for st in range(STORES_PER_STATE):
            for d in range(DEPTS_PER_STORE):
                for k in range(SKUS_PER_DEPT):
                    name = f"S{s}_ST{st}_D{d}_SKU{k}"
                    i = len(bottom); bottom.append(name)
                    groups["total"].append(i)
                    groups["state"].setdefault(f"S{s}", []).append(i)
                    groups["store"].setdefault(f"S{s}_ST{st}", []).append(i)
                    groups["dept"].setdefault(f"S{s}_ST{st}_D{d}", []).append(i)
    rows, labels, levels = [], [], []
    for lvl, members in [("total", {"total": groups["total"]}), ("state", groups["state"]),
                         ("store", groups["store"]), ("dept", groups["dept"])]:
        for name, idx in members.items():
            r = np.zeros(len(bottom)); r[idx] = 1; rows.append(r); labels.append(name); levels.append(lvl)
    for i, name in enumerate(bottom):
        r = np.zeros(len(bottom)); r[i] = 1; rows.append(r); labels.append(name); levels.append("sku")
    return np.array(rows), labels, np.array(levels)


def make_demand(rng, n_bottom):
    t = np.arange(DAYS)
    dow = t % 7
    Y = np.zeros((DAYS, n_bottom))
    for i in range(n_bottom):
        level = rng.lognormal(1.2, 0.8)
        weekly = 1 + 0.3 * np.isin(dow, [5, 6]) * rng.uniform(0.5, 1.5)
        trend = 1 + rng.uniform(-0.2, 0.4) * t / DAYS
        mu = level * weekly * trend * (1 + 0.15 * np.sin(2 * np.pi * t / 365 + rng.uniform(0, 6)))
        Y[:, i] = rng.poisson(mu) * (rng.random(DAYS) > rng.uniform(0, 0.3))  # intermittent
    return Y


def base_forecasts(Yall, origin):
    """One global GBM, direct 28-step: features use only data available at the origin."""
    n_series = Yall.shape[1]
    def feats(t0, h):
        lag = Yall[t0 + h - 35, :]                       # same weekday as target, observed before origin
        return np.column_stack([np.full(n_series, (t0 + h) % 7), np.full(n_series, h),
                                Yall[t0 - 28:t0].mean(0), Yall[t0 - 7:t0].mean(0), lag, np.arange(n_series)])
    X, y = [], []
    for t0 in range(DAYS // 2, origin - H, 7):
        for h in range(H):
            X.append(feats(t0, h)); y.append(Yall[t0 + h])
    model = make_gbm().fit(np.vstack(X), np.concatenate(y))
    fc = np.array([model.predict(feats(origin, h)) for h in range(H)])
    resid = []                                           # in-sample residuals for the MinT covariance
    for t0 in range(origin - 4 * H, origin, H):
        fitted = np.array([model.predict(feats(t0, h)) for h in range(H)])
        resid.append(Yall[t0:t0 + H] - fitted)
    return np.clip(fc, 0, None), np.vstack(resid)


def mint_reconcile(S, yhat, resid):
    """MinT-shrink: W = lambda*diag + (1-lambda)*cov, G = (S'W^-1 S)^-1 S'W^-1."""
    W_full = np.cov(resid.T) + 1e-6 * np.eye(S.shape[0])
    lam = 0.5 if len(resid) < 60 else 0.2
    W = lam * np.diag(np.diag(W_full)) + (1 - lam) * W_full
    Winv = np.linalg.inv(W)
    G = np.linalg.solve(S.T @ Winv @ S, S.T @ Winv)
    return (S @ G @ yhat.T).T


def wrmsse(Yall_train, Ytest, F, levels, weights):
    scale = np.mean(np.diff(Yall_train, axis=0) ** 2, axis=0) + 1e-9
    rmsse = np.sqrt(np.mean((Ytest - F) ** 2, axis=0) / scale)
    out = 0.0
    for lvl in np.unique(levels):
        m = levels == lvl
        w = weights[m] / weights[m].sum()
        out += (w * rmsse[m]).sum() / len(np.unique(levels))
    return float(out)


def main():
    rng = np.random.default_rng(SEED)
    os.makedirs(OUT, exist_ok=True)
    S, labels, levels = build_hierarchy()
    Yb = make_demand(rng, S.shape[1])
    Yall = Yb @ S.T                                   # all 79 series, coherent by construction
    origin = DAYS - H
    prices = rng.uniform(2, 40, S.shape[1])
    weights = S @ (prices * Yb[origin - 28:origin].sum(0))   # revenue in last 28 days, per node

    base, resid = base_forecasts(Yall, origin)
    mint = mint_reconcile(S, base, resid)
    test = Yall[origin:]
    bottom_mint = mint[:, levels == "sku"]
    coherence_err = float(np.abs(bottom_mint @ S.T - mint).max())
    base_incoh = float(np.abs(base[:, levels == "sku"] @ S.T - base).max())
    results = {"WRMSSE": round(wrmsse(Yall[:origin], test, mint, levels, weights), 3),
               "WRMSSE base (unreconciled)": round(wrmsse(Yall[:origin], test, base, levels, weights), 3),
               "Levels": 5, "Coherence error": round(coherence_err, 8),
               "Base incoherence (max abs)": round(base_incoh, 2), "SKU coverage": int(S.shape[1])}
    print("SKU Hierarchy Reconciliation")
    for k, v in results.items():
        print(f"  {k:<28} {v}")
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(results, f)

    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    axes[0].plot(test[:, 0], "k", label="actual total")
    axes[0].plot(base[:, 0], "--", color="tab:gray", label="base total")
    axes[0].plot(base[:, levels == "sku"].sum(1), ":", color="tab:red", label="sum of base SKUs")
    axes[0].plot(mint[:, 0], color="tab:green", label="MinT total")
    axes[0].set_title("Chain total, 28-day horizon"); axes[0].legend()
    lv_order = ["total", "state", "store", "dept", "sku"]
    def per_level(F, l):
        m = levels == l
        return wrmsse(Yall[:origin][:, m], test[:, m], F[:, m], levels[m], weights[m])
    b = [per_level(base, l) for l in lv_order]
    m = [per_level(mint, l) for l in lv_order]
    x = np.arange(5)
    axes[1].bar(x - 0.2, b, 0.4, label="base"); axes[1].bar(x + 0.2, m, 0.4, label="MinT")
    axes[1].set_xticks(x); axes[1].set_xticklabels(lv_order); axes[1].set_title("RMSSE by level"); axes[1].legend()
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    print(f"Wrote {OUT}/results.json and figure.png")


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
