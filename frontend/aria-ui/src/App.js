import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const API = "http://localhost:8000";

const DOMAIN_CONFIG = {
  healthcare: { color: "#3b82f6", emoji: "🏥", label: "Healthcare" },
  fintech:    { color: "#10b981", emoji: "💳", label: "Fintech" },
  saas:       { color: "#8b5cf6", emoji: "💻", label: "SaaS" },
};

const FEATURE_LABELS = {
  age: "Age", time_in_hospital: "Hospital Stay", n_lab_procedures: "Lab Procedures",
  n_medications: "Medications", n_inpatient: "Prior Inpatient", n_emergency: "Emergency Visits",
  has_diabetes: "Diabetes", has_heart_disease: "Heart Disease", has_hypertension: "Hypertension",
  V14: "Transaction Pattern A", V4: "Transaction Pattern B", V12: "Transaction Pattern C",
  V17: "Transaction Pattern D", V10: "Transaction Pattern E", Amount: "Transaction Amount",
  Time: "Transaction Time",
  Contract: "Contract Type", InternetService: "Internet Service", OnlineSecurity: "Online Security",
  tenure: "Tenure", MonthlyCharges: "Monthly Charges", TechSupport: "Tech Support",
};

const EXAMPLES = [
  "72 year old diabetic patient, 8 days in hospital, 3 prior inpatient visits, has heart disease",
  "$4,500 transaction at 2am from a new account opened 2 weeks ago",
  "Customer on month-to-month plan, no tech support, paying $85/month, only been with us 3 months",
];

