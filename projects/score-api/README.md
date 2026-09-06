# Score API with a lineage card

A credit-style score behind FastAPI. Every response carries the model version, the features used and a reason code.

## Problem

A lender wants a probability of default that an operations team can act on and a regulator can question. A score alone is not enough. Each response must say which model produced it, why the score is high, and whether a challenger model is quietly disagreeing. And the whole thing must be rolled back before lunch if it misbehaves.

## Data

Reference: Give Me Some Credit ([kaggle.com/c/GiveMeSomeCredit](https://www.kaggle.com/c/GiveMeSomeCredit)).

The script uses a calibrated synthetic stand-in so it runs offline: 20,000 applicants with 12 features (utilisation, age, delinquency counts, debt ratio, income, open lines, real estate loans, dependents, employment years, inquiries) and a default rate near 7%, generated from a known logit.

## Method

- Champion: logistic regression on standardised features. For a linear model the per-feature contribution (standardised value x coefficient) is the exact additive explanation, so the top-3 positive contributions are the reason codes. In the full build XGBoost with SHAP top-3 plays this role; the payload is the same.
- Canary: a histogram gradient boosting model trained on the same split. The canary delta is the absolute holdout AUC gap between canary and champion.
- Lineage: `model_sha` is a SHA-1 of the rounded coefficients and intercept, so a payload can be traced to an exact artefact.
- Latency: 1,000 single-row scores through the pure-numpy path; p95 in milliseconds.
- Artefact: `outputs/model.json` (features, coefficients, scaler, sha) is written for `app.py`.
- API: `app.py` exposes `POST /score` returning `{score, reasons, model_sha}` and `GET /health`. FastAPI is import-guarded; `main.py` never imports it.

## How to run

```
pip install -r ../requirements.txt
python main.py

# optional API
pip install fastapi uvicorn
uvicorn app:app --reload
curl -X POST http://127.0.0.1:8000/score -H "Content-Type: application/json" \
  -d '{"revolving_utilization":0.9,"age":29,"times_30_59_late":2,"debt_ratio":0.8,"monthly_income":3200,"open_credit_lines":6,"times_90_late":1,"real_estate_loans":0,"times_60_89_late":0,"dependents":2,"employment_years":1.5,"inquiries_6m":4}'
```

## Results

| Metric | Portfolio | Script (synthetic) |
|---|---|---|
| AUC | 0.86 | printed |
| p95 latency | 11ms | printed (numpy path, sub-millisecond) |
| Canary delta | <0.01 AUC | printed |
| Features | 12 | 12 |

## What to feature in an interview

- Reason codes that are exact for the model that produced them. For logistic regression the contributions are the explanation; for trees you need SHAP and should say so.
- The model hash in every payload. Rollback is a config change, and every historical decision is traceable to the artefact that made it.
- The canary as a disagreement monitor. A large AUC gap between champion and challenger is a signal about the data before it is a signal about the model.

## Files

- `main.py` - data generator, champion and canary, reason codes, latency, artefact, plot.
- `app.py` - FastAPI service reading `outputs/model.json`.
- `outputs/results.json`, `outputs/model.json`, `outputs/figure.png` - written on each run (gitignored).

Leadership is being able to roll back before lunch.
