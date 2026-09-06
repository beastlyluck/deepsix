"""Held-out days, three dropout levels, three horizons. Same windows for both
models so the matrix is a fair fight. Glucose errors in mg/dL, HR in bpm.
"""
import numpy as np

from models.node import predict
from models.windows import H, STEP, make_window
from mlops.impute import forward_fill

HORIZONS = {"30m": 6, "60m": 12, "120m": 24}


def test_windows(series_by_pid, train_days, rng, per_patient=12):
    T0 = train_days * 1440 // STEP
    out = []
    for pid, s in series_by_pid.items():
        T = len(s["u"])
        for _ in range(per_patient):
            start = rng.integers(T0, T - H - 1)
            out.append((pid, start))
    return out


def node_errors(theta, emb, series_by_pid, windows):
    err = {k: [[], []] for k in HORIZONS}
    for pid, start in windows:
        z0, u, y, m, _ = make_window(series_by_pid[pid], pid, start)
        zs = predict(theta, emb, z0[None], u[:, None], np.array([pid]))[:, 0, :2]
        truth = series_by_pid[pid]["truth"][start:start + H + 1]
        for k, h in HORIZONS.items():
            err[k][0].append((zs[h, 0] - truth[h, 0]) * 100)
            err[k][1].append((zs[h, 1] - truth[h, 1]) * 100)
    return {k: {"glucose_rmse": _rmse(v[0]), "hr_rmse": _rmse(v[1])} for k, v in err.items()}


def esn_features(series, start):
    """Input block for the ESN: filled observations + mask + exogenous."""
    y = series["y"][start:start + H + 1]
    mask = ~np.isnan(y)
    filled = forward_fill(y, default=np.array([1.0, 0.7]))
    u = series["u"][start:start + H + 1, :3]
    return np.concatenate([filled, mask.astype(float), u], axis=-1), y, mask


def esn_fit(esn, series_by_pid, train_days, rng, n=400):
    T0 = train_days * 1440 // STEP
    X, Y, M = [], [], []
    pids = list(series_by_pid)
    for _ in range(n):
        pid = pids[rng.integers(len(pids))]
        start = rng.integers(0, T0 - H - 1)
        x, y, m = esn_features(series_by_pid[pid], start)
        # one-step-ahead on the next observed value; forward-filled input, mask says what was real
        X.append(x[:-1]); Y.append(np.nan_to_num(y[1:])); M.append(m[1:].astype(float))
    return esn.fit(np.stack(X, 1), np.stack(Y, 1), np.stack(M, 1))


def esn_errors(esn, series_by_pid, windows, warm=24):
    """Warm the reservoir on the two hours before the window, then roll forward
    feeding its own forecasts back as if observed. Same horizons as the ODE."""
    err = {k: [[], []] for k in HORIZONS}
    hmax = max(HORIZONS.values())
    for pid, start in windows:
        s = series_by_pid[pid]
        x, y, m = esn_features(s, max(start - warm, 0))
        w = start - max(start - warm, 0)
        truth = s["truth"][start:start + H + 1]
        hist = [x[t] for t in range(w + 1)]
        preds = []
        for step in range(hmax):
            pred = np.clip(esn.predict(np.stack(hist, 0)[:, None, :])[-1, 0], 0.4, 4.0)
            preds.append(pred)
            nxt = x[w + step + 1].copy() if w + step + 1 < len(x) else np.concatenate([pred, [1, 1], np.zeros(3)])
            nxt[:2] = pred                          # own forecast stands in for the unknown observation
            nxt[2:4] = 1.0
            hist.append(nxt)
        for k, h in HORIZONS.items():
            err[k][0].append((preds[h - 1][0] - truth[h, 0]) * 100)
            err[k][1].append((preds[h - 1][1] - truth[h, 1]) * 100)
    return {k: {"glucose_rmse": _rmse(v[0]), "hr_rmse": _rmse(v[1])} for k, v in err.items()}


def persistence_errors(series_by_pid, windows):
    """Last observed value carried forward. The baseline any forecaster has to beat."""
    err = {k: [[], []] for k in HORIZONS}
    for pid, start in windows:
        s = series_by_pid[pid]
        last = np.array([np.nan, np.nan])
        for j in range(2):
            col = s["y"][:start + 1, j]
            ok = np.where(~np.isnan(col))[0]
            last[j] = col[ok[-1]] if len(ok) else (1.0 if j == 0 else 0.7)
        truth = s["truth"][start:start + H + 1]
        for k, h in HORIZONS.items():
            err[k][0].append((last[0] - truth[h, 0]) * 100)
            err[k][1].append((last[1] - truth[h, 1]) * 100)
    return {k: {"glucose_rmse": _rmse(v[0]), "hr_rmse": _rmse(v[1])} for k, v in err.items()}


def _rmse(v):
    v = np.asarray(v)
    return round(float(np.sqrt(np.mean(v ** 2))), 2)
