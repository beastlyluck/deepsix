# SKU Hierarchy Reconciliation

Store x SKU forecasts that still add up to the chain total. MinT reconciliation so finance and operations share one number.

## Problem

Independent forecasts at each level of a retail hierarchy never sum. The SKU planners have one total, finance has another, and the meeting is about whose number is real. Reconciliation takes all the base forecasts and returns a single coherent set that is, on average, more accurate than any of them alone.

## Data

Reference: M5 Forecasting (Walmart) hierarchy sample ([kaggle.com/c/m5-forecasting-accuracy](https://www.kaggle.com/c/m5-forecasting-accuracy)).

The script uses a calibrated synthetic stand-in so it runs offline: 60 bottom SKU series over 365 days with weekly seasonality, drift, annual cycle and intermittent zeros, aggregated through a five-level hierarchy (total, 2 states, 4 stores, 12 departments, 60 SKUs = 79 nodes). Prices are random so revenue weights differ by node.

## Method

- Base forecasts: one global gradient boosting model (LightGBM if installed, else scikit-learn histogram GBM) trained across all 79 series in direct multi-step form. Features are target weekday, horizon, 28-day and 7-day means at the origin, a same-weekday lag and a series id. Horizon is 28 days.
- MinT-shrink reconciliation: in-sample residuals from four training origins give the error covariance W. W is shrunk toward its diagonal, then the reconciled forecasts are S (S' W^-1 S)^-1 S' W^-1 y_hat, where S is the summing matrix.
- Coherence check: reconciled bottom series summed through S must equal the reconciled aggregates. The max absolute gap is reported.
- Scoring: WRMSSE in the M5 style, with revenue weights inside each level and equal weight across levels. Base and reconciled forecasts are scored on the same 28-day holdout.

## How to run

```
pip install -r ../requirements.txt
python main.py
```

## Results

| Metric | Portfolio | Script (synthetic) |
|---|---|---|
| WRMSSE | 0.62 | printed (MinT and base) |
| Levels | 5 | 5 |
| Coherence error | 0 | printed (~1e-12) |
| SKU coverage | 12k | 60 |

## What to feature in an interview

- Why reconciliation is not just top-down or bottom-up. MinT uses every level and weights them by how noisy each has been.
- The shrinkage step. With 79 series and about 112 residual rows, the raw covariance is unstable; shrinking toward the diagonal is what makes the inverse behave.
- The result that matters to the business is the coherence error, not the leaderboard score. Two teams stop arguing when the sum is exact.

## Files

- `main.py` - hierarchy builder, demand generator, global GBM, MinT, WRMSSE, plot.
- `outputs/results.json`, `outputs/figure.png` - written on each run (gitignored).
