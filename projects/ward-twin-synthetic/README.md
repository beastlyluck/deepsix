# Ward Twin — privacy-preserving hospital occupancy

A 280-bed site needs tomorrow’s 08:00 occupancy ± a band. Privacy will not clear the ADT log. This case is the twin: six wards, a negative-binomial interval, a k-anonymity table, and a gate that opens when midnight census misses twice.

This is not a toy forecast. The product is the band, the k floor, and the gate — not the MAE.

## Problem

Bed managers ask a number. Privacy officers ask whether anyone can be re-identified. Those two rooms do not share a spreadsheet. A useful system publishes an hourly count and an 80% interval, then admits when the live ward has walked away from the twin.

Reference shape: MIMIC-IV derived hourly occupancy ([physionet.org/content/mimiciv](https://physionet.org/content/mimiciv/)). The script never downloads it. Seeded synthetic stand-in, same grain.

## What you get

| Artefact | Where |
|---|---|
| Interactive desk | `site/index.html` (open in a browser, no server) |
| Method / data / ops notes | `docs/METHOD.md`, `docs/DATA.md`, `docs/OPERATIONS.md` |
| IRLS walkthrough | `notebooks/ward_census.ipynb` |
| Holdout series + k=10 cohort | `outputs/holdout.csv`, `outputs/cohort_k10.csv` |
| KPI + dashboard payload | `outputs/results.json`, `outputs/dashboard.json` |

## Method (short)

1. Generate 104 days × 6 wards of NB occupancy (daily rhythm, weekend dip, slow trend).
2. Fit a Poisson IRLS log-mean on Fourier hour, weekend, trend, ward dummies. Estimate NB2 α by method of moments.
3. Score a 14-day holdout with 80% NB quantiles. Report MAE, coverage, and a PIT histogram.
4. Sample a 900-row cohort; drop any (ward × age × sex) cell with n < 10.
5. Midnight gate: two consecutive census values outside the band opens the ward.

Full write-up: `docs/METHOD.md`.

## How to run

```
pip install -r ../requirements.txt
python main.py
```

Then open `site/index.html`. The board reads `site/data.js` written from the last run.

## Results (script, seed 7)

Printed on each run. Typical shape on this stand-in: MAE around 4 beds, coverage near 80%, k ≥ 10, one or two gates if a ward drifts.

| Check | Why it matters |
|---|---|
| Coverage 80% | If this is 60%, the band is theatre, not a product |
| PIT histogram | Pile-up at 0/1 means the interval is too tight |
| k ≥ 10 | The table may leave the hospital; the ADT may not |
| Gate | Two midnight misses — ask whether the ward changed |

## Interview points

- Why NB, not Poisson: bed counts are over-dispersed; the interval width is what NUM reads.
- Why k-anonymity is on the cohort, not the forecast: the forecast is already an aggregate.
- Why you do not “fix” the band when the gate opens: the gate is the signal that the process changed.

## Files

```
main.py                 orchestration (this folder)
src/simulate.py         occupancy + cohort
src/glm.py              IRLS, α, intervals, PIT
src/gate.py             midnight gate + ward scorecard
docs/                   data, method, operations
notebooks/              IRLS walkthrough
site/index.html         desk
```

Not for clinical use. Stand-in data only.
