"""
Model registry for FakeReview Detector.

How to add a new model
──────────────────────
1. Subclass BaseReviewModel and implement predict_batch().
2. Add an entry to REGISTRY with a unique model_id.
3. If the model needs artifacts loaded at startup, call its load() method
   inside load_all_artifacts() in this file.

Current models
──────────────
  lstm  – BiLSTM trained in Keras (model.h5 + tokenizer.pkl + scaler.pkl)

Planned / drop-in additions
────────────────────────────
  deberta  – fine-tune microsoft/deberta-v3-small on the same dataset,
             save with model.save_pretrained("deberta/"), add a DeBERTaModel
             subclass below, register it, and load it in load_all_artifacts().
"""

from __future__ import annotations
import pickle
import os
from abc import ABC, abstractmethod

import numpy as np


# ─── Abstract base ───────────────────────────────────────────────────────────

class BaseReviewModel(ABC):
    @abstractmethod
    def predict_batch(self, reviews: list[dict]) -> list[dict]:
        """
        Args:
            reviews: list of {"text": str, "rating": float}
        Returns:
            list of {"label": "Fake"|"Real"|"Uncertain", "confidence": float}
        """


def _label_from_prob(prob: float) -> dict:
    """Shared threshold logic for all models that output a 0-1 probability."""
    if prob > 0.60:
        label = "Fake"
    elif prob < 0.40:
        label = "Real"
    else:
        label = "Uncertain"
    return {"label": label, "confidence": round(float(prob), 4)}


# ─── LSTM model (current default) ───────────────────────────────────────────

class LSTMModel(BaseReviewModel):
    MAX_VOCAB_SIZE     = 15000
    MAX_SEQUENCE_LENGTH = 100

    def __init__(self):
        self._model     = None
        self._tokenizer = None
        self._scaler    = None

    def load(self):
        import tensorflow as tf
        from tensorflow.keras.preprocessing.sequence import pad_sequences
        from tensorflow.keras.layers import (
            Input, Embedding, SpatialDropout1D, Bidirectional, LSTM,
            GlobalAveragePooling1D, GlobalMaxPooling1D, Concatenate,
            Dense, Dropout
        )
        from tensorflow.keras.models import Model

        self._pad_sequences = pad_sequences

        # --- load tokenizer + scaler ---
        from tensorflow.keras.preprocessing.text import tokenizer_from_json

        with open("tokenizer.json", "r") as f:
            tokenizer_json_str = f.read()

        self._tokenizer = tokenizer_from_json(tokenizer_json_str)
        
        import numpy as np

        params = np.load("scaler_params.npz")
        mean = params["mean"]
        scale = params["scale"]

        def _scale_ratings(ratings: np.ndarray) -> np.ndarray:
            return (ratings - mean) / scale

        self._scale_ratings = _scale_ratings

        embed_dim = 64
        lstm_units = 32

        text_input = Input(shape=(self.MAX_SEQUENCE_LENGTH,), name="text_input")
        rating_input = Input(shape=(1,), name="rating_input")

        x = Embedding(self.MAX_VOCAB_SIZE, embed_dim)(text_input)
        x = SpatialDropout1D(0.3)(x)
        x = Bidirectional(LSTM(lstm_units, return_sequences=True))(x)

        avg_pool = GlobalAveragePooling1D()(x)
        max_pool = GlobalMaxPooling1D()(x)
        text_features = Concatenate()([avg_pool, max_pool])

        r = Dense(8, activation="relu")(rating_input)

        merged = Concatenate()([text_features, r])
        merged = Dropout(0.4)(merged)
        merged = Dense(16, activation="relu")(merged)
        output = Dense(1, activation="sigmoid")(merged)

        self._model = Model(inputs=[text_input, rating_input], outputs=output)

       
        self._model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])

        
        weights_path = "weights.weights.h5"  
        if not os.path.exists(weights_path):
            raise FileNotFoundError(
                f"Missing {weights_path}. In Colab run: model.save_weights('weights.weights.h5') "
                "and put the file next to model.py."
            )

        self._model.load_weights(weights_path)

        print(f"[lstm] Loaded weights from {weights_path}. Inputs: {[i.name for i in self._model.inputs]}")

    def predict_batch(self, reviews: list[dict]) -> list[dict]:
        texts   = [r["text"] for r in reviews]
        ratings = np.array([[r["rating"]] for r in reviews], dtype=np.float32)

        sequences = self._tokenizer.texts_to_sequences(texts)
        padded    = self._pad_sequences(
            sequences,
            maxlen=self.MAX_SEQUENCE_LENGTH,
            padding="post",
            truncating="post",
        )
        ratings_scaled = self._scale_ratings(ratings)
        preds          = self._model.predict([padded, ratings_scaled], verbose=0)

        return [_label_from_prob(float(p[0])) for p in preds]


# ─── DeBERTa model (uncomment after fine-tuning) ─────────────────────────────
# Expects a `deberta/` folder in api/ produced by the fine-tuning notebook.
# Add to requirements.txt:  transformers==4.47.0  sentencepiece==0.2.0

# class DeBERTaModel(BaseReviewModel):
#     MAX_LENGTH = 256
#
#     def __init__(self):
#         self._pipeline = None
#
#     def load(self):
#         from transformers import pipeline
#         self._pipeline = pipeline(
#             "text-classification",
#             model="./deberta",   # fine-tuned model directory
#             tokenizer="./deberta",
#             device=-1,           # -1 = CPU; use 0 for GPU
#             truncation=True,
#             max_length=self.MAX_LENGTH,
#         )
#         print("[deberta] Loaded.")
#
#     def predict_batch(self, reviews: list[dict]) -> list[dict]:
#         # Prepend rating exactly as done during fine-tuning
#         texts = [
#             f"[RATING: {max(1, min(5, int(round(r['rating']))))}] {r['text']}"
#             for r in reviews
#         ]
#         raw = self._pipeline(texts)
#         results = []
#         for p in raw:
#             # id2label was set to {0: "Real", 1: "Fake"} during training
#             prob = p["score"] if p["label"] == "Fake" else 1.0 - p["score"]
#             results.append(_label_from_prob(prob))
#         return results
# ─────────────────────────────────────────────────────────────────────────────


# ─── Registry ────────────────────────────────────────────────────────────────

REGISTRY: dict[str, BaseReviewModel] = {
    "lstm": LSTMModel(),
    # "deberta": DeBERTaModel(),   ← uncomment after adding the class above
}

# Human-readable display names for the extension popup
MODEL_META = {
    "lstm": {
        "label":       "BiLSTM (default)",
        "description": "Custom-trained BiLSTM. Fast, lightweight.",
    },
    # "deberta": {
    #     "label":       "DeBERTa-v3-small",
    #     "description": "Fine-tuned transformer. Higher accuracy, slower.",
    # },
}


def load_all_artifacts():
    """Called once at server startup — loads every registered model."""
    for model_id, model in REGISTRY.items():
        print(f"[registry] Loading '{model_id}' …")
        model.load()
    print(f"[registry] Ready. Models: {list(REGISTRY)}")


def get_model(model_id: str) -> BaseReviewModel:
    if model_id not in REGISTRY:
        raise KeyError(f"Unknown model_id '{model_id}'. Available: {list(REGISTRY)}")
    return REGISTRY[model_id]
