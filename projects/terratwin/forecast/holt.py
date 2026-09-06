"""Holt-style level per tower, then a facility total that is the sum.

We do not MinT here — that lives in sku-hierarchy. The point is the
spatial series: disease on tower 3 should not be smoothed into the
site number. The board plots towers separately on purpose.
"""
import numpy as np

from rl.reward import yield_proxy


def tower_series(history, cfg):
    """history: list of yield arrays (n_trays,)."""
    T = cfg["site"]["towers"]
    per = cfg["site"]["layers"] * cfg["site"]["trays_per_layer"]
    out = np.zeros((len(history), T))
    for t, y in enumerate(history):
        for tw in range(T):
            out[t, tw] = y[tw * per:(tw + 1) * per].mean()
    return out


def holt(y, alpha=0.35):
    level = y[0]
    hat = [level]
    for v in y[1:]:
        level = alpha * v + (1 - alpha) * level
        hat.append(level)
    return np.array(hat)


def forecast_towers(series, steps=8):
    """series (time, towers). Return last level and a short hold-out MAPE."""
    mape = []
    future = []
    for tw in range(series.shape[1]):
        y = series[:, tw]
        cut = max(8, len(y) - 6)
        hat = holt(y[:cut])
        err = np.abs(y[cut:] - hat[-1]) / (np.abs(y[cut:]) + 1e-6)
        mape.append(float(err.mean()) if len(err) else 0.0)
        future.append([float(hat[-1])] * steps)
    return {"mape_by_tower": [round(m, 3) for m in mape], "horizon": future,
            "facility_mape": round(float(np.mean(mape)), 3)}


def snapshot_yield(state):
    return yield_proxy(state)
