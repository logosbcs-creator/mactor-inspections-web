"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGES, type Lang, getSavedLang, saveLang, getLangFromUrl } from "./i18n/translations";
import { M } from "./inspector-mactor/character";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const btnReset: React.CSSProperties = {
  touchAction: "manipulation", cursor: "pointer",
  userSelect: "none", WebkitUserSelect: "none",
  outline: "none", WebkitTapHighlightColor: "transparent", border: "none",
  background: "none", padding: 0,
};

type ServiceType = "repair" | "new_project";

// ─── Logo mark ──────────────────────────────────────────────────────────────
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

// ─── Language Picker ─────────────────────────────────────────────────────────
function LanguagePicker({ onSelect }: { onSelect: (l: Lang) => void }) {
  const [hovered, setHovered] = useState<Lang | null>(null);

  return (
    <main style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 20px", background: "var(--navy)",
      backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 65%)",
    }}>
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

      <div className="fade-up-2" style={{ textAlign: "center", marginBottom: "28px" }}>
        <p style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--white)", marginBottom: "4px" }}>
          Choose your language
        </p>
        <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
          Selecciona · 请选择 · भाषा चुनें
        </p>
      </div>

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

      <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--muted)", textAlign: "center" }}>
        MacTor Maintenance · GTA Toronto © 2026
      </p>
    </main>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [lang, setLang]             = useState<Lang | null>(null);
  const [ready, setReady]           = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [propertyType, setPropertyType] = useState<"residential" | "commercial" | null>(null);
  const [loading, setLoading]       = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  useEffect(() => {
    const saved = getLangFromUrl() || getSavedLang();
    setLang(saved);
    setReady(true);
  }, []);

  if (!ready) return null;

  if (lang === null || showLangPicker) {
    return (
      <LanguagePicker onSelect={(l) => {
        setLang(l);
        setShowLangPicker(false);
      }} />
    );
  }

  const m = M[lang];
  const currentLangMeta = LANGUAGES.find(l => l.code === lang)!;
  const canStart = serviceType !== null && propertyType !== null && !loading;

  const start = async () => {
    if (!canStart) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/inspection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyType, clientLanguage: lang, serviceType }),
      });
      const data = await res.json();
      router.push(`/inspection/${data.id}?lang=${lang}&serviceType=${serviceType}`);
    } catch {
      setLoading(false);
      alert(m.connectionError);
    }
  };

  return (
    <main style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column", padding: "0 20px",
      backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.07) 0%, transparent 60%)",
    }}>

      {/* Compact header */}
      <div style={{ paddingTop: "44px", paddingBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <LogoMark size="sm" />
            <div>
              <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "9px", letterSpacing: "2px", color: "var(--gold)", margin: 0 }}>
                FIXMYPROPERTY · GTA
              </p>
              <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, letterSpacing: "-0.3px" }}>
                <span style={{ fontWeight: 300, color: "var(--muted)" }}>Inspector </span>
                <span style={{ color: "var(--white)" }}>MacTor</span>
              </h1>
            </div>
          </div>
          <button type="button" className="lang-chip" onClick={() => setShowLangPicker(true)}>
            <span>{currentLangMeta.flag}</span>
            <span>{currentLangMeta.name}</span>
          </button>
        </div>
      </div>

      {/* MacTor intro card */}
      <div style={{
        position: "relative", overflow: "hidden",
        borderRadius: "16px", minHeight: "110px",
        background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)",
        marginBottom: "24px",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mactor.png" alt="" aria-hidden="true"
          style={{
            position: "absolute", right: "-4px", top: "-8px",
            height: "165px", width: "auto", objectFit: "contain",
            objectPosition: "center top", pointerEvents: "none",
          }} />
        <div style={{ padding: "16px", paddingRight: "110px" }}>
          <p style={{ margin: 0, fontSize: "0.65rem", fontFamily: "'Space Mono',monospace", color: "var(--gold)", letterSpacing: "1.5px", marginBottom: "5px" }}>
            INSPECTOR MACTOR · {m.free.toUpperCase()} INSPECTION
          </p>
          <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--white)", lineHeight: 1.4 }}>
            {serviceType ? (serviceType === "repair" ? m.repairContextMsg : m.newProjectContextMsg) : m.welcomeTagline}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--muted)" }}>
            {m.subtitle}
          </p>
        </div>
      </div>

      {/* ── Service type selector — MAIN CHOICE ── */}
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--muted)", letterSpacing: "2px", marginBottom: "12px" }}>
          {m.whatDoYouNeed.toUpperCase()}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {([
            { id: "repair" as ServiceType,      icon: "🔧", label: m.serviceRepairLabel,     desc: m.serviceRepairDesc     },
            { id: "new_project" as ServiceType, icon: "🏗️", label: m.serviceNewProjectLabel, desc: m.serviceNewProjectDesc },
          ]).map(opt => {
            const active = serviceType === opt.id;
            return (
              <button key={opt.id} type="button" onClick={() => setServiceType(opt.id)}
                style={{
                  ...btnReset,
                  padding: "24px 12px 20px",
                  borderRadius: "20px",
                  minHeight: "150px",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px",
                  background: active
                    ? "linear-gradient(160deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))"
                    : "var(--navy-800)",
                  border: active ? "2px solid var(--gold)" : "1.5px solid var(--border)",
                  boxShadow: active ? "0 0 0 3px rgba(245,158,11,0.12)" : "none",
                  transition: "all 0.15s",
                }}>
                <span style={{ fontSize: "2.6rem", lineHeight: 1 }}>{opt.icon}</span>
                <span style={{
                  fontWeight: 800, fontSize: "1rem",
                  color: active ? "var(--gold-light)" : "var(--white)",
                  letterSpacing: "-0.2px",
                }}>
                  {active ? "✓ " : ""}{opt.label}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.4, textAlign: "center" }}>
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Property type — secondary choice ── */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--muted)", letterSpacing: "2px", marginBottom: "12px" }}>
          {m.propertyLabel.toUpperCase()}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {([
            { id: "residential" as const, label: m.residential, icon: "🏠", desc: m.residentialDesc },
            { id: "commercial"  as const, label: m.commercial,  icon: "🏢", desc: m.commercialDesc  },
          ]).map(opt => {
            const active = propertyType === opt.id;
            return (
              <button key={opt.id} type="button" onClick={() => setPropertyType(opt.id)}
                style={{
                  ...btnReset, padding: "14px 10px", borderRadius: "16px", textAlign: "center",
                  background: active ? "rgba(59,130,246,0.12)" : "var(--navy-800)",
                  border: active ? "2px solid rgba(59,130,246,0.6)" : "1.5px solid var(--border)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                }}>
                <span style={{ fontSize: "1.6rem" }}>{opt.icon}</span>
                <span style={{ fontWeight: 700, color: active ? "#93c5fd" : "var(--white)", fontSize: "0.9rem" }}>
                  {active ? "✓ " : ""}{opt.label}
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--muted)", lineHeight: 1.4 }}>{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <button type="button" onClick={start} disabled={!canStart}
        style={{
          ...btnReset,
          background: canStart ? "linear-gradient(135deg,#f59e0b,#d97706)" : "var(--navy-800)",
          color: canStart ? "#0a0f1e" : "var(--muted)",
          padding: "20px", borderRadius: "18px", fontWeight: 800, fontSize: "1.1rem",
          width: "100%", minHeight: "64px", marginBottom: "28px",
          opacity: canStart ? 1 : 0.45,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
          boxShadow: canStart ? "0 4px 20px rgba(245,158,11,0.3)" : "none",
          border: canStart ? "none" : "1px solid var(--border)",
        }}>
        {loading ? (
          <><span className="pulse-dot" style={{ width: 10, height: 10, borderRadius: "50%", background: "currentColor" }} />{m.starting}</>
        ) : m.startBtn}
      </button>

      <p style={{ textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--muted)", paddingBottom: "24px" }}>
        FixMyProperty · MacTor Maintenance · GTA Toronto © 2026
      </p>
    </main>
  );
}
