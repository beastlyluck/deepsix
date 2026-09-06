# Retention Uplift, not spray

Who should receive a win-back offer? An uplift model that saves budget by refusing customers who would have stayed anyway, and leaving alone the ones an offer would annoy.

## Problem

A churn model ranks who is likely to leave. That is the wrong question for a retention campaign. The campaign needs to know whose behaviour the offer changes. Messaging everyone spends the budget on customers who were staying regardless and on a few who leave because they were reminded they could.

## Data

Reference: IBM Telco customer churn ([kaggle.com/datasets/blastchar/telco-customer-churn](https://www.kaggle.com/datasets/blastchar/telco-customer-churn)) with a simulated randomised offer.

The script uses a calibrated synthetic stand-in so it runs offline: 7,043 customers with tenure, monthly charges, contract type, fibre, tech support, paperless billing, seniority and dependents. The offer is assigned 50/50 at random. The treatment effect is heterogeneous by construction: month-to-month customers with high charges and short tenure are persuadable; long-tenure customers with dependents react badly.

## Method

- T-learner: two gradient boosting classifiers, one on the offered group and one on the control group. Uplift is the predicted churn reduction, P(churn | no offer) minus P(churn | offer).
- Class transformation (Jaskowski and Jaroszewicz): a single classifier on Z = 1 for treated-and-retained or control-and-churned. With a 50/50 split, uplift = 2 P(Z=1) - 1.
- Qini curve on a 40% holdout: customers are ranked by predicted uplift, and at each share k the incremental retained count is treated responders minus control responders scaled to treated size, normalised by total treated.
- AUUC is the area between the model's Qini curve and the random-targeting line.
- Budget save is one minus the smallest share of customers needed to capture 95% of the peak incremental saves.

## How to run

```
pip install -r ../requirements.txt
python main.py
```

## Results

| Metric | Portfolio | Script (synthetic) |
|---|---|---|
| Qini (20%) | 0.19 | printed |
| Budget save | 34% | printed |
| AUUC | 0.11 | printed |
| N | 7043 | 7043 |

## What to feature in an interview

- The difference between propensity and uplift. High churn risk with zero uplift is a customer you do not pay to keep.
- Why the Qini curve can peak before 100%. Sleeping dogs make the tail of the curve slope down, and that is the budget argument.
- Why the offer had to be randomised to measure any of this. Without a control group the uplift estimate is a story.

## Files

- `main.py` - data generator, T-learner, class transformation, Qini, AUUC, plot.
- `outputs/results.json`, `outputs/figure.png` - written on each run (gitignored).

Messaging everyone is pride without a control group.
