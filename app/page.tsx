"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { T, LANGUAGES, type Lang, getSavedLang, saveLang, getLangFromUrl } from "./i18n/translations";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const btnReset: React.CSSProperties = {
  touchAction: "manipulation", cursor: "pointer",
  userSelect: "none", WebkitUserSelect: "none",
  outline: "none", WebkitTapHighlightColor: "transparent", border: "none",
  background: "none", padding: 0,
};

// ─── Logo mark (small, for header) ─────────────────────────────────────────
function LogoMark({ size = "sm" }: { size?: "sm" | "lg" }) {
  const isLg = size === "lg";
  return (
    <div style={{
      position: "relative", flexShrink: 0,
      width: isLg ? 72 : 42, height: isLg ? 72 : 42,
      borderRadius: isLg ? 20 : 13,
      background: "linear-gradient(135deg,rgba(59,130,246,0.22),rgba(245,158,11,0.18))",
      border: "1.5px solid rgba(245,158,11,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: isLg ? "2.6rem" : "1.5rem",
    }}>
      🏠
      <div style={{
        position: "absolute", bottom: isLg ? -6 : -4, right: isLg ? -6 : -4,
        width: isLg ? 30 : 20, height: isLg ? 30 : 20,
        borderRadius: "50%", background: "var(--gold)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: isLg ? "1rem" : "0.65rem",
        boxShadow: "0 2px 8px rgba(245,158,11,0.5)",
      }}>🔍</div>
    </div>
  );
}

// ─── Language Picker ────────────────────────────────────────────────────────
function LanguagePicker({ onSelect }: { onSelect: (l: Lang) => void }) {
  const [hovered, setHovered] = useState<Lang | null>(null);

  return (
    <main style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 20px", background: "var(--navy)",
      backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 65%)",
    }}>
      {/* Logo */}
      <div className="fade-up-1" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "36px", gap: "14px" }}>
        <LogoMark size="lg" />
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", letterSpacing: "3px", color: "var(--gold)", margin: "0 0 6px" }}>
            ▲ MACTOR MAINTENANCE
          </p>
          <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
            <span style={{ fontWeight: 300, color: "var(--muted)" }}>Inspector </span>
            <span style={{ color: "var(--white)" }}>Mactor</span>
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
            AI · GTA Toronto
          </p>
        </div>
      </div>

      {/* Subtitle — multilingual */}
      <div className="fade-up-2" style={{ textAlign: "center", marginBottom: "28px" }}>
        <p style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--white)", marginBottom: "4px" }}>
          Choose your language
        </p>
        <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
          Selecciona · 请选择 · भाषा चुनें
        </p>
      </div>

      {/* Language cards — 2×2 + last card centered */}
      <div className="fade-up-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%", maxWidth: "360px", marginBottom: "32px" }}>
        {LANGUAGES.map((lang, i) => (
          <button
            key={lang.code}
            type="button"
            className={`lang-card ${hovered === lang.code ? "selected" : ""}`}
            onMouseEnter={() => setHovered(lang.code)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => { saveLang(lang.code); onSelect(lang.code); }}
            style={i === LANGUAGES.length - 1 && LANGUAGES.length % 2 !== 0
              ? { gridColumn: "1 / -1", maxWidth: 180, justifySelf: "center", width: "100%" }
              : {}}
          >
            <span className="lang-flag">{lang.flag}</span>
            <span className="lang-native">{lang.name}</span>
            <span className="lang-en">{lang.nameEn}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--muted)", textAlign: "center" }}>
        MacTor Maintenance · GTA Toronto © 2026
      </p>
    </main>
  );
}

