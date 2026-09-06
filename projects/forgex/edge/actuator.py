"""Feature extract + logistic score in numpy. Timed on a single cycle.

The IsolationForest stays on the desk. The cell only needs the logit and
the residual. Weights are written as JSON so a PLC wrapper can load them
without importing sklearn.
"""
import json
import time

import numpy as np


def dump(path, clf, scaler):
    art = {
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist(),
        "coef": clf.coef_[0].tolist(),
        "intercept": float(clf.intercept_[0]),
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(art, f, indent=2)
    return art


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def score(art, x):
    z = (np.asarray(x, dtype=float) - art["mean"]) / art["scale"]
    logit = float(np.dot(z, art["coef"]) + art["intercept"])
    return 1.0 / (1.0 + np.exp(-logit))


def bench(art, x, n=4000):
    # warmup
    for _ in range(20):
        score(art, x)
    t0 = time.perf_counter()
    for _ in range(n):
        score(art, x)
    return (time.perf_counter() - t0) / n * 1e6
