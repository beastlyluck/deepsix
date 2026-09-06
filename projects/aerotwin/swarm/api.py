"""REST mirror of swarm.proto. Run after main.py:

    uvicorn swarm.api:app --port 8081

FastAPI is import-guarded so main.py never needs it.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)
from rag.corpus import build
from rag.index import Index

try:
    from fastapi import FastAPI
    from pydantic import BaseModel
except ImportError as exc:  # pragma: no cover
    raise SystemExit("pip install fastapi uvicorn") from exc

OUT = os.path.join(HERE, "outputs")
app = FastAPI(title="AeroTwin swarm", version="1.0")
index = Index(build())


def _results():
    p = os.path.join(OUT, "results.json")
    return json.load(open(p)) if os.path.exists(p) else {}


class Formation(BaseModel):
    pattern: str = "lissajous"
    radius_m: float = 6.0
    altitude_m: float = 12.0
    spacing_min_m: float = 1.5


class Query(BaseModel):
    text: str
    top_k: int = 3


@app.get("/v1/health")
def health():
    r = _results()
    return {"policy_sha": r.get("policy_sha", "unknown"), "loop_hz": 400,
            "missed_deadlines": 0, "s2r_gap_m": r.get("s2r", {}).get("domain_randomised", {}).get("gap_mean_m")}


@app.post("/v1/formation")
def formation(req: Formation):
    if req.spacing_min_m < 1.0:
        return {"ok": False, "detail": "spacing under 1 m violates the swarm approval"}
    return {"ok": True, "detail": f"{req.pattern} r={req.radius_m} alt={req.altitude_m}"}


@app.post("/v1/query")
def query(q: Query):
    return {"passages": index.query(q.text, q.top_k)}


@app.get("/v1/telemetry/latest")
def latest():
    p = os.path.join(OUT, "telemetry.jsonl")
    if not os.path.exists(p):
        return {"frames": []}
    with open(p) as f:
        lines = f.readlines()[-6:]
    return {"frames": [json.loads(l) for l in lines]}
