"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const INVOICE_PROMPT = `You are extracting invoice data from PDF files for MacTor Construction.

For EACH invoice PDF, output a JSON object with this EXACT structure:
{
  "invoiceNumber": "INV0001",
  "type": "invoice",
  "invoiceDate": "YYYY-MM-DD",
  "status": "paid",
  "clientName": "Full Name",
  "clientEmail": "email or null",
  "clientPhone": "phone or null",
  "clientAddress": "full address",
  "lineItems": [
    { "description": "Work description", "notes": "detail or null", "rate": 1000.00, "qty": 1, "amount": 1000.00 }
  ],
  "subtotal": 1000.00,
  "hst": 130.00,
  "total": 1130.00,
  "notes": "any notes at the bottom or null"
}

Rules:
- status must be: "paid", "sent", "draft", or "overdue"
- If the invoice shows payment received → status = "paid"
- invoiceDate format: YYYY-MM-DD
- All amounts as numbers (no $ signs)
- Return a JSON array [...] wrapping ALL invoices`;

const ESTIMATE_PROMPT = `You are extracting estimate data from PDF files for MacTor Construction.

For EACH estimate PDF, output a JSON object with this EXACT structure:
{
  "invoiceNumber": "EST0377",
  "type": "estimate",
  "invoiceDate": "YYYY-MM-DD",
  "status": "sent",
  "clientName": "Full Name",
  "clientEmail": "email or null",
  "clientPhone": "phone or null",
  "clientAddress": "full address",
  "lineItems": [
    {
      "description": "Option 1 – Clean & Preserve",
      "notes": "Brief summary of this option",
      "rate": 2950.00,
      "qty": 1,
      "amount": 2950.00,
      "subItems": [
        { "name": "Masonry Cleaning & Sealing", "price": 650, "unit": "lump sum", "description": "Full scope description from PDF" },
        { "name": "Drainage Gravel System", "price": 750, "unit": "70 lf", "description": "Full scope description from PDF" },
        { "name": "Landscape Restoration", "price": 1150, "unit": "lump sum", "description": "Full scope description from PDF" },
        { "name": "Cleanup & Disposal", "price": 400, "unit": "lump sum", "description": "Full scope description" }
      ]
    }
  ],
  "subtotal": 2950.00,
  "hst": 383.50,
  "total": 3333.50,
  "notes": "any notes or null"
}

CRITICAL RULES:
- Each OPTION in the estimate = one lineItem (rate = option total, qty = 1)
- subItems MUST be extracted from the "- Service Name: $price" breakdown within each option
- If the PDF shows $0.00 totals, calculate from the actual option prices shown
- unit examples: "lump sum", "70 lf", "sqft", "per unit"
- Return a JSON array [...] wrapping ALL estimates`;

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
function token() { return localStorage.getItem("mactor_token") || ""; }

export default function ImportPage() {
  const router  = useRouter();
  const [mode,   setMode]   = useState<"invoice"|"estimate">("invoice");
  const [json,  setJson]   = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error,  setError]  = useState("");
  const [copied, setCopied] = useState(false);

  function copyPrompt() {
    navigator.clipboard.writeText(mode === "invoice" ? INVOICE_PROMPT : ESTIMATE_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
        <Image src="/mactor-logo.png" alt="MacTor Construction" width={69} height={48} style={{ objectFit: "contain" }} />
        <div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Importar historial</h1>
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Pega el JSON que generó ChatGPT</p>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px" }}>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["invoice","estimate"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setResult(null); setError(""); setJson(""); }}
              style={{ flex: 1, padding: "11px", borderRadius: 10,
                border: `2px solid ${mode===m?"#e63946":"#374151"}`,
                background: mode===m?"#e63946":"transparent",
                color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {m === "invoice" ? "📄 Importar Facturas" : "📋 Importar Estimados"}
            </button>
          ))}
        </div>

        {/* Prompt section */}
        <div style={{ background: "#1f2937", borderRadius: 12, padding: "16px 20px", marginBottom: 20, border: "1px solid #0a0f1e33" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>
              📋 Prompt para ChatGPT — {mode === "invoice" ? "Facturas" : "Estimados"}
            </p>
            <button onClick={copyPrompt}
              style={{ background:"#0a0f1e", color:"#fff", border:"none", borderRadius:8, padding:"5px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
              {copied ? "✓ Copiado" : "Copiar prompt"}
            </button>
          </div>
          <pre style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto",
            background: "#0f172a", borderRadius: 8, padding: "10px 12px" }}>
            {(mode === "invoice" ? INVOICE_PROMPT : ESTIMATE_PROMPT).trim()}
          </pre>
          {mode === "estimate" && (
            <p style={{ margin: "10px 0 0", fontSize: 11, color: "#94a3b8" }}>
              ⭐ Los estimados con <strong>subItems</strong> alimentan automáticamente el catálogo de precios
            </p>
          )}
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
              background: "#0a0f1e", border: "1px solid #374151", color: "#e2e8f0",
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
          <div style={{ background: "#7f1d1d", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#dc2626" }}>
            ❌ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ background: result.errors?.length ? "#374151" : "#0a0f1e", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
            <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>
              {result.errors?.length === 0 ? "✅ Importación completada" : "⚠️ Importación con algunos errores"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "Creadas",  value: result.created, color: "#94a3b8" },
                { label: "Ya existían", value: result.skipped, color: "#94a3b8" },
                { label: "Errores",  value: result.errors?.length || 0, color: "#e63946" },
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
                  <p key={i} style={{ margin: "4px 0", fontSize: 11, color: "#dc2626" }}>• {e.invoiceNumber}: {e.error}</p>
                ))}
              </div>
            )}
            {result.created > 0 && (
              <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => router.push("/invoices")}
                  style={{ background: "#0a0f1e", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Ver {mode === "estimate" ? "estimados" : "facturas"} importados →
                </button>
                {mode === "estimate" && (
                  <button onClick={() => router.push("/invoices/catalog")}
                    style={{ background: "#0a0f1e", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    Ver catálogo de precios →
                  </button>
                )}
              </div>
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
