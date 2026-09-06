# TerraTwin — vertical farm closed loop

Eight towers, ten layers, a disease that walks to the next tray. The twin
learns a 27-action climate policy with fitted Q-iteration and races it
against a setpoint PID on the same seed. The shipped artefact is the loop
plus `config/facility.toml`. Kubernetes and the systemd unit only keep it
up.

This stack is not the others. Facility truth lives in TOML. The learner is
numpy least-squares FQI — no gym, no torch. Deploy is YAML + a Dockerfile.
The board is an SVG rack grid with a typed what-if, not a 3D canvas.

## What is here

| Path | What |
|---|---|
| `config/facility.toml` | Setpoints, limits, SIR rates, reward weights |
| `env/` | Tray grid, first-order climate, spatial SIR |
| `rl/fqi.py` | Batch FQI + PID baseline |
| `rl/reward.py` | Yield − energy − disease − limit hits |
| `forecast/holt.py` | Per-tower Holt, facility MAPE |
| `control/loop.py` | The product |
| `deploy/` | Dockerfile, k8s Deployment, systemd unit |
| `site/` | Layer grid, gradients, what-if grammar |
| `docs/` | Reward, sensor schema, container notes |

## Run

```
python main.py
python main.py --quick
start site/index.html
start docs/index.html
```

## Honesty notes

- Trays and mildew are simulated. No greenhouse extract.
- FQI sees facility-wide features, not a per-tray action. A rack-level
  policy is a different product and would need a different reward.
- PID vs FQI share one disease seed so the comparison is fair. A lucky
  seed is not claimed.
