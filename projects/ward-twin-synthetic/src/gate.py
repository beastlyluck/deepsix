"""Census residual gate and per-ward scorecard.

A forecast that can be corrected by one trusted midnight count is easier to
govern than a black box. Two nights outside the 80% band opens the gate.
"""
import numpy as np
import pandas as pd


def midnight_gate(test):
    midnight = test[test["hod"] == 0].copy()
    midnight["miss"] = (midnight["beds"] < midnight["lo"]) | (midnight["beds"] > midnight["hi"])
    flags = {}
    streaks = {}
    for w, g in midnight.groupby("ward"):
        m = g["miss"].values
        flags[int(w)] = bool(len(m) > 1 and np.any(m[1:] & m[:-1]))
        streaks[int(w)] = int(np.max(np.convolve(m.astype(int), np.ones(2), mode="valid")) if len(m) > 1 else 0)
    nights = midnight[["ward", "ward_name", "t", "beds", "pred", "lo", "hi", "miss"]].copy()
    nights["day"] = (nights["t"] // 24).astype(int)
    return flags, streaks, nights


def ward_scorecard(test):
    rows = []
    for w, g in test.groupby("ward"):
        mae = float(np.abs(g["beds"] - g["pred"]).mean())
        cover = float(((g["beds"] >= g["lo"]) & (g["beds"] <= g["hi"])).mean())
        rows.append({
            "ward": int(w),
            "ward_name": g["ward_name"].iloc[0],
            "mae": round(mae, 2),
            "coverage80": round(cover, 3),
            "mean_beds": round(float(g["beds"].mean()), 1),
            "mean_band": round(float((g["hi"] - g["lo"]).mean()), 1),
        })
    return pd.DataFrame(rows)
