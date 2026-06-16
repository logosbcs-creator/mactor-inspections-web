"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

function token() { return localStorage.getItem("mactor_token") || ""; }

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280", sent: "#2563eb", paid: "#16a34a", overdue: "#dc2626",
};
const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador", sent: "Enviado", paid: "Pagado", overdue: "Vencido",
};

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = use(params);
  const router   = useRouter();
  const [inv,    setInv]    = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [msg,    setMsg]    = useState("");

  useEffect(() => {
    const t = localStorage.getItem("mactor_token");
    if (!t) { router.push("/invoices/login"); return; }
    fetch(`${API}/api/invoices/${id}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => { if (r.status === 401) { router.push("/invoices/login"); return null; } return r.json(); })
      .then(d => d && setInv(d));
  }, [id]);

  async function send() {
    setSending(true); setMsg("");
    const r = await fetch(`${API}/api/invoices/${id}/send`, { method: "POST", headers: { Authorization: `Bearer ${token()}` } });
    if (r.ok) { setMsg("✅ Enviado correctamente"); setInv((p: any) => ({ ...p, status: "sent", sentAt: new Date().toISOString() })); }
    else       { setMsg("❌ Error al enviar"); }
    setSending(false);
  }

  async function markPaid() {
    const r = await fetch(`${API}/api/invoices/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ status: "paid" }),
    });
    if (r.ok) setInv((p: any) => ({ ...p, status: "paid", paidAt: new Date().toISOString() }));
  }

  function openPDF() {
    window.open(`${API}/api/invoices/${id}/pdf?token=${token()}`, "_blank");
  }

  if (!inv) return <div style={{ minHeight: "100dvh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>Cargando...</div>;

  const isEst = inv.type === "estimate";

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0f1e", color: "#fff", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#111827", borderBottom: "1px solid #1f2937", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/invoices")} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 22, cursor: "pointer", padding: 0 }}>←</button>
          <div>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{inv.invoiceNumber}</h1>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: (STATUS_COLORS[inv.status] || "#6b7280") + "33", color: STATUS_COLORS[inv.status] || "#6b7280" }}>
              {STATUS_LABELS[inv.status] || inv.status}
            </span>
          </div>
        </div>
        <button onClick={openPDF}
          style={{ background: "#1f2937", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          📄 Ver PDF
        </button>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px" }}>
        {msg && <div style={{ background: msg.startsWith("✅") ? "#14532d" : "#7f1d1d", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13 }}>{msg}</div>}

        {/* Client card */}
        <div style={{ background: "#111827", borderRadius: 12, padding: "20px", marginBottom: 12 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".05em" }}>Cliente</p>
          <p style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 700 }}>{inv.clientName}</p>
          {inv.clientAddress && <p style={{ margin: "2px 0", fontSize: 13, color: "#9ca3af" }}>{inv.clientAddress}</p>}
          {inv.clientPhone   && <p style={{ margin: "2px 0", fontSize: 13, color: "#9ca3af" }}>{inv.clientPhone}</p>}
          {inv.clientEmail   && <p style={{ margin: "2px 0", fontSize: 13, color: "#9ca3af" }}>{inv.clientEmail}</p>}
        </div>

        {/* Line items */}
        <div style={{ background: "#111827", borderRadius: 12, padding: "20px", marginBottom: 12 }}>
          <p style={{ margin: "0 0 14px", fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".05em" }}>Ítems</p>
          {(inv.lineItems || []).map((item: any, i: number) => (
            <div key={i} style={{ borderBottom: "1px solid #1f2937", paddingBottom: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{item.description}</p>
                  {item.notes && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af", whiteSpace: "pre-line" }}>{item.notes}</p>}
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e63946", flexShrink: 0, marginLeft: 12 }}>${Number(item.amount || 0).toFixed(2)}</p>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#6b7280" }}>${Number(item.rate || 0).toFixed(2)} × {item.qty}</p>
            </div>
          ))}

          {/* Totals */}
          {[["Subtotal", inv.subtotal], ["HST (13%)", inv.hst]].map(([l, v]) => (
            <div key={String(l)} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#9ca3af", fontSize: 13 }}>{l}</span>
              <span style={{ color: "#fff", fontSize: 13 }}>${Number(v).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", background: "#0a0f1e", borderRadius: 8, padding: "10px 12px", marginTop: 8 }}>
            <span style={{ color: "#fff", fontWeight: 700 }}>TOTAL CAD</span>
            <span style={{ color: "#e63946", fontWeight: 700, fontSize: 18 }}>${Number(inv.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Notes */}
        {inv.notes && (
          <div style={{ background: "#111827", borderRadius: 12, padding: "16px 20px", marginBottom: 12 }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".05em" }}>Notas</p>
            <p style={{ margin: 0, fontSize: 13, color: "#d1d5db", whiteSpace: "pre-line" }}>{inv.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {inv.clientEmail && inv.status !== "paid" && (
            <button onClick={send} disabled={sending}
              style={{ padding: "14px", borderRadius: 12, background: "#1d4ed8", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.7 : 1 }}>
              {sending ? "Enviando..." : `📤 Enviar ${isEst ? "estimado" : "factura"} por email`}
            </button>
          )}
          {inv.status !== "paid" && (
            <button onClick={markPaid}
              style={{ padding: "14px", borderRadius: 12, background: "#14532d", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              ✅ Marcar como pagado
            </button>
          )}
          {inv.status === "paid" && (
            <div style={{ background: "#14532d33", border: "1px solid #16a34a", borderRadius: 12, padding: "14px", textAlign: "center", color: "#16a34a", fontWeight: 700 }}>
              ✅ Pagado {inv.paidAt ? `· ${new Date(inv.paidAt).toLocaleDateString("en-CA")}` : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
