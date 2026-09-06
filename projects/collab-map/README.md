# Faculty collaboration map

Who actually writes with whom? A campus collaboration graph from open author lists, useful for a school that wants to see its isolated labs.

## Problem

An org chart says which department someone sits in. Author lists say who they work with. A research office wants the second picture: the real groups, the labs that never co-author outside themselves, and the people who connect groups that would otherwise be separate. That is strategy input, not surveillance, so the output is communities and bridges, not individual scores.

## Data

Reference: ArXiv metadata sample, authors and categories ([arxiv.org](https://arxiv.org/)).

The script uses a calibrated synthetic stand-in so it runs offline: 600 authors in 14 latent labs, 1,600 papers with 2 to 5 authors. Most papers stay in-lab; 35% pull in an author from another lab or one of a few roaming collaborators.

## Method

- Bipartite projection: the author-paper graph becomes a weighted co-authorship graph where the edge weight is the number of shared papers.
- Community detection: `networkx` greedy modularity (Clauset-Newman-Moore) when installed, otherwise a weighted label propagation fallback. The full build uses Leiden via igraph; the fallback keeps the script dependency-light.
- Modularity is computed directly from the partition with the weighted Newman formula, independent of the detection library.
- Bridges: authors with at least eight co-author links whose weight spans three or more communities with a participation coefficient of 0.5 or higher. Ranked by participation, then by weight.
- Isolated communities are those with no edge leaving the community.

## How to run

```
pip install -r ../requirements.txt
python main.py
```

## Results

| Metric | Portfolio | Script (synthetic) |
|---|---|---|
| Authors | 6.1k | 600 |
| Communities | 14 | printed (size >= 5) |
| Bridges | 39 | printed |
| Modularity | 0.46 | printed |

## What to feature in an interview

- Why modularity is reported as a number and not as a verdict. It is a fit statistic for the partition; the story is in the bridge list and the isolated labs.
- The bridge rule uses a participation coefficient, not degree. A prolific author who only writes in-lab is not a bridge.
- The framing. Communities and bridges are reported; individuals are not ranked by output. That choice is what makes the map usable by a research office.

## Files

- `main.py` - author/paper generator, projection, community detection with fallback, modularity, bridges, plot.
- `outputs/results.json`, `outputs/figure.png` - written on each run (gitignored).

A polite spidey-sense for research strategy.
