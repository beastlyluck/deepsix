# AeroTwin — quadrotor swarm digital twin

Six airframes, one policy, real gusts. The twin exists to put a number on how
far the trained controller drifts when it leaves the simulator, and to ship the
controller as an edge artefact with that number attached.

## What is here

| Path | What |
|---|---|
| `sim/quadrotor.py` | Differentiable quadrotor swarm sim in Torch: attitude lag, quadratic drag, Dryden-style gusts, downwash. Nominal, domain-randomised and held-out "real" parameter sets. |
| `rl/policy.py` | MLP around a PD prior. Trained by backprop through the sim (analytic policy gradient). |
| `rl/s2r.py` | Sim-to-real audit: nominal vs domain-randomised policies, both flown in the real world, gap per seed. |
| `rag/` | Manuals, CAD part sheets and anomaly checklists; family-specific chunking; TF-IDF word+char retrieval; recall@3 on planted queries. |
| `edge/` | `export.py` traces to TorchScript + JSON weights. `controller.cpp` + `CMakeLists.txt` is the libtorch 400 Hz loop. |
| `swarm/` | `swarm.proto` gRPC contract and a FastAPI REST mirror. |
| `site/` | Ops dashboard: raw WebGL spatial map, telemetry sparklines, corrective terminal, S2R audit table. |
| `docs/` | Documentation site: topology, simulator equations, S2R metrics, chunking strategy, API reference. |

## Run

```
python main.py            # ~1-2 min CPU, 3 seeds
python main.py --quick    # 2 seeds, fewer iterations
start site/index.html
uvicorn swarm.api:app --port 8081      # optional live API
```

Outputs land in `outputs/`: `results.json`, `dashboard.json`, `telemetry.jsonl`,
`edge/policy.pt`, `edge/weights.json`.

## Stack

PyTorch (differentiable sim, APG training, TorchScript) · libtorch/CMake for
the edge binary · scikit-learn TF-IDF for retrieval · gRPC proto + FastAPI ·
hand-written WebGL. No C++ toolchain was available on the build machine, so the
edge loop is provided as source and the TorchScript artefact is verified against
eager PyTorch instead.

## Honesty notes

- The "real" world is a held-out parameter set, not flight data.
- Regulations and part sheets are invented; only their shape is realistic.
- Analytic policy gradient works because the sim is differentiable; replaying
  real flight logs would need PPO or similar.
