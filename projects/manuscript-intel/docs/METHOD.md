# Method — Manuscript intel

TF-IDF (1–2 grams) + logistic claim classifier on sentence labels. Ontology layer maps surface forms to canonical dataset names. Unseen names (OpenWebText, proprietary hospital set) are recall misses on purpose.

SQLite ledger: papers, claims, datasets. The query that matters: methods that report a CI and released code. Latency is wall time of that join, not a toy COUNT(*).

Label noise 6% stands in for annotator disagreement. Do not tune C until F1 looks pretty — the ledger is the product.
