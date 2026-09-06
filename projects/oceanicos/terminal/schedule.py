"""Vessel calls for a 48 h window, plus the shipping-line hierarchy used by the
dwell and volume forecasts.
"""
import numpy as np

LINES = {
    "MSK": {"services": ["AE1", "AE7"], "dwell_mu": np.log(3.2)},
    "CMA": {"services": ["FAL1", "NEMO"], "dwell_mu": np.log(4.1)},
    "ONE": {"services": ["FP1"], "dwell_mu": np.log(2.6)},
    "HLC": {"services": ["FE2", "MDX"], "dwell_mu": np.log(3.7)},
}


def vessel_calls(rng, hours=48, cranes=6):
    calls, t = [], 0.5 * 3600
    k = 0
    while t < hours * 3600 - 6 * 3600:
        line = rng.choice(list(LINES))
        svc = rng.choice(LINES[line]["services"])
        boxes = int(rng.integers(650, 1400))
        calls.append({"name": f"{svc}-{k:02d}", "line": line, "service": svc, "eta_s": float(t), "boxes": boxes,
                      "n_cranes": int(rng.integers(2, 4)), "dwell_mu": LINES[line]["dwell_mu"] + rng.normal(0, 0.15)})
        t += rng.uniform(3.0, 6.0) * 3600
        k += 1
    return calls


def weekly_history(rng, weeks=104):
    """Weekly box volumes per (line, service): trend + yearly season + line-specific noise + a disruption."""
    hist = {}
    w = np.arange(weeks)
    for line, spec in LINES.items():
        for svc in spec["services"]:
            base = rng.uniform(1500, 4200)
            season = 0.18 * np.sin(2 * np.pi * (w + rng.uniform(0, 52)) / 52)
            trend = 1 + 0.002 * w * rng.uniform(0.5, 1.5)
            noise = rng.normal(0, 0.07, weeks)
            y = base * trend * (1 + season + noise)
            if rng.random() < 0.5:                        # a blank sailing / canal closure
                s = rng.integers(60, 90)
                y[s:s + 3] *= rng.uniform(0.2, 0.5)
            hist[(line, svc)] = np.maximum(y, 50)
    return hist
