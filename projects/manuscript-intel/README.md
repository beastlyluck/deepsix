# Manuscript Intel

A reading desk for research abstracts: claims, methods and dataset names extracted into a ledger you can query by method, dataset or whether code was released.

## Problem

A Master of Data Science reading list runs to hundreds of papers a semester. The questions a study group asks are structural: which papers report a confidence interval, which ones use dataset X, which released code. Rereading to answer those is wasted time. The desk should read once and let the ledger answer.

## Data

Reference: ArXiv cs.LG / stat.ML abstracts and an open PDF subset ([arxiv.org](https://arxiv.org/)).

The script uses a calibrated synthetic stand-in so it runs offline: 420 template-generated abstracts with known claim sentences, known method, known dataset mentions using several surface forms (CIFAR10 vs CIFAR-10, SQuAD 2.0), about 40% of papers naming a dataset the ontology does not know, and 6% label noise on claim sentences, so neither F1 nor recall is trivially 1.0.

## Method

- Claim classifier: sentence-level TF-IDF (1-2 grams) and logistic regression, stratified 70/30 split, F1 on the held-out sentences.
- Dataset extraction: an ontology of canonical names and their surface forms, matched with word-boundary regex. Recall is measured against the generator's ground truth.
- Ledger: SQLite tables for papers, claims (with a has_ci flag) and datasets, with indexes. The benchmark query is "papers that report a confidence interval and released code, grouped by method", timed over 50 runs.

## How to run

```
pip install -r ../requirements.txt
python main.py
```

## Results

| Metric | Portfolio | Script (synthetic) |
|---|---|---|
| Claim F1 | 0.81 | printed |
| Papers | 420 | 420 |
| Dataset recall | 0.74 | printed |
| Query latency | 120ms | printed (in-memory SQLite is faster) |

## What to feature in an interview

- The split between the statistical layer (claim classifier) and the rules layer (dataset ontology). Rules are auditable; the classifier handles phrasing.
- Recall is capped by the ontology. Unknown datasets are the miss, and the fix is a vocabulary update, not a retrain.
- The ledger is the product. A briefing question becomes one SQL statement with a measured latency.

## Files

- `main.py` - abstract generator, classifier, extractor, SQLite ledger, timing, plot.
- `outputs/results.json`, `outputs/figure.png` - written on each run (gitignored).

The Illusionist reads so the team does not reread.
