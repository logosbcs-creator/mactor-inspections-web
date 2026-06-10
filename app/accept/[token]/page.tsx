"use client";
import { use, useState, useEffect } from "react";
import Link from "next/link";
import { T, type Lang, getSavedLang, getLangFromUrl } from "../../i18n/translations";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export default function AcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [status, setStatus] = useState<"loading" | "accepted" | "declined" | "error">("loading");
  const [lang, setLang] = useState<Lang>("en");
  const action = typeof window !== "undefined" ? new URL(window.location.href).searchParams.get("action") : null;

  useEffect(() => {
    setLang(getLangFromUrl() || getSavedLang() || "en");
  }, []);

  useEffect(() => {
    const endpoint = action === "decline" ? "decline" : "accept";
    fetch(`${API_URL}/api/approve/${token}/${endpoint}`, { method: "POST" })
      .then(r => r.json())
      .then(() => setStatus(action === "decline" ? "declined" : "accepted"))
      .catch(() => setStatus("error"));
  }, [token, action]);

  const t = T[lang];

  const content = {
    loading:  { icon: "⏳", title: t.processing,  color: "var(--gold-light)", msg: "" },
    accepted: { icon: "🎉", title: t.accepted,     color: "var(--green)",      msg: t.acceptedMsg },
    declined: { icon: "👍", title: t.declined,     color: "var(--muted)",      msg: t.declinedMsg },
    error:    { icon: "❌", title: "Error",         color: "var(--red)",        msg: t.errorMsg    },
  }[status];

  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center", background: "var(--navy)" }}>
      <span style={{ fontSize: "3.5rem", marginBottom: "20px" }}>{content.icon}</span>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: content.color, marginBottom: "12px" }}>{content.title}</h1>
      {content.msg && (
        <p style={{ color: "var(--muted)", fontSize: "1rem", maxWidth: "300px", lineHeight: 1.6, marginBottom: "32px" }}>
          {content.msg}
        </p>
      )}
      {status !== "loading" && (
        <Link href="/" style={{
          padding: "14px 28px", borderRadius: "14px",
          background: "var(--navy-800)", border: "1px solid var(--border)",
          color: "var(--white)", textDecoration: "none", fontWeight: 600, touchAction: "manipulation",
        }}>
          {t.backHome}
        </Link>
      )}
      <p style={{ marginTop: "32px", fontFamily: "'Space Mono',monospace", fontSize: "11px", color: "var(--muted)" }}>
        MacTor Maintenance · GTA Toronto
      </p>
    </main>
  );
}
