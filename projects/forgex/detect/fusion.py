"""Late fusion. Each modality scores alone; a small logit combines them.

IsolationForest on the stacked vector is the unsupervised trip. A logistic
fit on a labelled hold-out is the number we publish, because a plant will
not accept a score without a false-stop rate. Ablations drop one block at
a time so the review can see that acoustics catch the bearing and vision
catches the leak — they are not interchangeable.
"""
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.preprocessing import StandardScaler


def split_blocks(X, n_ac, n_cu):
    return X[:, :n_ac], X[:, n_ac:n_ac + n_cu], X[:, n_ac + n_cu:]


def fit(X, y, n_ac, n_cu, seed=0):
    sc = StandardScaler().fit(X)
    Z = sc.transform(X)
    iso = IsolationForest(n_estimators=200, contamination=0.12, random_state=seed).fit(Z)
    iso_s = -iso.score_samples(Z)
    clf = LogisticRegression(max_iter=400, C=1.4).fit(Z, y)
    blocks = {}
    names = ("acoustic", "current", "vision", "all")
    parts = list(split_blocks(X, n_ac, n_cu)) + [X]
    for name, xb in zip(names, parts):
        s = StandardScaler().fit(xb)
        zb = s.transform(xb)
        m = LogisticRegression(max_iter=400, C=1.4).fit(zb, y)
        p = m.predict_proba(zb)[:, 1]
        blocks[name] = {
            "auc": round(float(roc_auc_score(y, p)), 3),
            "ap": round(float(average_precision_score(y, p)), 3),
        }
    return {"scaler": sc, "iso": iso, "clf": clf, "iso_scores": iso_s,
            "proba": clf.predict_proba(Z)[:, 1], "ablation": blocks}


def score_one(art, x):
    z = art["scaler"].transform(x.reshape(1, -1))
    p = float(art["clf"].predict_proba(z)[0, 1])
    iso = float(-art["iso"].score_samples(z)[0])
    return p, iso
