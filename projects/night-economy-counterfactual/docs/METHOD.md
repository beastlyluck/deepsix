# Method — Night economy DiD

## Match

Control precinct is the one whose pre-period weekday log-profile (level-stripped) is closest to treated. If that distance is ugly, stop. Do not shop donors after seeing the post gap.

## Estimator

Two-way fixed effects: `log(spend) ~ sensor + day + treated×post`. Sensor-clustered block bootstrap, 200 draws, 90% interval.

## Event study

Weekly leads/lags around the cut, week −1 omitted. Pre-period coefficients should sit near zero (`|lead| < 0.04`). If they do not, the headline DiD is not a brief.

## Simulator

Elasticity per tram/hour is `coef / −3` (cut from 6 to 3). The slider is that elasticity, not a new regression.

## Residuals

Post-period mean residual by sensor. Red if |r| > 1.5 σ. Do not average those sensors into the headline.

## What this is not

Not a crime paper. Incidents on the old slider were a toy. Spend is the outcome. Parallel trends first.