function RiskGauge({ score, level, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 120, height: 120, borderRadius: "50%",
        background: `conic-gradient(${color} ${score * 3.6}deg, #1e293b ${score * 3.6}deg)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto", boxShadow: `0 0 24px ${color}33`
      }}>
        <div style={{
          width: 90, height: 90, borderRadius: "50%",
          background: "#0f172a", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ fontSize: 26, fontWeight: "800", color }}>{score}</div>
          <div style={{ fontSize: 10, color: "#475569" }}>/ 100</div>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, fontWeight: "700", color, letterSpacing: 2 }}>
        {level === "HIGH" ? "⚠️" : level === "MEDIUM" ? "⚡" : "✅"} {level} RISK
      </div>
    </div>
  );
}

function ResultCard({ result }) {
  const config = DOMAIN_CONFIG[result.domain] || DOMAIN_CONFIG["healthcare"];

  if (result.status === "unclear") {
    return (
      <div style={{
        background: "#1e293b", borderRadius: 12, padding: 20,
        border: "1px solid #334155", marginTop: 8,
        fontSize: 13, color: "#94a3b8", lineHeight: 1.7
      }}>
        🤔 {result.explanation}
      </div>
    );
  }

  return (
    <div style={{
      background: "#1e293b", borderRadius: 12, padding: 20,
      border: `1px solid ${config.color}33`, marginTop: 8
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: `${config.color}22`, border: `1px solid ${config.color}44`,
        borderRadius: 20, padding: "4px 12px", fontSize: 12,
        color: config.color, fontWeight: "600", marginBottom: 16
      }}>
        {config.emoji} {config.label} Risk Analysis
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 20, alignItems: "start" }}>
        <RiskGauge score={result.risk_score} level={result.risk_level} color={config.color} />
        <div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>
            Top Risk Drivers
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={result.top_factors} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" stroke="#334155" fontSize={10} />
              <YAxis
                dataKey="feature"
                type="category"
                stroke="#334155"
                fontSize={10}
                width={140}
                tick={{ fill: "#94a3b8" }}
                tickFormatter={(v) => FEATURE_LABELS[v] || v}
              />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: `1px solid ${config.color}44`, borderRadius: 6, fontSize: 11 }}
                formatter={(v) => [`${v} pts`, "Impact"]}
                labelFormatter={(v) => FEATURE_LABELS[v] || v}
              />
              <Bar dataKey="impact" radius={4}>
                {result.top_factors.map((_, i) => (
                  <Cell key={i} fill={config.color} opacity={1 - i * 0.25} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{
        marginTop: 16, padding: 14, background: "#0f172a",
        borderRadius: 8, fontSize: 13, color: "#cbd5e1", lineHeight: 1.7,
        borderLeft: `3px solid ${config.color}`
      }}>
        {result.explanation}
      </div>
    </div>
  );
}

function Message({ msg }) {
  if (msg.type === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <div style={{
          background: "#3b82f6", color: "#fff", borderRadius: "16px 16px 4px 16px",
          padding: "10px 16px", maxWidth: "70%", fontSize: 14, lineHeight: 1.5
        }}>
          {msg.text}
        </div>
      </div>
    );
  }

  if (msg.type === "loading") {
    return (
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14
        }}>⚡</div>
        <div style={{
          background: "#1e293b", borderRadius: "4px 16px 16px 16px",
          padding: "12px 16px", fontSize: 13, color: "#64748b"
        }}>
          Analyzing risk...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14
      }}>⚡</div>
      <div style={{ flex: 1 }}>
        {msg.result ? (
          <ResultCard result={msg.result} />
        ) : (
          <div style={{
            background: "#1e293b", borderRadius: "4px 16px 16px 16px",
            padding: "12px 16px", fontSize: 13, color: "#ef4444"
          }}>
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setInput("");
    setLoading(true);

    setMessages(prev => [...prev, { type: "user", text: userMsg }, { type: "loading" }]);

    try {
      const res = await axios.post(`${API}/analyze`, { message: userMsg });
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { type: "aria", result: res.data };
        return updated;
      });
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { type: "aria", text: "Error connecting to API. Make sure the backend is running." };
        return updated;
      });
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0f172a",
      color: "#e2e8f0", fontFamily: "'Inter', -apple-system, sans-serif",
      display: "flex", flexDirection: "column"
    }}>

      {/* Header */}
      <div style={{
        background: "#1e293b", borderBottom: "1px solid #334155",
        padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
          }}>⚡</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: "800", color: "#f8fafc" }}>ARIA</div>
            <div style={{ fontSize: 11, color: "#475569" }}>Autonomous Risk & Intelligence Agent</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {Object.entries(DOMAIN_CONFIG).map(([k, v]) => (
            <div key={k} style={{ fontSize: 12, color: "#475569" }}>
              {v.emoji} <span style={{ color: v.color }}>{v.label}</span>
            </div>
          ))}
          <div style={{
            background: "#0f172a", padding: "5px 12px", borderRadius: 20,
            fontSize: 11, color: "#10b981", border: "1px solid #10b98133",
            display: "flex", alignItems: "center", gap: 5
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }}></div>
            Live
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", maxWidth: 820, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {messages.length === 0 && (
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: "800", color: "#f1f5f9", marginBottom: 8 }}>
              Describe your risk scenario
            </div>
            <div style={{ fontSize: 14, color: "#475569", marginBottom: 24 }}>
              ARIA automatically detects if it's a healthcare, fintech, or SaaS case and runs the right model.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {EXAMPLES.map((ex, i) => (
                <button key={i} onClick={() => sendMessage(ex)}
                  style={{
                    background: "#1e293b", border: "1px solid #334155",
                    borderRadius: 10, padding: "10px 16px", color: "#94a3b8",
                    fontSize: 13, cursor: "pointer", textAlign: "left",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={e => e.target.style.borderColor = "#3b82f6"}
                  onMouseLeave={e => e.target.style.borderColor = "#334155"}
                >
                  "{ex}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        borderTop: "1px solid #1e293b", padding: "16px 32px",
        background: "#0f172a", flexShrink: 0
      }}>
        <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", gap: 12 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage(input)}
            placeholder="Describe a patient, transaction, or customer..."
            style={{
              flex: 1, background: "#1e293b", border: "1px solid #334155",
              borderRadius: 12, padding: "12px 16px", color: "#f1f5f9",
              fontSize: 14, outline: "none"
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{
              padding: "12px 24px", borderRadius: 12, border: "none",
              background: loading || !input.trim() ? "#1e293b" : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              color: loading || !input.trim() ? "#475569" : "#fff",
              fontSize: 14, fontWeight: "700", cursor: loading || !input.trim() ? "not-allowed" : "pointer"
            }}>
            {loading ? "..." : "Analyze →"}
          </button>
        </div>
        <div style={{ maxWidth: 820, margin: "8px auto 0", fontSize: 11, color: "#334155", textAlign: "center" }}>
          Try: healthcare · fintech fraud · SaaS churn · avg AUC-ROC 0.873
        </div>
      </div>
    </div>
  );
}