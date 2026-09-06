"""Arrival GLM, campus scorecard, flu-week attribution.

The GLM is for arrivals. Occupancy is a queue, not a regression.
The residual is the “did this campus change?” check against last winter.
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import PoissonRegressor

from .simulate import BAYS, CAMPUSES, DAYS


def fit_arrivals(df):
    work = df.copy()
    work["weekend"] = (work["day"] % 7 >= 5).astype(int)
    work["hbin"] = (work["hour"] // 2).astype(int)
    X = pd.get_dummies(work[["campus", "hbin", "weekend"]].astype(str), drop_first=True)
    y = work["arrivals"]
    model = PoissonRegressor(alpha=1e-4, max_iter=400)
    model.fit(X, y)
    pred = model.predict(X)
    mae = float(np.mean(np.abs(y - pred)))
    work["arr_hat"] = pred
    return model, mae, work


def campus_report(df, winter_midnight):
    last = df[df["day"] == DAYS - 1]
    out = []
    for campus in CAMPUSES:
        g = last[last["campus"] == campus]
        midnight = g.loc[g["hour"] < 0.3, "occupancy"].mean()
        residual = midnight - winter_midnight[campus]
        out.append({
            "campus": campus,
            "median_wait": round(float(g["wait_min"].median()), 1),
            "peak_ramping": int(g["ramping"].max()),
            "occ_pct": round(100 * g["occupancy"].mean() / BAYS[campus], 1),
            "breaches": int(g["at_risk_4h"].sum()),
            "midnight_residual": round(float(residual), 1),
            "bays": BAYS[campus],
        })
    return out


def flu_attribution(df):
    """Austin week 2 vs week 1, contrasted with the other three campuses."""
    early = df[df["day"] < 7]
    late = df[df["day"] >= 7]
    rows = []
    for campus in CAMPUSES:
        e = early[early["campus"] == campus]
        l = late[late["campus"] == campus]
        rows.append({
            "campus": campus,
            "arrivals_w1": round(float(e["arrivals"].sum()), 1),
            "arrivals_w2": round(float(l["arrivals"].sum()), 1),
            "wait_w1": round(float(e["wait_min"].median()), 1),
            "wait_w2": round(float(l["wait_min"].median()), 1),
            "ramp_w1": int(e["ramping"].max()),
            "ramp_w2": int(l["ramping"].max()),
            "breach_w1": int(e["at_risk_4h"].sum()),
            "breach_w2": int(l["at_risk_4h"].sum()),
        })
    return rows


def last_day_series(df):
    last = df[df["day"] == DAYS - 1]
    series = {}
    for campus in CAMPUSES:
        g = last[last["campus"] == campus].sort_values("slot")
        series[campus] = {
            "hour": [round(float(h), 2) for h in g["hour"]],
            "occupancy": g["occupancy"].astype(int).tolist(),
            "ramping": g["ramping"].astype(int).tolist(),
            "wait": [round(float(w), 1) for w in g["wait_min"]],
            "arrivals": g["arrivals"].astype(int).tolist(),
            "bays": int(BAYS[campus]),
        }
    return series
