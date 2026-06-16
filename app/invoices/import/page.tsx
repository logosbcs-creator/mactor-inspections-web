"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
function token() { return localStorage.getItem("mactor_token") || ""; }

export default function ImportPage() {
  const router  = useRouter();
  const [json,  setJson]   = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error,  setError]  = useState("");

  async function handleImport() {
    setError(""); setResult(null);
    let parsed: any[];
    try {
      // Strip markdown code fences that ChatGPT adds (```json ... ``` or ``` ... ```)
      const clean = json.trim().replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(clean);
      if (!Array.isArray(parsed)) throw new Error("Debe ser un arreglo JSON [ ... ]");
    } catch (e: any) {
      setError("JSON inválido: " + e.message); return;
    }
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/invoices/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ invoices: parsed }),
      });
      if (r.status === 401) { router.push("/invoices/login"); return; }
      const data = await r.json();
      setResult(data);
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0f1e", color: "#fff", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.push("/invoices")} style={{ background: "none", border: "none", color: "#64748b", fontSize: 22, cursor: "pointer", padding: 0 }}>←</button>
        <Image src="/mactor-logo.png" alt="MacTor Construction" width={100} height={48} style={{ objectFit: "contain" }} />
        <div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Importar historial</h1>
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Pega el JSON que generó ChatGPT</p>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px" }}>

        {/* Instructions */}
        <div style={{ background: "#1e3a5f", borderRadius: 12, padding: "16px 20px", marginBottom: 20, border: "1px solid #2563eb33" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#60a5fa" }}>📋 Cómo usar</p>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#93c5fd", lineHeight: 1.8 }}>
            <li>Dale los PDFs a ChatGPT con el prompt que te di</li>
            <li>ChatGPT devuelve un JSON — cópialo todo</li>
            <li>Pégalo aquí abajo</li>
            <li>Clic en "Importar" — listo</li>
          </ol>
        </div>

        {/* JSON input */}
        <div style={{ background: "#111827", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
          <label style={{ display: "block", color: "#9ca3af", fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".05em" }}>
            JSON de ChatGPT
          </label>
          <textarea
            value={json}
            onChange={e => setJson(e.target.value)}
            placeholder={'[\n  {\n    "invoiceNumber": "INV0001",\n    "clientName": "John Smith",\n    ...\n  }\n]'}
            style={{
              width: "100%", minHeight: 320, padding: "12px", borderRadius: 8,
              background: "#0a0f1e", border: "1px solid #374151", color: "#a5f3fc",
              fontSize: 12, fontFamily: "monospace", outline: "none",
              resize: "vertical", boxSizing: "border-box", lineHeight: 1.6,
            }}
          />
          {json && (
            <p style={{ margin: "8px 0 0", fontSize: 11, color: "#6b7280" }}>
              {(() => { try { const c = json.trim().replace(/^```[a-z]*\n?/i,"").replace(/```\s*$/i,"").trim(); const a = JSON.parse(c); return Array.isArray(a) ? `✓ ${a.length} factura(s) detectada(s)` : "⚠ No es un arreglo"; } catch { return "⚠ JSON inválido"; } })()}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#7f1d1d", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#fca5a5" }}>
            ❌ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ background: result.errors?.length ? "#78350f" : "#14532d", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
            <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>
              {result.errors?.length === 0 ? "✅ Importación completada" : "⚠️ Importación con algunos errores"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "Creadas",  value: result.created, color: "#4ade80" },
                { label: "Ya existían", value: result.skipped, color: "#facc15" },
                { label: "Errores",  value: result.errors?.length || 0, color: "#f87171" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(0,0,0,.2)", borderRadius: 8, padding: "10px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#d1d5db" }}>{s.label}</p>
                </div>
              ))}
            </div>
            {result.errors?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {result.errors.map((e: any, i: number) => (
                  <p key={i} style={{ margin: "4px 0", fontSize: 11, color: "#fca5a5" }}>• {e.invoiceNumber}: {e.error}</p>
                ))}
              </div>
            )}
            {result.created > 0 && (
              <button onClick={() => router.push("/invoices")}
                style={{ marginTop: 16, background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Ver facturas importadas →
              </button>
            )}
          </div>
        )}

        {/* Import button */}
        {!result && (
          <button onClick={handleImport} disabled={loading || !json.trim()}
            style={{ width: "100%", padding: "15px", borderRadius: 12, background: loading ? "#374151" : "#e63946", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: (loading || !json.trim()) ? "not-allowed" : "pointer" }}>
            {loading ? "Importando..." : "📥 Importar todo el historial"}
          </button>
        )}
      </div>
    </div>
  );
}
