"use client";
import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type Lang, getSavedLang, getLangFromUrl } from "../../i18n/translations";
import { M, CATEGORIES, type IssueCategory, sortDefectsBySeverity, hasUrgentIssues } from "../../inspector-mactor/character";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const btn: React.CSSProperties = {
  touchAction: "manipulation", cursor: "pointer",
  userSelect: "none", WebkitUserSelect: "none",
  outline: "none", WebkitTapHighlightColor: "transparent", border: "none",
};

type Severity  = "low" | "medium" | "high" | "critical";
type ReportStep = "report" | "followup" | "estimate" | "contact";

const SEV_COLORS: Record<Severity, string> = {
  critical: "var(--red)", high: "var(--amber)", medium: "var(--blue)", low: "var(--green)",
};

const SEV_LABELS: Record<Severity, Record<Lang, string>> = {
  critical: { en: "CRITICAL", es: "CRÍTICO",   zh: "严重", hi: "गंभीर",   tl: "KRITIKAL"   },
  high:     { en: "HIGH",     es: "ALTO",       zh: "高",   hi: "उच्च",    tl: "MATAAS"     },
  medium:   { en: "MEDIUM",   es: "MEDIO",      zh: "中",   hi: "मध्यम",   tl: "KATAMTAMAN" },
  low:      { en: "LOW",      es: "BAJO",       zh: "低",   hi: "कम",      tl: "MABABA"     },
};

