"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const btn: React.CSSProperties = {
  touchAction: "manipulation",
  cursor: "pointer",
  userSelect: "none",
  WebkitUserSelect: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  border: "none",
};

export default function LandingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<"residential" | "commercial" | null>(null);
  const [loading, setLoading] = useState(false);

  const start = async () => {
    if (!selected || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/inspection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyType: selected }),
      });
      const data = await res.json();
      router.push(`/inspection/${data.id}`);
    } catch {
      setLoading(false);
      alert("Connection error. Please check your internet connection.");
    }
  };

  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", padding: "0 20px" }}>

      {/* Header */}
      <div style={{ paddingTop: "48px", paddingBottom: "32px", textAlign: "center" }}>
        <p style={{ fontFamily: "monospace", fontSize: "11px", letterSpacing: "3px", color: "var(--blue-light)", marginBottom: "12px" }}>
          ▲ MACTOR MAINTENANCE
        </p>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--white)", margin: "0 0 8px", lineHeight: 1.2 }}>
          Property<br />
          <span style={{ color: "var(--blue-light)" }}>Inspection</span>
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem", margin: 0 }}>
          AI detects damage · Instant estimate · GTA Toronto
        </p>
      </div>

      {/* Property type selector */}
      <div style={{ marginBottom: "28px" }}>
        <p style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--muted)", letterSpacing: "2px", marginBottom: "14px", textAlign: "center" }}>
          PROPERTY TYPE
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[
            { id: "residential", label: "Residential", icon: "🏠", desc: "House, condo,\napartment" },
            { id: "commercial",  label: "Commercial",  icon: "🏢", desc: "Office, retail,\ncommercial building" },
          ].map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt.id as "residential" | "commercial")}
              style={{
                ...btn,
                padding: "20px 12px",
                borderRadius: "18px",
                background: selected === opt.id ? "rgba(59,130,246,0.18)" : "var(--navy-800)",
                border: selected === opt.id ? "2px solid var(--blue)" : "1.5px solid var(--border)",
                textAlign: "center",
                minHeight: "120px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}>
              <span style={{ fontSize: "2.2rem" }}>{opt.icon}</span>
              <span style={{ fontWeight: 700, color: selected === opt.id ? "var(--blue-light)" : "var(--white)", fontSize: "1rem" }}>
                {selected === opt.id ? "✓ " : ""}{opt.label}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)", whiteSpace: "pre-line", lineHeight: 1.4 }}>
                {opt.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ marginBottom: "28px", padding: "18px", borderRadius: "16px", background: "var(--navy-800)", border: "1px solid var(--border)" }}>
        <p style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--muted)", letterSpacing: "2px", marginBottom: "14px" }}>HOW IT WORKS</p>
        {[
          { n: "1", icon: "📷", text: "Take up to 10 photos of the damage" },
          { n: "2", icon: "🤖", text: "AI analyzes and detects issues instantly" },
          { n: "3", icon: "📋", text: "View the report with risk alerts" },
          { n: "4", icon: "💰", text: "Receive a cost estimate by email" },
          { n: "5", icon: "🔧", text: "Accept and we schedule the repair" },
        ].map(step => (
          <div key={step.n} style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--blue-light)", fontWeight: 700 }}>{step.n}</span>
            </div>
            <span style={{ fontSize: "0.9rem" }}>{step.icon} {step.text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={start}
        disabled={!selected || loading}
        style={{
          ...btn,
          background: selected && !loading ? "var(--blue)" : "var(--navy-700)",
          color: selected && !loading ? "white" : "var(--muted)",
          padding: "20px",
          borderRadius: "18px",
          fontWeight: 700,
          fontSize: "1.15rem",
          width: "100%",
          minHeight: "64px",
          marginBottom: "32px",
          opacity: selected && !loading ? 1 : 0.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}>
        {loading ? (
          <>
            <span className="pulse-dot" style={{ width: 10, height: 10, borderRadius: "50%", background: "white" }} />
            Starting…
          </>
        ) : "Start Inspection →"}
      </button>

      {/* Footer */}
      <p style={{ textAlign: "center", fontFamily: "monospace", fontSize: "11px", color: "var(--muted)", paddingBottom: "24px" }}>
        MacTor Maintenance · GTA Toronto © 2026
      </p>
    </main>
  );
}
