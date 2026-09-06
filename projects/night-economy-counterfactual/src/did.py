"""Two-way FE DiD, clustered bootstrap, event-study leads/lags."""
import numpy as np
import pandas as pd


def did_ols(d):
    y = np.log(d["spend"].values)
    sensors = pd.get_dummies(d["sensor"], drop_first=False).values.astype(float)
    days = pd.get_dummies(d["day"], drop_first=True).values.astype(float)
    X = np.column_stack([sensors, days, (d["treated"] * d["post"]).values.astype(float)])
    beta, *_ = np.linalg.lstsq(X, y, rcond=None)
    resid = y - X @ beta
    return float(beta[-1]), resid


def block_bootstrap(d, rng, n=200):
    ids = d["sensor"].unique()
    boots = []
    for _ in range(n):
        pick = rng.choice(ids, len(ids), replace=True)
        b = pd.concat([d[d["sensor"] == s].assign(sensor=f"{s}_{i}") for i, s in enumerate(pick)])
        boots.append(did_ols(b)[0])
    return np.percentile(boots, [5, 95])


def event_study(d, width=4):
    """Weekly leads/lags around the cut. Pre-period should sit on zero."""
    d = d.copy()
    week = (d["day"] // 7).astype(int)
    cut = int(d.loc[d["post"] == 1, "day"].min() // 7)
    rel = week - cut
    keep = d[rel.abs() <= width].copy()
    keep["rel"] = (keep["day"] // 7) - cut
    y = np.log(keep["spend"].values)
    sensors = pd.get_dummies(keep["sensor"], drop_first=False).values.astype(float)
    weeks = pd.get_dummies(keep["rel"], drop_first=False)
    # omit week -1 as the reference
    if -1 in weeks.columns:
        weeks = weeks.drop(columns=[-1])
    interact = weeks.mul(keep["treated"].values, axis=0)
    X = np.column_stack([sensors, interact.values])
    beta, *_ = np.linalg.lstsq(X, y, rcond=None)
    names = list(interact.columns)
    coefs = beta[-len(names):]
    out = {int(k): round(float(v), 4) for k, v in zip(names, coefs)}
    out[-1] = 0.0
    return dict(sorted(out.items()))


def parallel_r2(d):
    pre = d[d["post"] == 0].groupby(["day", "treated"])["spend"].sum().unstack()
    A = np.column_stack([np.ones(len(pre)), pre[0].values])
    b, *_ = np.linalg.lstsq(A, pre[1].values, rcond=None)
    hat = A @ b
    return float(1 - ((pre[1].values - hat) ** 2).sum() / ((pre[1].values - pre[1].mean()) ** 2).sum())
