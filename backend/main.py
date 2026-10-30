"""FastAPI application for OBD-II Problem Detector.

Runs locally with `python main.py` (port 8000) and on Vercel as the `backend` service
(see vercel.json). Nothing here keeps state between requests.
"""

import asyncio
import os
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

import db
from schemas import LiveRequest, PredictionResponse, SchemaResponse, VehicleInput
from model import get_model, get_schema
from simulation import get_live_prediction

app = FastAPI(
    title="OBD-II Problem Detector API",
    description="Predict vehicle problems using XGBoost classifier",
    version="2.0.0",
)

# Only needed when the frontend is served from another origin (the Vite dev server proxies /api).
_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/api/schema", response_model=SchemaResponse)
async def get_form_schema():
    """Get the form field schema for the frontend."""
    return get_schema()


@app.post("/api/predict", response_model=PredictionResponse)
async def predict(input_data: VehicleInput):
    """Predict whether a vehicle has a problem, and store the check."""
    raw = input_data.model_dump()
    label, pred_class, probability = get_model().predict(raw)
    saved = await asyncio.to_thread(db.save_prediction, "manual", raw, label, pred_class, probability)

    return PredictionResponse(
        saved=saved,
        prediction=label,
        prediction_class=pred_class,
        probability=probability,
        input_summary=raw,
    )


@app.post("/api/live")
async def live(req: LiveRequest):
    """Current simulated reading for the client's vehicle; stored when `save` is set."""
    data = get_live_prediction(req.vehicle.model_dump(), req.started_at)
    if req.save:
        data["saved"] = await asyncio.to_thread(
            db.save_prediction, "live", data["vehicle_data"], data["prediction"],
            data["prediction_class"], data["probability"], data["driving_mode"],
        )
    return data


@app.get("/api/history")
async def get_history(source: Optional[str] = None, limit: int = Query(100, ge=1, le=500)):
    """Get saved predictions from Supabase, newest first."""
    try:
        rows = await asyncio.to_thread(db.list_predictions, source, limit)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return {"entries": rows}


@app.get("/api/db/status")
async def get_db_status():
    """Report whether Supabase is reachable and the table exists."""
    return await asyncio.to_thread(db.status)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
