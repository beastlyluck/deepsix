# Executive KPI twin

Five numbers a director will actually open: growth, quality, risk, cost, and a "do not surprise me" residual.

## Problem

Executive dashboards fail by volume. Fifty charts, no owners, and no way to tell a seasonal dip from a problem. The twin is a single page with five KPIs, each with a definition, a version, an owner and a band. When an actual leaves its band the page turns red before the meeting, and the fifth number says how surprising the week was overall.

## Data

Reference: synthetic SaaS and campus operations at weekly grain (this project's own generator, [github.com/beastlyluck/exec-kpi-twin](https://github.com/beastlyluck/exec-kpi-twin)).

The script generates a 104-week fact table so it runs offline: active users with growth and annual seasonality, sessions, incidents, open and overdue invoices and cloud spend. Two real events are planted in the watch window: a three-week user drop around week 90 and a quality slip from week 95.

## Method

- Metrics layer: each KPI is a card with a definition, a version number, an owner, a unit and an expression over the fact table. Four KPIs are computed from facts; the fifth is derived from the other four.
- Baseline per KPI: least squares on intercept, linear trend and annual sine/cosine terms, fitted on the first 78 weeks. The band is the fit +/- 2 residual standard deviations.
- Alerts: weeks in the 26-week watch window where the actual leaves the band.
- Surprise residual: mean absolute z-score across the four KPIs each week; above 2 the page is red even if no single KPI tripped.
- Comparison: the same alert rule with a naive mean +/- 2 SD band, to show how much noise seasonality alone would have produced.

## How to run

```
pip install -r ../requirements.txt
python main.py
```

## Results

| Metric | Portfolio | Script (synthetic) |
|---|---|---|
| KPIs | 5 | 5 |
| Defs versioned | yes | yes |
| Refresh | hourly | hourly (design; script runs once) |
| Surprise rate | down | printed (model band vs naive band) |

## What to feature in an interview

- Why five and not fifty. Each number has an owner who can be asked about it, and a definition version so last quarter's number can be reproduced.
- The band is the product. A KPI without an expected range cannot surprise anyone, and a KPI that surprises every week is noise.
- The fifth KPI. A page-level residual catches the week where everything is slightly off and nothing is individually red.

## Files

- `main.py` - fact generator, metrics layer, seasonal bands, alerts, one-page render, plot.
- `outputs/results.json`, `outputs/figure.png` - written on each run (gitignored).

Not fifty charts. Five honest ones.
