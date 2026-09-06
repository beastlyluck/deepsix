# Method — Score API

Champion: logistic on standardised Give-Me-Some-Credit-shaped features. Reason codes = top-3 positive contributions (z × coef). model_sha is SHA-1 of rounded coefs + intercept.

Canary: HistGBM, holdout AUC delta. Latency: 1000 numpy scores, p95. app.py reads outputs/model.json. Rollback is a config change.
