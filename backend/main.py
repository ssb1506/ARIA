from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd

app = FastAPI(title="ARIA — Autonomous Risk & Intelligence Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Paths ──────────────────────────────────────────────────
USERNAME = "shreya"
BASE_PATH = f"/Users/{USERNAME}/Desktop/ARIA"
MODEL_PATH = f"{BASE_PATH}/models"

# ── Load models ────────────────────────────────────────────
model_hc   = joblib.load(f"{MODEL_PATH}/healthcare_model.pkl")
model_ft   = joblib.load(f"{MODEL_PATH}/fintech_model.pkl")
model_saas = joblib.load(f"{MODEL_PATH}/saas_model.pkl")

features_hc   = joblib.load(f"{MODEL_PATH}/healthcare_features.pkl")
features_ft   = joblib.load(f"{MODEL_PATH}/fintech_features.pkl")
features_saas = joblib.load(f"{MODEL_PATH}/saas_features.pkl")

MODELS = {
    "healthcare": (model_hc,   features_hc),
    "fintech":    (model_ft,   features_ft),
    "saas":       (model_saas, features_saas),
}

print("✅ All models loaded")

# ── Request schema ─────────────────────────────────────────
class PredictRequest(BaseModel):
    mode: str
    features: dict

# ── Helper ─────────────────────────────────────────────────
def get_top_factors(model, features):
    importances = model.feature_importances_
    factors = sorted(
        zip(features, importances),
        key=lambda x: abs(x[1]),
        reverse=True
    )[:3]
    return [
        {"feature": str(f), "impact": round(float(v) * 100, 1)}
        for f, v in factors
    ]

def predict_risk(model, features, input_dict, mode):
    df = pd.DataFrame([input_dict])[features]
    prob = float(model.predict_proba(df)[0][1])
    risk_score = round(prob * 100, 1)
    return {
        "risk_score": risk_score,
        "risk_level": (
            "HIGH"   if risk_score >= 70 else
            "MEDIUM" if risk_score >= 40 else
            "LOW"
        ),
        "top_factors": get_top_factors(model, features),
        "mode": mode
    }

# ── Routes ─────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "ARIA API is running ✅"}

@app.get("/health")
def health():
    return {"status": "healthy", "models_loaded": list(MODELS.keys())}

@app.post("/predict")
def predict(req: PredictRequest):
    if req.mode not in MODELS:
        return {"error": f"Invalid mode. Choose from: {list(MODELS.keys())}"}
    model, features = MODELS[req.mode]
    return predict_risk(model, features, req.features, req.mode)

@app.get("/features/{mode}")
def get_features(mode: str):
    if mode not in MODELS:
        return {"error": "Invalid mode"}
    _, features = MODELS[mode]
    return {"mode": mode, "features": features}