"use client";
import { use, useState, useEffect } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export default function AcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [status, setStatus] = useState<"loading" | "accepted" | "declined" | "error">("loading");
  const action = typeof window !== "undefined" ? new URL(window.location.href).searchParams.get("action") : null;

  useEffect(() => {
    const endpoint = action === "decline" ? "decline" : "accept";
    fetch(`${API_URL}/api/approve/${token}/${endpoint}`, { method: "POST" })
      .then(r => r.json())
      .then(() => setStatus(action === "decline" ? "declined" : "accepted"))
      .catch(() => setStatus("error"));
  }, [token, action]);

  const content = {
    loading:  { icon: "⏳", title: "Processing…",       color: "var(--blue-light)", msg: "" },
    accepted: { icon: "🎉", title: "Estimate Accepted!", color: "var(--green)",      msg: "We will call you soon to schedule the visit. Thank you for choosing MacTor!" },
    declined: { icon: "👍", title: "Noted",              color: "var(--muted)",      msg: "Thank you for your response. If you change your mind, feel free to contact us." },
    error:    { icon: "❌", title: "Error",              color: "var(--red)",        msg: "Something went wrong. Please contact MacTor directly." },
  }[status];

  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center", background: "var(--navy)" }}>
      <span style={{ fontSize: "3.5rem", marginBottom: "20px" }}>{content.icon}</span>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: content.color, marginBottom: "12px" }}>{content.title}</h1>
      {content.msg && <p style={{ color: "var(--muted)", fontSize: "1rem", maxWidth: "300px", lineHeight: 1.6, marginBottom: "32px" }}>{content.msg}</p>}
      {status !== "loading" && (
        <Link href="/" style={{ padding: "14px 28px", borderRadius: "14px", background: "var(--navy-800)", border: "1px solid var(--border)", color: "var(--white)", textDecoration: "none", fontWeight: 600, touchAction: "manipulation" }}>
          Back to home
        </Link>
      )}
      <p style={{ marginTop: "32px", fontFamily: "monospace", fontSize: "11px", color: "var(--muted)" }}>MacTor Maintenance · GTA Toronto</p>
    </main>
  );
}
