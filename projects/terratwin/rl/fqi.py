"""Fitted Q-iteration with a linear readout on hand features.

27 discrete actions. Features are facility-wide means and the infected
fraction — we do not give the learner a per-tray action. That is the
point of the bottleneck: a rack-level policy on 320 trays is a different
product. FQI iterates Bellman backups with numpy least squares.

A PID that holds the toml setpoints is the baseline. If FQI cannot beat
it on yield-per-kWh after the same disease seed, the board says so.
"""
import numpy as np

from env.climate import idle, step
from env.disease import step as sir
from env.racks import adjacency
from rl.reward import step_reward

N_ACT = 27


def feats(state, I):
    return np.array([
        state["temp"].mean(), state["rh"].mean(), state["ec"].mean(),
        state["ppfd"].mean(), state["temp"].std(), I.mean(),
        np.quantile(state["temp"], 0.9), np.quantile(state["rh"], 0.9),
    ])


def collect(cfg, rng, episodes=12, horizon=48):
    adj = adjacency(cfg)
    rows = []
    for _ in range(episodes):
        st = idle(cfg, rng)
        I = np.zeros(len(st["temp"]))
        I[rng.integers(0, len(I), size=2)] = 1.0
        S = 1.0 - I
        for _h in range(horizon):
            a = int(rng.integers(0, N_ACT))
            phi = feats(st, I)
            r = step_reward(st, a, I, cfg)
            st = step(st, a, cfg, rng)
            I, S = sir(I, S, st, adj, cfg, rng)
            rows.append((phi, a, r, feats(st, I)))
    return rows


def fit(rows, iters=12):
    phi = np.stack([r[0] for r in rows])
    n = len(rows)
    A = np.array([r[1] for r in rows])
    R = np.array([r[2] for r in rows])
    phi2 = np.stack([r[3] for r in rows])
    # design: features × one-hot action
    def design(x, a):
        oh = np.zeros((len(a), N_ACT))
        oh[np.arange(len(a)), a] = 1
        return np.hstack([x, oh, x * a.reshape(-1, 1) / N_ACT])
    X = design(phi, A)
    q = np.zeros(n)
    w = np.zeros(X.shape[1])
    for _ in range(iters):
        # greedy next-action Q
        nxt = []
        for i in range(n):
            qs = []
            for a in range(N_ACT):
                xa = design(phi2[i:i + 1], np.array([a]))
                qs.append(float(np.ravel(xa @ w)[0]))
            nxt.append(max(qs))
        y = R + 0.92 * np.array(nxt)
        w, *_ = np.linalg.lstsq(X, y, rcond=None)
    return w


def greedy(w, state, I):
    x = feats(state, I).reshape(1, -1)
    best, val = 0, -1e9
    for a in range(N_ACT):
        oh = np.zeros((1, N_ACT)); oh[0, a] = 1
        xa = np.hstack([x, oh, x * a / N_ACT])
        v = float(np.ravel(xa @ w)[0])
        if v > val:
            best, val = a, v
    return best, val


def pid_action(state, cfg):
    """Hold toml setpoints. Light up if mean PPFD is low, mist if RH is low."""
    sp = cfg["setpoints"]
    light = 1 if state["ppfd"].mean() < sp["ppfd"] - 10 else (-1 if state["ppfd"].mean() > sp["ppfd"] + 15 else 0)
    mist = 1 if state["rh"].mean() < sp["rh"] - 0.03 else (-1 if state["rh"].mean() > sp["rh"] + 0.04 else 0)
    nut = 1 if state["ec"].mean() < sp["ec_ms"] - 0.08 else (-1 if state["ec"].mean() > sp["ec_ms"] + 0.08 else 0)
    return int((light + 1) * 9 + (mist + 1) * 3 + (nut + 1))
