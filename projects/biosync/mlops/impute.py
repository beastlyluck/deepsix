"""Three ways to fill a gap, scored against the truth we happen to have.

forward_fill  - what most wearable apps do
linear        - what most dashboards do
node          - integrate the replica across the gap using the known inputs
"""
import numpy as np


def forward_fill(y, default):
    out = y.copy()
    last = default.astype(float).copy()
    for t in range(len(out)):
        for j in range(out.shape[1]):
            if np.isnan(out[t, j]):
                out[t, j] = last[j]
            else:
                last[j] = out[t, j]
    return out


def linear(y):
    out = y.copy()
    T = len(y)
    for j in range(y.shape[1]):
        ok = np.where(~np.isnan(y[:, j]))[0]
        if len(ok) < 2:
            continue
        out[:, j] = np.interp(np.arange(T), ok, y[ok, j])
    return out


def score_gaps(series, filled, gap_mask):
    """RMSE in original units over synthetic gaps only."""
    truth = series["truth"]
    d = (filled - truth)[gap_mask]
    return round(float(np.sqrt(np.mean(d ** 2)) * 100), 2)


def carve_gaps(y, rng, n_gaps=30, length=(6, 24)):
    """Punch extra gaps into observed stretches so we can score the fill."""
    y2 = y.copy()
    mask = np.zeros_like(y, dtype=bool)
    T = len(y)
    for _ in range(n_gaps):
        j = rng.integers(2)
        s = rng.integers(0, T - length[1])
        L = rng.integers(*length)
        seg = slice(s, s + L)
        hit = ~np.isnan(y[seg, j])
        mask[seg, j] = hit
        y2[seg, j] = np.nan
    return y2, mask
