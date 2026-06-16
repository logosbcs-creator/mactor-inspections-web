"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

interface LineItem { description: string; notes: string; rate: number; qty: number; amount: number; }

const emptyItem = (): LineItem => ({ description: "", notes: "", rate: 0, qty: 1, amount: 0 });

function token() { return localStorage.getItem("mactor_token") || ""; }

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8, background: "#1f2937",
  border: "1px solid #374151", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = { display: "block", color: "#9ca3af", fontSize: 11, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" };

export default function NewInvoicePage() {
  const router = useRouter();
  const [type,   setType]   = useState<"invoice"|"estimate">("invoice");
  const [client, setClient] = useState({ name: "", email: "", phone: "", address: "" });
  const [items,  setItems]  = useState<LineItem[]>([emptyItem()]);
  const [notes,  setNotes]  = useState("");
  const [saving, setSaving] = useState(false);

  function updateItem(i: number, field: keyof LineItem, val: string | number) {
    setItems(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      if (field === "rate" || field === "qty") {
        next[i].amount = Math.round(Number(next[i].rate) * Number(next[i].qty) * 100) / 100;
      }
      return next;
    });
  }

  const subtotal = items.reduce((s, i) => s + Number(i.amount), 0);
  const hst      = Math.round(subtotal * 0.13 * 100) / 100;
  const total    = Math.round((subtotal + hst) * 100) / 100;

  async function save(andSend = false) {
    if (!client.name.trim()) { alert("Nombre del cliente requerido"); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ type, clientName: client.name, clientEmail: client.email, clientPhone: client.phone, clientAddress: client.address, lineItems: items, notes }),
      });
      if (r.status === 401) { router.push("/invoices/login"); return; }
      const inv = await r.json();
      if (andSend && client.email) {
        await fetch(`${API}/api/invoices/${inv.id}/send`, { method: "POST", headers: { Authorization: `Bearer ${token()}` } });
      }
      router.push(`/invoices/${inv.id}`);
    } catch { alert("Error guardando"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0f1e", color: "#fff", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#111827", borderBottom: "1px solid #1f2937", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.push("/invoices")} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 22, cursor: "pointer", padding: 0 }}>←</button>
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Nueva {type === "invoice" ? "Factura" : "Estimado"}</h1>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px" }}>
        {/* Type toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {(["invoice","estimate"] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
                background: type === t ? "#e63946" : "#1f2937", color: type === t ? "#fff" : "#9ca3af" }}>
              {t === "invoice" ? "📄 Factura" : "📋 Estimado"}
            </button>
          ))}
        </div>

        {/* Client */}
        <div style={{ background: "#111827", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".05em" }}>Cliente</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Nombre *</label>
              <input style={inp} value={client.name} onChange={e => setClient(p => ({ ...p, name: e.target.value }))} placeholder="Nombre del cliente" />
            </div>
            <div>
              <label style={lbl}>Email</label>
              <input style={inp} type="email" value={client.email} onChange={e => setClient(p => ({ ...p, email: e.target.value }))} placeholder="email@ejemplo.com" />
            </div>
            <div>
              <label style={lbl}>Teléfono</label>
              <input style={inp} value={client.phone} onChange={e => setClient(p => ({ ...p, phone: e.target.value }))} placeholder="416-000-0000" />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Dirección</label>
              <input style={inp} value={client.address} onChange={e => setClient(p => ({ ...p, address: e.target.value }))} placeholder="123 Main St, Toronto ON" />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div style={{ background: "#111827", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".05em" }}>Ítems</h2>
            <button onClick={() => setItems(p => [...p, emptyItem()])}
              style={{ background: "#1f2937", color: "#e63946", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              + Agregar ítem
            </button>
          </div>

          {items.map((item, i) => (
            <div key={i} style={{ background: "#0a0f1e", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#e63946" }}>Ítem {i + 1}</span>
                {items.length > 1 && (
                  <button onClick={() => setItems(p => p.filter((_, j) => j !== i))}
                    style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 18, padding: 0 }}>✕</button>
                )}
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Descripción</label>
                <input style={inp} value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Descripción del trabajo" />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Notas / Detalle</label>
                <textarea style={{ ...inp, minHeight: 60, resize: "vertical" } as React.CSSProperties}
                  value={item.notes} onChange={e => updateItem(i, "notes", e.target.value)} placeholder="Labor: $xx · Materials: $xx · Trabajo realizado..." />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={lbl}>Precio ($)</label>
                  <input style={inp} type="number" min="0" step="0.01" value={item.rate || ""} onChange={e => updateItem(i, "rate", parseFloat(e.target.value) || 0)} placeholder="0.00" />
                </div>
                <div>
                  <label style={lbl}>Cantidad</label>
                  <input style={inp} type="number" min="1" value={item.qty} onChange={e => updateItem(i, "qty", parseInt(e.target.value) || 1)} />
                </div>
                <div>
                  <label style={lbl}>Total</label>
                  <div style={{ ...inp, color: "#e63946", fontWeight: 700, display: "flex", alignItems: "center" }}>
                    ${item.amount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Totals */}
          <div style={{ borderTop: "1px solid #1f2937", paddingTop: 16, marginTop: 8 }}>
            {[["Subtotal", subtotal], ["HST (13%)", hst]].map(([l, v]) => (
              <div key={String(l)} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#9ca3af", fontSize: 13 }}>{l}</span>
                <span style={{ color: "#fff", fontSize: 13 }}>${Number(v).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", background: "#1f2937", borderRadius: 8, padding: "10px 12px", marginTop: 8 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>TOTAL CAD</span>
              <span style={{ color: "#e63946", fontWeight: 700, fontSize: 18 }}>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={{ background: "#111827", borderRadius: 12, padding: "20px", marginBottom: 24 }}>
          <label style={lbl}>Notas finales</label>
          <textarea style={{ ...inp, minHeight: 80, resize: "vertical" } as React.CSSProperties}
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Ej: El trabajo fue completado el viernes 13 de junio..." />
        </div>

        {/* Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <button onClick={() => save(false)} disabled={saving}
            style={{ padding: "14px", borderRadius: 12, background: "#1f2937", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            💾 Guardar borrador
          </button>
          <button onClick={() => save(true)} disabled={saving || !client.email}
            style={{ padding: "14px", borderRadius: 12, background: "#e63946", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: (saving || !client.email) ? "not-allowed" : "pointer", opacity: (saving || !client.email) ? 0.7 : 1 }}>
            📤 Guardar y enviar
          </button>
        </div>
        {!client.email && <p style={{ color: "#6b7280", fontSize: 12, textAlign: "center", marginTop: 8 }}>Agrega email del cliente para enviar directo</p>}
      </div>
    </div>
  );
}
