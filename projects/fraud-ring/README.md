# Fraud ring, explained

Shared devices, shared addresses, shared velocity. A community that looks like a family until the edges say otherwise.

## Problem

Account-level fraud scores miss rings because each account in the ring looks ordinary on its own. Review teams also cannot act on a score. They need the group, the entities that bind it, and a sentence they can check and argue with. The false positives that matter most are families: several legitimate accounts sharing one address and one device.

## Data

Reference: PaySim / Elliptic-style transaction graph ([kaggle.com/datasets/ellipticco/elliptic-data-set](https://www.kaggle.com/datasets/ellipticco/elliptic-data-set)).

The script uses a calibrated synthetic stand-in so it runs offline: 3,000 accounts with velocity, average amount and age; 60 families that share an address and sometimes a device; 12 fraud rings of 5 to 8 new, fast accounts sharing several devices and usually an address; and a sprinkle of lone fraudsters with no graph signal.

## Method

- Entity graph: accounts are linked when they share a device or an address. Edges carry the type of shared entity.
- Graph features per account: shared-entity degree, connected component size (union of a DFS pass), triangle count, and number of shared-device edges.
- Model: logistic regression on standardised features, trained twice on a 60/40 stratified split, once with tabular features only and once with graph features added. Scored by PR-AUC (average precision) on the holdout, because fraud is rare and ROC-AUC flatters.
- Case packs: connected components with at least two accounts above a 0.5 score. Each pack lists the nodes, the binding edges with their entity type, and a generated sentence with the shared entities, velocity and account age. Packs with zero true fraud are counted as false families.
- Review time: alerts reviewed individually at 6 minutes each versus packs at 6 minutes plus 2 per node. The assumptions are printed with the result.

## How to run

```
pip install -r ../requirements.txt
python main.py
```

## Results

| Metric | Portfolio | Script (synthetic) |
|---|---|---|
| PR-AUC | 0.64 | printed (with and without graph features) |
| Cases packed | 22 | printed |
| Review time | -31% | printed |
| False family | 3 | printed |

## What to feature in an interview

- The tabular-only versus tabular-plus-graph comparison is the argument for the graph. Same model, same split, one extra feature block.
- Case packs are the product. A reviewer reads six nodes and one sentence, not a score, and can say "that is a family" and be right.
- False families are reported as a number. Every graph-based fraud system has them; hiding them is how review teams lose trust.

## Files

- `main.py` - account generator, entity graph, graph features, PR-AUC comparison, case packs, plot.
- `outputs/results.json`, `outputs/figure.png` - written on each run (gitignored).

Great power is a path, not a black-box score.
