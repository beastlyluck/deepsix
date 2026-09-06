"""Campus Load Forecast: 24-hour campus electricity demand with a drift gate.

Gradient boosting on weather, timetable and lag features, rolling-origin 24h
evaluation, a 0.9 quantile model scored with pinball loss, a ridge AR(72) residual
corrector standing in for the LSTM, and a PSI drift gate that triggers a
champion/challenger swap when summer arrives early. Synthetic; runs offline.
"""
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge

try:
    from lightgbm import LGBMRegressor as GBM
    def make_gbm(quantile=None):
        kw = {"objective": "quantile", "alpha": quantile} if quantile else {}
        return GBM(n_estimators=300, learning_rate=0.05, verbose=-1, random_state=0, **kw)
except ImportError:
    from sklearn.ensemble import HistGradientBoostingRegressor as GBM
    def make_gbm(quantile=None):
        kw = {"loss": "quantile", "quantile": quantile} if quantile else {}
        return GBM(max_iter=300, learning_rate=0.05, random_state=0, **kw)

SEED = 5
BUILDINGS = 12
DAYS = 120
EVAL_DAYS = 14
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")


def make_campus(rng):
    """Hourly kWh for 12 buildings, summed to campus. Heat arrives early in the last 2 weeks."""
    t = np.arange(DAYS * 24)
    hod, dow, day = t % 24, (t // 24) % 7, t // 24
    season = 14 + 6 * np.sin(2 * np.pi * (day - 200) / 365)
    early_summer = np.where(day >= DAYS - EVAL_DAYS, 7.0, 0.0)           # drift in the eval window
    temp = season + early_summer + 5 * np.sin(2 * np.pi * (hod - 14) / 24) + rng.normal(0, 1.5, len(t))
    teaching = ((dow < 5) & (hod >= 8) & (hod < 18)).astype(float) * (1 - 0.5 * (day % 7 == 6))
    occupancy = teaching * (0.6 + 0.4 * np.sin(np.pi * np.clip((hod - 8) / 10, 0, 1)))
    total = np.zeros(len(t))
    day_shock = rng.normal(1.0, 0.06, DAYS)[day]                          # events, exams, unlogged closures
    for _ in range(BUILDINGS):
        base = rng.uniform(40, 90)
        cooling = rng.uniform(6, 14) * np.clip(temp - 22, 0, None)
        heating = rng.uniform(2, 5) * np.clip(12 - temp, 0, None)
        total += (base + rng.uniform(60, 140) * occupancy + cooling + heating) * day_shock + rng.normal(0, 10, len(t))
    df = pd.DataFrame({"t": t, "day": day, "hod": hod, "dow": dow, "temp": temp,
                       "occupancy": occupancy, "kwh": total})
    df["lag24"] = df["kwh"].shift(24)
    df["lag168"] = df["kwh"].shift(168)
    df["cdd"] = np.clip(df["temp"] - 22, 0, None)
    return df.dropna().reset_index(drop=True)


FEATS = ["hod", "dow", "temp", "cdd", "occupancy", "lag24", "lag168"]


def psi(ref, cur, bins=10):
    edges = np.quantile(ref, np.linspace(0, 1, bins + 1))
    edges[0], edges[-1] = -np.inf, np.inf
    r = np.histogram(ref, edges)[0] / len(ref) + 1e-6
    c = np.histogram(cur, edges)[0] / len(cur) + 1e-6
    return float(np.sum((c - r) * np.log(c / r)))


def rolling_origin(df, retrain_every=7):
    """Retrain weekly; forecast each of the last 14 days 24h ahead from midnight."""
    preds, q90s, actuals, days = [], [], [], []
    model = qmodel = resid_ar = None
    for k, d in enumerate(range(DAYS - EVAL_DAYS, DAYS)):
        train = df[df["day"] < d]
        if k % retrain_every == 0:
            model = make_gbm().fit(train[FEATS], train["kwh"])
            qmodel = make_gbm(0.9).fit(train[FEATS], train["kwh"])
            res = train["kwh"].values - model.predict(train[FEATS])
            lagged = np.column_stack([np.roll(res, i) for i in range(24, 96)])[96:]
            resid_ar = Ridge(alpha=50.0).fit(lagged, res[96:])
        test = df[df["day"] == d]
        base = model.predict(test[FEATS])
        res_hist = train["kwh"].values[-120:] - model.predict(train[FEATS].tail(120))
        n = len(res_hist)   # lags 24..95 relative to each target hour h are all observed
        X_h = np.array([res_hist[n + h - np.arange(24, 96)] for h in range(len(test))])
        corr = resid_ar.predict(X_h)
        preds.append(base + 0.5 * corr); q90s.append(qmodel.predict(test[FEATS]))
        actuals.append(test["kwh"].values); days.append(d)
    return np.concatenate(preds), np.concatenate(q90s), np.concatenate(actuals), df[df["day"] >= DAYS - EVAL_DAYS]


def main():
    rng = np.random.default_rng(SEED)
    os.makedirs(OUT, exist_ok=True)
    df = make_campus(rng)
    pred, q90, actual, eval_df = rolling_origin(df)
    mape = float(np.mean(np.abs(actual - pred) / actual))
    pin = np.mean(np.where(actual >= q90, 0.9 * (actual - q90), 0.1 * (q90 - actual)))
    pinball_norm = float(pin / actual.mean())

    ref = df[df["day"] < DAYS - EVAL_DAYS]
    drift = {f: round(psi(ref[f].values, eval_df[f].values), 3) for f in ["temp", "occupancy", "lag24"]}
    gate = "STOP: retrain" if max(drift.values()) > 0.2 else "OK"

    # Champion/challenger: challenger is retrained on the most recent 28 days only.
    champion_mae = float(np.mean(np.abs(actual - pred)))
    recent = df[(df["day"] >= DAYS - EVAL_DAYS - 28) & (df["day"] < DAYS - EVAL_DAYS)]
    challenger = make_gbm().fit(recent[FEATS], recent["kwh"])
    ch_mae = float(np.mean(np.abs(actual - challenger.predict(eval_df[FEATS]))))
    swap = ch_mae < champion_mae
    results = {"24h MAPE": f"{mape:.1%}", "Pinball 0.9": round(pinball_norm, 3), "Buildings": BUILDINGS,
               "Retrain": "weekly", "PSI": drift, "drift_gate": gate,
               "champion_MAE_kWh": round(champion_mae, 1), "challenger_MAE_kWh": round(ch_mae, 1),
               "swap_to_challenger": bool(swap)}
    print("Campus Load Forecast")
    for k, v in results.items():
        print(f"  {k:<22} {v}")
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(results, f)

    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    axes[0].plot(actual[:168], color="k", lw=0.9, label="actual")
    axes[0].plot(pred[:168], color="tab:orange", label="24h forecast")
    axes[0].plot(q90[:168], color="tab:orange", ls=":", label="q0.90")
    axes[0].set_title("First evaluation week (campus kWh)"); axes[0].legend()
    axes[1].scatter(eval_df["temp"], actual - pred, s=6, alpha=0.6)
    axes[1].axhline(0, color="k", lw=0.5)
    axes[1].set_title(f"Residual vs temperature (PSI temp={drift['temp']}, gate={gate})")
    axes[1].set_xlabel("temperature C"); axes[1].set_ylabel("actual - forecast")
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    print(f"Wrote {OUT}/results.json and figure.png")


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
