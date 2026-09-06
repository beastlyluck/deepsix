"""Model Watch Desk: a one-page watch for drift, performance and champion approval.

Three production models, fourteen daily windows, PSI per feature against a
reference window, rolling AUC with next-day labels, traffic-light rules, a signed
champion ledger and a digest. Logs are synthetic (UCI Adult-shaped); runs offline.
"""
import hashlib
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score

SEED = 21
WINDOWS = 14
N_PER_WINDOW = 1500
FEATURES = ["age", "education_num", "hours_per_week", "capital_gain", "tenure_months"]
MODELS = {"income_propensity": {"drift_day": None}, "credit_limit": {"drift_day": 8}, "churn_watch": {"drift_day": None}}
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")


def sample_window(rng, n, shift=0.0, label_shift=0.0):
    """UCI Adult-shaped features; shift moves age and hours, label_shift moves the outcome."""
    age = rng.normal(38 + 8 * shift, 12, n).clip(18, 80)
    edu = rng.integers(6, 17, n).astype(float)
    hours = rng.normal(40 + 6 * shift, 10, n).clip(5, 90)
    gain = np.where(rng.random(n) < 0.08, rng.lognormal(8, 1, n), 0.0)
    tenure = rng.exponential(30, n)
    X = np.column_stack([age, edu, hours, gain, tenure])
    logit = -6 + 0.03 * age + 0.3 * edu + 0.03 * hours + 0.0001 * gain + label_shift * rng.standard_normal(n)
    y = (rng.random(n) < 1 / (1 + np.exp(-logit))).astype(int)
    return X, y


def psi(ref, cur, bins=10):
    edges = np.quantile(ref, np.linspace(0, 1, bins + 1))
    edges[0], edges[-1] = -np.inf, np.inf
    r = np.histogram(ref, edges)[0] / len(ref) + 1e-6
    c = np.histogram(cur, edges)[0] / len(cur) + 1e-6
    return float(np.sum((c - r) * np.log(c / r)))


def light(v):
    return "red" if v > 0.2 else ("amber" if v > 0.1 else "green")


def main():
    rng = np.random.default_rng(SEED)
    os.makedirs(OUT, exist_ok=True)
    ledger, board, pages = {}, {}, []
    for name, cfg in MODELS.items():
        Xref, yref = sample_window(rng, 8000)
        model = LogisticRegression(max_iter=1000).fit(Xref, yref)
        sha = hashlib.sha1(np.round(model.coef_, 6).tobytes()).hexdigest()[:10]
        ledger[name] = {"champion_sha": sha, "approved_by": "analytics-lead", "approved_on": "2026-08-25",
                        "ref_auc": round(float(roc_auc_score(yref, model.predict_proba(Xref)[:, 1])), 3)}
        rows = []
        for day in range(WINDOWS):
            drift = cfg["drift_day"] is not None and day >= cfg["drift_day"]
            lshift = 2.5 if (name == "churn_watch" and day >= 10) else 0.0   # performance-only degradation
            X, y = sample_window(rng, N_PER_WINDOW, shift=1.0 if drift else 0.0, label_shift=lshift)
            feat_psi = {f: psi(Xref[:, i], X[:, i]) for i, f in enumerate(FEATURES)}
            worst = max(feat_psi, key=feat_psi.get)
            auc = float(roc_auc_score(y, model.predict_proba(X)[:, 1])) if day > 0 else None  # labels arrive next day
            status = light(feat_psi[worst])
            if auc is not None and auc < ledger[name]["ref_auc"] - 0.05:
                status = "red"
            rows.append({"day": day, "psi_max": round(feat_psi[worst], 3), "worst_feature": worst,
                         "auc": None if auc is None else round(auc, 3), "status": status})
            if status == "red":
                pages.append((name, day))
        board[name] = rows

    # Detection delay for the model with injected drift; false pages = red days with no real cause.
    cred = [r for r in board["credit_limit"] if r["status"] == "red"]
    detect_delay = cred[0]["day"] - MODELS["credit_limit"]["drift_day"] if cred else None
    real = {("credit_limit", d) for d in range(8, WINDOWS)} | {("churn_watch", d) for d in range(10, WINDOWS)}
    false_pages = [p for p in pages if p not in real]
    results = {"Detect delay": f"{detect_delay} day", "Windows": WINDOWS, "False pages": f"{len(false_pages)}/{WINDOWS}d",
               "Models": len(MODELS), "champion_ledger": ledger, "board": board}
    print("Model Watch Desk")
    for k in ["Detect delay", "Windows", "False pages", "Models"]:
        print(f"  {k:<14} {results[k]}")
    print("\nDigest:")
    for name, rows in board.items():
        last = rows[-1]
        print(f"  [{last['status'].upper():5}] {name:<18} PSI {last['psi_max']:.3f} ({last['worst_feature']}), "
              f"AUC {last['auc']}, champion {ledger[name]['champion_sha']} approved by {ledger[name]['approved_by']}")
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(results, f)

    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    for name, rows in board.items():
        axes[0].plot([r["day"] for r in rows], [r["psi_max"] for r in rows], marker="o", label=name)
        axes[1].plot([r["day"] for r in rows if r["auc"]], [r["auc"] for r in rows if r["auc"]], marker="o", label=name)
    axes[0].axhline(0.1, color="orange", ls="--"); axes[0].axhline(0.2, color="red", ls="--")
    axes[0].set_title("Max feature PSI vs reference"); axes[0].set_xlabel("window (day)"); axes[0].legend()
    axes[1].set_title("Rolling AUC (labels arrive next day)"); axes[1].set_xlabel("window (day)"); axes[1].legend()
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    print(f"Wrote {OUT}/results.json and figure.png")


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
