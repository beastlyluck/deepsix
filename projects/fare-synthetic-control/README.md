# Fare Change Synthetic Control

Did a fare reform move ridership, or was it the weather and a long weekend? A synthetic control with a placebo test.

## Problem

One route changed its fare. Ridership fell. A before/after slide says the fare did it. It cannot rule out weather, season or a system-wide slide. A synthetic control builds a weighted mix of untreated routes that tracked the treated route before the change, then reads the effect as the gap afterward.

## Data

Reference: open route-day mobility counts ([ptv.vic.gov.au](https://www.ptv.vic.gov.au/)) and Bureau of Meteorology weather.

The script uses a calibrated synthetic stand-in so it runs offline: 19 routes over 240 days of log boardings driven by two latent factors with route-specific loadings, a weekend dip, daily rainfall and noise. The treated route drops 6.4% after day 180.

## Method

- Weather adjustment: pre-period OLS of each route's log boardings on rainfall; the rain component is removed from the whole series.
- Synthetic control (Abadie): donor weights minimise pre-period squared error subject to w >= 0 and sum(w) = 1, solved with SLSQP. The fit quality is the pre-period RMSPE.
- ATT: mean post-period gap between the treated route and its synthetic counterpart, reported as a percentage.
- Placebo in space: each donor is treated as if it had received the reform, with the remaining routes as its donor pool. The p-value is the share of units whose post/pre RMSPE ratio is at least as large as the treated route's.

## How to run

```
pip install -r ../requirements.txt
python main.py
```

## Results

| Metric | Portfolio | Script (synthetic) |
|---|---|---|
| ATT (boardings) | -6.4% | printed |
| Placebo p | 0.08 | printed |
| Donors | 18 | 18 |
| Pre-fit | RMSPE 0.041 | printed |

## What to feature in an interview

- Why the weights live on the simplex. No extrapolation, no negative routes, and the donor weights are readable by a transport planner.
- The placebo test is the credibility check. If half the donors show a gap as large as the treated route, the story is weather, not fare.
- What pre-period RMSPE means for the claim. A poor pre-fit means the post-gap is noise wearing a suit.

## Files

- `main.py` - route generator, weather adjustment, SC weights, placebo loop, plot.
- `outputs/results.json`, `outputs/figure.png` - written on each run (gitignored).

The dashed line is the city that did not exist, until the weights said it did.
