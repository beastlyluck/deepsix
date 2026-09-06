"""Ops API. REST for plans and KPIs, WebSocket that replays the event store at
a chosen speed so the map moves. Run after main.py:

    uvicorn api.server:app --port 8082
"""
import asyncio
import json
import os
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)
from api.store import Store

try:
    from fastapi import FastAPI, WebSocket
    from pydantic import BaseModel
except ImportError as exc:  # pragma: no cover
    raise SystemExit("pip install fastapi uvicorn") from exc

OUT = os.path.join(HERE, "outputs")
app = FastAPI(title="OceanicOS terminal", version="1.0")
store = Store(os.path.join(OUT, "events"))


def _results():
    p = os.path.join(OUT, "results.json")
    return json.load(open(p)) if os.path.exists(p) else {}


class BookingQuery(BaseModel):
    line: str
    service: str
    boxes: int


@app.get("/v1/kpis/{run}")
def kpis(run: str):
    return _results().get("benchmark", {}).get(run, {})


@app.get("/v1/forecast/volume")
def volume():
    return _results().get("hierarchy_summary", {})


@app.get("/v1/forecast/dwell/{line}")
def dwell(line: str):
    return _results().get("dwell", {}).get(line, {"error": "unknown line"})


@app.post("/v1/plan/yard")
def yard_plan(q: BookingQuery):
    d = _results().get("dwell", {}).get(q.line)
    if not d:
        return {"ok": False, "detail": "no dwell profile for line"}
    deep = d["p_dwell_gt_5d"] > 0.3
    return {"ok": True, "boxes": q.boxes, "zone": "deep" if deep else "gate-side",
            "expected_dwell_days": d["shrunk_mean_days"], "p_long_stay": d["p_dwell_gt_5d"]}


@app.get("/v1/events/{run}")
def events(run: str, t0: int = 0, t1: int = 3600):
    return {"events": store.events_between(run, t0, t1)}


@app.websocket("/v1/stream/{run}")
async def stream(ws: WebSocket, run: str, speed: float = 60.0):
    """Replays snapshots and the events between them. speed = sim seconds per wall second."""
    await ws.accept()
    snaps = store.snapshots(run)
    for i, s in enumerate(snaps):
        t0 = int(s["t"])
        t1 = int(snaps[i + 1]["t"]) if i + 1 < len(snaps) else t0 + 300
        await ws.send_text(json.dumps({"snapshot": s, "events": store.events_between(run, t0, t1)}))
        await asyncio.sleep((t1 - t0) / speed)
    await ws.close()
