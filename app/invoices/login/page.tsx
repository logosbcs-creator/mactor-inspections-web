"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export default function InvoiceLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await r.json();
      if (!r.ok) { setError("Usuario o contraseña incorrectos"); return; }
      localStorage.setItem("mactor_token", data.token);
      router.push("/invoices");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--navy,#0a0f1e)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#111827", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Image src="/mactor-logo.png" alt="MacTor Construction" width={180} height={100} style={{ objectFit: "contain", marginBottom: 12 }} />
          <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>Sistema de Facturación</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#9ca3af", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>Usuario</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "#1f2937", border: "1px solid #374151", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }}
              placeholder="julio" autoComplete="username"
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", color: "#9ca3af", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "#1f2937", border: "1px solid #374151", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }}
              autoComplete="current-password"
            />
          </div>
          {error && <p style={{ color: "#e63946", fontSize: 13, marginBottom: 16, textAlign: "center" }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "13px", borderRadius: 10, background: "#e63946", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
