"""Retention Uplift: who should receive a win-back offer?

T-learner and class-transformation uplift models on a telco-shaped churn table with
a randomised offer, scored with a Qini curve and AUUC on a holdout. The budget saved
is the share of customers the model refuses to message. Synthetic; runs offline.
"""
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split

SEED = 13
N = 7043
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")
FEATS = ["tenure", "monthly", "month_to_month", "fibre", "tech_support", "paperless", "senior", "dependents"]


def make_telco(rng):
    """IBM Telco-shaped features, a 50/50 randomised offer, heterogeneous treatment effect."""
    df = pd.DataFrame({
        "tenure": rng.integers(1, 73, N), "monthly": rng.normal(65, 30, N).clip(18, 120),
        "month_to_month": (rng.random(N) < 0.55).astype(int), "fibre": (rng.random(N) < 0.44).astype(int),
        "tech_support": (rng.random(N) < 0.29).astype(int), "paperless": (rng.random(N) < 0.59).astype(int),
        "senior": (rng.random(N) < 0.16).astype(int), "dependents": (rng.random(N) < 0.30).astype(int),
    })
    base = (-1.6 - 0.03 * df["tenure"] + 0.012 * df["monthly"] + 1.1 * df["month_to_month"]
            + 0.4 * df["fibre"] - 0.5 * df["tech_support"] + 0.3 * df["paperless"] + 0.2 * df["senior"])
    # Persuadables: month-to-month, high charges, short tenure. Sleeping dogs: long-tenure, dependents.
    tau = (-2.0 * df["month_to_month"] * (df["monthly"] > 50) * (df["tenure"] < 36)
           - 0.3 * df["month_to_month"] + 0.9 * (df["tenure"] > 48) * df["dependents"])
    df["offer"] = rng.integers(0, 2, N)
    logit = base + tau * df["offer"]
    df["churn"] = (rng.random(N) < 1 / (1 + np.exp(-logit))).astype(int)
    return df


def qini_curve(uplift, treat, churn, grid=np.linspace(0.02, 1.0, 50)):
    """Incremental retained customers per treated customer, when messaging the top-k by score."""
    order = np.argsort(-uplift)
    t, r = treat[order], 1 - churn[order]
    nt_total = t.sum()
    pts = []
    for k in grid:
        m = int(np.ceil(k * len(order)))
        tk, ck = t[:m] == 1, t[:m] == 0
        nt, nc = tk.sum(), ck.sum()
        inc = r[:m][tk].sum() - (r[:m][ck].sum() * nt / nc if nc else 0)
        pts.append(inc / nt_total)
    return grid, np.array(pts)


def main():
    rng = np.random.default_rng(SEED)
    os.makedirs(OUT, exist_ok=True)
    df = make_telco(rng)
    tr, te = train_test_split(df, test_size=0.4, random_state=SEED, stratify=df["offer"])
    gbm = lambda: GradientBoostingClassifier(n_estimators=150, max_depth=3, learning_rate=0.05, random_state=SEED)

    # T-learner: separate response models for offer / no offer. Uplift = churn reduction.
    m1 = gbm().fit(tr[tr["offer"] == 1][FEATS], tr[tr["offer"] == 1]["churn"])
    m0 = gbm().fit(tr[tr["offer"] == 0][FEATS], tr[tr["offer"] == 0]["churn"])
    u_t = m0.predict_proba(te[FEATS])[:, 1] - m1.predict_proba(te[FEATS])[:, 1]

    # Class transformation (Jaskowski & Jaroszewicz): Z=1 if treated & retained or control & churned.
    z = ((tr["offer"] == 1) & (tr["churn"] == 0)) | ((tr["offer"] == 0) & (tr["churn"] == 1))
    mz = gbm().fit(tr[FEATS], z.astype(int))
    u_ct = 2 * mz.predict_proba(te[FEATS])[:, 1] - 1

    treat, churn = te["offer"].values, te["churn"].values
    curves = {"T-learner": qini_curve(u_t, treat, churn), "Class transform": qini_curve(u_ct, treat, churn),
              "Random": qini_curve(rng.random(len(te)), treat, churn)}
    overall = curves["Random"][1][-1]                        # incremental retained if everyone is messaged
    summary = {}
    for name, (g, q) in curves.items():
        q20 = float(np.interp(0.20, g, q))
        trap = getattr(np, "trapezoid", None) or np.trapz
        auuc = float(trap(q, g) - trap(g * overall, g))            # area above the random line
        summary[name] = {"Qini (20%)": round(q20, 3), "AUUC": round(auuc, 3)}
    best = max(["T-learner", "Class transform"], key=lambda n: summary[n]["AUUC"])
    g, q = curves[best]
    k_star = float(g[np.argmax(q >= 0.95 * q.max())])         # smallest share capturing 95% of saves
    true_share_positive = float((u_t > 0).mean())
    results = {"Qini (20%)": summary[best]["Qini (20%)"], "Budget save": f"{1 - k_star:.0%}",
               "AUUC": summary[best]["AUUC"], "N": N, "best_model": best, "models": summary,
               "share_with_positive_uplift": round(true_share_positive, 3),
               "message_everyone_incremental_rate": round(float(overall), 3)}
    print("Retention Uplift")
    for k in ["Qini (20%)", "Budget save", "AUUC", "N", "best_model"]:
        print(f"  {k:<14} {results[k]}")
    print("  per-model:", summary)
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(results, f)

    fig, ax = plt.subplots(figsize=(7, 4.5))
    for name, (g, q) in curves.items():
        ax.plot(g, q, label=name, ls="--" if name == "Random" else "-")
    ax.axvline(k_star, color="gray", ls=":", label=f"stop at {k_star:.0%} of customers")
    ax.set_xlabel("share of customers messaged (ranked by uplift)")
    ax.set_ylabel("incremental retained per treated customer")
    ax.set_title("Qini curves, holdout"); ax.legend()
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    print(f"Wrote {OUT}/results.json and figure.png")


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