// ─── Main Landing Page ──────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang | null>(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<"residential" | "commercial" | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  useEffect(() => {
    const saved = getLangFromUrl() || getSavedLang();
    setLang(saved);
    setReady(true);
  }, []);

  if (!ready) return null;

  // Show language picker
  if (lang === null || showLangPicker) {
    return (
      <LanguagePicker onSelect={(l) => {
        setLang(l);
        setShowLangPicker(false);
      }} />
    );
  }

  const t = T[lang];
  const currentLangMeta = LANGUAGES.find(l => l.code === lang)!;

  const start = async () => {
    if (!selected || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/inspection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyType: selected, clientLanguage: lang }),
      });
      const data = await res.json();
      // Store lang in sessionStorage so sub-pages can read it
      sessionStorage.setItem("inspector_inspect_lang", lang);
      router.push(`/inspection/${data.id}?lang=${lang}`);
    } catch {
      setLoading(false);
      alert(t.connectionError);
    }
  };

  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", padding: "0 20px",
      backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.07) 0%, transparent 60%)" }}>

      {/* Header */}
      <div style={{ paddingTop: "44px", paddingBottom: "28px" }}>
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <LogoMark size="sm" />
            <div>
              <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "9px", letterSpacing: "2px", color: "var(--gold)", margin: 0 }}>
                ▲ MACTOR MAINTENANCE
              </p>
              <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, letterSpacing: "-0.3px" }}>
                <span style={{ fontWeight: 300, color: "var(--muted)" }}>Inspector </span>
                <span style={{ color: "var(--white)" }}>Mactor</span>
              </h1>
            </div>
          </div>
          {/* Language switcher */}
          <button
            type="button"
            className="lang-chip"
            onClick={() => setShowLangPicker(true)}
          >
            <span>{currentLangMeta.flag}</span>
            <span>{currentLangMeta.name}</span>
          </button>
        </div>

        {/* Tagline */}
        <div style={{ textAlign: "center", paddingTop: "8px" }}>
          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "11px", letterSpacing: "2px", color: "var(--muted)", marginBottom: "6px" }}>
            AI · GTA TORONTO
          </p>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: 0 }}>
            {t.tagline}
          </p>
        </div>
      </div>

      {/* Property type selector */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--muted)", letterSpacing: "2px", marginBottom: "12px", textAlign: "center" }}>
          {t.propertyType}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {([
            { id: "residential", label: t.residential, icon: "🏠", desc: t.residentialDesc },
            { id: "commercial",  label: t.commercial,  icon: "🏢", desc: t.commercialDesc  },
          ] as const).map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt.id)}
              style={{
                ...btnReset,
                padding: "20px 12px",
                borderRadius: "18px",
                background: selected === opt.id ? "rgba(245,158,11,0.12)" : "var(--navy-800)",
                border: selected === opt.id ? "2px solid var(--gold)" : "1.5px solid var(--border)",
                textAlign: "center",
                minHeight: "120px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px",
              }}>
              <span style={{ fontSize: "2.2rem" }}>{opt.icon}</span>
              <span style={{ fontWeight: 700, color: selected === opt.id ? "var(--gold-light)" : "var(--white)", fontSize: "1rem" }}>
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
      <div style={{ marginBottom: "24px", padding: "18px", borderRadius: "16px", background: "var(--navy-800)", border: "1px solid var(--border)" }}>
        <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--muted)", letterSpacing: "2px", marginBottom: "14px" }}>
          {t.howItWorks}
        </p>
        {t.steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: i < 4 ? "10px" : 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "11px", color: "var(--gold-light)", fontWeight: 700 }}>{i + 1}</span>
            </div>
            <span style={{ fontSize: "0.88rem", color: "var(--muted)" }}>
              {["📷","🤖","📋","💰","🔧"][i]} {step}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={start}
        disabled={!selected || loading}
        style={{
          ...btnReset,
          background: selected && !loading
            ? "linear-gradient(135deg, #f59e0b, #d97706)"
            : "var(--navy-700)",
          color: selected && !loading ? "#0a0f1e" : "var(--muted)",
          padding: "20px",
          borderRadius: "18px",
          fontWeight: 800,
          fontSize: "1.1rem",
          width: "100%",
          minHeight: "64px",
          marginBottom: "28px",
          opacity: selected && !loading ? 1 : 0.5,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
          boxShadow: selected && !loading ? "0 4px 20px rgba(245,158,11,0.3)" : "none",
          letterSpacing: "-0.2px",
        }}>
        {loading ? (
          <>
            <span className="pulse-dot" style={{ width: 10, height: 10, borderRadius: "50%", background: "currentColor" }} />
            {t.starting}
          </>
        ) : t.startBtn}
      </button>

      {/* Footer */}
      <p style={{ textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--muted)", paddingBottom: "24px" }}>
        MacTor Maintenance · GTA Toronto © 2026
      </p>
    </main>
  );
}
