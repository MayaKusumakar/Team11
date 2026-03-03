from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import model as ml


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    ml.load_all_artifacts()
    yield


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="FakeReview Detector API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ReviewIn(BaseModel):
    text:   Annotated[str, Field(min_length=1)]
    rating: float


class PredictionOut(BaseModel):
    label:      str    # "Fake" | "Real" | "Uncertain"
    confidence: float  # raw sigmoid output (0-1)


class BatchRequest(BaseModel):
    reviews:  Annotated[list[ReviewIn], Field(min_length=1, max_length=200)]
    model_id: str = "lstm"  # which model to use — must exist in REGISTRY


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/models")
def list_models():
    """Returns all available models and their display metadata."""
    return [
        {"id": mid, **meta}
        for mid, meta in ml.MODEL_META.items()
        if mid in ml.REGISTRY
    ]


@app.post("/predict/batch", response_model=list[PredictionOut])
def predict_batch(body: BatchRequest):
    try:
        model   = ml.get_model(body.model_id)
        reviews = [r.model_dump() for r in body.reviews]
        return model.predict_batch(reviews)
    except KeyError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
