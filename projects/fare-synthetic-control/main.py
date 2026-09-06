"""Fare Change Synthetic Control: did a fare reform move ridership?

Abadie-style synthetic control on route-day boardings with a donor pool of 18
routes, weather residualised out first, simplex-constrained weights via SLSQP,
pre-period RMSPE, and a placebo-in-space test. Synthetic; runs offline.
"""
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from scipy.optimize import minimize

SEED = 17
DONORS = 18
PRE, POST = 180, 60
TRUE_ATT = -0.064
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")


def make_boardings(rng):
    """Log boardings for 1 treated + 18 donor routes; two latent factors, weekly cycle, rain."""
    T = PRE + POST
    t = np.arange(T)
    factors = np.column_stack([0.04 * np.sin(2 * np.pi * t / 365 + 1), 0.02 * rng.standard_normal(T).cumsum() / 5])
    rain = rng.gamma(0.6, 4, T)                              # mm per day
    loadings = rng.uniform(0.3, 1.5, (DONORS + 1, 2))
    levels = np.log(rng.uniform(1500, 9000, DONORS + 1))
    weekly = np.where(np.isin(t % 7, [5, 6]), -0.25, 0.0)
    Y = np.zeros((DONORS + 1, T))
    for i in range(DONORS + 1):
        Y[i] = levels[i] + factors @ loadings[i] + weekly - 0.006 * rain + rng.normal(0, 0.03, T)
    Y[0, PRE:] += np.log(1 + TRUE_ATT)                       # fare reform on the treated route
    return Y, rain


def residualise_weather(Y, rain):
    """Per-route pre-period OLS on rain; remove the rain term and the pre-period mean."""
    X = np.column_stack([np.ones(Y.shape[1]), rain])
    adj = np.empty_like(Y)
    for i in range(Y.shape[0]):
        b, *_ = np.linalg.lstsq(X[:PRE], Y[i, :PRE], rcond=None)
        adj[i] = Y[i] - b[1] * rain
        adj[i] -= adj[i, :PRE].mean()                        # level-free so the donor hull covers the treated route
    return adj


def sc_weights(y1_pre, Y0_pre):
    """Minimise pre-period squared error over the simplex (w >= 0, sum w = 1)."""
    k = Y0_pre.shape[0]
    obj = lambda w: np.sum((y1_pre - w @ Y0_pre) ** 2)
    res = minimize(obj, np.full(k, 1 / k), method="SLSQP", bounds=[(0, 1)] * k,
                   constraints={"type": "eq", "fun": lambda w: w.sum() - 1}, options={"maxiter": 500})
    return res.x


def fit_sc(Y, treated):
    donors = [i for i in range(Y.shape[0]) if i != treated]
    w = sc_weights(Y[treated, :PRE], Y[donors, :PRE])
    synth = w @ Y[donors]
    gap = Y[treated] - synth
    pre_rmspe = np.sqrt(np.mean(gap[:PRE] ** 2))
    post_rmspe = np.sqrt(np.mean(gap[PRE:] ** 2))
    return w, synth, gap, pre_rmspe, post_rmspe


def main():
    rng = np.random.default_rng(SEED)
    os.makedirs(OUT, exist_ok=True)
    Y, rain = make_boardings(rng)
    Ya = residualise_weather(Y, rain)
    w, synth, gap, pre_rmspe, post_rmspe = fit_sc(Ya, 0)
    att_log = gap[PRE:].mean()

    # Placebo in space: assign the treatment to each donor in turn, same donor pool logic.
    ratios, placebo_gaps = [], []
    for j in range(1, DONORS + 1):
        _, _, g, pre_j, post_j = fit_sc(Ya, j)
        ratios.append(post_j / pre_j)
        placebo_gaps.append(g)
    treated_ratio = post_rmspe / pre_rmspe
    p_value = (np.sum(np.array(ratios) >= treated_ratio) + 1) / (DONORS + 1)
    top = np.argsort(-w)[:5]
    results = {"ATT (boardings)": f"{np.exp(att_log) - 1:+.1%}", "Placebo p": round(float(p_value), 3),
               "Donors": DONORS, "Pre-fit": f"RMSPE {pre_rmspe:.3f}",
               "post_pre_rmspe_ratio": round(float(treated_ratio), 2),
               "top_donor_weights": {f"route_{int(i)}": round(float(w[i - 1]), 3) for i in top + 1},
               "true_effect_used_in_simulation": f"{TRUE_ATT:+.1%}"}
    print("Fare Change Synthetic Control")
    for k in ["ATT (boardings)", "Placebo p", "Donors", "Pre-fit", "post_pre_rmspe_ratio", "top_donor_weights"]:
        print(f"  {k:<22} {results[k]}")
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(results, f)

    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    axes[0].plot(Ya[0], color="k", lw=0.9, label="treated route")
    axes[0].plot(synth, color="tab:blue", ls="--", label="synthetic control")
    axes[0].axvline(PRE, color="tab:red", ls=":", label="fare change")
    axes[0].set_title("Weather-adjusted log boardings (pre-period mean removed)"); axes[0].legend()
    for g in placebo_gaps:
        axes[1].plot(g, color="lightgray", lw=0.8)
    axes[1].plot(gap, color="k", lw=1.5, label="treated gap")
    axes[1].axvline(PRE, color="tab:red", ls=":"); axes[1].axhline(0, color="k", lw=0.5)
    axes[1].set_title(f"Placebo-in-space gaps (p = {p_value:.2f})"); axes[1].legend()
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    print(f"Wrote {OUT}/results.json and figure.png")


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
