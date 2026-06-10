"use client";
import { useState, use, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { T, type Lang, getSavedLang } from "../../i18n/translations";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const btn: React.CSSProperties = {
  touchAction: "manipulation", cursor: "pointer",
  userSelect: "none", WebkitUserSelect: "none",
  outline: "none", WebkitTapHighlightColor: "transparent", border: "none",
};

type Severity = "low" | "medium" | "high" | "critical";

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState<"report" | "form">("report");
  const [inspection, setInspection] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const fromUrl = searchParams.get("lang") as Lang;
    const saved = getSavedLang();
    setLang(fromUrl || saved || "en");
  }, [searchParams]);

  if (!loaded) {
    setLoaded(true);
    fetch(`${API_URL}/api/inspection/${id}`)
      .then(r => r.json())
      .then(data => setInspection(data))
      .catch(console.error);
  }

  const t = T[lang];

  const handleSubmit = async () => {
    if (!name || !email || !phone || !address) {
      alert(t.fillAllFields);
      return;
    }
    setSubmitting(true);
    try {
      await fetch(`${API_URL}/api/inspection/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName: name, clientEmail: email, clientPhone: phone, address, clientLanguage: lang }),
      });
      router.push(`/status/${id}?lang=${lang}`);
    } catch {
      setSubmitting(false);
      alert(t.sendError);
    }
  };

  if (!inspection) {
    return (
      <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="pulse-dot" style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--gold)" }} />
      </main>
    );
  }

  const analyses = Object.values(inspection.aiAnalysis || {}) as any[];
  const allDefects = analyses.flatMap((a: any) => a.observed_defects || []);
  const criticalOrHigh = allDefects.filter((d: any) => d.severity === "critical" || d.severity === "high");
  const photos = inspection.photos || [];

  const priorityColor = (p: string) => ({
    critical: "var(--red)", high: "var(--amber)", medium: "var(--blue)", low: "var(--green)", no_issues: "var(--green)",
  }[p] || "var(--muted)");

  const topPriority = allDefects.reduce((best: string, d: any) => {
    const order: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, no_issues: 0 };
    return (order[d.severity] || 0) > (order[best] || 0) ? d.severity : best;
  }, "no_issues");

  const priorityLabel = topPriority === "no_issues" ? t.noDamage
    : topPriority === "critical" ? t.immediateAttention
    : topPriority === "high" ? t.urgentRepair
    : t.maintenanceNeeded;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "16px", borderRadius: "14px",
    background: "var(--navy-800)", border: "1px solid var(--border)",
    color: "var(--white)", fontSize: "1rem", outline: "none",
    touchAction: "manipulation", fontFamily: "'Outfit', sans-serif",
  };

  // ── Contact form ──
  if (step === "form") {
    return (
      <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--navy)" }}>
        <header style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
          <button type="button" onClick={() => setStep("report")}
            style={{ ...btn, width: 40, height: 40, borderRadius: 12, background: "var(--navy-800)", border: "1px solid var(--border)", color: "var(--white)", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ←
          </button>
          <div>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--gold)", letterSpacing: "2px", margin: 0 }}>{t.yourDetails}</p>
            <h1 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--white)" }}>{t.contactInfo}</h1>
          </div>
        </header>

        <div style={{ flex: 1, padding: "24px 20px", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "24px" }}>{t.contactDesc}</p>

          {[
            { label: t.fullName,  value: name,  onChange: setName,  placeholder: t.namePlaceholder,  type: "text",  inputMode: "text"  },
            { label: t.email,     value: email, onChange: setEmail, placeholder: t.emailPlaceholder, type: "email", inputMode: "email" },
            { label: t.phone,     value: phone, onChange: setPhone, placeholder: t.phonePlaceholder, type: "tel",   inputMode: "tel"   },
          ].map(field => (
            <div key={field.label} style={{ marginBottom: "18px" }}>
              <label style={{ fontFamily: "'Space Mono',monospace", fontSize: "11px", color: "var(--muted)", letterSpacing: "2px", display: "block", marginBottom: "8px" }}>
                {field.label}
              </label>
              <input
                type={field.type} inputMode={field.inputMode as any}
                value={field.value} onChange={e => field.onChange(e.target.value)}
                placeholder={field.placeholder} style={inputStyle}
              />
            </div>
          ))}

          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontFamily: "'Space Mono',monospace", fontSize: "11px", color: "var(--muted)", letterSpacing: "2px", display: "block", marginBottom: "8px" }}>
              {t.propertyAddress}
            </label>
            <textarea
              value={address} onChange={e => setAddress(e.target.value)}
              placeholder="123 Main St, Toronto, ON M5V 1A1" rows={3}
              style={{ ...inputStyle, resize: "none" }}
            />
          </div>

          <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "20px", fontFamily: "'Space Mono',monospace" }}>
            {t.privacy}
          </p>

          <button type="button" onClick={handleSubmit} disabled={submitting}
            style={{
              ...btn, width: "100%", padding: "18px", borderRadius: "18px",
              background: submitting ? "var(--navy-700)" : "linear-gradient(135deg,#f59e0b,#d97706)",
              color: submitting ? "var(--muted)" : "#0a0f1e",
              fontWeight: 800, fontSize: "1.05rem", minHeight: "60px",
              opacity: submitting ? 0.6 : 1,
              boxShadow: submitting ? "none" : "0 4px 16px rgba(245,158,11,0.3)",
            }}>
            {submitting ? t.sending : t.submitBtn}
          </button>
        </div>
      </main>
    );
  }

  // ── Report view ──
  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--navy)" }}>
      <header style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
        <button type="button" onClick={() => router.push(`/inspection/${id}?lang=${lang}`)}
          style={{ ...btn, width: 40, height: 40, borderRadius: 12, background: "var(--navy-800)", border: "1px solid var(--border)", color: "var(--white)", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ←
        </button>
        <div>
          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--gold)", letterSpacing: "2px", margin: 0 }}>{t.inspectionReport}</p>
          <h1 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--white)" }}>{t.aiResults}</h1>
        </div>
      </header>

      <div style={{ flex: 1, padding: "20px", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

        {/* Priority banner */}
        <div style={{
          padding: "16px", borderRadius: "16px", marginBottom: "20px",
          background: topPriority === "no_issues" ? "rgba(34,197,94,0.1)" : topPriority === "critical" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
          border: `1px solid ${topPriority === "no_issues" ? "rgba(34,197,94,0.3)" : topPriority === "critical" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
          display: "flex", alignItems: "center", gap: "14px",
        }}>
          <span style={{ fontSize: "2rem" }}>
            {topPriority === "no_issues" ? "✅" : topPriority === "critical" ? "🚨" : topPriority === "high" ? "⚠️" : "📋"}
          </span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: priorityColor(topPriority) }}>{priorityLabel}</p>
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
              {t.photosAnalyzedIssues(photos.length, allDefects.length)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
          {[
            { label: t.criticalHigh, value: criticalOrHigh.length, color: "var(--red)" },
            { label: t.totalIssues,  value: allDefects.length,     color: "var(--amber)" },
            { label: t.photos,       value: photos.length,         color: "var(--gold-light)" },
          ].map(stat => (
            <div key={stat.label} style={{ padding: "14px 10px", borderRadius: "14px", background: "var(--navy-800)", border: "1px solid var(--border)", textAlign: "center" }}>
              <p style={{ margin: 0, fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: "1.8rem", color: stat.color }}>{stat.value}</p>
              <p style={{ margin: "4px 0 0", fontSize: "0.68rem", color: "var(--muted)", lineHeight: 1.3 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Risk alerts */}
        {criticalOrHigh.length > 0 && (
          <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: "20px" }}>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "11px", color: "var(--red)", letterSpacing: "2px", marginBottom: "12px" }}>
              {t.riskAlerts}
            </p>
            {criticalOrHigh.map((d: any, i: number) => (
              <div key={i} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: i < criticalOrHigh.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: "0.88rem", color: "var(--white)" }}>{d.defect_type}</p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--amber)" }}>{t.ifNotRepaired} {d.danger_if_ignored}</p>
              </div>
            ))}
          </div>
        )}

        {/* Defects by photo */}
        {analyses.map((a: any, i: number) => (
          a.observed_defects?.length > 0 && (
            <div key={i} style={{ marginBottom: "16px", padding: "14px", borderRadius: "14px", background: "var(--navy-800)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photos[i]} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem", color: "var(--white)", textTransform: "capitalize" }}>{a.area_detected?.replace(/_/g, " ")}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>{t.issueDetected(a.observed_defects?.length)}</p>
                </div>
              </div>
              {a.observed_defects.map((d: any, j: number) => (
                <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: j < a.observed_defects.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--white)" }}>{d.defect_type}</span>
                  <span className={`badge-${d.severity as Severity}`}>{d.severity?.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )
        ))}

        {allDefects.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px", borderRadius: "16px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", marginBottom: "20px" }}>
            <p style={{ fontSize: "2rem", marginBottom: "8px" }}>✅</p>
            <p style={{ color: "var(--green)", fontWeight: 600 }}>{t.noDamageDetected}</p>
          </div>
        )}

        {/* CTA */}
        <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", marginBottom: "16px" }}>
          <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--white)", marginBottom: "6px" }}>{t.wantEstimate}</p>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 0 }}>{t.estimateDesc}</p>
        </div>

        <button type="button" onClick={() => setStep("form")}
          style={{
            ...btn, width: "100%", padding: "18px", borderRadius: "18px",
            background: "linear-gradient(135deg,#f59e0b,#d97706)",
            color: "#0a0f1e", fontWeight: 800, fontSize: "1.05rem", minHeight: "60px", marginBottom: "12px",
            boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
          }}>
          {t.requestEstimate}
        </button>

        <button type="button" onClick={() => router.push(`/inspection/${id}?lang=${lang}`)}
          style={{ ...btn, width: "100%", padding: "14px", borderRadius: "14px", background: "var(--navy-800)", border: "1px solid var(--border)", color: "var(--muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
          {t.addMorePhotosBtn}
        </button>
      </div>
    </main>
  );
}
