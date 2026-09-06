# Closed-loop climate controller. Weights from a training run.
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "-c", "from control.loop import run; from main import load_cfg; import numpy as np; run(load_cfg(), np.random.default_rng(0), w=np.load('outputs/q_weights.npy'))"]
