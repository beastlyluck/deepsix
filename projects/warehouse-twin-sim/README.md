# Warehouse Twin (discrete event)

A discrete-event twin of a pick-face. Stress it with a 2x promo week before you hire another picker.

## Problem

A promo week doubles order volume. Operations has two levers on the table: add a packer, or run two hours of overtime. Both cost money. The question is which one moves the late-order rate, and the answer should come from a model of the queue, not from a meeting.

## Data

Reference: synthetic pick logs calibrated to public warehouse time-and-motion ranges (SimPy documentation examples, [simpy.readthedocs.io](https://simpy.readthedocs.io/)).

The script generates its own arrivals and task times so it runs offline: a non-homogeneous Poisson arrival stream with a midday peak, lognormal pick times that scale with lines per order, and lognormal pack times. No real order data is used.

## Method

- Event-driven simulation on a `heapq` priority queue, SimPy-style but without the dependency. Events are arrive, picked, packed. Pickers and packers are counted resources with FIFO queues. The shift clock stops processing at shift end; anything queued or in flight is counted as late.
- KPIs per run: orders, late-order rate, mean wait before picking, picker utilisation, packer utilisation.
- Factorial design: pickers {4, 5, 6} x packers {2, 3} x shift {8h, 10h} x demand {1x, 2x} x 2 replications = 48 scenarios.
- Common random numbers: the order workload (arrival times, pick and pack durations) is drawn up front and seeded by replication, so scenarios in the same replication face identical orders and differ only in staffing. This is what makes a two-replication comparison readable.
- The headline comparison is under 2x demand: baseline (5 pickers, 2 packers, 8h) versus one extra packer versus two hours of overtime, on late-order rate.

## How to run

```
pip install -r ../requirements.txt
python main.py
```

## Results

| Metric | Portfolio | Script (synthetic) |
|---|---|---|
| Late orders - | 22% | printed (extra packer vs baseline) |
| Scenarios | 48 | 48 |
| Util. pack | 81% | printed (recommended scenario, 2x; baseline also shown) |
| Runtime | 9s | printed |

The script also prints the overtime comparison so the two levers can be read side by side.

## What to feature in an interview

- Why a queue model and not a spreadsheet. Utilisation near 80% is where waiting time stops being linear, and a spreadsheet average hides that.
- Common random numbers. Paired scenarios on the same order stream turn a noisy comparison into a clean one; say what more replications would buy on top.
- How the twin reframes the hiring conversation: one extra packer is a bottleneck fix, overtime is a backlog fix, and the KPI tells you which problem you have.

## Files

- `main.py` - event-driven simulator, factorial runner, KPI table, plot.
- `outputs/results.json`, `outputs/figure.png` - written on each run (gitignored).

Run the night in silicon first.
