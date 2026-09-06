# Land-use change, one tile at a time

EuroSAT-style tiles classified, then differenced year-over-year so a planner sees what became urban, and where the model is not sure.

## Problem

A council wants hectares converted from pasture and crop to residential and industrial between two years. A classifier alone gives a class per tile. The brief needs a transition matrix in hectares and an honest list of tiles the model could not call, so nobody reports a change that is really classifier noise.

## Data

Reference: EuroSAT, 27,000 Sentinel-2 patches across 10 land-cover classes ([github.com/phelber/eurosat](https://github.com/phelber/eurosat)).

The script uses a calibrated synthetic stand-in so it runs offline: each tile is summarised by six spectral indices (NDVI, NDBI, NDWI, brightness, texture, red/NIR ratio) drawn around class-specific centroids. 6,000 tiles train and test the classifier. A separate 40 x 40 tile scene is generated for two years, with 12% of pasture and crop tiles converting to residential or industrial.

## Method

- Tile classifier: histogram gradient boosting on the six indices. In the full build this is an EfficientNet-B0 encoder on the raw 64 x 64 x 13 patch; the stand-in keeps the evaluation logic identical.
- Per-class IoU from the confusion matrix, TP / (TP + FP + FN), averaged to mIoU. Accuracy on a 25% stratified holdout.
- Change differencing: predicted class in year 1 versus year 2 for every tile in the scene. Changes are tallied into a from/to transition matrix and converted to hectares at 40.96 ha per tile.
- Confidence mask: predictive entropy above 0.6 nats in either year marks a tile unsure. Unsure tiles are excluded from the change total and reported separately, with the three worst listed by grid position.

## How to run

```
pip install -r ../requirements.txt
python main.py
```

## Results

| Metric | Portfolio | Script (synthetic) |
|---|---|---|
| Accuracy | 97.4% | printed |
| mIoU | 0.94 | printed |
| Unsure tiles | 3.1% | printed |
| Classes | 10 | 10 |

The script also prints hectares that became urban against the true converted area, so the effect of the confidence mask on the total is visible.

## What to feature in an interview

- Why mIoU rather than accuracy for a land-cover map. Small classes like River and Highway matter to the planner and vanish in accuracy.
- Why unsure tiles are excluded from the change total and listed, not averaged. A change map with a false positive in it costs more than one with a gap.
- The unit of the deliverable is hectares in a transition matrix, not a probability. The model is a step, the brief is the product.

## Files

- `main.py` - tile generator, classifier, IoU, two-year scene, change matrix, confidence mask, plot.
- `outputs/results.json`, `outputs/figure.png` - written on each run (gitignored).

The Swordsman does not hide the unsure tiles in the average.
