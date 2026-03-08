import { useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const API = "http://localhost:8000";

const MODE_CONFIG = {
  healthcare: {
    label: "Healthcare",
    emoji: "🏥",
    color: "#3b82f6",
    description: "Patient readmission risk prediction",
    fields: [
      { key: "age", label: "Age", min: 18, max: 90, default: 65 },
      { key: "time_in_hospital", label: "Days in Hospital", min: 1, max: 14, default: 5 },
      { key: "n_lab_procedures", label: "Lab Procedures", min: 0, max: 100, default: 40 },
      { key: "n_medications", label: "Medications", min: 0, max: 30, default: 12 },
      { key: "n_inpatient", label: "Prior Inpatient Visits", min: 0, max: 15, default: 1 },
      { key: "n_emergency", label: "Emergency Visits", min: 0, max: 10, default: 1 },
      { key: "has_diabetes", label: "Has Diabetes", min: 0, max: 1, default: 0 },
      { key: "has_heart_disease", label: "Has Heart Disease", min: 0, max: 1, default: 0 },
    ],
    hidden: { n_procedures: 2, n_outpatient: 0, num_diagnoses: 6, has_hypertension: 0, insulin_prescribed: 0, discharge_type: 1, admission_source: 1 }
  },
  fintech: {
    label: "Fintech",
    emoji: "💳",
    color: "#10b981",
    description: "Credit card fraud detection",
    fields: [
      { key: "Amount", label: "Transaction Amount ($)", min: 0, max: 5000, default: 150 },
      { key: "Time", label: "Time (seconds since first)", min: 0, max: 172800, default: 50000 },
      { key: "V1", label: "V1 (PCA Feature)", min: -5, max: 5, default: -1.36 },
      { key: "V2", label: "V2 (PCA Feature)", min: -5, max: 5, default: -0.07 },
      { key: "V3", label: "V3 (PCA Feature)", min: -5, max: 5, default: 2.53 },
      { key: "V4", label: "V4 (PCA Feature)", min: -5, max: 5, default: 1.38 },
    ],
    hidden: { V5: -0.34, V6: 0.46, V7: 0.24, V8: 0.10, V9: 0.36, V10: -0.07, V11: -0.22, V12: -0.16, V13: -0.16, V14: -0.45, V15: 0.06, V16: -0.08, V17: -0.07, V18: -0.27, V19: 0.22, V20: 0.21, V21: 0.02, V22: 0.27, V23: -0.11, V24: 0.07, V25: 0.13, V26: -0.19, V27: 0.13, V28: -0.02 }
  },
  saas: {
    label: "SaaS",
    emoji: "💻",
    color: "#8b5cf6",
    description: "Customer churn prediction",
    fields: [
      { key: "tenure", label: "Months as Customer", min: 0, max: 72, default: 12 },
      { key: "MonthlyCharges", label: "Monthly Charges ($)", min: 0, max: 120, default: 65 },
      { key: "TotalCharges", label: "Total Charges ($)", min: 0, max: 9000, default: 786 },
      { key: "Contract", label: "Contract (0=Month, 1=1yr, 2=2yr)", min: 0, max: 2, default: 0 },
      { key: "TechSupport", label: "Tech Support (0=No, 1=Yes)", min: 0, max: 1, default: 0 },
      { key: "OnlineSecurity", label: "Online Security (0=No, 1=Yes)", min: 0, max: 1, default: 0 },
    ],
    hidden: { SeniorCitizen: 0, Partner: 1, Dependents: 0, PhoneService: 1, MultipleLines: 0, OnlineBackup: 1, DeviceProtection: 0, StreamingTV: 1, StreamingMovies: 1, PaperlessBilling: 1, gender: 1, InternetService: 1, PaymentMethod: 2 }
  }
};

function RiskGauge({ score, level, color }) {
  return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <div style={{
        width: 180, height: 180, borderRadius: "50%",
        background: `conic-gradient(${color} ${score * 3.6}deg, #1e293b ${score * 3.6}deg)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto", boxShadow: `0 0 40px ${color}33`
      }}>
        <div style={{
          width: 140, height: 140, borderRadius: "50%",
          background: "#0f172a", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ fontSize: 40, fontWeight: "800", color }}>{score}</div>
          <div style={{ fontSize: 12, color: "#475569" }}>out of 100</div>
        </div>
      </div>
      <div style={{
        marginTop: 16, fontSize: 20, fontWeight: "700",
        color,
        letterSpacing: 3
      }}>
        {level === "HIGH" ? "⚠️" : level === "MEDIUM" ? "⚡" : "✅"} {level} RISK
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("healthcare");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const config = MODE_CONFIG[mode];

  const [inputs, setInputs] = useState(
    Object.fromEntries(config.fields.map(f => [f.key, f.default]))
  );

  const handleModeChange = (m) => {
    setMode(m);
    setResult(null);
    setError(null);
    const newConfig = MODE_CONFIG[m];
    setInputs(Object.fromEntries(newConfig.fields.map(f => [f.key, f.default])));
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const allFeatures = { ...inputs, ...config.hidden };
      const res = await axios.post(`${API}/predict`, {
        mode,
        features: allFeatures
      });
      setResult(res.data);
    } catch (e) {
      setError("API error — make sure backend is running on port 8000");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "#e2e8f0",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        borderBottom: "1px solid #1e293b",
        padding: "24px 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: "0 0 20px #3b82f633"
          }}>⚡</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: "800", color: "#f8fafc", letterSpacing: -0.5 }}>ARIA</div>
            <div style={{ fontSize: 12, color: "#475569" }}>Autonomous Risk & Intelligence Agent</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Avg AUC-ROC: <span style={{ color: "#10b981", fontWeight: "700" }}>0.873</span>
          </div>
          <div style={{
            background: "#0f172a", padding: "6px 14px",
            borderRadius: 20, fontSize: 12, color: "#10b981",
            border: "1px solid #10b98133", display: "flex", alignItems: "center", gap: 6
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }}></div>
            API Live
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>

        {/* Mode Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32, background: "#1e293b", padding: 6, borderRadius: 12, width: "fit-content" }}>
          {Object.entries(MODE_CONFIG).map(([m, c]) => (
            <button key={m} onClick={() => handleModeChange(m)}
              style={{
                padding: "10px 28px", borderRadius: 8, border: "none",
                cursor: "pointer", fontWeight: "600", fontSize: 14,
                background: mode === m ? c.color : "transparent",
                color: mode === m ? "#fff" : "#64748b",
                transition: "all 0.2s",
                boxShadow: mode === m ? `0 4px 14px ${c.color}44` : "none"
              }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* Input Form */}
          <div style={{
            background: "#1e293b", borderRadius: 16, padding: 28,
            border: `1px solid ${config.color}22`
          }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: "700", color: "#f1f5f9" }}>
                {config.emoji} {config.label} Risk Inputs
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                {config.description}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {config.fields.map(field => (
                <div key={field.key}>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, fontWeight: "500" }}>
                    {field.label}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                      type="range"
                      min={field.min}
                      max={field.max}
                      step={field.max > 100 ? 10 : 0.01}
                      value={inputs[field.key]}
                      onChange={e => setInputs({ ...inputs, [field.key]: parseFloat(e.target.value) })}
                      style={{ flex: 1, accentColor: config.color }}
                    />
                    <div style={{
                      minWidth: 52, textAlign: "right",
                      fontSize: 13, fontWeight: "700",
                      color: config.color
                    }}>
                      {inputs[field.key]}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handlePredict} disabled={loading}
              style={{
                width: "100%", padding: "14px", borderRadius: 10,
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                background: loading ? "#334155" : `linear-gradient(135deg, ${config.color}, ${config.color}cc)`,
                color: "#fff", fontSize: 15, fontWeight: "700",
                marginTop: 24, transition: "all 0.2s",
                boxShadow: loading ? "none" : `0 4px 20px ${config.color}44`
              }}>
              {loading ? "⏳ Analyzing..." : `🔍 Analyze Risk`}
            </button>
          </div>

          {/* Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {!result && !error && (
              <div style={{
                background: "#1e293b", borderRadius: 16, padding: 28,
                border: "1px solid #1e293b", height: "100%",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 12, color: "#334155"
              }}>
                <div style={{ fontSize: 48 }}>⚡</div>
                <div style={{ fontSize: 14, color: "#475569", textAlign: "center" }}>
                  Adjust the inputs and click<br />Analyze Risk to see predictions
                </div>
              </div>
            )}

            {error && (
              <div style={{
                background: "#450a0a", border: "1px solid #ef444444",
                borderRadius: 16, padding: 20, color: "#fca5a5"
              }}>
                ❌ {error}
              </div>
            )}

            {result && (
              <>
                {/* Gauge */}
                <div style={{
                  background: "#1e293b", borderRadius: 16, padding: 24,
                  border: `1px solid ${config.color}22`
                }}>
                  <RiskGauge score={result.risk_score} level={result.risk_level} color={config.color} />
                </div>

                {/* Bar Chart */}
                <div style={{
                  background: "#1e293b", borderRadius: 16, padding: 24,
                  border: `1px solid ${config.color}22`
                }}>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16, fontWeight: "600" }}>
                    Top Risk Drivers
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={result.top_factors} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" stroke="#334155" fontSize={11} />
                      <YAxis dataKey="feature" type="category" stroke="#334155" fontSize={11} width={130} tick={{ fill: "#94a3b8" }} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: `1px solid ${config.color}44`, borderRadius: 8 }}
                        formatter={(v) => [`${v} pts`, "Impact"]}
                        labelStyle={{ color: "#94a3b8" }}
                      />
                      <Bar dataKey="impact" radius={6}>
                        {result.top_factors.map((_, i) => (
                          <Cell key={i} fill={config.color} opacity={1 - i * 0.25} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}