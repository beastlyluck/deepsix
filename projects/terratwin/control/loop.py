"""Closed-loop climate. FQI vs PID on the same disease seed.

The product is this loop plus the toml. Kubernetes just keeps it alive.
"""
import numpy as np

from env.climate import idle, step
from env.disease import step as sir
from env.racks import adjacency
from forecast.holt import snapshot_yield
from rl.fqi import greedy, pid_action
from rl.reward import energy, step_reward


def run(cfg, rng, w=None, horizon=64, seed_trays=(3, 41)):
    adj = adjacency(cfg)
    st = idle(cfg, rng)
    I = np.zeros(len(st["temp"]))
    for i in seed_trays:
        if i < len(I):
            I[i] = 1.0
    S = 1.0 - I
    log = []
    for t in range(horizon):
        if w is None:
            a = pid_action(st, cfg)
        else:
            a, _ = greedy(w, st, I)
        r = step_reward(st, a, I, cfg)
        e = energy(st, a, cfg)
        y = snapshot_yield(st)
        log.append({
            "t": t, "action": int(a), "reward": r, "energy": e,
            "yield": float(y.mean()), "infected": float(I.mean()),
            "temp": st["temp"].copy(), "rh": st["rh"].copy(),
            "ec": st["ec"].copy(), "ppfd": st["ppfd"].copy(),
            "I": I.copy(),
        })
        st = step(st, a, cfg, rng)
        I, S = sir(I, S, st, adj, cfg, rng)
    return log
