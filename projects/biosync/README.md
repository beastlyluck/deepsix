# BioSync — patient-specific continuous replica

One patient, one continuous-time model, every gap the wearable leaves. A
Neural ODE written in plain NumPy — RK4 forward, hand-written reverse mode —
learns glucose and heart-rate dynamics with a per-patient embedding, and is
scored against a discrete-time recurrent baseline at three device-dropout
levels. The same arithmetic ships as an ONNX graph plus a 22 µs RK4 step.

## What is here

| Path | What |
|---|---|
| `physio/sim.py` | Minimal-model glucose/insulin + first-order HR, per-patient parameters, CGM and wearable observation model with realistic gaps. |
| `data/lake.py` | Parquet lake, hive-partitioned by HMAC pseudonym and day. Eight columns, no free text. |
| `models/node.py` | Neural ODE: MLP dynamics, RK4, reverse mode through every stage, Adam, masked loss, learned patient embeddings. |
| `models/esn.py` | Echo-state network baseline on the filled grid with mask channels. |
| `models/evaluate.py` | Matrix: dropout × {ODE, ESN, persistence} × {30, 60, 120 min}. |
| `mlops/impute.py` | Forward fill vs linear vs replica rollout over carved gaps. |
| `privacy/dp.py` | Gaussian mechanism for hourly cohort curves; neighbouring-cohort attacker check against the (ε, δ) bound. |
| `edge/` | ONNX graph built with `onnx.helper`; numpy runtime with latency and equivalence checks. |
| `app.py` | Streamlit + Plotly live dashboard with the what-if assistant on the edge engine. |
| `site/` | Static clinical mirror; the replica is ported to JS so what-ifs run in the browser. |
| `docs/` | Secure stream, equations, reverse-mode derivation, matrix, DP validation, edge. |

## Run

```
python main.py            # ~1 min, numpy only
python main.py --quick
streamlit run app.py      # live app
start site/index.html     # static mirror
```

## Stack

NumPy/SciPy for all modelling — no autograd framework anywhere. pyarrow for
the lake, `onnx` for the export, Streamlit + Plotly for the live app. The
static page ports the ODE to JavaScript.

## Honesty notes

- The cohort is synthetic. Nothing is validated on people.
- Linear interpolation beats the replica at gap filling because it sees the
  end of the gap; it is reported anyway because it is the ceiling.
- The ESN stands in for a GRU. Its collapse under dropout is the point: any
  model that needs a value in every slot inherits it.
