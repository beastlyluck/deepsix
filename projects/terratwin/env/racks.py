"""Tray grid. A tray is (tower, layer, slot). Neighbours share a face.

Lower layers run warmer because the LED stack dumps heat upward and the
return duct sits at the floor. That gradient is why a single-zone PID
browns the bottom before the top is even at setpoint.
"""
import numpy as np


def n_trays(cfg):
    return cfg["site"]["towers"] * cfg["site"]["layers"] * cfg["site"]["trays_per_layer"]


def index(cfg, tower, layer, slot):
    L, S = cfg["site"]["layers"], cfg["site"]["trays_per_layer"]
    return (tower * L + layer) * S + slot


def coords(cfg):
    T, L, S = cfg["site"]["towers"], cfg["site"]["layers"], cfg["site"]["trays_per_layer"]
    rows = []
    for t in range(T):
        for k in range(L):
            for s in range(S):
                rows.append((t, k, s, index(cfg, t, k, s)))
    return rows


def adjacency(cfg):
    """Sparse neighbour list: same tower ±layer, same layer ±tower."""
    T, L, S = cfg["site"]["towers"], cfg["site"]["layers"], cfg["site"]["trays_per_layer"]
    adj = [[] for _ in range(n_trays(cfg))]
    for t, k, s, i in coords(cfg):
        for dt, dk in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            tt, kk = t + dt, k + dk
            if 0 <= tt < T and 0 <= kk < L:
                adj[i].append(index(cfg, tt, kk, s))
    return adj


def stack_bias(cfg):
    """Kelvin offset by layer. Layer 0 is floor."""
    L = cfg["site"]["layers"]
    return np.linspace(1.6, -0.8, L)
