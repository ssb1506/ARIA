from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
from google import genai
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()
gemini = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
GEMINI_MODEL = "gemini-2.5-flash"

app = FastAPI(title="ARIA — Autonomous Risk & Intelligence Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_PATH, "models")

model_hc   = joblib.load(f"{MODEL_PATH}/healthcare_model.pkl")
model_ft   = joblib.load(f"{MODEL_PATH}/fintech_model.pkl")
model_saas = joblib.load(f"{MODEL_PATH}/saas_model.pkl")

features_hc   = joblib.load(f"{MODEL_PATH}/healthcare_features.pkl")
features_ft   = joblib.load(f"{MODEL_PATH}/fintech_features.pkl")
features_saas = joblib.load(f"{MODEL_PATH}/saas_features.pkl")

MODELS = {
    "healthcare": (model_hc, features_hc),
    "fintech":    (model_ft, features_ft),
    "saas":       (model_saas, features_saas),
}

print("✅ All models loaded")
FINTECH_DEFAULTS = {
    "Time": 94813.0, "V1": -0.07, "V2": 0.05, "V3": 0.12,
    "V4": 0.07, "V5": -0.05, "V6": 0.03, "V7": 0.03,
    "V8": -0.01, "V9": 0.02, "V10": 0.02, "V11": 0.02,
    "V12": -0.02, "V13": 0.00, "V14": -0.02, "V15": 0.01,
    "V16": -0.01, "V17": -0.02, "V18": 0.00, "V19": 0.00,
    "V20": 0.00, "V21": 0.00, "V22": 0.00, "V23": 0.00,
    "V24": 0.00, "V25": 0.00, "V26": 0.00, "V27": 0.00,
    "V28": 0.00, "Amount": 88.0
}

# Fraud-like PCA pattern (from actual fraud cases in dataset)
FINTECH_FRAUD_SIGNAL = {
    "V1": -3.0, "V2": 3.5, "V3": -4.0, "V4": 2.5,
    "V10": -4.0, "V11": -1.5, "V12": -5.0, "V14": -8.0,
    "V16": -2.0, "V17": -7.0
}
class AnalyzeRequest(BaseModel):
    message: str

def ask_gemini(prompt: str) -> str:
    response = gemini.models.generate_content(model=GEMINI_MODEL, contents=prompt)
    return response.text.strip()

def route_domain(message: str) -> str:
    prompt = f"""You are a risk analysis router. Given a user message, determine which domain it belongs to.

Domains:
- healthcare: mentions patients, hospital, medical, diagnosis, readmission, diabetes, medications, clinical
- fintech: mentions transactions, fraud, credit card, payment, bank, amount, suspicious charge
- saas: mentions customer, subscription, churn, cancel, monthly plan, software, tenure, contract
- unknown: message is gibberish, random text, or doesn't fit any domain

User message: "{message}"

Reply with ONLY one word: healthcare, fintech, saas, or unknown"""

    domain = ask_gemini(prompt).lower().strip()
    if domain not in ["healthcare", "fintech", "saas"]:
        return "unknown"
    return domain

def extract_features(message: str, domain: str) -> dict:
    if domain == "healthcare":
        prompt = f"""Extract patient features from this text and return ONLY a JSON object.

Text: "{message}"

Return this exact JSON with values filled in (use defaults if not mentioned):
{{
  "age": <number, default 65>,
  "time_in_hospital": <days, default 5>,
  "n_lab_procedures": <number, default 40>,
  "n_procedures": <number, default 2>,
  "n_medications": <number, default 12>,
  "n_outpatient": <number, default 0>,
  "n_inpatient": <number, default 1>,
  "n_emergency": <number, default 0>,
  "num_diagnoses": <number, default 6>,
  "has_diabetes": <1 if mentioned else 0>,
  "has_hypertension": <1 if mentioned else 0>,
  "has_heart_disease": <1 if mentioned else 0>,
  "insulin_prescribed": <1 if mentioned else 0>,
  "discharge_type": <number, default 1>,
  "admission_source": <number, default 1>
}}

Return ONLY the JSON, no explanation."""

    elif domain == "fintech":
        prompt = f"""Extract transaction features from this text and return ONLY a JSON object.

Text: "{message}"

Return this exact JSON:
{{
  "Amount": <transaction amount as number, default 88>,
  "Time": <time of day in seconds 0-86400, if night/late/2am/3am use 75000, default 50000>
}}

Return ONLY the JSON, no explanation."""

    else:
        prompt = f"""Extract customer features from this text and return ONLY a JSON object.

Text: "{message}"

Return this exact JSON with values filled in (use defaults if not mentioned):
{{
  "tenure": <months as customer, default 12>,
  "MonthlyCharges": <monthly cost in dollars, default 65>,
  "TotalCharges": <total paid, default 780>,
  "Contract": <0 for month-to-month, 1 for one year, 2 for two year, default 0>,
  "TechSupport": <1 if has tech support else 0>,
  "OnlineSecurity": <1 if has online security else 0>,
  "PaperlessBilling": <1 if paperless else 0>,
  "SeniorCitizen": <1 if senior else 0>,
  "Partner": <1 if has partner else 0>,
  "Dependents": <1 if has dependents else 0>,
  "PhoneService": <1, default>,
  "MultipleLines": <0, default>,
  "OnlineBackup": <1, default>,
  "DeviceProtection": <0, default>,
  "StreamingTV": <0, default>,
  "StreamingMovies": <0, default>,
  "gender": <1, default>,
  "InternetService": <1, default>,
  "PaymentMethod": <2, default>
}}

Return ONLY the JSON, no explanation."""

    text = ask_gemini(prompt)
    text = text.replace("```json", "").replace("```", "").strip()
    features = json.loads(text)

    if domain == "fintech":
        full = FINTECH_DEFAULTS.copy()
        # Blend fraud signal based on suspicion level
        amount = float(features.get("Amount", 88))
        time = float(features.get("Time", 50000))
        is_night = time > 64800 or time < 21600  # after 6pm or before 6am
        is_large = amount > 1000
        is_very_large = amount > 3000

        if is_very_large and is_night:
            # High fraud signal
            for k, v in FINTECH_FRAUD_SIGNAL.items():
                full[k] = v * 0.9
        elif is_large or is_night:
            # Medium fraud signal
            for k, v in FINTECH_FRAUD_SIGNAL.items():
                full[k] = v * 0.5
        full.update(features)
        return full

    return features

def predict(domain: str, features: dict) -> dict:
    model, feature_list = MODELS[domain]
    df = pd.DataFrame([features])[feature_list]
    prob = float(model.predict_proba(df)[0][1])
    risk_score = round(prob * 100, 1)

    importances = model.feature_importances_
    top = sorted(zip(feature_list, importances), key=lambda x: x[1], reverse=True)[:3]
    top_factors = [{"feature": str(f), "impact": round(float(v) * 100, 1)} for f, v in top]

    return {
        "risk_score": risk_score,
        "risk_level": "HIGH" if risk_score >= 70 else "MEDIUM" if risk_score >= 40 else "LOW",
        "top_factors": top_factors
    }

def explain(message: str, domain: str, prediction: dict) -> str:
    factors = ", ".join([f["feature"].replace("_", " ") for f in prediction["top_factors"]])
    prompt = f"""You are ARIA, an AI risk analyst. A user described this case:

"{message}"

Domain: {domain}
Risk Level: {prediction['risk_level']}
Top driving factors: {factors}

Write 2-3 sentences in plain English explaining this risk assessment.
Be specific to the details the user provided. End with one concrete actionable recommendation.
Do not use bullet points. Do not mention any score numbers."""

    return ask_gemini(prompt)

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    try:
        domain = route_domain(req.message)

        if domain == "unknown":
            return {
                "domain": "unknown",
                "status": "unclear",
                "explanation": "I couldn't identify a clear risk scenario. Try describing a patient, a financial transaction, or a customer situation."
            }

        features = extract_features(req.message, domain)
        prediction = predict(domain, features)
        explanation = explain(req.message, domain, prediction)

        return {
            "domain": domain,
            "risk_score": prediction["risk_score"],
            "risk_level": prediction["risk_level"],
            "top_factors": prediction["top_factors"],
            "explanation": explanation,
            "status": "success"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/")
def root():
    return {"message": "ARIA API is running ✅"}

@app.get("/health")
def health():
    return {"status": "healthy", "models_loaded": list(MODELS.keys())}