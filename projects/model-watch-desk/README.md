# Model Watch Desk

A one-page watch for data drift, performance and "who approved this champion". Built so a manager without an ML background can still say stop.

## Problem

Three models run in production. Nobody looks at them until a number on a dashboard is wrong. The desk should tell you the day inputs move, the day performance drops once labels arrive, and who signed off on the model that is currently live. It should page rarely enough that people keep reading it.

## Data

Reference: synthetic production logs shaped like the UCI Adult census table ([archive.ics.uci.edu/dataset/2/adult](https://archive.ics.uci.edu/dataset/2/adult)).

The script uses a calibrated synthetic stand-in so it runs offline: a reference window of 8,000 rows per model and 14 daily windows of 1,500 rows. One model gets an input shift (age and hours) from day 8. One model gets a label-only degradation from day 10 so the desk has to catch a drop that PSI cannot see. One model is clean.

## Method

- PSI per feature against the reference window using ten quantile bins. Traffic light: green below 0.1, amber 0.1 to 0.2, red above 0.2.
- Rolling AUC per window with a one-day label delay. A drop of more than 0.05 below reference AUC also turns the window red.
- Champion ledger: each model's coefficients are hashed to a short SHA and recorded with an approver and a date.
- Detection delay is the gap between the injected drift day and the first red window. False pages are red windows with no injected cause.
- A text digest, one line per model, is printed as the Slack-style summary.

## How to run

```
pip install -r ../requirements.txt
python main.py
```

## Results

| Metric | Portfolio | Script (synthetic) |
|---|---|---|
| Detect delay | 1 day | printed |
| Windows | 14 | 14 |
| False pages | 2/qtr | printed (per 14 days) |
| Models | 3 | 3 |

## What to feature in an interview

- Two independent signals. PSI catches input drift the same day; AUC catches silent degradation once labels land. Neither is enough alone.
- The champion ledger is governance, not tooling. A hash, an approver and a date answer "who let this run".
- Alert budget. Thresholds were chosen for false pages per quarter, because a pager that fires weekly gets muted.

## Files

- `main.py` - log generator, PSI, rolling AUC, traffic-light rules, ledger, digest, plot.
- `outputs/results.json`, `outputs/figure.png` - written on each run (gitignored).
