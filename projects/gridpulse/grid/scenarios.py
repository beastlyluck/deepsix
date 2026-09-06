"""Day profiles and contingency scenarios that feed the GNN and the dispatcher."""
import numpy as np


def day_profiles(rng, hours=24):
    h = np.arange(hours)
    load = 0.55 + 0.45 * np.exp(-((h - 18) / 3.2) ** 2) + 0.2 * np.exp(-((h - 8) / 2.0) ** 2)
    solar = np.clip(np.sin(np.pi * (h - 6) / 13), 0, None) * rng.uniform(0.6, 1.0)
    wind = np.clip(0.45 + 0.35 * np.sin(2 * np.pi * (h + rng.uniform(0, 24)) / 24) + rng.normal(0, 0.08, hours), 0.05, 1)
    return load, solar, wind


def injection(grid, load_scale, solar_cf, wind_cf, battery=None):
    """Net injection per bus, MW, before slack balancing."""
    kind = np.array(grid.kind)
    inj = -grid.peak_load * load_scale
    inj[kind == "wind"] += grid.cap["wind"] * wind_cf
    inj[kind == "solar"] += grid.cap["solar"] * solar_cf
    if battery is not None:
        inj[kind == "battery"] += battery
    inj[grid.slack] -= inj.sum()
    return inj


def sample_contingencies(grid, rng, n=400):
    """(injection, tripped lines, hour, scale) tuples. N-1 mostly, some N-2."""
    out = []
    for _ in range(n):
        load, solar, wind = day_profiles(rng)
        h = rng.integers(24)
        scale = rng.uniform(0.9, 1.35)
        inj = injection(grid, load[h] * scale, solar[h], wind[h])
        k = 2 if rng.random() < 0.3 else 1
        trip = tuple(rng.choice(grid.M, k, replace=False))
        out.append((inj, trip, int(h), float(scale)))
    return out
