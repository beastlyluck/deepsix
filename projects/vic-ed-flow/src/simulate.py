"""Four-campus ED queue. 15-minute slots, ramping when bays are full.

Austin gets a flu multiplier after day 7. That is the campus the residual
is meant to catch. Not a live AHV extract.
"""
import numpy as np
import pandas as pd

CAMPUSES = ("Alfred", "Royal Melbourne", "Monash Clayton", "Austin")
DAYS = 14
SLOTS = DAYS * 24 * 4
BAYS = {"Alfred": 42, "Royal Melbourne": 48, "Monash Clayton": 36, "Austin": 28}


def tod_curve(slot):
    hour = (slot % 96) / 4
    return (
        0.55
        + 0.85 * np.exp(-0.5 * ((hour - 18.5) / 3.4) ** 2)
        + 0.25 * np.exp(-0.5 * ((hour - 11) / 2.2) ** 2)
    )


def simulate(rng):
    rows = []
    winter_midnight = {}
    for campus in CAMPUSES:
        bays = BAYS[campus]
        occ = int(bays * rng.uniform(0.62, 0.78))
        ramp_q = 0
        los = rng.lognormal(1.35, 0.38, 8000)
        los_i = 0
        depart_at = []
        for _ in range(occ):
            stay = max(2, int(los[los_i % len(los)] * 4))
            los_i += 1
            depart_at.append(int(rng.integers(1, stay)))
        midnight_occ = []
        for s in range(SLOTS):
            hour = (s % 96) / 4
            dow = (s // 96) % 7
            lam = 1.85 * BAYS[campus] / 36 * tod_curve(s)
            if dow >= 5:
                lam *= 0.88
            if campus == "Austin" and s > SLOTS * 0.5:
                lam *= 1.45
            arrivals = int(rng.poisson(lam))
            finished = sum(1 for t in depart_at if t <= s)
            depart_at = [t for t in depart_at if t > s]
            occ = max(0, occ - finished)
            ramped = 0
            for _ in range(arrivals):
                stay = max(2, int(los[los_i % len(los)] * 4))
                los_i += 1
                if occ < bays:
                    occ += 1
                    depart_at.append(s + stay)
                else:
                    ramped += 1
                    ramp_q += 1
            freed = min(ramp_q, max(0, bays - occ))
            for _ in range(freed):
                stay = max(2, int(los[los_i % len(los)] * 4))
                los_i += 1
                occ += 1
                depart_at.append(s + stay)
                ramp_q -= 1
            wait = 18 + 7 * (occ / bays) + 11 * (ramp_q / 8) + rng.normal(0, 2.2)
            wait = max(8.0, float(wait))
            rows.append({
                "campus": campus, "slot": s, "day": s // 96, "hour": hour,
                "arrivals": arrivals, "occupancy": occ, "bays": bays,
                "ramping": ramp_q, "wait_min": wait,
                "at_risk_4h": int(wait >= 90),
            })
            if abs(hour - 0) < 0.01:
                midnight_occ.append(occ)
        winter_midnight[campus] = float(np.median(midnight_occ[:7]))
    return pd.DataFrame(rows), winter_midnight
