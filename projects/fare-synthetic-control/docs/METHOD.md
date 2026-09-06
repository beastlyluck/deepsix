# Method — Fare synthetic control

Weather residualise first (pre-period OLS on rain, then de-mean). Simplex weights via SLSQP. Pre RMSPE is the fit gate. Placebo-in-space: treat each donor, p = share of post/pre RMSPE ratios ≥ treated.

If a placebo city looks just as big, there is no brief. Do not shop donors after seeing the post gap.
