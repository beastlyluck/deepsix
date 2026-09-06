"""Minimal FastAPI wrapper for the credit score. Run `python main.py` first to write
outputs/model.json, then `uvicorn app:app --reload` and POST to /score.

FastAPI is optional; main.py does not import this file.
"""
import json
import os

import numpy as np

try:
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel
except ImportError:  # pragma: no cover - fastapi not installed
    FastAPI = None

HERE = os.path.dirname(os.path.abspath(__file__))
ART_PATH = os.path.join(HERE, "outputs", "model.json")
REASONS = {"revolving_utilization": "High revolving utilisation", "age": "Short credit history (age)",
           "times_30_59_late": "Recent 30-59 day delinquencies", "debt_ratio": "High debt-to-income ratio",
           "monthly_income": "Low monthly income", "open_credit_lines": "Number of open credit lines",
           "times_90_late": "90+ day delinquencies on file", "real_estate_loans": "Real estate loan exposure",
           "times_60_89_late": "Recent 60-89 day delinquencies", "dependents": "Number of dependents",
           "employment_years": "Short employment tenure", "inquiries_6m": "Recent credit inquiries"}


def load_artefact():
    if not os.path.exists(ART_PATH):
        raise FileNotFoundError("outputs/model.json missing. Run `python main.py` first.")
    with open(ART_PATH) as f:
        art = json.load(f)
    for k in ["coef", "mean", "scale"]:
        art[k] = np.array(art[k])
    return art


def score(art, payload):
    x = np.array([float(payload[f]) for f in art["features"]])
    contrib = (x - art["mean"]) / art["scale"] * art["coef"]
    p = 1 / (1 + np.exp(-(contrib.sum() + art["intercept"])))
    top = np.argsort(-contrib)[:3]
    return {"score": round(float(p), 4),
            "reasons": [REASONS[art["features"][i]] for i in top if contrib[i] > 0],
            "model_sha": art["model_sha"]}


if FastAPI is not None:
    app = FastAPI(title="score-api", version="1.0")
    ART = load_artefact() if os.path.exists(ART_PATH) else None

    class Applicant(BaseModel):
        revolving_utilization: float
        age: float
        times_30_59_late: float
        debt_ratio: float
        monthly_income: float
        open_credit_lines: float
        times_90_late: float
        real_estate_loans: float
        times_60_89_late: float
        dependents: float
        employment_years: float
        inquiries_6m: float

    @app.post("/score")
    def post_score(applicant: Applicant):
        if ART is None:
            raise HTTPException(status_code=503, detail="Model artefact not found. Run main.py first.")
        return score(ART, applicant.model_dump())

    @app.get("/health")
    def health():
        return {"status": "ok", "model_sha": ART["model_sha"] if ART else None}


if __name__ == "__main__":
    if FastAPI is None:
        print("fastapi is not installed. pip install fastapi uvicorn, or use score() directly.")
    else:
        import uvicorn
        uvicorn.run(app, host="127.0.0.1", port=8000)
