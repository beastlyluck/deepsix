"""Hierarchical weekly volume forecast with reconciliation, and dwell shrinkage.

Hierarchy: terminal -> shipping line -> service. Base forecasts are seasonal
Holt-Winters fitted per series (numpy). Reconciliation is MinT with a shrunk
covariance so the bottom series add up to the top exactly. Coherence is not a
nicety here: the yard plan is built from the top number and the block plan
from the bottom ones, and they must agree.

Dwell: per-line log-normal with empirical-Bayes shrinkage toward the terminal
prior, so a line with 30 boxes does not get a wild dwell estimate.
"""
import numpy as np


def holt_winters(y, season=52, alpha=0.3, beta=0.02, gamma=0.2, h=8):
    n = len(y)
    L = y[:season].mean()
    B = (y[season:2 * season].mean() - y[:season].mean()) / season
    S = y[:season] / L
    fitted = np.zeros(n)
    for t in range(n):
        s = S[t % season]
        fitted[t] = (L + B) * s
        Ln = alpha * y[t] / s + (1 - alpha) * (L + B)
        B = beta * (Ln - L) + (1 - beta) * B
        S[t % season] = gamma * y[t] / Ln + (1 - gamma) * s
        L = Ln
    fc = np.array([(L + (k + 1) * B) * S[(n + k) % season] for k in range(h)])
    return fc, y - fitted


def summing_matrix(keys):
    """Rows: total, one per line, one per bottom series. Columns: bottom series."""
    lines = sorted(set(k[0] for k in keys))
    S = [np.ones(len(keys))]
    for ln in lines:
        S.append(np.array([1.0 if k[0] == ln else 0.0 for k in keys]))
    S.extend(np.eye(len(keys)))
    return np.array(S), ["total"] + lines + [f"{a}/{b}" for a, b in keys]


def mint_reconcile(S, base, resid, lam=0.5):
    """MinT-shrink: G = (S' W^-1 S)^-1 S' W^-1, W = shrink(cov(resid))."""
    Wf = np.cov(resid)
    Wd = np.diag(np.diag(Wf))
    W = lam * Wd + (1 - lam) * Wf + 1e-6 * np.eye(len(Wf))
    Wi = np.linalg.inv(W)
    G = np.linalg.solve(S.T @ Wi @ S, S.T @ Wi)
    return S @ (G @ base)


def forecast_hierarchy(hist, h=8, holdout=8):
    keys = sorted(hist)
    S, names = summing_matrix(keys)
    n_bottom = len(keys)
    levels = {"total": [0], "line": list(range(1, len(names) - n_bottom)), "service": list(range(len(names) - n_bottom, len(names)))}
    bottom_train = np.array([hist[k][:-holdout] for k in keys])
    test_all = S @ np.array([hist[k][-holdout:] for k in keys])
    all_train = S @ bottom_train
    # base forecasts at every level independently: this is what makes them incoherent
    base, resid = [], []
    for row in all_train:
        fc, r = holt_winters(row, h=h)
        base.append(fc)
        resid.append(r[52:])
    base, resid = np.array(base), np.array(resid)
    rec = mint_reconcile(S, base, resid)

    def mape(a, b):
        return float(np.mean(np.abs(a - b) / np.maximum(b, 1)) * 100)

    def by_level(F):
        return {lvl: round(float(np.mean([mape(F[i], test_all[i]) for i in idx])), 2) for lvl, idx in levels.items()}

    incoh = float(np.abs(base[0] - base[levels["service"]].sum(0)).mean())
    return {"names": names, "levels": levels,
            "base": base.round(0).tolist(), "reconciled": rec.round(0).tolist(), "actual": test_all.round(0).tolist(),
            "history": {n: all_train[i][-52:].round(0).tolist() for i, n in enumerate(names)},
            "mape_base": by_level(base), "mape_reconciled": by_level(rec),
            "base_incoherence_boxes": round(incoh, 1)}


def dwell_shrinkage(boxes_by_line, prior_mu, prior_sd=0.3):
    """Empirical Bayes on log-dwell means. Returns per-line posterior mean and the P(dwell > 5 d)."""
    out = {}
    for line, dwell_days in boxes_by_line.items():
        x = np.log(np.asarray(dwell_days, float)) if len(dwell_days) else np.zeros(0)
        n, s2 = len(x), 0.45 ** 2
        post_var = 1 / (1 / prior_sd ** 2 + n / s2)
        post_mu = post_var * (prior_mu / prior_sd ** 2 + x.sum() / s2)
        p_long = 1 - _phi((np.log(5) - post_mu) / np.sqrt(s2))
        out[line] = {"n": int(n), "raw_mean_days": round(float(np.exp(x.mean())) if n else None, 2) if n else None,
                     "shrunk_mean_days": round(float(np.exp(post_mu)), 2), "p_dwell_gt_5d": round(float(p_long), 3)}
    return out


def _phi(z):
    from math import erf, sqrt
    return 0.5 * (1 + erf(z / sqrt(2)))
