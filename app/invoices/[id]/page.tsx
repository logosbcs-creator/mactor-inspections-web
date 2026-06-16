"use client";
import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
function token() { return localStorage.getItem("mactor_token") || ""; }

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280", sent: "#2563eb", paid: "#16a34a", overdue: "#dc2626",
};
const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", sent: "Sent", paid: "Paid", overdue: "Overdue",
};

interface LineItem { description: string; notes?: string; rate: number; qty: number; amount: number; }

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = use(params);
  const router    = useRouter();
  const [inv,     setInv]     = useState<any>(null);
  const [tab,     setTab]     = useState<"preview"|"edit">("preview");
  const [sending, setSending] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editClient,  setEditClient]  = useState({ name:"", email:"", phone:"", address:"" });
  const [editItems,   setEditItems]   = useState<LineItem[]>([]);
  const [editNotes,   setEditNotes]   = useState("");
  const [editPhotos,  setEditPhotos]  = useState<string[]>([]);
  const [editDate,    setEditDate]    = useState("");
  const [editDue,     setEditDue]     = useState("");
  const [editStatus,  setEditStatus]  = useState("");

  useEffect(() => {
    if (!localStorage.getItem("mactor_token")) { router.push("/invoices/login"); return; }
    load();
  }, [id]);

  async function load() {
    const r = await fetch(`${API}/api/invoices/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
    if (r.status === 401) { router.push("/invoices/login"); return; }
    const d = await r.json();
    setInv(d);
    // Populate edit form
    setEditClient({ name: d.clientName||"", email: d.clientEmail||"", phone: d.clientPhone||"", address: d.clientAddress||"" });
    setEditItems(d.lineItems || []);
    setEditNotes(d.notes || "");
    setEditPhotos(d.photos || []);
    setEditDate(d.invoiceDate ? d.invoiceDate.split("T")[0] : "");
    setEditDue(d.dueDate || "On Receipt");
    setEditStatus(d.status || "draft");
  }

  // ── Edit helpers ──────────────────────────────────────────────
  function updateItem(i: number, field: string, val: string | number) {
    setEditItems(prev => {
      const items = [...prev];
      const item  = { ...items[i], [field]: val };
      if (field === "rate" || field === "qty") {
        item.amount = Math.round(Number(item.rate) * Number(item.qty) * 100) / 100;
      }
      items[i] = item;
      return items;
    });
  }

  function addItem() {
    setEditItems(prev => [...prev, { description: "", notes: "", rate: 0, qty: 1, amount: 0 }]);
  }

  function removeItem(i: number) {
    setEditItems(prev => prev.filter((_, idx) => idx !== i));
  }

  const subtotal = editItems.reduce((s, i) => s + Number(i.amount || 0), 0);
  const hst      = Math.round(subtotal * 0.13 * 100) / 100;
  const total    = Math.round((subtotal + hst) * 100) / 100;

  // ── Save edits ────────────────────────────────────────────────
  async function saveEdit() {
    setSaving(true); setMsg("");
    const r = await fetch(`${API}/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        clientName:    editClient.name,
        clientEmail:   editClient.email,
        clientPhone:   editClient.phone,
        clientAddress: editClient.address,
        lineItems:     editItems,
        notes:         editNotes,
        photos:        editPhotos,
        invoiceDate:   editDate,
        dueDate:       editDue,
        status:        editStatus,
      }),
    });
    if (r.ok) {
      const updated = await r.json();
      setInv(updated);
      setMsg("✅ Changes saved");
      setTab("preview");
    } else {
      setMsg("❌ Error saving");
    }
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  }

  // ── Photo upload ─────────────────────────────────────────────
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(async file => {
        const fd = new FormData();
        fd.append("photo", file);
        const r = await fetch(`${API}/api/invoices/upload-photo`, {
          method: "POST", headers: { Authorization: `Bearer ${token()}` }, body: fd,
        });
        const d = await r.json();
        return d.url as string;
      }));
      setEditPhotos(prev => [...prev, ...urls.filter(Boolean)]);
    } catch { setMsg("❌ Error subiendo fotos"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  // ── Actions ───────────────────────────────────────────────────
  async function send() {
    setSending(true); setMsg("");
    const r = await fetch(`${API}/api/invoices/${id}/send`, { method: "POST", headers: { Authorization: `Bearer ${token()}` } });
    if (r.ok) { setMsg("✅ Email sent!"); setInv((p: any) => ({ ...p, status: "sent", sentAt: new Date().toISOString() })); }
    else       { setMsg("❌ Error sending email"); }
    setSending(false);
    setTimeout(() => setMsg(""), 4000);
  }

  async function markPaid() {
    const r = await fetch(`${API}/api/invoices/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ status: "paid" }),
    });
    if (r.ok) { setInv((p: any) => ({ ...p, status: "paid", paidAt: new Date().toISOString() })); setEditStatus("paid"); }
  }

  async function markUnpaid() {
    const r = await fetch(`${API}/api/invoices/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ status: "sent" }),
    });
    if (r.ok) { setInv((p: any) => ({ ...p, status: "sent", paidAt: null })); setEditStatus("sent"); }
  }

  function openPDF() { window.open(`${API}/api/invoices/${id}/pdf?token=${token()}`, "_blank"); }

  if (!inv) return (
    <div style={{ minHeight:"100dvh", background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", color:"#94a3b8", fontFamily:"system-ui,sans-serif" }}>
      Loading...
    </div>
  );

  const isEst = inv.type === "estimate";

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100dvh", background:"#f8fafc", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color:"#111" }}>

      {/* ── Top bar ── */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0" }}>

        {/* Row 1: back + logo + invoice # + status + action buttons */}
        <div style={{ padding:"12px 24px", display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={() => router.push("/invoices")}
            style={{ background:"none", border:"none", color:"#64748b", fontSize:20, cursor:"pointer", padding:0, lineHeight:1 }}>←</button>
          <Image src="/mactor-logo.png" alt="MacTor" width={90} height={44} style={{ objectFit:"contain" }} />

          <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
            <span style={{ fontWeight:800, fontSize:17, color:"#0f172a" }}>{inv.invoiceNumber}</span>
            <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20,
              background:(STATUS_COLORS[inv.status]||"#6b7280")+"22", color:STATUS_COLORS[inv.status]||"#6b7280" }}>
              {STATUS_LABELS[inv.status]||inv.status}
            </span>
            {inv.sentAt && <span style={{ fontSize:11, color:"#94a3b8" }}>Sent {new Date(inv.sentAt).toLocaleDateString("en-CA",{month:"short",day:"numeric"})}</span>}
          </div>

          {/* Action buttons */}
          <div style={{ display:"flex", gap:8 }}>
            {inv.status !== "paid" && (
              <button onClick={markPaid}
                style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #16a34a", background:"#dcfce7", color:"#16a34a", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                ✓ Mark Paid
              </button>
            )}
            {inv.status === "paid" && (
              <button onClick={markUnpaid}
                style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", color:"#64748b", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                ↩ Mark Unpaid
              </button>
            )}
            <button onClick={openPDF}
              style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", color:"#374151", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              📄 PDF
            </button>
            {inv.clientEmail ? (
              <button onClick={send} disabled={sending}
                style={{ padding:"8px 18px", borderRadius:8, border:"none", background:"#e63946", color:"#fff", fontSize:13, fontWeight:700, cursor:sending?"not-allowed":"pointer", opacity:sending?0.7:1 }}>
                {sending ? "Sending..." : "✉ Email Invoice"}
              </button>
            ) : (
              <button onClick={() => setTab("edit")}
                style={{ padding:"8px 18px", borderRadius:8, border:"1px dashed #e63946", background:"#fff", color:"#e63946", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                ✉ Add Email to Send
              </button>
            )}
          </div>
        </div>

        {/* Row 2: tabs */}
        <div style={{ display:"flex", padding:"0 24px", gap:0 }}>
          {(["preview","edit"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:"10px 20px", border:"none", background:"none", cursor:"pointer", fontSize:13, fontWeight:600, textTransform:"capitalize",
                color: tab===t ? "#e63946" : "#64748b",
                borderBottom: tab===t ? "2px solid #e63946" : "2px solid transparent" }}>
              {t === "preview" ? "👁 Preview" : "✏️ Edit"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Flash message ── */}
      {msg && (
        <div style={{ background: msg.startsWith("✅") ? "#f0fdf4" : "#fef2f2",
          borderBottom: `1px solid ${msg.startsWith("✅")?"#bbf7d0":"#fecaca"}`,
          padding:"10px 24px", fontSize:13, color: msg.startsWith("✅") ? "#16a34a" : "#dc2626", fontWeight:600 }}>
          {msg}
        </div>
      )}

      <div style={{ maxWidth:760, margin:"0 auto", padding:"28px 24px" }}>

        {/* ═══════════════ PREVIEW TAB ═══════════════ */}
        {tab === "preview" && (
          <div>
            {/* Invoice header card */}
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden", marginBottom:16 }}>
              <div style={{ background:"#0a0f1e", padding:"24px 28px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <p style={{ margin:0, fontSize:11, color:"#9ca3af", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>MACTOR Construction</p>
                  <p style={{ margin:"4px 0 0", fontSize:11, color:"#6b7280" }}>Julio Cesar Macias · GST # 70823 0743</p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:"#6b7280" }}>71 Sufi Cresc, North York ON M4A 2X3</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ margin:0, fontSize:24, fontWeight:900, color:"#e63946" }}>{inv.invoiceNumber}</p>
                  <p style={{ margin:"4px 0 0", fontSize:11, color:"#9ca3af" }}>{isEst ? "ESTIMATE" : "INVOICE"}</p>
                  <p style={{ margin:"4px 0 0", fontSize:11, color:"#6b7280" }}>{new Date(inv.invoiceDate).toLocaleDateString("en-CA",{month:"long",day:"numeric",year:"numeric"})}</p>
                </div>
              </div>

              {/* Client */}
              <div style={{ padding:"20px 28px", borderBottom:"1px solid #f1f5f9", display:"flex", gap:40 }}>
                <div>
                  <p style={{ margin:"0 0 4px", fontSize:10, color:"#94a3b8", fontWeight:700, textTransform:"uppercase" }}>Bill To</p>
                  <p style={{ margin:"0 0 2px", fontSize:15, fontWeight:700 }}>{inv.clientName}</p>
                  {inv.clientAddress && <p style={{ margin:"2px 0", fontSize:13, color:"#64748b" }}>{inv.clientAddress}</p>}
                  {inv.clientPhone   && <p style={{ margin:"2px 0", fontSize:13, color:"#64748b" }}>{inv.clientPhone}</p>}
                  {inv.clientEmail   && <p style={{ margin:"2px 0", fontSize:13, color:"#2563eb" }}>{inv.clientEmail}</p>}
                </div>
                <div>
                  <p style={{ margin:"0 0 4px", fontSize:10, color:"#94a3b8", fontWeight:700, textTransform:"uppercase" }}>Due</p>
                  <p style={{ margin:0, fontSize:13, fontWeight:600 }}>{inv.dueDate || "On Receipt"}</p>
                </div>
              </div>

              {/* Line items */}
              <div style={{ padding:"0 28px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 60px 90px", padding:"10px 0", borderBottom:"2px solid #0a0f1e" }}>
                  {["DESCRIPTION","RATE","QTY","AMOUNT"].map(h => (
                    <span key={h} style={{ fontSize:10, fontWeight:800, color:"#0a0f1e", letterSpacing:".06em" }}>{h}</span>
                  ))}
                </div>
                {(inv.lineItems||[]).map((item: any, i: number) => (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 80px 60px 90px", padding:"14px 0", borderBottom:"1px solid #f1f5f9" }}>
                    <div>
                      <p style={{ margin:0, fontWeight:700, fontSize:14 }}>{item.description}</p>
                      {item.notes && <p style={{ margin:"4px 0 0", fontSize:12, color:"#64748b", whiteSpace:"pre-line" }}>{item.notes}</p>}
                    </div>
                    <span style={{ fontSize:13, color:"#64748b", paddingTop:2 }}>${Number(item.rate||0).toFixed(2)}</span>
                    <span style={{ fontSize:13, color:"#64748b", paddingTop:2 }}>{item.qty}</span>
                    <span style={{ fontSize:13, fontWeight:600, paddingTop:2 }}>${Number(item.amount||0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals + payment */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", padding:"20px 28px", gap:20 }}>
                <div>
                  <p style={{ margin:"0 0 10px", fontWeight:700, fontSize:14 }}>Payment Info</p>
                  <p style={{ margin:"0 0 2px", fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase" }}>PayPal</p>
                  <p style={{ margin:"0 0 10px", fontSize:13, color:"#2563eb" }}>payments@mactor.ca</p>
                  <p style={{ margin:"0 0 2px", fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase" }}>By Cheque</p>
                  <p style={{ margin:0, fontSize:13, color:"#374151" }}>Mactor Construction or Julio Cesar Macias Aguilar</p>
                </div>
                <div>
                  {[["Subtotal", inv.subtotal], ["HST (13%)", inv.hst]].map(([l, v]) => (
                    <div key={String(l)} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <span style={{ fontSize:13, color:"#64748b" }}>{l}</span>
                      <span style={{ fontSize:13 }}>${Number(v).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 12px", background:"#f8fafc", borderRadius:8, marginTop:4 }}>
                    <span style={{ fontWeight:700, fontSize:13 }}>TOTAL</span>
                    <span style={{ fontWeight:700, fontSize:13 }}>${Number(inv.total).toFixed(2)}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 12px", background:"#0a0f1e", borderRadius:8, marginTop:6 }}>
                    <span style={{ fontWeight:800, color:"#fff" }}>BALANCE DUE</span>
                    <span style={{ fontWeight:800, color:"#e63946", fontSize:16 }}>
                      {inv.status === "paid" ? "CAD $0.00" : `CAD $${Number(inv.total).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>

              {inv.notes && (
                <div style={{ padding:"16px 28px", borderTop:"1px solid #f1f5f9", background:"#fafafa" }}>
                  <p style={{ margin:0, fontSize:12, color:"#64748b", whiteSpace:"pre-line" }}>{inv.notes}</p>
                </div>
              )}
            </div>

            {/* Quick edit prompt */}
            <p style={{ textAlign:"center", fontSize:12, color:"#94a3b8" }}>
              Need to make a change?{" "}
              <button onClick={() => setTab("edit")} style={{ background:"none", border:"none", color:"#e63946", cursor:"pointer", fontWeight:700, fontSize:12 }}>
                Switch to Edit tab
              </button>
            </p>
          </div>
        )}

        {/* ═══════════════ EDIT TAB ═══════════════ */}
        {tab === "edit" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Status */}
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"20px 24px" }}>
              <p style={{ margin:"0 0 12px", fontSize:11, color:"#64748b", fontWeight:700, textTransform:"uppercase", letterSpacing:".05em" }}>Status</p>
              <div style={{ display:"flex", gap:8 }}>
                {(["draft","sent","paid","overdue"] as const).map(s => (
                  <button key={s} onClick={() => setEditStatus(s)}
                    style={{ padding:"7px 16px", borderRadius:20, border:`2px solid ${editStatus===s ? STATUS_COLORS[s] : "#e2e8f0"}`,
                      background: editStatus===s ? STATUS_COLORS[s]+"22" : "#fff",
                      color: editStatus===s ? STATUS_COLORS[s] : "#64748b",
                      fontSize:12, fontWeight:700, cursor:"pointer", textTransform:"capitalize" }}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"20px 24px" }}>
              <p style={{ margin:"0 0 14px", fontSize:11, color:"#64748b", fontWeight:700, textTransform:"uppercase", letterSpacing:".05em" }}>Dates</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div>
                  <label style={labelSt}>Invoice Date</label>
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} style={inputSt} />
                </div>
                <div>
                  <label style={labelSt}>Due</label>
                  <select value={editDue} onChange={e => setEditDue(e.target.value)} style={inputSt}>
                    <option>On Receipt</option>
                    <option>Net 15</option>
                    <option>Net 30</option>
                    <option>Net 60</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Client */}
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"20px 24px" }}>
              <p style={{ margin:"0 0 14px", fontSize:11, color:"#64748b", fontWeight:700, textTransform:"uppercase", letterSpacing:".05em" }}>Client</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={labelSt}>Name *</label>
                  <input value={editClient.name} onChange={e => setEditClient(p => ({...p, name:e.target.value}))} style={inputSt} placeholder="Client name" />
                </div>
                <div>
                  <label style={labelSt}>Email</label>
                  <input type="email" value={editClient.email} onChange={e => setEditClient(p => ({...p, email:e.target.value}))} style={inputSt} placeholder="email@example.com" />
                </div>
                <div>
                  <label style={labelSt}>Phone</label>
                  <input value={editClient.phone} onChange={e => setEditClient(p => ({...p, phone:e.target.value}))} style={inputSt} placeholder="(416) 555-0000" />
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={labelSt}>Address</label>
                  <input value={editClient.address} onChange={e => setEditClient(p => ({...p, address:e.target.value}))} style={inputSt} placeholder="123 Main St, Toronto ON" />
                </div>
              </div>
            </div>

            {/* Line items */}
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"20px 24px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <p style={{ margin:0, fontSize:11, color:"#64748b", fontWeight:700, textTransform:"uppercase", letterSpacing:".05em" }}>Line Items</p>
              </div>

              {/* Header */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 90px 60px 90px 32px", gap:8, marginBottom:8 }}>
                {["Description","Rate","Qty","Amount",""].map(h => (
                  <span key={h} style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".04em" }}>{h}</span>
                ))}
              </div>

              {editItems.map((item, i) => (
                <div key={i} style={{ border:"1px solid #f1f5f9", borderRadius:8, padding:"12px", marginBottom:10, background:"#fafafa" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 90px 60px 90px 32px", gap:8, marginBottom:8 }}>
                    <input value={item.description} onChange={e => updateItem(i,"description",e.target.value)}
                      placeholder="Description" style={{ ...inputSt, margin:0 }} />
                    <input type="number" value={item.rate} onChange={e => updateItem(i,"rate",parseFloat(e.target.value)||0)}
                      style={{ ...inputSt, margin:0 }} />
                    <input type="number" value={item.qty} onChange={e => updateItem(i,"qty",parseFloat(e.target.value)||1)}
                      style={{ ...inputSt, margin:0 }} />
                    <div style={{ ...inputSt as any, margin:0, background:"#f8fafc", color:"#0f172a", fontWeight:700, display:"flex", alignItems:"center" }}>
                      ${item.amount.toFixed(2)}
                    </div>
                    <button onClick={() => removeItem(i)}
                      style={{ background:"#fee2e2", border:"none", borderRadius:6, color:"#dc2626", cursor:"pointer", fontSize:16, fontWeight:700 }}>
                      ×
                    </button>
                  </div>
                  <input value={item.notes||""} onChange={e => updateItem(i,"notes",e.target.value)}
                    placeholder="Notes (optional)" style={{ ...inputSt, margin:0, width:"100%", fontSize:12, color:"#64748b" }} />
                </div>
              ))}

              <button onClick={addItem}
                style={{ width:"100%", padding:"10px", borderRadius:8, border:"2px dashed #e2e8f0", background:"#fafafa", color:"#64748b", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                + Add line item
              </button>

              {/* Totals preview */}
              <div style={{ marginTop:16, padding:"14px", background:"#f8fafc", borderRadius:8 }}>
                {[["Subtotal", subtotal], ["HST (13%)", hst]].map(([l,v]) => (
                  <div key={String(l)} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:13, color:"#64748b" }}>{l}</span>
                    <span style={{ fontSize:13 }}>${Number(v).toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px solid #e2e8f0", paddingTop:8, marginTop:4 }}>
                  <span style={{ fontWeight:800, fontSize:14 }}>TOTAL</span>
                  <span style={{ fontWeight:800, fontSize:16, color:"#e63946" }}>CAD ${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"20px 24px" }}>
              <label style={{ ...labelSt, display:"block", marginBottom:8 }}>Notes (shown on invoice)</label>
              <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3}
                placeholder="Additional notes for the client..."
                style={{ ...inputSt, width:"100%", resize:"vertical", margin:0, boxSizing:"border-box" }} />
            </div>

            {/* Photos */}
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"20px 24px" }}>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={handlePhotoUpload} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <span style={{ ...labelSt, margin:0 }}>Photos — PDF attachment ({editPhotos.length})</span>
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  style={{ background: uploading?"#f1f5f9":"#fef2f2", color: uploading?"#94a3b8":"#e63946",
                    border:"none", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:700, cursor: uploading?"not-allowed":"pointer" }}>
                  {uploading ? "Uploading..." : "📷 Add photos"}
                </button>
              </div>
              {editPhotos.length > 0 ? (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                  {editPhotos.map((url, i) => (
                    <div key={i} style={{ position:"relative", borderRadius:8, overflow:"hidden", aspectRatio:"4/3", background:"#f1f5f9" }}>
                      <Image src={url} alt={`photo ${i+1}`} fill style={{ objectFit:"cover" }} />
                      <button onClick={() => setEditPhotos(p => p.filter((_, j) => j !== i))}
                        style={{ position:"absolute", top:4, right:4, background:"rgba(0,0,0,.65)", border:"none",
                          color:"#fff", borderRadius:"50%", width:22, height:22, cursor:"pointer", fontSize:14, lineHeight:"22px", textAlign:"center" }}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div onClick={() => fileRef.current?.click()}
                  style={{ border:"2px dashed #e2e8f0", borderRadius:10, padding:"28px", textAlign:"center", cursor:"pointer", background:"#fafafa" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor="#e63946")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor="#e2e8f0")}>
                  <p style={{ margin:0, fontSize:26 }}>📷</p>
                  <p style={{ margin:"6px 0 0", fontSize:13, color:"#94a3b8" }}>Click to add photos — they appear at the end of the PDF</p>
                </div>
              )}
            </div>

            {/* Save */}
            <button onClick={saveEdit} disabled={saving || !editClient.name}
              style={{ padding:"16px", borderRadius:12, background: saving ? "#94a3b8" : "#e63946", border:"none", color:"#fff", fontSize:15, fontWeight:700, cursor: (saving||!editClient.name)?"not-allowed":"pointer" }}>
              {saving ? "Saving..." : "💾 Save Changes"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────
const labelSt: React.CSSProperties = {
  display:"block", fontSize:11, fontWeight:700, color:"#64748b",
  textTransform:"uppercase", letterSpacing:".04em", marginBottom:6
};
const inputSt: React.CSSProperties = {
  width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid #e2e8f0",
  fontSize:13, color:"#0f172a", outline:"none", background:"#fff",
  boxSizing:"border-box" as const
};
