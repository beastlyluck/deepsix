# Campus Load Forecast

24-hour electricity demand for a university campus, driven by weather and timetable, with a monitor that stops the model when summer arrives early.

## Problem

Facilities needs tomorrow's hourly load to schedule chillers and buy on the spot market. The model is trained on cool months. The failure mode is not a bad fit; it is a good winter model quietly running into a heatwave. The forecast needs an accuracy number, an upper quantile, and a gate that says stop.

## Data

Reference: ASHRAE Great Energy Predictor analog ([kaggle.com/c/ashrae-energy-prediction](https://www.kaggle.com/c/ashrae-energy-prediction)) with Bureau of Meteorology weather.

The script uses a calibrated synthetic stand-in so it runs offline: 12 buildings over 120 days of hourly kWh, with base load, timetable occupancy, cooling degree response, heating response and noise. The last 14 days carry a +7 C early-summer shift so the drift gate has something to catch.

## Method

- Baseline: gradient boosting (LightGBM if installed, otherwise scikit-learn's histogram GBM) on hour, weekday, temperature, cooling degrees, occupancy and 24h/168h lags.
- Residual corrector: a ridge AR model on the last 72 hours of residuals. In the full build this is a small LSTM; here it is ridge so the script has no deep-learning dependency.
- Rolling-origin evaluation: forecast each of the last 14 days 24 hours ahead from midnight, retraining weekly. Report 24h MAPE on the campus total.
- Upper quantile: a second GBM fitted with quantile loss at 0.9, scored by pinball loss normalised by mean load.
- Drift gate: PSI of temperature, cooling degrees and occupancy in the evaluation window versus training. PSI above 0.2 trips the gate.
- Champion/challenger: a challenger trained on the most recent 28 days is scored on the same window; the swap happens only if its MAE is lower.

## How to run

```
pip install -r ../requirements.txt
python main.py
```

## Results

| Metric | Portfolio | Script (synthetic) |
|---|---|---|
| 24h MAPE | 6.8% | printed |
| Pinball 0.9 | 0.041 | printed (normalised) |
| Buildings | 12 | 12 |
| Retrain | weekly | weekly |

The script also prints PSI per feature, the gate decision and the champion vs challenger MAE.

## What to feature in an interview

- Rolling-origin evaluation with weekly retraining is the honest number. A random split leaks tomorrow's weather into today's training set.
- Why PSI on inputs, not just MAE on outputs: labels arrive after the damage. Input drift is visible at midnight.
- The champion/challenger rule is a policy, not a model. Say who approves the swap and what the fallback is.

## Files

- `main.py` - campus generator, GBM baseline, quantile model, rolling origin, PSI gate, plot.
- `outputs/results.json`, `outputs/figure.png` - written on each run (gitignored).

A forecast that knows when it is no longer Super Saiyan.
