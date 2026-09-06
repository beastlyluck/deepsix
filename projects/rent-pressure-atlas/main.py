"""Melbourne rental stress by SA2-shaped suburb.

Hedonic log-rent on rooms, distance to rail, and a ring dummy,
then a stress index: median rent / (0.3 * household income).
A one-lag spatial check: residual vs neighbours who share a border.

Writes a self-contained HTML atlas to site/index.html.
"""
from __future__ import annotations

import json
import os

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge

SEED = 8
# inner / middle / outer rings, invented but geographically plausible names
# name, ring, bedrooms, km to rail, household income
SUBURBS = [
    ("Fitzroy", "inner", 1.8, 0.6, 118000),
    ("Carlton", "inner", 1.7, 0.4, 109000),
    ("South Yarra", "inner", 1.9, 0.5, 142000),
    ("St Kilda", "inner", 1.8, 0.8, 98000),
    ("Brunswick", "middle", 2.1, 0.7, 91000),
    ("Footscray", "middle", 2.2, 0.5, 78000),
    ("Richmond", "inner", 1.9, 0.6, 121000),
    ("Preston", "middle", 2.3, 0.9, 74000),
    ("Sunshine", "middle", 2.4, 0.8, 68000),
    ("Box Hill", "middle", 2.2, 0.4, 82000),
    ("Dandenong", "outer", 2.5, 0.7, 61000),
    ("Frankston", "outer", 2.4, 0.6, 64000),
    ("Werribee", "outer", 2.6, 1.1, 72000),
    ("Craigieburn", "outer", 2.7, 1.2, 79000),
    ("Ringwood", "outer", 2.5, 0.5, 88000),
    ("Glen Waverley", "middle", 2.4, 0.6, 101000),
    ("Coburg", "middle", 2.2, 0.7, 86000),
    ("Newport", "middle", 2.3, 0.8, 93000),
    ("Thomastown", "outer", 2.5, 1.0, 67000),
    ("Pakenham", "outer", 2.8, 1.4, 76000),
]
# undirected borders used for the lag
BORDERS = {
    "Fitzroy": ["Carlton", "Richmond", "Collingwood"],
    "Carlton": ["Fitzroy", "Brunswick"],
    "South Yarra": ["Richmond", "St Kilda"],
    "St Kilda": ["South Yarra"],
    "Brunswick": ["Carlton", "Coburg", "Fitzroy"],
    "Footscray": ["Newport", "Sunshine"],
    "Richmond": ["Fitzroy", "South Yarra"],
    "Preston": ["Coburg", "Thomastown"],
    "Sunshine": ["Footscray", "Werribee"],
    "Box Hill": ["Glen Waverley", "Ringwood"],
    "Dandenong": ["Frankston", "Pakenham"],
    "Frankston": ["Dandenong"],
    "Werribee": ["Sunshine", "Newport"],
    "Craigieburn": ["Thomastown"],
    "Ringwood": ["Box Hill"],
    "Glen Waverley": ["Box Hill"],
    "Coburg": ["Brunswick", "Preston"],
    "Newport": ["Footscray", "Werribee"],
    "Thomastown": ["Preston", "Craigieburn"],
    "Pakenham": ["Dandenong"],
}

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")


def build_table(rng):
    recs = []
    for name, ring, rooms, km, income in SUBURBS:
        ring_k = {"inner": 0.32, "middle": 0.10, "outer": 0.0}[ring]
        log_rent = 5.72 + 0.16 * rooms - 0.04 * km + ring_k + rng.normal(0, 0.05)
        if name in ("Footscray", "Dandenong", "St Kilda"):
            log_rent += 0.22
        rent = float(np.exp(log_rent))
        vac = max(0.5, 3.6 - 8 * ring_k + rng.normal(0, 0.3))
        recs.append(
            {
                "sa2": name,
                "ring": ring,
                "rooms": rooms,
                "km_to_rail": km,
                "hh_income": income,
                "rent_wk": rent,
                "vacancy": vac,
            }
        )
    return pd.DataFrame(recs)


def hedonic(df):
    X = pd.get_dummies(df[["rooms", "km_to_rail", "ring"]], drop_first=True)
    y = np.log(df["rent_wk"])
    model = Ridge(alpha=0.4)
    model.fit(X, y)
    df = df.copy()
    df["rent_hat"] = np.exp(model.predict(X))
    df["residual"] = df["rent_wk"] - df["rent_hat"]
    df["stress"] = df["rent_wk"] * 52 / (0.30 * df["hh_income"])
    return df, float(np.sqrt(np.mean((y - model.predict(X)) ** 2)))


def spatial_lag(df):
    idx = {n: i for i, n in enumerate(df["sa2"])}
    lags = []
    for name in df["sa2"]:
        nbrs = [n for n in BORDERS.get(name, []) if n in idx]
        if not nbrs:
            lags.append(0.0)
            continue
        lags.append(float(df.loc[df["sa2"].isin(nbrs), "residual"].mean()))
    df = df.copy()
    df["resid_lag"] = lags
    # correlation of residual with neighbour residual
    r = float(np.corrcoef(df["residual"], df["resid_lag"])[0, 1])
    return df, r


def main():
    os.makedirs(OUT, exist_ok=True)
    rng = np.random.default_rng(SEED)
    df = build_table(rng)
    df, rmse = hedonic(df)
    df, lag_r = spatial_lag(df)
    hot = df.sort_values("stress", ascending=False)[["sa2", "stress", "residual"]].head(5)
    summary = {
        "log_rmse": round(rmse, 3),
        "spatial_lag_r": None if np.isnan(lag_r) else round(lag_r, 3),
        "share_stressed": round(float((df["stress"] >= 1).mean()), 3),
        "hottest": hot.to_dict(orient="records"),
    }
    dash = {
        **summary,
        "sa2": df[["sa2", "ring", "rent_wk", "rent_hat", "stress", "residual", "vacancy", "hh_income"]]
        .round(2).to_dict(orient="records"),
    }
    with open(os.path.join(OUT, "results.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w", encoding="utf-8") as f:
        json.dump(dash, f)
    df.to_csv(os.path.join(OUT, "sa2.csv"), index=False)

    fig, ax = plt.subplots(figsize=(7, 4.2))
    colours = df["stress"].map(lambda s: "#b71c1c" if s >= 1.15 else "#c77800" if s >= 1 else "#2e7d32")
    ax.scatter(df["hh_income"] / 1000, df["rent_wk"], c=colours, s=42)
    for _, r in df.iterrows():
        if r["stress"] >= 1.1:
            ax.annotate(r["sa2"], (r["hh_income"] / 1000, r["rent_wk"]), fontsize=7)
    ax.set_xlabel("HH income ($k)")
    ax.set_ylabel("Weekly rent")
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    plt.close()
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
