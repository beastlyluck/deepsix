# VIC grid peak desk

A control-room page for the Victorian region: demand, a 90th percentile forecast, and the three price events you would actually name in a standup.

## Context

AEMO publishes VIC1 demand and price at half-hour grain. This folder does not download that feed. It rebuilds the same clock — weekday shape, cooling degree days, a heat bump on the last four days, and one unit trip on day 18 around 17:30 — so the desk can be shown without credentials.

## What the script does

- Gradient boosting quantile (0.9) on hour, dow, CDD, lag-1 and lag-48.
- Pinball on the hold-out plus coverage of the actual under the q90.
- Log-price residual vs demand and CDD. Anything above the training 97th percentile is a spike.
- Event log: top three priced intervals, labelled heat peak or unit trip.

`app.py` is FastAPI. It only reads `outputs/desk.csv` and `outputs/results.json`.

```
pip install -r requirements.txt
python main.py
uvicorn app:app --reload
```

Open http://127.0.0.1:8000

## What I look for when it runs

Coverage of the q90 should sit near 0.85–0.95. The event log should include day 18. Spike rate is a few percent, not a flood.

## Talking point

The forecast is there so a spike that the weather already explained does not get a name. The trip is the one that should.
