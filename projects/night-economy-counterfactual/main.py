"""Night economy DiD entry. Event-study first; headline second."""
import json
import os
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from src.did import block_bootstrap, did_ols, event_study, parallel_r2
from src.panel import PRE_DAYS, TRUE_EFFECT, make_panel, match_control

SEED = 11
OUT = os.path.join(HERE, "outputs")


def main():
    rng = np.random.default_rng(SEED)
    os.makedirs(OUT, exist_ok=True)
    df = make_panel(rng)
    control, distances = match_control(df)
    d = df[df["precinct"].isin([0, control])].reset_index(drop=True)
    coef, resid = did_ols(d)
    d["resid"] = resid
    lo, hi = block_bootstrap(d, rng)
    r2 = parallel_r2(d)
    es = event_study(d)
    pre_leads = [v for k, v in es.items() if k < 0]
    parallel_ok = max(abs(v) for v in pre_leads) < 0.04 if pre_leads else False

    per_tram = coef / -3
    slider = {t: {"spend": f"{(np.exp(per_tram * (t - 6)) - 1):+.1%}"} for t in range(2, 9)}
    post_resid = d[d["post"] == 1].groupby("sensor")["resid"].mean()
    red = post_resid[np.abs(post_resid) > 1.5 * post_resid.std()].index.tolist()

    daily = d.groupby(["day", "treated"])["spend"].mean().unstack()
    results = {
        "DiD spend": f"{np.exp(coef) - 1:+.0%}",
        "DiD 90% CI": [f"{np.exp(lo) - 1:+.1%}", f"{np.exp(hi) - 1:+.1%}"],
        "R2 (control)": round(r2, 2),
        "matched_control_precinct": control,
        "parallel_trends_ok": bool(parallel_ok),
        "event_study": es,
        "unexplained_sensors": [int(s) for s in red],
        "true_effect": TRUE_EFFECT,
    }
    dash = {
        **results,
        "match_distance": distances,
        "simulator": slider,
        "treated": [round(float(v), 1) for v in daily[1].values],
        "control": [round(float(v), 1) for v in daily[0].values],
        "cut_day": PRE_DAYS,
        "residuals": {str(int(s)): round(float(v), 3) for s, v in post_resid.items()},
    }
    print("Night Economy Counterfactual")
    for k in ["DiD spend", "DiD 90% CI", "R2 (control)", "parallel_trends_ok", "unexplained_sensors"]:
        print(f"  {k:<26} {results[k]}")
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(dash, f)

    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    axes[0].plot(daily.index, daily[1], color="k", label="treated")
    axes[0].plot(daily.index, daily[0], color="tab:gray", label=f"control {control}")
    axes[0].axvline(PRE_DAYS, color="tab:red", ls="--")
    axes[0].set_title("Mean nightly spend per sensor")
    axes[0].legend()
    weeks = sorted(es)
    axes[1].axhline(0, color="k", lw=0.5)
    axes[1].axvline(-0.5, color="tab:red", ls=":")
    axes[1].plot(weeks, [es[w] for w in weeks], marker="o", color="k")
    axes[1].set_title("Event study (week −1 omitted)")
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
