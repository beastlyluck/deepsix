"""Hourly occupancy and a publishable synthetic cohort.

Occupancy is a 280-bed site: six wards, daily and weekly rhythm, slow growth,
negative-binomial noise. The cohort is what a privacy office would see if they
asked for a table — not the ADT log.
"""
import numpy as np
import pandas as pd

WARDS = 6
WARD_NAMES = ["A medical", "B surgical", "C short-stay", "D paeds", "E rehab", "F overflow"]
TRAIN_DAYS, TEST_DAYS = 90, 14


def make_ward_data(rng, train_days=TRAIN_DAYS, test_days=TEST_DAYS):
    hours = np.arange((train_days + test_days) * 24)
    base = rng.uniform(28, 52, WARDS)
    rows = []
    for w in range(WARDS):
        hod = hours % 24
        dow = (hours // 24) % 7
        rhythm = 1 + 0.12 * np.sin(2 * np.pi * (hod - 8) / 24) - 0.06 * (dow >= 5)
        trend = 1 + 0.00004 * hours
        mu = base[w] * rhythm * trend
        alpha = 0.006
        lam = rng.gamma(1 / alpha, alpha * mu)
        y = rng.poisson(lam)
        rows.append(pd.DataFrame({
            "ward": w, "ward_name": WARD_NAMES[w], "t": hours,
            "hod": hod, "dow": dow, "beds": y,
        }))
    return pd.concat(rows, ignore_index=True)


def synthetic_cohort(rng, n=900, k_min=10):
    """Sample a cohort and drop (ward, age, sex) cells below k."""
    cohort = pd.DataFrame({
        "ward": rng.integers(0, WARDS, n),
        "age_band": rng.choice(["18-39", "40-59", "60-74", "75+"], n, p=[0.2, 0.3, 0.3, 0.2]),
        "sex": rng.choice(["F", "M"], n),
        "los_days": np.round(rng.gamma(2.0, 2.2, n), 1),
    })
    cells = cohort.groupby(["ward", "age_band", "sex"]).size()
    keep = cells[cells >= k_min].index
    safe = cohort.set_index(["ward", "age_band", "sex"]).loc[keep].reset_index()
    k_achieved = int(safe.groupby(["ward", "age_band", "sex"]).size().min()) if len(safe) else 0
    cell_table = cells.reset_index(name="n")
    cell_table["kept"] = cell_table["n"] >= k_min
    return safe, k_achieved, len(cohort) - len(safe), cell_table
