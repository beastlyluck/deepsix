"""Vision robustness audit: when is the camera model guessing?

ImageNet-C style audit: 15 corruptions x 3 severities x 4 backbones, per-cell
accuracy from simulated per-image outcomes, corruption error relative to a legacy
reference model, mean corruption error (mCE), a traffic-light table and the
stakeholder sentences that fall out of it. Synthetic outcomes; runs offline.
"""
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

SEED = 37
N_IMAGES = 600
SEVERITIES = [1, 2, 3]
CORRUPTIONS = {  # 15 corruptions -> how fast accuracy degrades with severity (fragility)
    "gaussian_noise": 0.16, "shot_noise": 0.15, "impulse_noise": 0.17, "defocus_blur": 0.12,
    "glass_blur": 0.18, "motion_blur": 0.13, "zoom_blur": 0.14, "snow": 0.15, "rain": 0.15,
    "fog": 0.10, "brightness": 0.04, "contrast": 0.12, "elastic": 0.09, "pixelate": 0.08,
    "jpeg": 0.07}
BACKBONES = {"resnet50": (0.76, 1.00), "convnext_tiny": (0.82, 0.72), "efficientnet_b0": (0.77, 0.88),
             "vit_small": (0.80, 0.78)}                                    # (clean acc, fragility multiplier)
REFERENCE = (0.57, 1.45)                                                   # legacy AlexNet-like model
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")


def simulate_errors(rng, clean_acc, frag_mult):
    """Per-image correctness under each corruption/severity; returns error-rate table."""
    rows = []
    for c, frag in CORRUPTIONS.items():
        for s in SEVERITIES:
            p_correct = clean_acc * (1 - frag * frag_mult * s ** 1.15)
            correct = rng.random(N_IMAGES) < max(p_correct, 0.02)
            rows.append({"corruption": c, "severity": s, "error": 1 - correct.mean()})
    return pd.DataFrame(rows)


def light(drop):
    return "green" if drop <= 0.10 else ("amber" if drop <= 0.25 else "red")


def main():
    rng = np.random.default_rng(SEED)
    os.makedirs(OUT, exist_ok=True)
    ref = simulate_errors(rng, *REFERENCE).groupby("corruption")["error"].sum()
    audit, tables = {}, {}
    for name, (clean, mult) in BACKBONES.items():
        clean_err = 1 - (rng.random(N_IMAGES) < clean).mean()
        err = simulate_errors(rng, clean, mult)
        ce = err.groupby("corruption")["error"].sum() / ref * 100          # corruption error vs reference
        tbl = err.pivot(index="corruption", columns="severity", values="error")
        drop = tbl.sub(clean_err, axis=0)                                  # accuracy drop vs clean
        tables[name] = drop
        audit[name] = {"clean_acc": round(1 - clean_err, 3), "mCE": round(float(ce.mean()), 1),
                       "CE": {k: round(float(v), 1) for k, v in ce.items()}}
    best = min(audit, key=lambda n: audit[n]["mCE"])
    lights = tables[best].apply(lambda col: col.map(light))
    red_first = {c: next((s for s in SEVERITIES if lights.loc[c, s] == "red"), None) for c in CORRUPTIONS}
    rain_fail = red_first["rain"]
    sentences = [f"Do not update inventory from this camera under {c} severity >= {s}." for c, s in red_first.items() if s]
    pages = ["scope", "clean accuracy", "corruption table", "severity thresholds", "decisions", "appendix"]
    results = {"mCE (best)": audit[best]["mCE"], "Rain fail sev.": rain_fail, "Backbones": len(BACKBONES),
               "Pages": len(pages), "best_backbone": best, "per_backbone": audit,
               "traffic_light_best": {c: {str(s): lights.loc[c, s] for s in SEVERITIES} for c in CORRUPTIONS},
               "stakeholder_sentences": sentences}
    print("Vision robustness audit")
    for k in ["mCE (best)", "Rain fail sev.", "Backbones", "Pages", "best_backbone"]:
        print(f"  {k:<16} {results[k]}")
    print("  mCE by backbone:", {k: v["mCE"] for k, v in audit.items()})
    print("  " + "\n  ".join(sentences[:4]) + (f"\n  ... {len(sentences) - 4} more" if len(sentences) > 4 else ""))
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(results, f)

    fig, axes = plt.subplots(1, 2, figsize=(13, 5), gridspec_kw={"width_ratios": [2, 1]})
    drop = tables[best]
    im = axes[0].imshow(drop.values, cmap="RdYlGn_r", vmin=0, vmax=0.5, aspect="auto")
    axes[0].set_yticks(range(len(drop.index))); axes[0].set_yticklabels(drop.index)
    axes[0].set_xticks(range(3)); axes[0].set_xticklabels([f"sev {s}" for s in SEVERITIES])
    axes[0].set_title(f"Accuracy drop vs clean, {best}"); fig.colorbar(im, ax=axes[0])
    names = list(audit); axes[1].barh(names, [audit[n]["mCE"] for n in names], color="tab:gray")
    axes[1].axvline(100, color="k", ls="--", lw=0.8); axes[1].set_title("mCE (reference = 100)")
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    print(f"Wrote {OUT}/results.json and figure.png")


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
