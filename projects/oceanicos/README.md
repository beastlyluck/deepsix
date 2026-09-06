# OceanicOS

Digital twin of an automated container terminal. A discrete-event simulation of
two berths, six cranes, 32 yard blocks and 16 AGVs; inside it, an assignment
engine that pairs AGVs to boxes with the Hungarian algorithm and picks blocks
from a dwell forecast, yard saturation and a spatio-temporal traffic model.

```
python main.py            # 48 h under both policies, ~1 min
python main.py --quick    # 24 h
start site\index.html     # dashboard (replay, gauges, heatmap, event log)
start docs\index.html     # documentation
uvicorn api.server:app --port 8082   # REST + WebSocket replay
```

## Layout

| path | what |
|---|---|
| `terminal/layout.py` | quay, blocks, lanes, gate; NetworkX road graph; route-overlap adjacency |
| `terminal/des.py` | heap-based DES: vessels, berths, cranes, AGVs, blocks, gate |
| `terminal/policy.py` | `Greedy` baseline and `Matrix` (Hungarian pairing + block scoring) |
| `terminal/schedule.py` | vessel calls and three years of weekly line × service history |
| `forecast/stgnn.py` | diffusion-convolution features + GBM readout; K=0 / K=2 / persistence |
| `forecast/hierarchy.py` | Holt-Winters per node, MinT-shrink reconciliation, dwell shrinkage |
| `api/store.py` | DuckDB (SQLite fallback) event and snapshot store |
| `api/server.py` | FastAPI plan endpoints and `ws /v1/stream/{run}` |
| `site/` | canvas terminal map with orthographic toggle, replay scrubber |
| `docs/` | method, equations, API, benchmark, drift |

## Honesty notes

Synthetic schedule and layout. The Matrix policy holds throughput and cuts
peak yard saturation from 100% to ~60% at the cost of a few minutes' more
crane stall over 48 h; reshuffles from full blocks are not modelled, so the
saturation benefit is understated and the stall cost is real. The traffic
model's graph term helps at 15 min and hurts at 60 min; both numbers are shown.
