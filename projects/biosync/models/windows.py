"""Turn the minute-level cohort into 5-minute training windows.

A window is 6 h (72 steps). Inputs per step: meal absorption proxy, activity,
sleep, plus room for the patient embedding. Targets: glucose/100, hr/100 where
observed. z0 uses the last observed glucose and HR before the window starts.
"""
import warnings

import numpy as np

from models.node import EMB, U, Z

STEP, H = 5, 72


def resample(patient, extra_dropout=0.0, rng=None):
    """Minute arrays -> 5 min grid. Optionally knock out more observations."""
    T = len(patient["G"]) // STEP
    idx = np.arange(T) * STEP
    carbs = patient["carbs"].reshape(T, STEP).sum(1)
    meal = np.zeros(T)
    q = 0.0
    for t in range(T):                       # first-order absorption proxy, model input not target
        q += carbs[t]
        q *= np.exp(-STEP / 40.0)
        meal[t] = q / 100.0
    act = patient["act"].reshape(T, STEP).mean(1)
    sleep = patient["sleep"][idx]
    cgm = patient["cgm"][idx].copy()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)          # all-nan slots are expected
        hr = np.nanmean(patient["hr"].reshape(T, STEP), axis=1)
    if extra_dropout > 0 and rng is not None:
        kill = rng.random(T) < extra_dropout
        cgm[kill] = np.nan
        kill = rng.random(T) < extra_dropout
        hr[kill] = np.nan
    truth = np.column_stack([patient["G"][idx] / 100, patient["HR"][idx] / 100])
    return {"u": np.column_stack([meal, act, sleep, np.zeros((T, EMB))]),
            "y": np.column_stack([cgm / 100, hr / 100]), "truth": truth}


def last_observed(y, t):
    out = np.zeros(2)
    for j in range(2):
        col = y[:t + 1, j]
        ok = np.where(~np.isnan(col))[0]
        out[j] = col[ok[-1]] if len(ok) else (1.0 if j == 0 else 0.7)
    return out


def make_window(series, pid, start):
    u = series["u"][start:start + H]
    y = series["y"][start:start + H + 1]
    mask = ~np.isnan(y)
    yz = np.where(mask, y, 0.0)
    z0 = np.concatenate([last_observed(series["y"], start), np.zeros(Z - 2)])
    return z0, u, yz, mask.astype(float), pid


def batcher(series_by_pid, train_days, batch=48):
    T_train = train_days * 1440 // STEP
    pids = list(series_by_pid)

    def make(rng):
        z0s, us, ys, ms, ids = [], [], [], [], []
        for _ in range(batch):
            pid = pids[rng.integers(len(pids))]
            start = rng.integers(0, T_train - H - 1)
            z0, u, y, m, _ = make_window(series_by_pid[pid], pid, start)
            z0s.append(z0); us.append(u); ys.append(y); ms.append(m); ids.append(pid)
        return (np.stack(z0s), np.stack(us, 1), np.stack(ys, 1), np.stack(ms, 1), np.array(ids))
    return make
