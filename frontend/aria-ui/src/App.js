import { useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const API = "http://localhost:8000";

// ── Default inputs per mode ─────────────────────────────
const DEFAULTS = {
  healthcare: {
    age: 65, time_in_hospital: 5, n_lab_procedures: 40,
    n_procedures: 2, n_medications: 12, n_outpatient: 0,
    n_inpatient: 1, n_emergency: 1, num_diagnoses: 6,
    has_diabetes: 1, has_hypertension: 0, has_heart_disease: 0,
    insulin_prescribed: 0, discharge_type: 1, admission_source: 1
  },
  fintech: {
    Time: 50000, V1: -1.36, V2: -0.07, V3: 2.53, V4: 1.38,
    V5: -0.34, V6: 0.46, V7: 0.24, V8: 0.10, V9: 0.36,
    V10: -0.07, V11: -0.22, V12: -0.16, V13: -0.16, V14: -0.45,
    V15: 0.06, V16: -0.08, V17: -0.07, V18: -0.27, V19: 0.22,
    V20: 0.21, V21: 0.02, V22: 0.27, V23: -0.11, V24: 0.07,
    V25: 0.13, V26: -0.19, V27: 0.13, V28: -0.02, Amount: 149.62
  },
  saas: {
    tenure: 12, MonthlyCharges: 65.5, TotalCharges: 786,
    SeniorCitizen: 0, Partner: 1, Dependents: 0,
    PhoneService: 1, MultipleLines: 0, OnlineSecurity: 0,
    OnlineBackup: 1, DeviceProtection: 0, TechSupport: 0,
    StreamingTV: 1, StreamingMovies: 1, PaperlessBilling: 1,
    gender: 1, InternetService: 1, Contract: 0,
    PaymentMethod: 2
  }
};

const MODE_LABELS = {
  healthcare: "🏥 Healthcare",
  fintech: "💳 Fintech",
  saas: "💻 SaaS"
};

const MODE_COLORS = {
  healthcare: "#3b82f6",
  fintech: "#10b981",
  saas: "#8b5cf6"
};

// ── Risk Gauge ──────────────────────────────────────────
function RiskGauge({ score, level }) {
  const color = level === "HIGH" ? "#ef4444" : level === "MEDIUM" ? "#f59e0b" : "#10b981";
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <div style={{
        width: 160, height: 160, borderRadius: "50%",
        background: `conic-gradient(${color} ${score * 3.6}deg, #1e293b ${score * 3.6}deg)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto", boxShadow: `0 0 30px ${color}44`
      }}>
        <div style={{
          width: 120, height: 120, borderRadius: "50%",
          background: "#0f172a", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ fontSize: 32, fontWeight: "bold", color }}>{score}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>/ 100</div>
        </div>
      </div>
      <div style={{
        marginTop: 12, fontSize: 18, fontWeight: "bold",
        color, letterSpacing: 2
      }}>
        {level === "HIGH" ? "⚠️" : level === "MEDIUM" ? "⚡" : "✅"} {level} RISK
      </div>
    </div>
  );
}

// ── Main App ────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState("healthcare");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await axios.post(`${API}/predict`, {
        mode,
        features: DEFAULTS[mode]
      });
      setResult(res.data);
    } catch (e) {
      setError("API error — make sure backend is running");
    }
    setLoading(false);
  };

  const accentColor = MODE_COLORS[mode];

  return (
    <div style={{
      minHeight: "100vh", background: "#0f172a",
      color: "#e2e8f0", fontFamily: "'Inter', sans-serif",
      padding: "0 0 60px 0"
    }}>

      {/* Header */}
      <div style={{
        background: "#1e293b", borderBottom: "1px solid #334155",
        padding: "20px 40px", display: "flex",
        alignItems: "center", justifyContent: "space-between"
      }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#f8fafc" }}>
            ARIA
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Autonomous Risk & Intelligence Agent
          </div>
        </div>
        <div style={{
          background: "#0f172a", padding: "6px 14px",
          borderRadius: 20, fontSize: 12, color: "#10b981",
          border: "1px solid #10b98133"
        }}>
          ● API Connected
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>

        {/* Mode Tabs */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          {Object.keys(DEFAULTS).map(m => (
            <button key={m} onClick={() => { setMode(m); setResult(null); }}
              style={{
                padding: "10px 24px", borderRadius: 8, border: "none",
                cursor: "pointer", fontWeight: "600", fontSize: 14,
                background: mode === m ? MODE_COLORS[m] : "#1e293b",
                color: mode === m ? "#fff" : "#94a3b8",
                transition: "all 0.2s",
                boxShadow: mode === m ? `0 0 20px ${MODE_COLORS[m]}66` : "none"
              }}>
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        {/* Info Card */}
        <div style={{
          background: "#1e293b", borderRadius: 12, padding: "20px 24px",
          marginBottom: 24, border: `1px solid ${accentColor}33`
        }}>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>
            Sample Input — {MODE_LABELS[mode]}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.8 }}>
            {Object.entries(DEFAULTS[mode]).slice(0, 6).map(([k, v]) => (
              <span key={k} style={{ marginRight: 16 }}>
                <span style={{ color: accentColor }}>{k}</span>: {v}
              </span>
            ))}
            <span style={{ color: "#475569" }}>...and more</span>
          </div>
        </div>

        {/* Predict Button */}
        <button onClick={handlePredict} disabled={loading}
          style={{
            width: "100%", padding: "16px", borderRadius: 10,
            border: "none", cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "#334155" : accentColor,
            color: "#fff", fontSize: 16, fontWeight: "bold",
            marginBottom: 32, transition: "all 0.2s",
            boxShadow: loading ? "none" : `0 0 30px ${accentColor}44`
          }}>
          {loading ? "⏳ Analyzing..." : `🔍 Analyze ${MODE_LABELS[mode]} Risk`}
        </button>

        {/* Error */}
        {error && (
          <div style={{
            background: "#450a0a", border: "1px solid #ef4444",
            borderRadius: 8, padding: 16, color: "#fca5a5", marginBottom: 24
          }}>
            ❌ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* Risk Gauge */}
            <div style={{
              background: "#1e293b", borderRadius: 12,
              padding: 24, border: `1px solid ${accentColor}33`
            }}>
              <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 16 }}>
                Risk Score
              </div>
              <RiskGauge score={result.risk_score} level={result.risk_level} />
            </div>

            {/* Top Factors */}
            <div style={{
              background: "#1e293b", borderRadius: 12,
              padding: 24, border: `1px solid ${accentColor}33`
            }}>
              <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 16 }}>
                Top Risk Factors
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={result.top_factors} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis dataKey="feature" type="category" stroke="#64748b" fontSize={11} width={120} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: `1px solid ${accentColor}` }}
                    formatter={(v) => [`${v} pts`, "Impact"]}
                  />
                  <Bar dataKey="impact" radius={4}>
                    {result.top_factors.map((_, i) => (
                      <Cell key={i} fill={accentColor} opacity={1 - i * 0.2} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Raw JSON */}
            <div style={{
              background: "#1e293b", borderRadius: 12, padding: 24,
              border: "1px solid #334155", gridColumn: "1 / -1"
            }}>
              <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 12 }}>
                API Response
              </div>
              <pre style={{
                background: "#0f172a", padding: 16, borderRadius: 8,
                fontSize: 12, color: "#10b981", overflow: "auto",
                margin: 0
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}