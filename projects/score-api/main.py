"""Score API with a lineage card: a credit-style score with reason codes and a model hash.

Twelve-feature logistic regression champion (contributions give exact top-3 reason
codes), a gradient boosting canary compared on holdout AUC, p95 single-row latency,
and a JSON payload {score, reasons, model_sha}. The fitted artefact is written to
outputs/model.json for app.py. Give-Me-Some-Credit-shaped synthetic data; runs offline.
"""
import hashlib
import json
import os
import time

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, roc_curve
from sklearn.model_selection import train_test_split

SEED = 43
N = 20000
FEATURES = ["revolving_utilization", "age", "times_30_59_late", "debt_ratio", "monthly_income",
            "open_credit_lines", "times_90_late", "real_estate_loans", "times_60_89_late",
            "dependents", "employment_years", "inquiries_6m"]
REASONS = {"revolving_utilization": "High revolving utilisation", "age": "Short credit history (age)",
           "times_30_59_late": "Recent 30-59 day delinquencies", "debt_ratio": "High debt-to-income ratio",
           "monthly_income": "Low monthly income", "open_credit_lines": "Number of open credit lines",
           "times_90_late": "90+ day delinquencies on file", "real_estate_loans": "Real estate loan exposure",
           "times_60_89_late": "Recent 60-89 day delinquencies", "dependents": "Number of dependents",
           "employment_years": "Short employment tenure", "inquiries_6m": "Recent credit inquiries"}
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")


def make_credit(rng):
    df = pd.DataFrame({
        "revolving_utilization": rng.beta(1.2, 3, N), "age": rng.normal(48, 14, N).clip(21, 90),
        "times_30_59_late": rng.poisson(0.35, N), "debt_ratio": rng.gamma(2, 0.2, N).clip(0, 5),
        "monthly_income": rng.lognormal(8.6, 0.6, N), "open_credit_lines": rng.poisson(8, N),
        "times_90_late": rng.poisson(0.2, N), "real_estate_loans": rng.poisson(1, N),
        "times_60_89_late": rng.poisson(0.15, N), "dependents": rng.poisson(0.8, N),
        "employment_years": rng.gamma(2, 4, N), "inquiries_6m": rng.poisson(1.2, N)})
    logit = (-4.6 + 3.6 * df["revolving_utilization"] - 0.035 * (df["age"] - 48) + 0.8 * df["times_30_59_late"]
             + 0.6 * df["debt_ratio"] - 0.5 * np.log(df["monthly_income"] / 5000) + 1.4 * df["times_90_late"]
             + 1.0 * df["times_60_89_late"] + 0.25 * df["inquiries_6m"] - 0.06 * df["employment_years"])
    df["default"] = (rng.random(N) < 1 / (1 + np.exp(-logit))).astype(int)
    return df


def score_row(art, x):
    """Pure-numpy scoring used by both the latency test and app.py."""
    z = (np.asarray(x, dtype=float) - art["mean"]) / art["scale"]
    contrib = z * art["coef"]
    p = 1 / (1 + np.exp(-(contrib.sum() + art["intercept"])))
    top = np.argsort(-contrib)[:3]
    reasons = [REASONS[FEATURES[i]] for i in top if contrib[i] > 0]
    return {"score": round(float(p), 4), "reasons": reasons, "model_sha": art["model_sha"]}


def main():
    rng = np.random.default_rng(SEED)
    os.makedirs(OUT, exist_ok=True)
    df = make_credit(rng)
    Xtr, Xte, ytr, yte = train_test_split(df[FEATURES].values, df["default"].values, test_size=0.3,
                                          random_state=SEED, stratify=df["default"])
    mean, scale = Xtr.mean(0), Xtr.std(0) + 1e-9
    champion = LogisticRegression(C=1.0, max_iter=2000).fit((Xtr - mean) / scale, ytr)
    art = {"coef": champion.coef_[0], "intercept": float(champion.intercept_[0]), "mean": mean, "scale": scale}
    art["model_sha"] = hashlib.sha1(np.round(np.r_[art["coef"], art["intercept"]], 8).tobytes()).hexdigest()[:12]
    p_champ = champion.predict_proba((Xte - mean) / scale)[:, 1]
    auc_champ = roc_auc_score(yte, p_champ)

    canary = HistGradientBoostingClassifier(max_iter=200, learning_rate=0.05, random_state=SEED).fit(Xtr, ytr)
    auc_canary = roc_auc_score(yte, canary.predict_proba(Xte)[:, 1])

    lat = []
    for i in range(1000):
        t0 = time.perf_counter(); score_row(art, Xte[i]); lat.append((time.perf_counter() - t0) * 1000)
    sample = score_row(art, Xte[int(np.argmax(p_champ))])
    results = {"AUC": round(float(auc_champ), 3), "p95 latency": f"{np.percentile(lat, 95):.2f}ms",
               "Canary delta": f"{abs(auc_canary - auc_champ):.3f} AUC", "Features": len(FEATURES),
               "canary_auc": round(float(auc_canary), 3), "default_rate": round(float(df["default"].mean()), 3),
               "example_payload": sample,
               "coefficients_std": {f: round(float(c), 3) for f, c in zip(FEATURES, art["coef"])}}
    print("Score API")
    for k in ["AUC", "p95 latency", "Canary delta", "Features", "canary_auc", "default_rate"]:
        print(f"  {k:<14} {results[k]}")
    print("  example payload:", json.dumps(sample))
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(results, f)
    with open(os.path.join(OUT, "model.json"), "w") as f:      # artefact for app.py
        json.dump({"features": FEATURES, "coef": art["coef"].tolist(), "intercept": art["intercept"],
                   "mean": mean.tolist(), "scale": scale.tolist(), "model_sha": art["model_sha"]}, f, indent=2)

    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    fpr, tpr, _ = roc_curve(yte, p_champ); axes[0].plot(fpr, tpr, label=f"champion logistic AUC {auc_champ:.3f}")
    fpr2, tpr2, _ = roc_curve(yte, canary.predict_proba(Xte)[:, 1]); axes[0].plot(fpr2, tpr2, "--", label=f"canary GBM AUC {auc_canary:.3f}")
    axes[0].plot([0, 1], [0, 1], "k:", lw=0.7); axes[0].set_title("ROC, holdout"); axes[0].legend()
    order = np.argsort(np.abs(art["coef"]))
    axes[1].barh([FEATURES[i] for i in order], art["coef"][order], color=np.where(art["coef"][order] > 0, "tab:red", "tab:green"))
    axes[1].set_title("Standardised coefficients (reason-code weights)")
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    print(f"Wrote {OUT}/results.json, model.json and figure.png")


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
