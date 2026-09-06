"""Small desk over outputs/desk.csv.

uvicorn app:app --reload --app-dir .
then open http://127.0.0.1:8000
"""
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse

ROOT = Path(__file__).parent
OUT = ROOT / "outputs"

app = FastAPI(title="VIC grid peak")


@app.get("/")
def index():
    return FileResponse(ROOT / "static" / "index.html")


@app.get("/api/series")
def series():
    import pandas as pd

    p = OUT / "desk.csv"
    if not p.exists():
        return JSONResponse({"error": "run python main.py"}, status_code=404)
    df = pd.read_csv(p)
    return {
        "t": df["t"].tolist(),
        "demand": [round(v, 1) for v in df["demand"]],
        "q90": [round(v, 1) for v in df["q90"]],
        "price": [round(v, 1) for v in df["price"]],
        "spike": df["spike"].tolist(),
    }


@app.get("/api/events")
def events():
    import json

    p = OUT / "results.json"
    if not p.exists():
        return JSONResponse({"error": "run python main.py"}, status_code=404)
    return json.loads(p.read_text(encoding="utf-8"))
