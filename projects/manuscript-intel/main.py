"""Manuscript Intel: claims, methods and dataset names from research abstracts.

Sentence-level claim classifier (TF-IDF + logistic regression), a rule/ontology
layer for dataset mentions, and a SQLite ledger that answers reading-list
questions. Abstracts are template-generated; runs offline.
"""
import json
import os
import re
import sqlite3
import time

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score
from sklearn.model_selection import train_test_split

SEED = 3
PAPERS = 420
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")

DATASETS = {  # canonical name -> surface forms the ontology layer knows
    "CIFAR-10": ["CIFAR-10", "CIFAR10", "the CIFAR-10 benchmark"],
    "ImageNet": ["ImageNet", "ImageNet-1k", "the ImageNet dataset"],
    "MNIST": ["MNIST", "the MNIST digits"],
    "SQuAD": ["SQuAD", "SQuAD v1.1", "SQuAD 2.0"],
    "GLUE": ["GLUE", "the GLUE benchmark"],
    "MIMIC-IV": ["MIMIC-IV", "MIMIC IV", "the MIMIC-IV database"],
    "UCI Adult": ["UCI Adult", "the Adult dataset", "Adult (UCI)"],
    "M5": ["M5", "the M5 forecasting competition data"],
    "EuroSAT": ["EuroSAT", "the EuroSAT tiles"],
}
UNSEEN = ["OpenWebText", "Pile-CC", "a proprietary hospital dataset"]  # recall misses
METHODS = ["gradient boosting", "a transformer encoder", "a graph neural network",
           "logistic regression", "a variational autoencoder", "contrastive pretraining"]
CLAIM_T = ["We show that {m} improves {metric} by {d} points on {ds}.",
           "Our method achieves an F1 of 0.{n} on {ds}, outperforming the prior best.",
           "Results indicate a {d}% relative gain with a 95% confidence interval of [{lo}, {hi}].",
           "{m} reaches {metric} {n}.{d} on {ds} with a 95% CI reported across five seeds.",
           "We find that {m} matches the baseline while using {d}x less compute.",
           "On {ds}, {metric} improves over {m} baselines in most settings.",
           "The gain in {metric} on {ds} is consistent across seeds."]
BACKG_T = ["Prior work has studied {m} in a range of settings.",
           "{ds} is widely used for evaluating {m}.",
           "Previous studies report {metric} between 0.{n} and 0.{n} on {ds} with wide confidence intervals.",
           "The task remains challenging due to label noise and distribution shift.",
           "We describe the training setup, hyperparameters and hardware for {m}.",
           "{m} baselines on {ds} are taken from the original papers.",
           "Code and data splits are described in the appendix."]
LABEL_NOISE = 0.06  # annotator disagreement on borderline sentences


def make_papers(rng):
    papers, sentences = [], []
    names = list(DATASETS)
    for pid in range(PAPERS):
        ds_true = list(rng.choice(names, rng.integers(1, 3), replace=False))
        mentions = [rng.choice(DATASETS[d]) for d in ds_true]
        if rng.random() < 0.4:
            ds_true.append(str(rng.choice(UNSEEN))); mentions.append(ds_true[-1])
        method = rng.choice(METHODS)
        text, used = [], set()
        for _ in range(rng.integers(5, 9)):
            is_claim = rng.random() < 0.4
            tpl = rng.choice(CLAIM_T if is_claim else BACKG_T)
            j = rng.integers(len(mentions)); used.add(ds_true[j])
            s = tpl.format(m=method, ds=mentions[j], metric=rng.choice(["accuracy", "AUC", "mIoU"]),
                           d=rng.integers(2, 12), n=rng.integers(60, 95), lo=0.02, hi=0.09)
            text.append(s)
            label = int(is_claim) if rng.random() > LABEL_NOISE else 1 - int(is_claim)
            sentences.append((pid, s, label))
        papers.append({"id": pid, "method": method, "datasets": [str(d) for d in used],
                       "abstract": " ".join(text), "code_released": bool(rng.random() < 0.55)})
    return papers, sentences


def extract_datasets(text):
    found = set()
    for canon, forms in DATASETS.items():
        for f in forms:
            if re.search(r"\b" + re.escape(f) + r"\b", text):
                found.add(canon)
    return found


def main():
    rng = np.random.default_rng(SEED)
    os.makedirs(OUT, exist_ok=True)
    papers, sentences = make_papers(rng)
    texts = [s for _, s, _ in sentences]
    y = np.array([c for _, _, c in sentences])
    Xtr, Xte, ytr, yte = train_test_split(texts, y, test_size=0.3, random_state=SEED, stratify=y)
    vec = TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True)
    clf = LogisticRegression(C=2.0, max_iter=500).fit(vec.fit_transform(Xtr), ytr)
    claim_f1 = float(f1_score(yte, clf.predict(vec.transform(Xte))))

    hits, total = 0, 0
    for p in papers:
        p["found"] = extract_datasets(p["abstract"])
        hits += len(set(p["datasets"]) & p["found"]); total += len(p["datasets"])
    recall = hits / total

    con = sqlite3.connect(":memory:")
    con.executescript("""CREATE TABLE papers(id INT PRIMARY KEY, method TEXT, code INT);
        CREATE TABLE claims(paper_id INT, sentence TEXT, has_ci INT);
        CREATE TABLE datasets(paper_id INT, name TEXT);
        CREATE INDEX ix_claims ON claims(paper_id); CREATE INDEX ix_ds ON datasets(name);""")
    con.executemany("INSERT INTO papers VALUES (?,?,?)", [(p["id"], p["method"], int(p["code_released"])) for p in papers])
    con.executemany("INSERT INTO datasets VALUES (?,?)", [(p["id"], d) for p in papers for d in p["found"]])
    X_all = vec.transform(texts)
    pred = clf.predict(X_all)
    con.executemany("INSERT INTO claims VALUES (?,?,?)",
                    [(pid, s, int("confidence interval" in s or " CI " in s)) for (pid, s, _), c in zip(sentences, pred) if c])
    q = """SELECT p.method, COUNT(DISTINCT p.id) FROM papers p JOIN claims c ON c.paper_id = p.id
           JOIN datasets d ON d.paper_id = p.id WHERE c.has_ci = 1 AND p.code = 1 GROUP BY p.method"""
    t0 = time.perf_counter()
    for _ in range(50):
        rows = con.execute(q).fetchall()
    latency_ms = (time.perf_counter() - t0) / 50 * 1000

    counts = con.execute("SELECT name, COUNT(*) FROM datasets GROUP BY name ORDER BY 2 DESC").fetchall()
    results = {"Claim F1": round(claim_f1, 2), "Papers": PAPERS, "Dataset recall": round(recall, 2),
               "Query latency": f"{latency_ms:.1f}ms", "papers_with_ci_and_code_by_method": dict(rows),
               "dataset_counts": dict(counts)}
    print("Manuscript Intel")
    for k in ["Claim F1", "Papers", "Dataset recall", "Query latency"]:
        print(f"  {k:<16} {results[k]}")
    print("  CI + code by method:", dict(rows))
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(results, f)

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.barh([c[0] for c in counts][::-1], [c[1] for c in counts][::-1], color="tab:purple")
    ax.set_title("Dataset mentions resolved by the ontology layer")
    ax.set_xlabel("papers")
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    print(f"Wrote {OUT}/results.json and figure.png")


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
