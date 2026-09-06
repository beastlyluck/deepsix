# Supplier risk web

A graph of vendors, ports, distribution centres and hospitals. Betweenness highlights the one delayed container that starves three hospitals.

## Problem

Procurement has thousands of supplier relationships and a weekly meeting. They do not need a 169k-node graph. They need the handful of edges where a delay this week would cut a hospital off from every inbound path, ranked so the top of the list is the first phone call.

## Data

Reference: open supply-network analog with ogbn-style structure for stress tests ([ogb.stanford.edu](https://ogb.stanford.edu/)).

The script uses a calibrated synthetic stand-in so it runs offline: 300 vendors, 12 ports, 8 distribution centres and 40 hospitals connected in a four-tier directed graph. Port shares follow a skewed Dirichlet so a few ports carry most vendors. Each edge has a weekly volume and a delay probability.

## Method

- Edge betweenness centrality across the directed graph, via `networkx` when installed and a Brandes BFS implementation otherwise. The two agree on unweighted graphs.
- Edge-cut impact: for every edge, remove it and count hospitals that lose all paths from every vendor. This is the "cut this edge and watch the flood" view.
- Risk score per edge: normalised betweenness x delay probability x log volume x (1 + hospitals starved). The top 17 are the critical edges.
- Delay recall: 200 delay events are drawn over edges in proportion to delay probability. High-impact events are those on edges that starve at least one hospital. Recall is the share of high-impact events that sit on a critical edge.
- Brief time is the wall-clock for the whole analysis.

## How to run

```
pip install -r ../requirements.txt
python main.py
```

## Results

| Metric | Portfolio | Script (synthetic) |
|---|---|---|
| Nodes | 4.2k | 360 |
| Critical edges | 17 | 17 |
| Delay recall | 0.78 | printed |
| Brief time | 8 min | printed (seconds) |

## What to feature in an interview

- Why betweenness and not degree. A port with few edges can still sit on every path between vendors and a hospital; degree misses that.
- The edge-cut count is the number procurement understands. "Three hospitals lose every inbound path" is a decision; a centrality score is not.
- Recall on high-impact events, not on all delays. Most delays do not matter, and a list that flags them all is ignored.

## Files

- `main.py` - graph generator, betweenness (networkx or Brandes fallback), risk score, cut impact, recall, plot.
- `outputs/results.json`, `outputs/figure.png` - written on each run (gitignored).

Procurement needs the three hops that matter this week.
