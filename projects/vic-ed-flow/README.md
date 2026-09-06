# ED flow board — four Victorian campuses

A night supervisor should open this and see which campus will miss the four-hour target before the morning huddle.

Public reporting talks about ramping and wait in weekly PDFs. This desk rebuilds the same grain from a campus-level arrival model so you can ask: if Austin picks up a flu week, who breaches first?

Not a live AHV feed. Seeded stand-in. The product is the risk list and the residual, not the GLM.

## What you get

| Artefact | Where |
|---|---|
| Huddle pack (offline) | `site/index.html` |
| Shift board | `streamlit run app.py` after `main.py` |
| Docs | `docs/DATA.md`, `docs/METHOD.md`, `docs/OPERATIONS.md` |
| Slot table | `outputs/flow.csv` |

## Method (short)

1. 14 winter days × 4 campuses × 15-minute slots.
2. Poisson GLM for arrivals (campus + 2-hour bin + weekend).
3. Lognormal LOS queue. Full bays → ramp.
4. Austin ×1.45 after day 7. Attribution is week-2 vs week-1 vs the other campuses.
5. Midnight residual vs first-week winter median.

## Run

```
pip install -r ../requirements.txt
python main.py
streamlit run app.py
```

Open `site/index.html` for the huddle pack. It reads `site/data.js` from the last run.

## Interview points

- Occupancy is a queue, not a regression.
- The residual exists so nobody treats the twin as a census.
- Austin is supposed to trip. If it does not, the board is broken.

Not for operational use. Stand-in data only.
