# GridPulse — regional microgrid digital twin

One weak corridor, two schedules, one evening peak. The twin produces a
dynamic line rating from a physics-informed thermal model, dispatches the day
against it with an LP, and scores every bus for cascade risk on a streaming
feature store. The shipped run shows the worst N-2 at 18:00 taking 30 buses
down under static ratings and none under the derated schedule.

## What is here

| Path | What |
|---|---|
| `grid/topology.py` | 48-bus planar microgrid, meshed, conductor-based ratings with six deliberately weak lines. |
| `grid/powerflow.py` | Sparse DC power flow per island, PTDF, cascading-outage model with emergency rating and pro-rata islanding. |
| `grid/scenarios.py` | Day profiles and N-1 / N-2 contingency sampling. |
| `pinn/thermal.py` | PINN for conductor temperature `T(x,t,I)` with hard-encoded BC/IC, FD verification, bisection for sustainable current. |
| `gnn/sgc.py` | Hop-concatenated simplified graph convolution on scipy sparse, logistic readout, K=0 ablation, edge criticality. |
| `dispatch/lp.py` | 24-hour dispatch LP with PTDF line constraints and battery SoC, HiGHS via scipy. |
| `stream/` | Avro schemas, Flink SQL feature job, DuckDB/sqlite feature store, offline replay with rising-edge alerts. |
| `site/` | Ops dashboard: SVG network graph with schedule toggle and time scrub, alert drawer, PINN vs FD, GNN ablation, dispatch stack. |
| `docs/` | PINN loss and boundary proofs, cascade model, GNN layer design, LP formulation, Kafka schemas. |

## Run

```
python main.py            # ~1 min CPU
python main.py --quick
start site/index.html
```

Outputs: `outputs/results.json`, `outputs/dashboard.json`, `outputs/feature_store.{duckdb|sqlite}`.

## Stack

PyTorch is used for the PINN only. Everything on the grid side is scipy
sparse; the GNN is sparse matmuls plus scikit-learn; dispatch is HiGHS. The
streaming layer is specified as Kafka Avro + Flink SQL and exercised offline
by the replay loop into DuckDB (sqlite when DuckDB is not installed).

## Honesty notes

- Grid, profiles and outages are synthetic. Labels for the cascade model come
  from the simulator, so the AUC is against the simulator's notion of loss.
- The PINN has fixed cooling coefficients; production would condition on
  ambient and wind. It is verified against finite differences, not against
  its own residual.
- DC power flow ignores voltage and reactive effects.