// ── MacTor speech bubble ──────────────────────────────────────────────────────
function MacTorBubble({ text, sub }: { text: string; sub?: string }) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "24px" }}>
      <div style={{
        flexShrink: 0, width: 44, height: 44, borderRadius: "50%",
        border: "2px solid var(--gold)", overflow: "hidden",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mactor.png" alt="Inspector MacTor"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 15%" }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: "0.7rem", fontFamily: "'Space Mono',monospace", color: "var(--gold)", letterSpacing: "1.5px", marginBottom: "6px" }}>
          INSPECTOR MACTOR
        </p>
        <div style={{ background: "var(--navy-800)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "0 14px 14px 14px", padding: "14px 16px" }}>
          <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--white)", lineHeight: 1.45 }}>{text}</p>
          {sub && <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.5 }}>{sub}</p>}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "14px 16px", borderRadius: "12px",
  background: "var(--navy-800)", border: "1px solid var(--border)",
  color: "var(--white)", fontSize: "1rem", outline: "none",
  fontFamily: "'Outfit',sans-serif", boxSizing: "border-box",
};

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [lang, setLang]           = useState<Lang>("en");
  const [step, setStep]           = useState<ReportStep>("report");
  const [inspection, setInspection] = useState<any>(null);
  const [loaded, setLoaded]       = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Follow-up answers
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>(["", "", ""]);

  // Contact form (shown only when estimate requested)
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [phone, setPhone]     = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => { setLang(getLangFromUrl() || getSavedLang() || "en"); }, []);

  if (!loaded) {
    setLoaded(true);
    fetch(`${API_URL}/api/inspection/${id}`)
      .then(r => r.json())
      .then(data => setInspection(data))
      .catch(console.error);
  }

  const m = M[lang];

  if (!inspection) {
    return (
      <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--navy)" }}>
        <span className="pulse-dot" style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--gold)" }} />
      </main>
    );
  }

  // Derived data
  const analyses   = Object.values(inspection.aiAnalysis || {}) as any[];
  const allDefects = sortDefectsBySeverity(analyses.flatMap((a: any) => a.observed_defects || []));
  const isUrgent   = hasUrgentIssues(allDefects);
  const photos     = inspection.photos || [];
  const category   = (inspection.issueCategory || "other") as IssueCategory;
  const catDef     = CATEGORIES[category];
  const followUpQs = catDef?.followUpQuestions[lang] || [];

  const handleSubmit = async () => {
    if (!name || !email || !phone || !address) {
      alert("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    try {
      const followUpPayload = followUpQs.map((q, i) => ({
        question: q,
        answer: followUpAnswers[i] || "",
      })).filter(a => a.answer.trim());

      await fetch(`${API_URL}/api/inspection/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: name, clientEmail: email, clientPhone: phone, address,
          clientLanguage: lang, followUpAnswers: followUpPayload,
        }),
      });
      router.push(`/status/${id}?lang=${lang}`);
    } catch {
      setSubmitting(false);
      alert("Error sending. Please try again.");
    }
  };

  const handleSkipEstimate = () => {
    // Just go to status without submitting contact info
    router.push(`/status/${id}?lang=${lang}`);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP: REPORT — MacTor presents findings
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === "report") {
    return (
      <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--navy)" }}>
        <header style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
          <button type="button" onClick={() => router.back()}
            style={{ ...btn, width: 40, height: 40, borderRadius: 12, background: "var(--navy-800)", border: "1px solid var(--border)", color: "var(--white)", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ←
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--gold)", letterSpacing: "2px", margin: 0 }}>
              INSPECTOR MACTOR · INSPECTION REPORT
            </p>
            <h1 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--white)" }}>
              {catDef?.icon} {catDef?.name[lang]}
            </h1>
          </div>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "11px", color: "var(--muted)", background: "var(--navy-800)", border: "1px solid var(--border)", padding: "4px 10px", borderRadius: 20 }}>
            {photos.length} 📷
          </div>
        </header>

        <div style={{ flex: 1, padding: "20px", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

          {/* MacTor's verdict */}
          <MacTorBubble
            text={m.reportGreeting(allDefects.length)}
            sub={allDefects.length === 0 ? m.reportNoIssues : undefined}
          />

          {/* Critical alert banner */}
          {isUrgent && (
            <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.3rem" }}>⚠</span>
              <span style={{ fontSize: "0.9rem", color: "#ff6b6b", fontWeight: 600 }}>{m.criticalAlert}</span>
            </div>
          )}

          {/* Stats row */}
          {allDefects.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "24px" }}>
              {[
                { label: "Issues", value: allDefects.length, color: "var(--amber)" },
                { label: "Critical/High", value: allDefects.filter(d => d.severity === "critical" || d.severity === "high").length, color: "var(--red)" },
                { label: "Photos", value: photos.length, color: "var(--gold)" },
              ].map(stat => (
                <div key={stat.label} style={{ padding: "14px", borderRadius: "12px", background: "var(--navy-800)", border: "1px solid var(--border)", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900, color: stat.color, fontFamily: "'Space Mono',monospace" }}>{stat.value}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "0.7rem", color: "var(--muted)", fontFamily: "'Space Mono',monospace" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Defect list */}
          {allDefects.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              {allDefects.map((d: any, i: number) => (
                <div key={i} style={{ padding: "14px 16px", borderRadius: "14px", background: "var(--navy-800)", border: `1px solid ${SEV_COLORS[d.severity as Severity] || "var(--border)"}33` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontWeight: 700, color: "var(--white)", fontSize: "0.95rem" }}>{d.defect_type}</span>
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 700, fontFamily: "'Space Mono',monospace",
                      padding: "3px 10px", borderRadius: 20,
                      background: `${SEV_COLORS[d.severity as Severity]}22`,
                      color: SEV_COLORS[d.severity as Severity],
                      border: `1px solid ${SEV_COLORS[d.severity as Severity]}44`,
                    }}>
                      {SEV_LABELS[d.severity as Severity]?.[lang] || d.severity.toUpperCase()}
                    </span>
                  </div>
                  {d.location && <p style={{ margin: "0 0 6px", fontSize: "0.78rem", color: "var(--muted)" }}>📍 {d.location}</p>}
                  {d.danger_if_ignored && (
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--amber)", padding: "8px 10px", background: "rgba(245,158,11,0.07)", borderRadius: "8px" }}>
                      ⚠ {d.danger_if_ignored}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Photo thumbnails */}
          {photos.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontSize: "0.7rem", fontFamily: "'Space Mono',monospace", color: "var(--muted)", letterSpacing: "1px", marginBottom: "10px" }}>
                INSPECTED PHOTOS
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {photos.map((url: string, i: number) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={url} alt={`photo ${i+1}`}
                    style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "10px", border: "1px solid var(--border)" }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px" }}>
          <button type="button" onClick={() => setStep("followup")}
            style={{
              ...btn, width: "100%", padding: "18px", borderRadius: "16px",
              background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#0a0f1e",
              fontWeight: 800, fontSize: "1.05rem",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            {m.estimateTitle} →
          </button>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP: FOLLOW-UP — MacTor asks category-specific questions
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === "followup") {
    return (
      <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--navy)" }}>
        <header style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
          <button type="button" onClick={() => setStep("report")}
            style={{ ...btn, width: 40, height: 40, borderRadius: 12, background: "var(--navy-800)", border: "1px solid var(--border)", color: "var(--white)", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ←
          </button>
          <div>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--gold)", letterSpacing: "2px", margin: 0 }}>INSPECTOR MACTOR</p>
            <h1 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--white)" }}>{m.followupTitle}</h1>
          </div>
        </header>

        <div style={{ flex: 1, padding: "24px 20px", overflowY: "auto" }}>
          <MacTorBubble text={m.followupIntro} sub={m.answerHint} />

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {followUpQs.map((q, i) => (
              <div key={i}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--white)", marginBottom: "8px" }}>
                  {i + 1}. {q}
                </label>
                <input
                  type="text"
                  value={followUpAnswers[i] || ""}
                  onChange={e => setFollowUpAnswers(prev => { const next = [...prev]; next[i] = e.target.value; return next; })}
                  placeholder={m.answerHint}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px" }}>
          <button type="button" onClick={() => setStep("estimate")}
            style={{
              ...btn, width: "100%", padding: "18px", borderRadius: "16px",
              background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#0a0f1e",
              fontWeight: 800, fontSize: "1.05rem",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            {m.followupNext}
          </button>
          <button type="button" onClick={() => setStep("estimate")}
            style={{ ...btn, width: "100%", padding: "12px", borderRadius: "12px", background: "none", color: "var(--muted)", fontSize: "0.85rem", textAlign: "center" }}>
            {m.followupSkip}
          </button>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP: ESTIMATE OFFER
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === "estimate") {
    return (
      <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--navy)" }}>
        <header style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
          <button type="button" onClick={() => setStep("followup")}
            style={{ ...btn, width: 40, height: 40, borderRadius: 12, background: "var(--navy-800)", border: "1px solid var(--border)", color: "var(--white)", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ←
          </button>
          <div>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--gold)", letterSpacing: "2px", margin: 0 }}>INSPECTOR MACTOR</p>
            <h1 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--white)" }}>{m.estimateTitle}</h1>
          </div>
        </header>

        <div style={{ flex: 1, padding: "24px 20px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <MacTorBubble text={m.estimateTitle} sub={m.estimateText} />

          {/* Inspection summary card */}
          <div style={{ padding: "20px", borderRadius: "16px", background: "var(--navy-800)", border: "1px solid var(--border)", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <span style={{ fontSize: "1.8rem" }}>{catDef?.icon}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: "var(--white)" }}>{catDef?.name[lang]}</p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>
                  {allDefects.length} issue{allDefects.length !== 1 ? "s" : ""} · {photos.length} photo{photos.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {inspection.problemDescription && (
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)", fontStyle: "italic", borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
                "{inspection.problemDescription}"
              </p>
            )}
          </div>

          {/* Free badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", borderRadius: "12px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", marginBottom: "8px" }}>
            <span>✅</span>
            <span style={{ fontSize: "0.85rem", color: "var(--green)" }}>
              {m.free} · No commitment · No sales calls
            </span>
          </div>
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px" }}>
          <button type="button" onClick={() => setStep("contact")}
            style={{
              ...btn, width: "100%", padding: "18px", borderRadius: "16px",
              background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#0a0f1e",
              fontWeight: 800, fontSize: "1.05rem",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}>
            📧 {m.estimateYes}
          </button>
          <button type="button" onClick={handleSkipEstimate}
            style={{ ...btn, width: "100%", padding: "12px", borderRadius: "12px", background: "none", color: "var(--muted)", fontSize: "0.85rem", textAlign: "center" }}>
            {m.estimateNo}
          </button>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP: CONTACT — only reached when user wants estimate
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--navy)" }}>
      <header style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
        <button type="button" onClick={() => setStep("estimate")}
          style={{ ...btn, width: 40, height: 40, borderRadius: 12, background: "var(--navy-800)", border: "1px solid var(--border)", color: "var(--white)", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ←
        </button>
        <div>
          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--gold)", letterSpacing: "2px", margin: 0 }}>INSPECTOR MACTOR</p>
          <h1 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--white)" }}>{m.contactTitle}</h1>
        </div>
      </header>

      <div style={{ flex: 1, padding: "24px 20px", overflowY: "auto" }}>
        <MacTorBubble text={m.contactTitle} sub={m.contactIntro} />

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            { label: "Full Name",        value: name,    set: setName,    type: "text",  placeholder: "Jane Smith" },
            { label: "Email",            value: email,   set: setEmail,   type: "email", placeholder: "jane@email.com" },
            { label: "Phone",            value: phone,   set: setPhone,   type: "tel",   placeholder: "+1 (416) 000-0000" },
            { label: "Property Address", value: address, set: setAddress, type: "text",  placeholder: "123 Main St, Toronto, ON" },
          ].map(field => (
            <div key={field.label}>
              <label style={{ display: "block", fontSize: "0.7rem", fontFamily: "'Space Mono',monospace", color: "var(--gold)", letterSpacing: "1px", marginBottom: "6px" }}>
                {field.label.toUpperCase()}
              </label>
              <input
                type={field.type}
                value={field.value}
                onChange={e => field.set(e.target.value)}
                placeholder={field.placeholder}
                style={inputStyle}
              />
            </div>
          ))}

          <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "4px 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
            🔒 Your information is confidential and used only for your estimate.
          </p>
        </div>
      </div>

      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
        <button type="button"
          onClick={handleSubmit}
          disabled={submitting || !name || !email || !phone || !address}
          style={{
            ...btn, width: "100%", padding: "18px", borderRadius: "16px",
            background: (!submitting && name && email && phone && address) ? "linear-gradient(135deg,#f59e0b,#d97706)" : "rgba(245,158,11,0.3)",
            color: (!submitting && name && email && phone && address) ? "#0a0f1e" : "var(--gold-light)",
            fontWeight: 800, fontSize: "1.05rem",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}>
          {submitting ? "Sending…" : "Send My Estimate →"}
        </button>
      </div>
    </main>
  );
}
