# Operations — how the 07:15 bed meeting uses this

## The question

NUM: “How many occupied beds at 08:00 tomorrow, and how wrong might we be?”

Privacy: “You may not have the ADT.”

Answer: ward-level mean + 80% band from the twin. One midnight census to check honesty.

## Daily ritual

1. Overnight job writes `outputs/results.json` and `outputs/dashboard.json`.
2. Open `site/index.html` (this board). No server.
3. Read the four KPIs. If “gate open” is not zero, open the night log before the forecast chart.
4. Select the ward that is arguing. Arrival pressure slider is a what-if, not a re-fit.
5. If two midnights missed, do not retrain at the table. Escalate: did the ward change?

## Decisions this board is allowed to support

- Call in overflow for ward F if the band sits on the physical cap
- Delay elective surgical load on B if C is already short-stay full
- Ask infection control about A if medical occupancy jumped and the gate opened

## Decisions this board is not allowed to support

- Named-patient boarding
- Staffing to the point forecast (use the upper band)
- Publishing the cohort without the k filter

## Failure modes

| Symptom | Likely cause | Action |
|---|---|---|
| Coverage << 80% | α too small or a regime change | Open the gate; do not shrink the band |
| PIT piled at ends | Intervals too tight | Check α; check weekend coding |
| One ward MAE >> others | Dummy not enough (outbreak) | Gate should already be open |
| k < 10 after publish | Sampler bug | Do not ship the table |

## Reproduce

```
cd projects/ward-twin-synthetic
pip install -r ../requirements.txt
python main.py
```

Walk the IRLS step in `notebooks/ward_census.ipynb`.
