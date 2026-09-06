# Case projects

Six digital twins (different stacks) and twenty-two analytics cases.

## Digital twins — one stack each

| Folder | Industry | Product | Stack (deliberately not shared) |
|---|---|---|---|
| [aerotwin](aerotwin/) | Aerospace swarm | 400 Hz edge policy + gRPC | **PyTorch** differentiable sim, TorchScript, C++/libtorch, FastAPI, raw WebGL |
| [gridpulse](gridpulse/) | Regional microgrid | Dispatch LP + cascade desk | **SciPy sparse** DC flow, PINN (torch only here), HiGHS, Avro/Flink SQL, DuckDB/SQLite, SVG graph |
| [biosync](biosync/) | Wearable replica | ONNX RK4 engine | **NumPy reverse-mode ODE**, Parquet lake, Streamlit+Plotly, JS port |
| [oceanicos](oceanicos/) | Smart terminal | Assignment matrix | **heap DES**, NetworkX, Hungarian, GBM ST-GNN, FastAPI WebSocket, canvas map |
| [forgex](forgex/) | Six-axis cell | JSON logit + interlock | **OpenCV + scipy STFT**, IsolationForest late fusion, Three.js arm |
| [terratwin](terratwin/) | Vertical farm | Closed-loop climate | **TOML + numpy FQI**, spatial SIR, k8s/systemd, SVG rack grid |

Do not “standardise” them onto one framework. The point of the suite is that a swarm controller, a grid LP, a clinical ODE, a port DES, a cell fusion score and a farm policy do not belong in the same runtime.

## Analytics cases

Twenty-two runnable boards. Each folder has a `README.md`, `docs/` (data + method), a unique `site/index.html`, and a `main.py` on a synthetic stand-in. Rebuilds write `site/data.js` only.

| Folder | Chapter / domain | One-line pitch | Main technique |
|---|---|---|---|
| [ward-twin-synthetic](ward-twin-synthetic/) | Illusionist / Healthcare Analytics | Hourly ward occupancy forecasts without identifiable records. | Negative-binomial GLM, synthetic cohort sampler, k-anonymity check, census residual gate |
| [night-economy-counterfactual](night-economy-counterfactual/) | Illusionist / Urban Analytics | Effect of a late-night tram cut on precinct spend. | Difference-in-differences with matched control strip, OLS via least squares |
| [manuscript-intel](manuscript-intel/) | Illusionist / NLP Analytics | Claims, methods and dataset names pulled from research abstracts into a ledger. | TF-IDF + logistic claim classifier, rule/ontology dataset extraction, SQLite ledger |
| [campus-load-forecast](campus-load-forecast/) | Singularity / Energy Analytics | 24-hour campus electricity demand with a drift gate. | Gradient boosting, rolling-origin evaluation, quantile pinball loss, PSI drift gate |
| [sku-hierarchy](sku-hierarchy/) | Singularity / Retail Forecasting | Store x SKU forecasts that add up to the chain total. | Base forecasts + MinT (shrinkage) reconciliation, WRMSSE |
| [model-watch-desk](model-watch-desk/) | Singularity / ML Observability | One-page drift and performance watch for three models. | PSI per feature, rolling AUC, traffic-light rules, champion ledger |
| [retention-uplift](retention-uplift/) | Prince / Causal Marketing Analytics | Send the win-back offer only to customers it will change. | T-learner and class-transformation uplift, Qini curve, AUUC |
| [fare-synthetic-control](fare-synthetic-control/) | Prince / Policy Analytics | Did a fare reform move ridership? | Abadie synthetic control (simplex-constrained weights), placebo-in-space |
| [warehouse-twin-sim](warehouse-twin-sim/) | Prince / Operations Analytics | Stress a pick-face with a 2x promo week before hiring. | Discrete-event simulation (heapq), factorial scenario design |
| [land-use-change](land-use-change/) | Swordsman / Geospatial Analytics | Year-over-year land-cover change with a confidence mask. | Tile classifier, per-class IoU, change matrix, entropy-based unsure mask |
| [inspection-kpi](inspection-kpi/) | Swordsman / Quality Analytics | Defect PPM, Pareto and a stop-the-line rule. | Detector precision/recall sweep (mAP@0.5), station ledger, repeat-fail rule |
| [vision-robustness-audit](vision-robustness-audit/) | Swordsman / Model Risk | Which corruptions make the camera model guess? | Corruption x severity accuracy grid, mean corruption error, traffic-light table |
| [nightly-analytics-fabric](nightly-analytics-fabric/) | Prime / Analytics Engineering | Nightly warehouse rebuild that keeps yesterday's numbers if tests fail. | dbt-style DAG with contract tests, SLA timing, publish gate |
| [score-api](score-api/) | Prime / Decision Services | Credit-style score with reason codes and a model hash. | Logistic regression, contribution-based reason codes, canary AUC delta, FastAPI |
| [exec-kpi-twin](exec-kpi-twin/) | Prime / BI / Product Analytics | Five KPIs with definitions, owners and a surprise band. | Metrics layer, seasonal baseline, residual band alerts |
| [supplier-risk-web](supplier-risk-web/) | Weaver / Supply-chain Analytics | The one delayed container that starves three hospitals. | Betweenness centrality, edge-cut impact, delay-risk score |
| [collab-map](collab-map/) | Weaver / Research Analytics | Who writes with whom, and which labs are isolated. | Bipartite projection, greedy modularity communities, bridge ranking |
| [fraud-ring](fraud-ring/) | Weaver / Fraud Analytics | Shared devices and addresses that reveal a ring. | Graph features + logistic baseline, PR-AUC, connected-component case packs |
| [vic-ed-flow](vic-ed-flow/) | Field desk / Healthcare ops | Ambulance ramping and ED occupancy by campus. | Poisson arrival GLM, occupancy queue, winter residual, Streamlit board |
| [rent-pressure-atlas](rent-pressure-atlas/) | Field desk / Housing | Which SA2s are in rental stress this quarter. | Hedonic rent, 30% stress index, spatial lag, static HTML atlas |
| [vic-grid-peak](vic-grid-peak/) | Field desk / Energy | VIC1 demand vs named price spikes. | Quantile demand, spike residual, FastAPI desk |
| [invoice-leak-desk](invoice-leak-desk/) | Field desk / Finance ops | Duplicate and split AP payments. | Blocking + fuzzy remittance match, Flask hold/release queue |

## Conventions

Every script generates its own data. The public dataset named in each README is the real reference; the script uses a calibrated synthetic stand-in with the same shape and rough effect sizes so it runs offline with no downloads. Numbers will not match the public data exactly and are not meant to.

Each `main.py` sets a fixed seed, runs the method, prints a summary, writes `outputs/results.json` (and usually `outputs/dashboard.json`), then emits `site/data.js`. Open `site/index.html` — it is the story and the board. No server required for the page. A few folders also have a live app (`streamlit`, `flask`, `uvicorn`) and four have a Jupyter notebook under `notebooks/`.

The `outputs/` folders are gitignored. Optional libraries (`networkx`, `fastapi`) are import-guarded; the scripts fall back to numpy or scikit-learn if they are missing.

Install once and run any case:

```
pip install -r requirements.txt
cd sku-hierarchy
python main.py
```
