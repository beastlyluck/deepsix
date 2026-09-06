"""Reward: yield proxy minus energy minus disease minus limit hits.

Yield is a saturating function of PPFD and a penalty when temp or EC leave
the crop band. Energy is tariff times light + mist. The weights live in
facility.toml so a grower can retune without touching the learner.
"""
import numpy as np

from env.climate import encode_action


def yield_proxy(state):
    ppfd = state["ppfd"]
    temp = state["temp"]
    ec = state["ec"]
    light = 1.0 - np.exp(-ppfd / 210.0)
    temp_ok = np.exp(-((temp - 22.0) / 3.5) ** 2)
    ec_ok = np.exp(-((ec - 1.8) / 0.35) ** 2)
    return light * temp_ok * ec_ok


def energy(state, action, cfg):
    a = encode_action(int(action))
    e = cfg["energy"]
    kwh = e["kwh_per_ppfd_hour"] * state["ppfd"].mean() * 0.25
    kwh = kwh + e["kwh_per_mist"] * max(a[1], 0) * 0.25
    return kwh * e["tariff_aud"]


def step_reward(state, action, I, cfg):
    r = cfg["reward"]
    y = yield_proxy(state).mean()
    lim = 0.0
    for key, lohi in (("temp", "temp_c"), ("rh", "rh"), ("ec", "ec_ms"), ("ppfd", "ppfd")):
        lo, hi = cfg["limits"][lohi]
        x = state[key if key != "temp" else "temp"]
        lim += float(np.mean((x < lo) | (x > hi)))
    return float(r["yield_w"] * y - r["energy_w"] * energy(state, action, cfg)
                 - r["disease_w"] * I.mean() - r["limit_w"] * lim)
