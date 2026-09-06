# Data dictionary — Ward Twin

Stand-in shaped like hourly occupancy derived from MIMIC-IV style ADT. Not an extract. Seed `7`.

## Occupancy series (`outputs/occupancy.csv` after a run)

| Field | Type | Grain | Notes |
|---|---|---|---|
| ward | int 0–5 | ward | Mapped to names A–F on the board |
| ward_name | str | ward | A medical, B surgical, C short-stay, D paeds, E rehab, F overflow |
| t | int | hour | 0 … (104×24)−1. First 90 days train, last 14 holdout |
| hod | int 0–23 | hour | Site local. Midnight census is hod == 0 |
| dow | int 0–6 | hour | Weekend = dow ≥ 5 (Sat/Sun dip) |
| beds | int | hour × ward | Occupied count. Never a named patient |
| pred | float | holdout only | NB GLM mean |
| lo, hi | float | holdout only | 80% negative-binomial interval |

## Synthetic cohort (privacy table)

| Field | Values | Rule |
|---|---|---|
| ward | 0–5 | Quasi-identifier |
| age_band | 18-39, 40-59, 60-74, 75+ | Quasi-identifier |
| sex | F, M | Quasi-identifier |
| los_days | gamma(2.0, 2.2) | Outcome-ish, kept if the cell survives |
| k | cell count | Cell (ward × age × sex) published only if k ≥ 10 |

## What is deliberately missing

No MRN, no admit time, no diagnosis, no ICU step-down, no theatre list, no ambulance offload. The twin is a census machine. If you need those, you are building a different product.

## Trust boundary

The only number that may come back from the live site is the midnight headcount. Everything else is generated or fitted on the stand-in.
