"""VIC region demand vs price spikes.

Half-hourly demand with a weekday shape and a heat bump,
a 0.9 quantile forecast from lags + CDD, and a spike label
when the price residual clears a high quantile. Event log
names the three worst intervals so a desk can point at them.

Stand-in for AEMO VIC1. Offline.
"""
from __future__ import annotations

import json
import os

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression

SEED = 31
DAYS = 21
STEPS = DAYS * 48
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")


def series(rng):
    t = np.arange(STEPS)
    hod = (t % 48) / 2
    dow = (t // 48) % 7
    day = t // 48
    # late summer heat on the last four days
    cdd = np.clip(18 + 7 * np.sin(2 * np.pi * (hod - 15) / 24) + np.where(day >= DAYS - 4, 9, 0) + rng.normal(0, 1.1, STEPS), 0, None)
    base = 4200 + 900 * np.sin(2 * np.pi * (hod - 8) / 24) ** 2
    base = np.where(dow >= 5, base * 0.86, base)
    demand = base + 55 * cdd + rng.normal(0, 70, STEPS)
    # a unit trip on day 18 around 17:30
    trip = (day == 18) & (hod >= 17.5) & (hod <= 19)
    price = 45 + 0.012 * (demand - 4500) + 4 * cdd + rng.normal(0, 8, STEPS)
    price = np.where(trip, price * 9.5 + rng.uniform(800, 1400, STEPS), price)
    price = np.where((cdd > 14) & (hod >= 16) & (hod <= 20), price * 2.1, price)
    df = pd.DataFrame(
        {
            "t": t,
            "day": day,
            "hod": hod,
            "dow": dow,
            "cdd": cdd,
            "demand": demand,
            "price": price,
        }
    )
    df["d_lag1"] = df["demand"].shift(1)
    df["d_lag48"] = df["demand"].shift(48)
    return df.dropna().reset_index(drop=True)


def forecast(df):
    feats = ["hod", "dow", "cdd", "d_lag1", "d_lag48"]
    cut = int(len(df) * 0.7)
    train, test = df.iloc[:cut], df.iloc[cut:]
    q = GradientBoostingRegressor(loss="quantile", alpha=0.9, max_depth=3, n_estimators=180, random_state=0)
    q.fit(train[feats], train["demand"])
    hat = q.predict(test[feats])
    pinball = float(np.mean(np.maximum(0.9 * (test["demand"] - hat), (0.9 - 1) * (test["demand"] - hat))))
    cover = float((test["demand"] <= hat).mean())
    test = test.copy()
    test["q90"] = hat
    return test, pinball, cover


def spikes(train, test):
    # residual on log price from demand + cdd
    from sklearn.linear_model import LinearRegression

    Xtr = train[["demand", "cdd"]]
    ytr = np.log(np.clip(train["price"], 1, None))
    lr = LinearRegression().fit(Xtr, ytr)
    resid = np.log(np.clip(test["price"], 1, None)) - lr.predict(test[["demand", "cdd"]])
    thr = np.quantile(np.log(np.clip(train["price"], 1, None)) - lr.predict(train[["demand", "cdd"]]), 0.97)
    y = (resid > thr).astype(int)
    # classifier is just a readable score for the desk
    clf = LogisticRegression(max_iter=200)
    clf.fit(test[["demand", "cdd", "hod"]], y)
    score = clf.predict_proba(test[["demand", "cdd", "hod"]])[:, 1]
    test = test.copy()
    test["spike"] = y
    test["spike_p"] = score
    events = test[test["spike"] == 1].nlargest(3, "price")
    log = [
        {
            "day": int(r.day),
            "hour": float(r.hod),
            "price": round(float(r.price), 1),
            "demand": round(float(r.demand), 0),
            "note": "unit trip" if r.day == 18 else "heat peak",
        }
        for r in events.itertuples()
    ]
    return test, log, float(y.mean())


def main():
    os.makedirs(OUT, exist_ok=True)
    rng = np.random.default_rng(SEED)
    df = series(rng)
    cut = int(len(df) * 0.7)
    test, pinball, cover = forecast(df)
    test, event_log, rate = spikes(df.iloc[:cut], test)
    summary = {
        "pinball_q90": round(pinball, 1),
        "q90_coverage": round(cover, 3),
        "spike_rate": round(rate, 3),
        "events": event_log,
    }
    dash = {
        **summary,
        "demand": [round(float(v), 1) for v in test["demand"].values[::2]],
        "q90": [round(float(v), 1) for v in test["q90"].values[::2]],
        "events": [
            {
                "step": int(i * 4),
                "when": f"d{e['day']} {e['hour']:.1f}h",
                "reason": e["note"],
            }
            for i, e in enumerate(event_log)
        ],
    }
    with open(os.path.join(OUT, "results.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w", encoding="utf-8") as f:
        json.dump(dash, f)
    test.to_csv(os.path.join(OUT, "desk.csv"), index=False)

    fig, ax1 = plt.subplots(figsize=(9, 3.8))
    ax1.plot(test["t"], test["demand"], color="#1a1a1a", lw=1.1, label="demand")
    ax1.plot(test["t"], test["q90"], color="#555", lw=1, ls="--", label="q90")
    ax2 = ax1.twinx()
    ax2.plot(test["t"], test["price"], color="#b71c1c", lw=0.9, alpha=0.85, label="price")
    ax1.set_ylabel("MW")
    ax2.set_ylabel("$ / MWh")
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    plt.close()
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
