# Method — Ward Twin

## Mean model

Log occupancy is linear in:

- intercept
- Fourier hour-of-day (1st and 2nd harmonic)
- weekend flag
- linear trend (hour index / 1000)
- ward dummies (ward 0 is the reference)

Fit is Poisson IRLS (30 iterations, ridge 1e-8 on the Gram matrix). That is the GLM mean, not the interval.

## Dispersion

NB2: `Var(Y) = μ + α μ²`. α is method-of-moments from Poisson residuals:

`α = max( Σ((y−μ)² − μ) / Σ(μ²), 1e-6 )`

If α collapses to the floor, the data were Poisson and the band is too tight. Report it.

## Intervals

`n = 1/α`, `p = n / (n+μ)`. Lower/upper = NB quantiles at 10% and 90% for an 80% band. Coverage on the 14-day holdout is the honesty check.

## Calibration (PIT)

Probability integral transform of holdout counts under the fitted NB. A histogram that piles at 0 or 1 means the band is too narrow. The board plots ten bins.

## Privacy

A 900-row synthetic cohort is grouped on (ward, age_band, sex). Cells with n < 10 are dropped, not imputed. k-anonymity is the minimum remaining cell size. The forecast never needs the dropped rows.

## Census gate

For each ward, take hod == 0 on the holdout. A night is a miss if census sits outside [lo, hi]. Two consecutive misses open the gate. Do not “fix” the band when the gate opens — ask whether the ward changed (outbreak, theatre cancel, overflow policy).

## What this is not

Not a patient-level length-of-stay model. Not a staffing optimiser. Not a clinical decision tool. MAE is a scoreboard; the gate and the k floor are the product.
