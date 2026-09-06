"""Late-night spend panel and matched control strip.

Treated precinct loses tram frequency after day 120. Donors keep it.
Match on pre-period weekday shape, not level.
"""
import numpy as np
import pandas as pd

PRECINCTS = 4
SENSORS = 28
PRE_DAYS, POST_DAYS = 120, 60
TRUE_EFFECT = -0.11


def make_panel(rng):
    days = np.arange(PRE_DAYS + POST_DAYS)
    dow = days % 7
    common = 1 + 0.35 * np.isin(dow, [4, 5]) + 0.05 * np.sin(2 * np.pi * days / 365)
    sensor_precinct = np.sort(rng.integers(0, PRECINCTS, SENSORS))
    sensor_precinct[:7] = 0
    rows = []
    for s in range(SENSORS):
        p = int(sensor_precinct[s])
        level = rng.lognormal(np.log(3800), 0.35) * (1.15 if p == 0 else [1.0, 0.7, 1.4][p - 1])
        shock = 1 + 0.02 * rng.standard_normal(len(days)).cumsum() / 10
        spend = level * common * shock * np.exp(0.08 * rng.standard_normal(len(days)))
        post = days >= PRE_DAYS
        if p == 0:
            spend = spend * np.where(post, 1 + TRUE_EFFECT, 1.0)
        rows.append(pd.DataFrame({
            "sensor": s, "precinct": p, "day": days,
            "post": post.astype(int), "treated": int(p == 0), "spend": spend,
        }))
    return pd.concat(rows, ignore_index=True)


def match_control(df):
    pre = df[df["post"] == 0]
    prof = pre.groupby(["precinct", pre["day"] % 7])["spend"].mean().unstack()
    prof = np.log(prof)
    prof = prof.sub(prof.mean(axis=1), axis=0)
    dist = ((prof.loc[1:] - prof.loc[0]) ** 2).sum(axis=1)
    return int(dist.idxmin()), {int(k): round(float(v), 4) for k, v in dist.to_dict().items()}
