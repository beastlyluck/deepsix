# Vision robustness audit

Fog, glare and compression. A one-week audit that tells a stakeholder when the camera twin is guessing.

## Problem

A camera model updates inventory counts. It was validated on clean images. The question the operations lead asks is not "what is the accuracy" but "under what conditions should I stop trusting it". The deliverable is a traffic-light table and a handful of sentences, not a paper.

## Data

Reference: ImageNet-C subset, 15 corruptions x severities ([github.com/hendrycks/robustness](https://github.com/hendrycks/robustness)).

The script uses a calibrated synthetic stand-in so it runs offline: per-image correctness is simulated for 600 images per cell across 15 corruptions (including rain), 3 severities and 4 backbones, each with a clean accuracy and a fragility multiplier. A legacy reference model provides the normalising error for CE.

## Method

- Per-cell error rate from simulated per-image outcomes for each corruption x severity.
- Corruption error (CE) per corruption: the backbone's summed error across severities divided by the reference model's, times 100. Mean CE (mCE) across the 15 corruptions ranks the backbones. Lower is better; 100 is the reference.
- Traffic light per cell on accuracy drop versus clean: green <= 10 points, amber <= 25, red above.
- For the best backbone, the first red severity per corruption becomes a stakeholder sentence: "Do not update inventory from this camera under rain severity >= 3."
- The report skeleton is six sections: scope, clean accuracy, corruption table, severity thresholds, decisions, appendix.

## How to run

```
pip install -r ../requirements.txt
python main.py
```

## Results

| Metric | Portfolio | Script (synthetic) |
|---|---|---|
| mCE (best) | 61.4 | printed |
| Rain fail sev. | 3 | printed |
| Backbones | 4 | 4 |
| Pages | 6 | 6 |

## What to feature in an interview

- Why mCE is relative. Normalising by a legacy model makes hard corruptions and easy ones count equally instead of letting noise dominate.
- The traffic-light thresholds are a business decision. Ten points of accuracy drop is where inventory counts start to drift beyond tolerance, and that number came from the operations lead, not the model.
- The output is a sentence with a condition in it. Anyone can act on "not under rain severity 3"; nobody acts on a heatmap.

## Files

- `main.py` - outcome simulator, CE and mCE, traffic-light table, sentences, plot.
- `outputs/results.json`, `outputs/figure.png` - written on each run (gitignored).

That sentence is the slash.
