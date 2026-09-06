# Method — Retention uplift

Randomised 50/50 offer. T-learner: two GBMs, uplift = P(churn|control) − P(churn|treat). Class transformation (Jaskowski): Z = 1 if treated&retained or control&churned.

Qini + AUUC vs random. Stop at the smallest share that captures 95% of incremental retains. Sleeping dogs (long tenure + dependents) have negative tau — mailing them is a cost.
