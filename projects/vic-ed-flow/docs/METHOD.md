# Method — VIC ED flow

## Arrivals

Poisson intensity by campus, two-hour bin, weekend. Fit with `PoissonRegressor` (L2 1e-4). MAE is people per 15-minute slot. The GLM does not predict occupancy.

## Occupancy queue

Each arrival draws a lognormal length of stay (hours, μ=1.35, σ=0.38). If a bay is free, the patient occupies it until that LOS elapses. If not, they join the ramp queue and take the next free bay.

Wait minutes are a readout: `18 + 7·occ/bays + 11·ramp/8 + noise`. The 90-minute flag is an early four-hour risk, not the statutory clock.

## Flu week

Austin’s intensity is multiplied by 1.45 after day 7. Other campuses stay on the winter curve. Attribution table: week-2 vs week-1 arrivals, wait, ramp, breaches — Austin versus the other three.

## Residual

Last midnight occupancy minus first-week winter median. This is not a forecast. It answers “did this campus change?” so nobody treats the twin as a census.

## What the board is allowed to say

- Which campus is ramping tonight
- Whether Austin’s residual is the flu week or a model miss
- Whether 4-hour risk slots cluster in the evening peak

It is not allowed to name a patient or replace the live AHV feed.
