"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

interface LineItem { description: string; notes: string; rate: number; qty: number; amount: number; }
const emptyItem = (): LineItem => ({ description: "", notes: "", rate: 0, qty: 1, amount: 0 });
function token() { return localStorage.getItem("mactor_token") || ""; }

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8, background: "#fff",
  border: "1px solid #e2e8f0", color: "#0f172a", fontSize: 14, outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", color: "#64748b", fontSize: 11, fontWeight: 700,
  marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em"
};
const card: React.CSSProperties = {
  background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
  padding: "20px 24px", marginBottom: 16
};

export default function NewInvoicePage() {
  const router   = useRouter();
  const fileRef  = useRef<HTMLInputElement>(null);
  const [type,   setType]   = useState<"invoice"|"estimate">("invoice");
  const [client, setClient] = useState({ name: "", email: "", phone: "", address: "" });
  const [items,  setItems]  = useState<LineItem[]>([emptyItem()]);
  const [notes,  setNotes]  = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
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

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(async file => {
        const fd = new FormData();
        fd.append("photo", file);
        const r = await fetch(`${API}/api/invoices/upload-photo`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token()}` },
          body: fd,
        });
        const d = await r.json();
        return d.url as string;
      }));
      setPhotos(prev => [...prev, ...urls.filter(Boolean)]);
    } catch { alert("Error subiendo fotos"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  function removePhoto(url: string) {
    setPhotos(prev => prev.filter(p => p !== url));
  }

  async function save(andSend = false) {
    if (!client.name.trim()) { alert("Nombre del cliente requerido"); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          type, clientName: client.name, clientEmail: client.email,
          clientPhone: client.phone, clientAddress: client.address,
          lineItems: items, notes, photos,
        }),
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
    <div style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color: "#111" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.push("/invoices")} style={{ background: "none", border: "none", color: "#64748b", fontSize: 22, cursor: "pointer", padding: 0 }}>←</button>
        <Image src="/mactor-logo.png" alt="MacTor" width={100} height={48} style={{ objectFit: "contain" }} />
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
          Nueva {type === "invoice" ? "Factura" : "Estimado"}
        </h1>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px" }}>

        {/* Type toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["invoice","estimate"] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              style={{ flex: 1, padding: "10px", borderRadius: 10, border: `2px solid ${type===t?"#e63946":"#e2e8f0"}`,
                cursor: "pointer", fontWeight: 700, fontSize: 13,
                background: type===t ? "#e63946" : "#fff", color: type===t ? "#fff" : "#64748b" }}>
              {t === "invoice" ? "📄 Factura" : "📋 Estimado"}
            </button>
          ))}
        </div>

        {/* Client */}
        <div style={card}>
          <p style={{ ...lbl, marginBottom: 14 }}>Cliente</p>
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
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ ...lbl, margin: 0 }}>Ítems</p>
            <button onClick={() => setItems(p => [...p, emptyItem()])}
              style={{ background: "#fef2f2", color: "#e63946", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              + Agregar ítem
            </button>
          </div>

          {items.map((item, i) => (
            <div key={i} style={{ border: "1px solid #f1f5f9", borderRadius: 10, padding: 14, marginBottom: 10, background: "#fafafa" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#e63946" }}>Ítem {i + 1}</span>
                {items.length > 1 && (
                  <button onClick={() => setItems(p => p.filter((_, j) => j !== i))}
                    style={{ background: "#fee2e2", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16, fontWeight: 700, borderRadius: 6, padding: "2px 8px" }}>×</button>
                )}
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Descripción</label>
                <input style={inp} value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Descripción del trabajo" />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Notas / Detalle</label>
                <textarea style={{ ...inp, minHeight: 56, resize: "vertical" } as React.CSSProperties}
                  value={item.notes} onChange={e => updateItem(i, "notes", e.target.value)} placeholder="Labor: $xx · Materials: $xx" />
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
                  <div style={{ ...inp, color: "#e63946", fontWeight: 700, display: "flex", alignItems: "center" }}>${item.amount.toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Totals */}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 14, marginTop: 8 }}>
            {[["Subtotal", subtotal], ["HST (13%)", hst]].map(([l, v]) => (
              <div key={String(l)} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#64748b", fontSize: 13 }}>{l}</span>
                <span style={{ fontSize: 13 }}>${Number(v).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", background: "#0f172a", borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
              <span style={{ color: "#fff", fontWeight: 700 }}>TOTAL CAD</span>
              <span style={{ color: "#e63946", fontWeight: 800, fontSize: 18 }}>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={card}>
          <label style={lbl}>Notas</label>
          <textarea style={{ ...inp, minHeight: 80, resize: "vertical" } as React.CSSProperties}
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Ej: Trabajo completado el viernes 13 de junio..." />
        </div>

        {/* Photos */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ ...lbl, margin: 0 }}>Fotos ({photos.length})</p>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              style={{ background: uploading ? "#f1f5f9" : "#fef2f2", color: uploading ? "#94a3b8" : "#e63946",
                border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: uploading ? "not-allowed" : "pointer" }}>
              {uploading ? "Subiendo..." : "📷 Agregar fotos"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoUpload} />
          </div>

          {photos.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {photos.map((url, i) => (
                <div key={i} style={{ position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "4/3", background: "#f1f5f9" }}>
                  <Image src={url} alt={`foto ${i+1}`} fill style={{ objectFit: "cover" }} />
                  <button onClick={() => removePhoto(url)}
                    style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,.6)", border: "none",
                      color: "#fff", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 14, lineHeight: "22px", textAlign: "center" }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div onClick={() => fileRef.current?.click()}
              style={{ border: "2px dashed #e2e8f0", borderRadius: 10, padding: "32px", textAlign: "center", cursor: "pointer", background: "#fafafa" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#e63946")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
              <p style={{ margin: 0, fontSize: 28 }}>📷</p>
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "#94a3b8" }}>Haz clic para agregar fotos del trabajo</p>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#cbd5e1" }}>Se incluirán al final del PDF</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <button onClick={() => save(false)} disabled={saving}
            style={{ padding: "14px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0", color: "#374151", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            💾 Guardar borrador
          </button>
          <button onClick={() => save(true)} disabled={saving || !client.email}
            style={{ padding: "14px", borderRadius: 12, background: "#e63946", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: (saving || !client.email) ? "not-allowed" : "pointer", opacity: (saving || !client.email) ? 0.7 : 1 }}>
            📤 Guardar y enviar
          </button>
        </div>
        {!client.email && <p style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", marginTop: 8 }}>Agrega email del cliente para enviar directo</p>}
      </div>
    </div>
  );
}
