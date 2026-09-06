"""Spatial SIR on trays. Infection jumps to face-neighbours.

Powdery mildew stand-in. High RH and still air (low PPFD, which we use as
a mixing proxy) raise beta. Recovery is slow on a 15-minute step, so the
controller's job is not to 'cure' — it is to keep the first tray from
seeding the tower.
"""
import numpy as np


def step(I, S, state, adj, cfg, rng):
    beta0 = cfg["disease"]["beta"]
    gamma = cfg["disease"]["gamma"]
    w = cfg["disease"]["neighbor_weight"]
    rh = state["rh"]
    mix = np.clip((state["ppfd"] - 80) / 260.0, 0.15, 1.0)
    beta = beta0 * (0.6 + 0.8 * np.clip((rh - 0.55) / 0.3, 0, 1)) / mix
    n = len(I)
    pressure = np.zeros(n)
    for i, nbrs in enumerate(adj):
        if nbrs:
            pressure[i] = np.mean(I[nbrs])
    force = beta * (0.65 * I + w * pressure)
    new = rng.random(n) < (S * force * 0.15)
    rec = rng.random(n) < (I * gamma * 0.15)
    I2 = np.clip(I + new.astype(float) - rec.astype(float), 0, 1)
    S2 = np.clip(S - new.astype(float), 0, 1)
    return I2, S2
