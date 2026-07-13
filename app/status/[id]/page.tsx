"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { T, type Lang, getSavedLang, getLangFromUrl } from "../../i18n/translations";

export default function StatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  void id;
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    setLang(getLangFromUrl() || getSavedLang() || "en");
  }, []);

  const t = T[lang];

  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center", background: "var(--navy)" }}>

      {/* Logo */}
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(245,158,11,0.15)", border: "2px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "24px" }}>
        ✅
      </div>

      <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "11px", color: "var(--gold)", letterSpacing: "3px", marginBottom: "12px" }}>
        {t.reportSubmitted}
      </p>

      <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--white)", margin: "0 0 12px", lineHeight: 1.2 }}>
        {t.allDone}
      </h1>

      <p style={{ color: "var(--muted)", fontSize: "1rem", maxWidth: "320px", lineHeight: 1.6, marginBottom: "32px" }}>
        {t.statusDesc} <strong style={{ color: "var(--white)" }}>{t.costEstimateByEmail}</strong> {t.statusAfter}
      </p>

      <div style={{ padding: "18px 20px", borderRadius: "16px", background: "var(--navy-800)", border: "1px solid var(--border)", marginBottom: "32px", width: "100%", maxWidth: "340px" }}>
        {[
          { icon: "✏️", text: t.statusSteps[0] },
          { icon: "📞", text: t.statusSteps[1] },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: i < 1 ? "1px solid var(--border)" : "none" }}>
            <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
            <span style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "left" }}>{item.text}</span>
          </div>
        ))}
      </div>

      <Link href="/" style={{
        display: "inline-block", padding: "16px 32px", borderRadius: "16px",
        background: "var(--navy-800)", border: "1px solid var(--border)",
        color: "var(--white)", fontWeight: 600, textDecoration: "none", touchAction: "manipulation",
      }}>
        {t.newInspection}
      </Link>

      <p style={{ marginTop: "24px", fontFamily: "'Space Mono',monospace", fontSize: "11px", color: "var(--muted)" }}>
        MacTor Maintenance · mactor.maintenance@gmail.com
      </p>
    </main>
  );
}
