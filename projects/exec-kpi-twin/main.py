"""Executive KPI twin: five numbers a director will open.

A versioned metrics layer (definition, owner, expression) over a weekly fact table,
a seasonal baseline per KPI fitted by least squares on trend and annual Fourier terms,
a residual band, and an alert when actuals leave the band. The surprise rate of the
model band is compared with a naive mean +/- 2 SD band. Synthetic; runs offline.
"""
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

SEED = 47
WEEKS = 104
TRAIN = 78                                                 # fit on 18 months, watch the last 26 weeks
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")

METRICS = {  # name -> definition card (this is the semantic layer)
    "growth_wau": {"version": 3, "owner": "product", "unit": "users",
                   "definition": "Weekly active users: distinct users with >= 1 session in the ISO week.",
                   "expr": lambda f: f["active_users"]},
    "quality_defect_rate": {"version": 2, "owner": "engineering", "unit": "%",
                            "definition": "Sev1+Sev2 incidents per 1,000 sessions.",
                            "expr": lambda f: f["incidents"] / f["sessions"] * 1000},
    "risk_overdue_share": {"version": 1, "owner": "finance", "unit": "%",
                           "definition": "Share of invoices open more than 30 days past due.",
                           "expr": lambda f: f["overdue_invoices"] / f["open_invoices"] * 100},
    "cost_per_active_user": {"version": 2, "owner": "platform", "unit": "AUD",
                             "definition": "Cloud spend divided by weekly active users.",
                             "expr": lambda f: f["cloud_spend"] / f["active_users"]},
    "surprise_residual": {"version": 1, "owner": "analytics", "unit": "z",
                          "definition": "Mean absolute z-score of the four KPIs against their bands this week.",
                          "expr": None},
}


def make_facts(rng):
    t = np.arange(WEEKS)
    season = np.sin(2 * np.pi * t / 52)
    users = 12000 * (1 + 0.008 * t) * (1 + 0.14 * season) * np.exp(rng.normal(0, 0.03, WEEKS))
    users[90:93] *= 0.85                                   # a real event: outage + campaign pause
    sessions = users * rng.normal(4.2, 0.15, WEEKS)
    incidents = rng.poisson(0.9 * sessions / 1000 * (1 + 0.5 * (t > 95)))   # quality slips at the end
    open_inv = rng.integers(400, 600, WEEKS)
    overdue = rng.binomial(open_inv, 0.12 + 0.03 * season)
    spend = users * rng.normal(0.85, 0.03, WEEKS) * (1 + 0.004 * t)
    return pd.DataFrame({"week": t, "active_users": users, "sessions": sessions, "incidents": incidents,
                         "open_invoices": open_inv, "overdue_invoices": overdue, "cloud_spend": spend})


def seasonal_band(y, train_n, z=2.0):
    """OLS on trend + annual Fourier; band = fitted +/- z * residual SD from the training window."""
    t = np.arange(len(y))
    X = np.column_stack([np.ones_like(t), t, np.sin(2 * np.pi * t / 52), np.cos(2 * np.pi * t / 52)]).astype(float)
    beta, *_ = np.linalg.lstsq(X[:train_n], y[:train_n], rcond=None)
    fit = X @ beta
    sd = np.std(y[:train_n] - fit[:train_n])
    return fit, sd, (y - fit) / sd


def main():
    rng = np.random.default_rng(SEED)
    os.makedirs(OUT, exist_ok=True)
    facts = make_facts(rng)
    kpis = pd.DataFrame({k: v["expr"](facts) for k, v in METRICS.items() if v["expr"]})
    bands, zs, alerts, naive_alerts = {}, {}, {}, {}
    for k in kpis:
        fit, sd, zscore = seasonal_band(kpis[k].values, TRAIN)
        bands[k] = (fit, sd); zs[k] = zscore
        alerts[k] = np.where(np.abs(zscore[TRAIN:]) > 2)[0] + TRAIN
        mu, s = kpis[k].values[:TRAIN].mean(), kpis[k].values[:TRAIN].std()
        naive_alerts[k] = np.where(np.abs((kpis[k].values[TRAIN:] - mu) / s) > 2)[0] + TRAIN
    kpis["surprise_residual"] = np.mean([np.abs(zs[k]) for k in zs], axis=0)
    watch_weeks = WEEKS - TRAIN
    model_rate = sum(len(v) for v in alerts.values()) / (4 * watch_weeks)
    naive_rate = sum(len(v) for v in naive_alerts.values()) / (4 * watch_weeks)
    latest = int(kpis["week"].iloc[-1]) if "week" in kpis else WEEKS - 1
    page = {k: {"value": round(float(kpis[k].iloc[-1]), 2), "unit": METRICS[k]["unit"], "owner": METRICS[k]["owner"],
                "definition_version": METRICS[k]["version"],
                "status": "red" if (k in alerts and latest in alerts[k]) or (k == "surprise_residual" and kpis[k].iloc[-1] > 2) else "green"}
            for k in METRICS}
    results = {"KPIs": len(METRICS), "Defs versioned": "yes", "Refresh": "hourly",
               "Surprise rate": f"{model_rate:.1%} (naive band {naive_rate:.1%})",
               "alert_weeks_model": {k: [int(w) for w in v] for k, v in alerts.items()},
               "alert_weeks_naive": {k: [int(w) for w in v] for k, v in naive_alerts.items()}, "page": page}
    print("Executive KPI twin")
    for k in ["KPIs", "Defs versioned", "Refresh", "Surprise rate"]:
        print(f"  {k:<16} {results[k]}")
    print("  This week's page:")
    for k, v in page.items():
        print(f"    [{v['status']:5}] {k:<24} {v['value']:>10} {v['unit']:<5} owner={v['owner']} v{v['definition_version']}")
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(results, f)

    fig, axes = plt.subplots(5, 1, figsize=(10, 9), sharex=True)
    for ax, k in zip(axes, METRICS):
        y = kpis[k].values
        ax.plot(y, color="k", lw=1)
        if k in bands:
            fit, sd = bands[k]
            ax.fill_between(range(WEEKS), fit - 2 * sd, fit + 2 * sd, color="tab:blue", alpha=0.15)
            ax.scatter(alerts[k], y[alerts[k]], color="tab:red", zorder=3, s=18)
        else:
            ax.axhline(2, color="tab:red", ls=":", lw=0.8)
        ax.axvline(TRAIN, color="gray", ls="--", lw=0.8)
        ax.set_ylabel(k, fontsize=8, rotation=0, ha="right", va="center")
    axes[-1].set_xlabel("week"); axes[0].set_title("Five KPIs, band alerts in red (fit window left of the dashed line)")
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    print(f"Wrote {OUT}/results.json and figure.png")


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
