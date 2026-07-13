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

// ─── Hero icons (inline SVG, teal accent) ─────────────────────────────────────
type IconName = "check" | "bolt" | "pin" | "lock" | "chip" | "clock" | "badge";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "check": return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.4 2.4L16 9.8" /></svg>;
    case "bolt":  return <svg {...common}><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" /></svg>;
    case "pin":   return <svg {...common}><path d="M12 22s7-7.4 7-12.5A7 7 0 0 0 5 9.5C5 14.6 12 22 12 22Z" /><circle cx="12" cy="9.5" r="2.4" /></svg>;
    case "lock":  return <svg {...common}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" /></svg>;
    case "chip":  return <svg {...common}><rect x="7" y="7" width="10" height="10" rx="1.5" /><path d="M9.5 3.5V7M14.5 3.5V7M9.5 17v3.5M14.5 17v3.5M3.5 9.5H7M3.5 14.5H7M17 9.5h3.5M17 14.5h3.5" /></svg>;
    case "clock": return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></svg>;
    case "badge": return <svg {...common}><path d="M12 2l2.4 4.2L19 7l-2 4 2 4-4.6.8L12 20l-2.4-4.2L5 15l2-4-2-4 4.6-.8L12 2Z" /><path d="M9.5 12.3l1.8 1.8 3.2-3.6" /></svg>;
    default: return null;
  }
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

  const heroStep = !serviceType ? 1 : !propertyType ? 2 : 3;
  const heroBadges = [
    { icon: "check" as IconName, label: m.heroBadgeFree },
    { icon: "bolt"  as IconName, label: m.heroBadgeInstant },
    { icon: "pin"   as IconName, label: m.heroBadgeLocation },
  ];
  const heroFeatures = [
    { icon: "lock" as IconName, title: m.heroFeature1Title, desc: m.heroFeature1Desc },
    { icon: "chip" as IconName, title: m.heroFeature2Title, desc: m.heroFeature2Desc },
    { icon: "clock" as IconName, title: m.heroFeature3Title, desc: m.heroFeature3Desc },
    { icon: "badge" as IconName, title: m.heroFeature4Title, desc: m.heroFeature4Desc },
  ];
  const heroSteps = [
    { n: 1, label: m.heroStepService },
    { n: 2, label: m.heroStepProperty },
    { n: 3, label: m.heroStepPhotos },
  ];

  return (
    <main style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.07) 0%, transparent 60%)",
    }}>
      <div className="hero-container">

        {/* Header */}
        <div style={{ paddingTop: "24px", paddingBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <LogoMark size="sm" />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "9px", letterSpacing: "2px", color: "var(--gold)", margin: 0, whiteSpace: "nowrap" }}>
                FIXMYPROPERTY · GTA
              </p>
              <h1 style={{ margin: 0, fontSize: "1rem", fontWeight: 900, letterSpacing: "-0.3px", whiteSpace: "nowrap" }}>
                <span style={{ fontWeight: 300, color: "var(--muted)" }}>Inspector </span>
                <span style={{ color: "var(--white)" }}>MacTor</span>
              </h1>
            </div>
          </div>
          <button type="button" className="lang-chip" onClick={() => setShowLangPicker(true)} style={{ flexShrink: 0 }}>
            <span>{currentLangMeta.flag}</span>
            <span>{currentLangMeta.name}</span>
            <span aria-hidden="true">⌄</span>
          </button>
        </div>

        {/* ── Hero: headline first, then a clean framed photo, then trust row ── */}
        <div className="hero-copy fade-up-1">
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 16px",
            borderRadius: "20px", background: "var(--teal-dim)", border: "1px solid rgba(45,212,191,0.35)",
            marginBottom: "20px",
          }}>
            <span style={{ color: "var(--teal)" }}>✦</span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "11px", letterSpacing: "1px", color: "var(--teal)", fontWeight: 700 }}>
              {m.heroEyebrow.toUpperCase()}
            </span>
          </div>

          <h2 style={{ margin: 0, fontSize: "clamp(2.3rem, 8vw, 3.6rem)", fontWeight: 900, lineHeight: 1.03, letterSpacing: "-1px", color: "var(--white)" }}>
            {m.heroHeadlinePre}{" "}
            <span style={{ background: "linear-gradient(135deg,#fcd34d,#f59e0b)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              {m.heroHeadlineHighlight}
            </span>
          </h2>
        </div>

        <div className="hero-photo-card fade-up-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/inspector-hero.png" alt="Inspector MacTor" className="hero-photo-clean" />
        </div>

        <div className="hero-trust-row fade-up-3">
          {heroBadges.map(b => (
            <span key={b.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "var(--teal)", display: "flex" }}><Icon name={b.icon} size={19} /></span>
              <span style={{ fontSize: "1rem", color: "var(--white)", fontWeight: 500 }}>{b.label}</span>
            </span>
          ))}
        </div>

        {/* ── Steps panel ── */}
        <div className="hero-panel fade-up-3">

          {/* Service type */}
          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "12px", color: "var(--teal)", letterSpacing: "1.5px", marginBottom: "16px", fontWeight: 700, textAlign: "center" }}>
            {m.heroStepLabel(1)}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "28px" }}>
            {([
              { id: "repair" as ServiceType,      icon: "/icon-repair.png",      label: m.serviceRepairLabel,     desc: m.serviceRepairDesc,     popular: true  },
              { id: "new_project" as ServiceType, icon: "/icon-new-project.png", label: m.serviceNewProjectLabel, desc: m.serviceNewProjectDesc, popular: false },
            ]).map(opt => {
              const active = serviceType === opt.id;
              return (
                <button key={opt.id} type="button" onClick={() => setServiceType(opt.id)}
                  style={{
                    ...btnReset, position: "relative",
                    padding: "28px 12px 24px",
                    borderRadius: "20px",
                    minHeight: "196px",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px",
                    background: active
                      ? "linear-gradient(160deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))"
                      : "var(--navy-800)",
                    border: active ? "2px solid var(--gold)" : "1.5px solid var(--border)",
                    boxShadow: active ? "0 0 0 3px rgba(245,158,11,0.12)" : "none",
                    transition: "all 0.15s",
                  }}>
                  {opt.popular && (
                    <span style={{
                      position: "absolute", top: "10px", left: "10px",
                      fontFamily: "'Space Mono',monospace", fontSize: "9px", fontWeight: 700, letterSpacing: "0.5px",
                      color: "#0a0f1e", background: "var(--gold-light)", padding: "3px 8px", borderRadius: "6px",
                    }}>
                      POPULAR
                    </span>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={opt.icon} alt="" className="icon-img" style={{ width: 104, height: 104 }} />
                  <span style={{
                    fontWeight: 800, fontSize: "1.15rem",
                    color: active ? "var(--gold-light)" : "var(--white)",
                    letterSpacing: "-0.2px",
                  }}>
                    {active ? "✓ " : ""}{opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Property type */}
          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "12px", color: "var(--teal)", letterSpacing: "1.5px", marginBottom: "4px", fontWeight: 700, textAlign: "center" }}>
            {m.heroStepLabel(2)}
          </p>
          <p style={{ margin: "0 0 16px", fontSize: "1.2rem", fontWeight: 800, color: "var(--white)", textAlign: "center" }}>
            {m.propertyLabel}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "28px" }}>
            {([
              { id: "residential" as const, label: m.residential, icon: "/icon-residential.png", desc: m.residentialDesc },
              { id: "commercial"  as const, label: m.commercial,  icon: "/icon-commercial.png", desc: m.commercialDesc  },
            ]).map(opt => {
              const active = propertyType === opt.id;
              return (
                <button key={opt.id} type="button" onClick={() => setPropertyType(opt.id)}
                  style={{
                    ...btnReset, padding: "22px 10px", borderRadius: "16px", textAlign: "center",
                    background: active ? "rgba(45,212,191,0.1)" : "var(--navy-800)",
                    border: active ? "2px solid var(--teal)" : "1.5px solid var(--border)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
                  }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={opt.icon} alt="" className="icon-img" style={{ width: 68, height: 68 }} />
                  <span style={{ fontWeight: 700, color: active ? "var(--teal)" : "var(--white)", fontSize: "1rem" }}>
                    {active ? "✓ " : ""}{opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Step indicator */}
          <div className="hero-steps-row">
            {heroSteps.map((s, i) => {
              const state = s.n < heroStep ? "done" : s.n === heroStep ? "active" : "upcoming";
              return (
                <div key={s.n} style={{ display: "flex", alignItems: "center", flex: i < heroSteps.length - 1 ? 1 : "0 0 auto" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: "0.85rem", fontFamily: "'Space Mono',monospace", flexShrink: 0,
                      background: state === "upcoming" ? "var(--navy-800)" : "rgba(245,158,11,0.15)",
                      border: `2px solid ${state === "upcoming" ? "var(--border)" : "var(--gold)"}`,
                      color: state === "upcoming" ? "var(--muted)" : "var(--gold-light)",
                    }}>
                      {state === "done" ? "✓" : s.n}
                    </div>
                    <span style={{ fontSize: "0.68rem", color: state === "upcoming" ? "var(--muted)" : "var(--gold-light)", fontWeight: state === "active" ? 700 : 500, whiteSpace: "nowrap" }}>
                      {s.label}
                    </span>
                  </div>
                  {i < heroSteps.length - 1 && (
                    <div style={{ flex: 1, height: 2, margin: "0 6px 20px", background: s.n < heroStep ? "var(--gold)" : "var(--border)" }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <button type="button" onClick={start} disabled={!canStart}
            style={{
              ...btnReset,
              background: canStart ? "linear-gradient(135deg,#f59e0b,#d97706)" : "var(--navy-800)",
              color: canStart ? "#0a0f1e" : "var(--muted)",
              padding: "18px", borderRadius: "18px", fontWeight: 800, fontSize: "1.1rem",
              width: "100%", minHeight: "64px", marginTop: "24px",
              opacity: canStart ? 1 : 0.45,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px",
              boxShadow: canStart ? "0 4px 20px rgba(245,158,11,0.3)" : "none",
              border: canStart ? "none" : "1px solid var(--border)",
            }}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="pulse-dot" style={{ width: 10, height: 10, borderRadius: "50%", background: "currentColor" }} />{m.starting}
              </span>
            ) : (
              <>
                <span>{m.heroCtaMain} →</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 500, opacity: 0.75 }}>{m.heroCtaSub}</span>
              </>
            )}
          </button>
        </div>

        {/* ── Trust features row ── */}
        <div className="hero-features-row">
          {heroFeatures.map(f => (
            <div key={f.title} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "8px", padding: "16px 10px" }}>
              <span style={{ color: "var(--teal)", display: "flex" }}><Icon name={f.icon} size={22} /></span>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--white)" }}>{f.title}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.4 }}>{f.desc}</span>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--muted)", padding: "8px 0 28px" }}>
          FixMyProperty · MacTor Maintenance · GTA Toronto © 2026
        </p>
      </div>
    </main>
  );
}
