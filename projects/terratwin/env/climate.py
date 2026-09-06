"""First-order climate per tray. Actions move setpoints, physics does the rest.

State: temp, rh, EC, PPFD. Action is a 3-vector in {-1,0,1} for light,
mist, nutrient. Heat from lights is the coupling the controller has to
learn — cranking PPFD without mist browns the tray.
"""
import numpy as np

from .racks import n_trays, stack_bias


def encode_action(a):
    # a in {0..26} -> (-1,0,1)^3
    return np.array([(a // 9) % 3, (a // 3) % 3, a % 3], dtype=float) - 1.0


def step(state, action, cfg, rng):
    n = n_trays(cfg)
    a = encode_action(int(action))
    sp = cfg["setpoints"]
    T, L, S = cfg["site"]["towers"], cfg["site"]["layers"], cfg["site"]["trays_per_layer"]
    bias = np.array([stack_bias(cfg)[k] for _t in range(T) for k in range(L) for _s in range(S)])
    dppfd = 28.0 * a[0]
    dmise = 0.035 * a[1]
    dec = 0.08 * a[2]
    ppfd = np.clip(state["ppfd"] + dppfd + rng.normal(0, 2.0, n), *cfg["limits"]["ppfd"])
    heat = 0.012 * (ppfd - sp["ppfd"]) + bias
    temp = state["temp"] + 0.22 * ((sp["temp_c"] + heat) - state["temp"]) + rng.normal(0, 0.08, n)
    rh = state["rh"] + 0.30 * ((sp["rh"] + dmise - 0.0004 * ppfd) - state["rh"]) + rng.normal(0, 0.008, n)
    ec = state["ec"] + 0.25 * ((sp["ec_ms"] + dec) - state["ec"]) + rng.normal(0, 0.02, n)
    temp = np.clip(temp, *cfg["limits"]["temp_c"])
    rh = np.clip(rh, *cfg["limits"]["rh"])
    ec = np.clip(ec, *cfg["limits"]["ec_ms"])
    return {"temp": temp, "rh": rh, "ec": ec, "ppfd": ppfd}


def idle(cfg, rng):
    n = n_trays(cfg)
    sp = cfg["setpoints"]
    T, L, S = cfg["site"]["towers"], cfg["site"]["layers"], cfg["site"]["trays_per_layer"]
    bias = np.array([stack_bias(cfg)[k] for t in range(T) for k in range(L) for s in range(S)])
    return {
        "temp": sp["temp_c"] + bias + rng.normal(0, 0.3, n),
        "rh": np.full(n, sp["rh"]) + rng.normal(0, 0.02, n),
        "ec": np.full(n, sp["ec_ms"]) + rng.normal(0, 0.05, n),
        "ppfd": np.full(n, sp["ppfd"]) + rng.normal(0, 8.0, n),
    }
