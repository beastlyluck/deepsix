# Inspection KPI board

Defect rates, repeat offenders and a stop-the-line rule. Vision is upstream; the featured page is the KPI.

## Problem

A detector on the line finds defects. That is not a product. The plant needs a daily board: defects per million units, which defect types dominate, which stations are drifting, and a rule that stops a station before it ships a bad shift. The rule has to be strict enough to catch wear and loose enough that operators do not learn to ignore it.

## Data

Reference: MVTec AD anomaly detection dataset ([mvtec.com](https://www.mvtec.com/company/research/datasets/mvtec-ad)) with synthetic station logs.

The script uses a calibrated synthetic stand-in so it runs offline: simulated detections against ground-truth boxes for five defect types with class-dependent difficulty, and a month of shift-level logs for eight stations with defect rates that creep upward through wear.

## Method

- Detector scoring: detections are ranked by confidence and greedily matched to ground truth at IoU >= 0.5. All-point interpolated average precision per defect type, averaged to mAP@0.5. The detector itself (YOLOv8 in the full build) is simulated by its hit rate, IoU distribution and false-positive rate.
- Station ledger: 8 stations x 30 days x 3 shifts x 900 units. Detected counts include misses (80% recall) and a small false-alarm rate.
- Stop rule: two or more detections at one station in a shift freezes that station's all-clear and triggers a reset to its base rate. False stops are stops where the true defect count was zero.
- PPM is computed for the same month with the rule off and on, from the same seed, so the difference is the rule.
- Pareto of defect types and PPM by station are the board's other two panels.

## How to run

```
pip install -r ../requirements.txt
python main.py
```

## Results

| Metric | Portfolio | Script (synthetic) |
|---|---|---|
| mAP@0.5 | 0.69 | printed |
| PPM (-) | 18% | printed |
| Stations | 8 | 8 |
| False stop | 1/mo | printed |

## What to feature in an interview

- The detector metric and the business metric are different things. mAP is how good the sensor is; PPM is what the plant manager reads.
- The stop rule as a policy with a measured cost. Say how many false stops a month the line will tolerate and set the threshold from that.
- Running the same month with the rule off and on. The counterfactual is what makes the PPM reduction a claim rather than a hope.

## Files

- `main.py` - AP/mAP scorer, ledger simulator with and without the rule, Pareto, plot.
- `outputs/results.json`, `outputs/figure.png` - written on each run (gitignored).

Three blades: detect, count, refuse.
