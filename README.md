# ⚡ ARIA — Autonomous Risk & Intelligence Agent

> An agentic AI system that accepts plain English descriptions and automatically routes to the correct ML model across healthcare, fintech, and SaaS risk domains.

🌐 **Live Demo:** [ssb1506.github.io/ARIA](https://ssb1506.github.io/ARIA)  
🔗 **Backend API:** [aria-backend-250616154845.us-central1.run.app](https://aria-backend-250616154845.us-central1.run.app)

---

## What is ARIA?

ARIA is a multi-domain risk prediction platform powered by XGBoost and Gemini AI. You describe a situation in plain English — a patient profile, a financial transaction, or a SaaS customer — and ARIA automatically:

1. **Routes** your input to the correct domain (healthcare / fintech / SaaS)
2. **Extracts** structured features from natural language using Gemini
3. **Predicts** a risk score using a trained XGBoost model
4. **Explains** the result in plain English with top risk drivers

---

## Model Performance

| Domain | Task | AUC-ROC | Dataset |
|--------|------|---------|---------|
| 🏥 Healthcare | Hospital Readmission | 0.6273 | UCI Diabetes Readmission (100K rows) |
| 💳 Fintech | Fraud Detection | **0.9923** | Kaggle Credit Card Fraud (284K rows) |
| 📦 SaaS | Customer Churn | **0.9378** | Telco Churn Dataset |
| | **Average** | **0.852** | |

> Healthcare AUC reflects the inherent complexity of the readmission prediction task — a known challenge in clinical ML literature.

---

## Architecture

```
User (Plain English)
        │
        ▼
  React Chat UI (GitHub Pages)
        │
        ▼
  FastAPI Backend (GCP Cloud Run)
        │
   ┌────┴────┐
   │  Gemini  │  ← Domain routing + feature extraction + explanation
   └────┬────┘
        │
   ┌────▼─────────────────────┐
   │   XGBoost Model Router   │
   ├──────────┬───────┬───────┤
   │Healthcare│Fintech│  SaaS │
   └──────────┴───────┴───────┘
        │
        ▼
  Risk Score + Top Factors + Explanation
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| ML Models | XGBoost, scikit-learn, SHAP |
| AI Agent | Google Gemini 2.5 Flash (google-genai SDK) |
| Backend | FastAPI, Python 3.11 |
| Frontend | React, Recharts |
| Deployment | GCP Cloud Run (backend), GitHub Pages (frontend) |
| Containerization | Docker |

---

## Example Inputs

**Healthcare:**
```
72 year old diabetic patient, 8 days in hospital, 3 prior inpatient visits, has heart disease
```

**Fintech:**
```
$4500 transaction at 2am, card used in 3 different countries in past hour
```

**SaaS:**
```
Customer on month-to-month contract, no tech support, fiber internet, been with us 2 months
```

---

## Project Structure

```
ARIA/
├── backend/
│   └── main.py              # FastAPI app — routing, prediction, Gemini pipeline
├── frontend/
│   └── aria-ui/             # React chat interface
├── models/
│   ├── healthcare_model.pkl
│   ├── fintech_model.pkl
│   └── saas_model.pkl
├── notebooks/
│   ├── 01_healthcare_eda.ipynb
│   ├── 02_fintech_eda.ipynb
│   ├── 03_saas_eda.ipynb
│   ├── 04_model_training.ipynb
│   └── 05_shap_explainability.ipynb
├── data/
├── Dockerfile
└── requirements.txt
```

---

## Running Locally

**Backend:**
```bash
git clone https://github.com/ssb1506/ARIA.git
cd ARIA
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
echo "GEMINI_API_KEY=your_key_here" > .env
uvicorn backend.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend/aria-ui
npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```

---

## API Usage

```bash
curl -X POST https://aria-backend-250616154845.us-central1.run.app/analyze \
  -H "Content-Type: application/json" \
  -d '{"message": "72 year old diabetic patient, 8 days in hospital"}'
```

**Response:**
```json
{
  "domain": "healthcare",
  "risk_score": 21.2,
  "risk_level": "LOW",
  "top_factors": [
    {"feature": "age", "impact": 15.5},
    {"feature": "has_diabetes", "impact": 14.0}
  ],
  "explanation": "...",
  "status": "success"
}
```

---

## Key Features

- **Zero UI friction** — no forms, no dropdowns, just plain English
- **Agentic pipeline** — Gemini autonomously decides domain, extracts features, explains results
- **Multi-domain** — one interface handles healthcare, fintech, and SaaS
- **Explainable AI** — SHAP-based top risk drivers surfaced for every prediction
- **Production deployed** — Docker + GCP Cloud Run + GitHub Pages

---

## Limitations & Future Work

- Healthcare AUC (0.63) is limited by label noise in the UCI readmission dataset
- Safety Guard (DistilBERT prompt injection blocker) — in progress
- GitHub Actions CI/CD — planned

---

*Built as a portfolio project demonstrating end-to-end ML engineering: data → model → API → UI → cloud deployment.*
