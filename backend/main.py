from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from model import load_all_artifacts, get_model

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictIn(BaseModel):
    text: str = Field(min_length=1)
    rating: Optional[float] = 5

@app.on_event("startup")
def _startup():
    load_all_artifacts()

@app.post("/predict")
def predict(body: PredictIn):
    mdl = get_model("lstm")
    out = mdl.predict_batch([{"text": body.text, "rating": float(body.rating or 5)}])[0]

    # out: {"label": "Fake"|"Real"|"Uncertain", "confidence": prob(0..1)}
    return {
        "label": out["label"].lower(),       
        "confidence": out["confidence"],     
        "reasons": [],
        "signals": [],
    }