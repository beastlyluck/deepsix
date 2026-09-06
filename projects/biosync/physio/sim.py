"""Minute-resolution glucose / insulin / heart-rate model for a synthetic cohort.

Glucose-insulin is Bergman's minimal model with a two-compartment meal
absorption term and an activity-driven uptake term. Heart rate is first-order
toward a set point moved by activity and sleep. Every patient gets their own
parameter draw, so the "replica" a model learns has to be patient-specific.

Observations mimic a CGM (5 min, warm-up gaps) and a wrist wearable (1 min,
charging gaps, random dropouts). Nothing here is a clinical model of anyone.
"""
import numpy as np

MIN_PER_DAY = 1440


def draw_patient(rng):
    return {
        "Gb": rng.uniform(85, 130), "Ib": rng.uniform(8, 15), "p1": rng.uniform(0.012, 0.03),
        "p2": rng.uniform(0.015, 0.03), "p3": rng.uniform(8e-6, 3e-5), "n": rng.uniform(0.12, 0.2),
        "gamma": rng.uniform(0.003, 0.008), "h": rng.uniform(85, 110), "tau_m": rng.uniform(25, 50),
        "k_meal": rng.uniform(3.5, 6.0), "k_act": rng.uniform(0.004, 0.012),
        "hr_rest": rng.uniform(52, 78), "hr_gain": rng.uniform(45, 75), "tau_hr": rng.uniform(4, 9),
    }


def schedule(rng, days):
    """Exogenous inputs per minute: carbs impulse (g), activity 0..1, sleep 0/1."""
    T = days * MIN_PER_DAY
    carbs, act, sleep = np.zeros(T), np.zeros(T), np.zeros(T)
    for d in range(days):
        base = d * MIN_PER_DAY
        for centre, lo, hi in ((7.5, 30, 60), (12.5, 40, 90), (19.0, 50, 100)):
            if rng.random() < 0.1:
                continue                                    # skipped meal
            t = base + int(60 * centre + rng.normal(0, 35))
            if 0 <= t < T:
                carbs[t] += rng.uniform(lo, hi)
        for _ in range(rng.integers(0, 3)):
            start = base + int(rng.uniform(6.5, 21) * 60)
            dur = int(rng.uniform(20, 60))
            act[start:start + dur] = rng.uniform(0.3, 1.0)
        sleep[base + 23 * 60: base + MIN_PER_DAY] = 1
        sleep[base: base + 7 * 60] = 1
    return carbs, act, sleep


def simulate(p, carbs, act, sleep, rng):
    T = len(carbs)
    G, X, I, HR = np.zeros(T), np.zeros(T), np.zeros(T), np.zeros(T)
    q1 = q2 = 0.0
    g, x, i, hr = p["Gb"], 0.0, p["Ib"], p["hr_rest"]
    for t in range(T):
        q1 += carbs[t]
        ra = q2 / p["tau_m"] * p["k_meal"]
        dq1 = -q1 / p["tau_m"]
        dq2 = (q1 - q2) / p["tau_m"]
        dg = -p["p1"] * (g - p["Gb"]) - x * g - p["k_act"] * act[t] * g + ra
        dx = -p["p2"] * x + p["p3"] * (i - p["Ib"])
        di = -p["n"] * (i - p["Ib"]) + p["gamma"] * max(g - p["h"], 0.0)
        target = p["hr_rest"] + p["hr_gain"] * act[t] - 8.0 * sleep[t]
        dhr = -(hr - target) / p["tau_hr"] + rng.normal(0, 0.6)
        q1, q2, g, x, i, hr = q1 + dq1, q2 + dq2, g + dg, x + dx, i + di, hr + dhr
        g = max(g, 40.0)
        G[t], X[t], I[t], HR[t] = g, x, i, hr
    return G, I, HR


def observe(G, HR, rng, cgm_gap_per_day=0.6, hr_gap_per_day=1.2):
    """Return sparse observation arrays (nan where unobserved)."""
    T = len(G)
    days = T // MIN_PER_DAY
    cgm = np.full(T, np.nan)
    idx = np.arange(0, T, 5)
    cgm[idx] = G[idx] + rng.normal(0, 5.0, len(idx))
    hr = HR + rng.normal(0, 1.5, T)
    for d in range(days):
        base = d * MIN_PER_DAY
        if rng.random() < cgm_gap_per_day:                 # sensor warm-up / compression low
            s = base + rng.integers(0, MIN_PER_DAY - 150)
            cgm[s: s + rng.integers(60, 150)] = np.nan
        for _ in range(rng.poisson(hr_gap_per_day)):       # charging, off wrist
            s = base + rng.integers(0, MIN_PER_DAY - 120)
            hr[s: s + rng.integers(30, 120)] = np.nan
    drop = rng.random(T) < 0.04                              # bluetooth dropouts
    hr[drop] = np.nan
    return cgm, hr


def cohort(n_patients=24, days=14, seed=11):
    rng = np.random.default_rng(seed)
    out = []
    for k in range(n_patients):
        p = draw_patient(rng)
        carbs, act, sleep = schedule(rng, days)
        G, I, HR = simulate(p, carbs, act, sleep, rng)
        cgm, hr = observe(G, HR, rng)
        out.append({"id": k, "params": p, "carbs": carbs, "act": act, "sleep": sleep,
                    "G": G, "I": I, "HR": HR, "cgm": cgm, "hr": hr})
    return out
