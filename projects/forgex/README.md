# ForgeX — six-axis cell twin

One arm, three sensors, a state machine that will not reset itself. The twin
scores a pick cycle from acoustic bands, drive current and a camera on joints
2 and 3, then hands the score to an interlock. The shipped artefact is a
JSON logit that scores a cycle in tens of microseconds.

This stack is not the others. OpenCV and `scipy.signal.stft` own the features.
sklearn IsolationForest + logistic is the desk model. Three.js draws the arm.
There is no PyTorch, no FastAPI, no Streamlit.

## What is here

| Path | What |
|---|---|
| `arm/` | DH kinematics, payload moment, friction + thermal residual |
| `sensors/acoustic.py` | 16 kHz mesh tone, STFT band energies, crest |
| `sensors/current.py` | 6th-harmonic ripple, THD, stall flag |
| `sensors/vision.py` | OpenCV Laplacian, hue hist, leak streak |
| `detect/fusion.py` | Late fusion + leave-one-block-out AUC |
| `safety/fsm.py` | NORMAL / WATCH / HOLD / ESTOP. HOLD needs a human bit |
| `edge/actuator.py` | JSON weights, numpy score, latency bench |
| `site/` | Three.js arm, FFT pane, FSM strip |
| `docs/` | Fusion diagram, STFT recipe, safety flowchart |

## Run

```
pip install -r requirements.txt
python main.py
start site/index.html
start docs/index.html
```

## Honesty notes

- Frames, tones and currents are generated. The camera never saw a cell.
- The thermal residual used by the FSM on thermal faults is a scaled
  temperature, not a fitted heat-equation inverse.
- IsolationForest contamination is set, not estimated from a clean week.
