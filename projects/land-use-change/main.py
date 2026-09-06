"""Land-use change, one tile at a time.

A tile classifier (gradient boosting on spectral-index features standing in for the
EfficientNet encoder), per-class IoU, a year-over-year change map with a class
transition matrix in hectares, and an entropy-based confidence mask that reports the
tiles the model is unsure about. EuroSAT-shaped synthetic tiles; runs offline.
"""
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import confusion_matrix
from sklearn.model_selection import train_test_split

SEED = 29
CLASSES = ["AnnualCrop", "Forest", "HerbaceousVegetation", "Highway", "Industrial",
           "Pasture", "PermanentCrop", "Residential", "River", "SeaLake"]
FEATURES = ["ndvi", "ndbi", "ndwi", "brightness", "texture", "red_nir_ratio"]
N_TILES = 6000
GRID = 40                     # 40 x 40 tiles per year; a EuroSAT tile is 64 px at 10 m = 40.96 ha
HA_PER_TILE = 40.96
UNSURE_ENTROPY = 0.6          # nats; max for 10 classes is ln(10) = 2.30
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")

# Class centroids in index space: (ndvi, ndbi, ndwi, brightness, texture, red/nir)
CENTROIDS = np.array([
    [0.55, -0.20, -0.30, 0.45, 0.30, 0.45], [0.80, -0.35, -0.45, 0.25, 0.20, 0.20],
    [0.60, -0.25, -0.35, 0.40, 0.25, 0.35], [0.15, 0.10, -0.10, 0.55, 0.55, 0.80],
    [0.05, 0.30, -0.05, 0.70, 0.60, 0.95], [0.65, -0.28, -0.38, 0.38, 0.15, 0.30],
    [0.50, -0.15, -0.28, 0.42, 0.45, 0.50], [0.20, 0.20, -0.12, 0.60, 0.65, 0.75],
    [0.10, -0.10, 0.30, 0.30, 0.40, 0.70], [-0.05, -0.30, 0.60, 0.15, 0.05, 0.90]])


def sample_tiles(rng, labels):
    X = CENTROIDS[labels] + rng.normal(0, 0.055, (len(labels), len(FEATURES)))
    X[:, 4] = np.abs(X[:, 4])
    return X


def make_scene(rng, clf):
    """Two years of a 40x40 tile grid. Some pasture/crop becomes residential or industrial."""
    base = rng.choice(len(CLASSES), GRID * GRID, p=[.15, .18, .10, .05, .05, .15, .10, .12, .04, .06])
    y1 = base.copy()
    y2 = base.copy()
    convert = (np.isin(base, [0, 5, 6])) & (rng.random(GRID * GRID) < 0.12)
    y2[convert] = rng.choice([7, 4], convert.sum(), p=[0.75, 0.25])
    out = {}
    for tag, lab in [("y1", y1), ("y2", y2)]:
        proba = clf.predict_proba(sample_tiles(rng, lab))
        out[tag] = {"true": lab, "pred": proba.argmax(1),
                    "entropy": -(proba * np.log(proba + 1e-12)).sum(1)}
    return out


def main():
    rng = np.random.default_rng(SEED)
    os.makedirs(OUT, exist_ok=True)
    labels = rng.integers(0, len(CLASSES), N_TILES)
    X = sample_tiles(rng, labels)
    Xtr, Xte, ytr, yte = train_test_split(X, labels, test_size=0.25, random_state=SEED, stratify=labels)
    clf = HistGradientBoostingClassifier(max_iter=200, learning_rate=0.08, random_state=SEED).fit(Xtr, ytr)
    pred = clf.predict(Xte)
    cm = confusion_matrix(yte, pred, labels=range(len(CLASSES)))
    tp = np.diag(cm)
    iou = tp / (cm.sum(0) + cm.sum(1) - tp)
    accuracy = float(tp.sum() / cm.sum())

    scene = make_scene(rng, clf)
    p1, p2 = scene["y1"]["pred"], scene["y2"]["pred"]
    unsure = (scene["y1"]["entropy"] > UNSURE_ENTROPY) | (scene["y2"]["entropy"] > UNSURE_ENTROPY)
    changed = (p1 != p2) & ~unsure
    trans = pd.crosstab(pd.Series(p1[changed], name="from"), pd.Series(p2[changed], name="to")) * HA_PER_TILE
    trans.index = [CLASSES[i] for i in trans.index]; trans.columns = [CLASSES[i] for i in trans.columns]
    became_urban = float(trans.reindex(columns=["Residential", "Industrial"]).fillna(0).values.sum())
    worst = np.argsort(-np.maximum(scene["y1"]["entropy"], scene["y2"]["entropy"]))[:3]

    results = {"Accuracy": f"{accuracy:.1%}", "mIoU": round(float(iou.mean()), 3), "Unsure tiles": f"{unsure.mean():.1%}",
               "Classes": len(CLASSES), "per_class_iou": {c: round(float(v), 3) for c, v in zip(CLASSES, iou)},
               "hectares_became_urban": round(became_urban, 1), "true_hectares_converted": round(float(np.sum(scene["y1"]["true"] != scene["y2"]["true"]) * HA_PER_TILE), 1),
               "transition_matrix_ha": {k: {kk: round(float(vv), 1) for kk, vv in v.items() if vv > 0} for k, v in trans.to_dict(orient="index").items()},
               "three_tiles_to_check": [{"row": int(i // GRID), "col": int(i % GRID), "entropy": round(float(max(scene["y1"]["entropy"][i], scene["y2"]["entropy"][i])), 2)} for i in worst]}
    print("Land-use change")
    for k in ["Accuracy", "mIoU", "Unsure tiles", "Classes", "hectares_became_urban", "true_hectares_converted"]:
        print(f"  {k:<24} {results[k]}")
    print("  tiles to check:", results["three_tiles_to_check"])
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(results, f)

    fig, axes = plt.subplots(1, 3, figsize=(14, 4.6))
    axes[0].imshow(p1.reshape(GRID, GRID), cmap="tab10", vmin=0, vmax=9); axes[0].set_title("Year 1 (predicted class)")
    axes[1].imshow(p2.reshape(GRID, GRID), cmap="tab10", vmin=0, vmax=9); axes[1].set_title("Year 2 (predicted class)")
    change_img = np.zeros(GRID * GRID); change_img[changed] = 1; change_img[unsure] = 2
    axes[2].imshow(change_img.reshape(GRID, GRID), cmap=matplotlib.colors.ListedColormap(["#eeeeee", "#d62728", "#ffbf00"]), vmin=0, vmax=2)
    axes[2].set_title("Change (red) and unsure (amber)")
    for ax in axes:
        ax.set_xticks([]); ax.set_yticks([])
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    print(f"Wrote {OUT}/results.json and figure.png")


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
