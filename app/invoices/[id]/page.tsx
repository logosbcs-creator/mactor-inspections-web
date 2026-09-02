"use client";
import { useState, useEffect, use, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
function token() { return localStorage.getItem("mactor_token") || ""; }
function currentUsername() {
  try { return JSON.parse(atob(token().split(".")[1])).user || ""; }
  catch { return ""; }
}

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280", sent: "#0a0f1e", paid: "#0a0f1e", overdue: "#dc2626", approved: "#0a0f1e",
};
const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", sent: "Sent", paid: "Paid", overdue: "Overdue", approved: "Approved",
};

interface LineItem { description: string; notes?: string; rate: number; qty: number; amount: number; }

// Card processing cost (Stripe: ~2.9% + $0.30 — rounded up here for a small
// cushion), spread proportionally across each item's amount instead of
// added as its own visible line, so the invoice total already covers it.
function withCardSurcharge(items: LineItem[]): LineItem[] {
  const subtotal = items.reduce((s, i) => s + Number(i.amount || 0), 0);
  if (subtotal <= 0) return items;
  const totalSurcharge = subtotal * 0.03 + 3;
  return items.map(item => {
    const share  = (Number(item.amount || 0) / subtotal) * totalSurcharge;
    const amount = Math.round((Number(item.amount || 0) + share) * 100) / 100;
    const qty    = Number(item.qty) || 1;
    return { ...item, amount, rate: Math.round((amount / qty) * 100) / 100 };
  });
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = use(params);
  const router    = useRouter();
  const searchParams = useSearchParams();
  const [inv,     setInv]     = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab,     setTab]     = useState<"preview"|"edit">("preview");
  const [sending,    setSending]    = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendEmail,     setSendEmail]     = useState("");
  const [sendBcc,       setSendBcc]       = useState(true);
  const [sendSms,       setSendSms]       = useState(false);
  const [sendPhone,     setSendPhone]     = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate,      setScheduleDate]      = useState("");
  const [scheduling,        setScheduling]        = useState(false);
  const [converting, setConverting] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword,    setDeletePassword]    = useState("");
  const [deleteError,       setDeleteError]       = useState("");
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState("");
  const [uploading, setUploading] = useState(false);
  const [mob,       setMob]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editClient,  setEditClient]  = useState({ name:"", email:"", phone:"", address:"" });
  const [editItems,   setEditItems]   = useState<LineItem[]>([]);
  const [editCardSurcharge, setEditCardSurcharge] = useState(false);
  const [editHstEnabled, setEditHstEnabled] = useState(true);
  const [editDiscount,   setEditDiscount]   = useState(0);
  const [editNotes,   setEditNotes]   = useState("");
  const [editPhotos,  setEditPhotos]  = useState<string[]>([]);
  const [editDate,    setEditDate]    = useState("");
  const [editDue,     setEditDue]     = useState("");
  const [editStatus,  setEditStatus]  = useState("");
  const [editScheduledDate, setEditScheduledDate] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("mactor_token")) { router.push("/invoices/login"); return; }
    load();
    const check = () => setMob(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [id]);

  async function load() {
    const r = await fetch(`${API}/api/invoices/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
    if (r.status === 401) { router.push("/invoices/login"); return; }
    if (!r.ok) { setNotFound(true); return; }
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
    setEditDiscount(d.discount || 0);
    setEditHstEnabled(d.hstEnabled !== false);
    // datetime-local wants "YYYY-MM-DDTHH:mm" — trim the seconds/Z off the ISO string
    setEditScheduledDate(d.scheduledDate ? d.scheduledDate.slice(0, 16) : "");
    // Coming straight from "Guardar y enviar" on the new-invoice form —
    // open the send confirmation instead of firing the email blind.
    if (searchParams.get("send") === "1") {
      setSendEmail(d.clientEmail || "");
      setSendPhone(d.clientPhone || "");
      setShowSendModal(true);
    }
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

  function moveItem(i: number, dir: -1 | 1) {
    setEditItems(prev => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const items = [...prev];
      [items[i], items[j]] = [items[j], items[i]];
      return items;
    });
  }

  const editDisplayItems = editCardSurcharge ? withCardSurcharge(editItems) : editItems;
  const rawSubtotal = editDisplayItems.reduce((s, i) => s + Number(i.amount || 0), 0);
  const subtotal = Math.max(0, Math.round((rawSubtotal - Number(editDiscount || 0)) * 100) / 100);
  const hst      = editHstEnabled ? Math.round(subtotal * 0.13 * 100) / 100 : 0;
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
        lineItems:     editDisplayItems,
        notes:         editNotes,
        photos:        editPhotos,
        invoiceDate:   editDate,
        dueDate:       editDue,
        status:        editStatus,
        discount:      editDiscount,
        hstEnabled:    editHstEnabled,
        scheduledDate: editScheduledDate || null,
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
    setSending(true); setMsg(""); setShowSendModal(false);
    const r = await fetch(`${API}/api/invoices/${id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ email: sendEmail || undefined, bcc: sendBcc, sms: sendSms, phone: sendPhone || undefined }),
    });
    if (r.ok) {
      const d = await r.json().catch(() => ({}));
      setMsg(sendSms && d.smsError ? `⚠️ Email sent, but SMS failed: ${d.smsError}` : "✅ Email sent!");
      // Mirrors the backend: only a draft flips to "sent" — a resend on an
      // already sent/paid invoice keeps its current status.
      const newStatus = inv.status === "draft" ? "sent" : inv.status;
      setInv((p: any) => ({ ...p, status: newStatus, sentAt: new Date().toISOString() }));
      setEditStatus(newStatus);
    } else {
      const d = await r.json().catch(() => ({}));
      setMsg(`❌ ${d.error || "Error sending email"}`);
    }
    setSending(false);
    setTimeout(() => setMsg(""), 6000);
  }

  async function saveSchedule(overrideValue?: string) {
    const value = overrideValue !== undefined ? overrideValue : scheduleDate;
    setScheduling(true);
    const r = await fetch(`${API}/api/invoices/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ scheduledDate: value || null }),
    });
    if (r.ok) {
      const updated = await r.json();
      setInv((p: any) => ({ ...p, scheduledDate: updated.scheduledDate }));
      setEditScheduledDate(value);
      setShowScheduleModal(false);
    }
    setScheduling(false);
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

  async function confirmDelete() {
    if (!deletePassword) return;
    setDeleting(true); setDeleteError("");

    // Re-verify identity before a destructive action — reuses the login
    // endpoint rather than trusting the still-valid session token alone.
    const check = await fetch(`${API}/api/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUsername(), password: deletePassword }),
    });
    if (!check.ok) {
      setDeleteError("Contraseña incorrecta");
      setDeleting(false);
      return;
    }

    const r = await fetch(`${API}/api/invoices/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    if (r.ok) {
      router.push("/invoices");
    } else {
      setDeleteError("Error al eliminar");
      setDeleting(false);
    }
  }

  async function convert() {
    const toEst = !isEst;
    if (!confirm(toEst ? "¿Crear un estimado a partir de esta factura?" : "¿Crear una factura a partir de este estimado?")) return;
    setConverting(true);
    const r = await fetch(`${API}/api/invoices/${id}/convert`, {
      method: "POST", headers: { Authorization: `Bearer ${token()}` },
    });
    if (r.ok) {
      const created = await r.json();
      router.push(`/invoices/${created.id}`);
    } else {
      setMsg("❌ Error al convertir");
      setConverting(false);
      setTimeout(() => setMsg(""), 3000);
    }
  }

  if (notFound) return (
    <div style={{ minHeight:"100dvh", background:"#f8fafc", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, fontFamily:"system-ui,sans-serif" }}>
      <p style={{ fontSize:36, margin:0 }}>🔍</p>
      <p style={{ color:"#64748b", fontSize:14 }}>Invoice not found</p>
      <button onClick={() => router.push("/invoices")}
        style={{ padding:"9px 20px", borderRadius:8, border:"none", background:"#e63946", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
        ← Back to invoices
      </button>
    </div>
  );

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
        <div style={{ padding: mob ? "10px 12px" : "12px 24px", display:"flex", alignItems:"center", gap: mob ? 8 : 12, flexWrap: mob ? "wrap" : "nowrap" }}>
          <button onClick={() => router.push("/invoices")}
            style={{ background:"none", border:"none", color:"#64748b", fontSize:20, cursor:"pointer", padding:0, lineHeight:1, flexShrink:0 }}>←</button>
          {!mob && <Image src="/mactor-logo.png" alt="MacTor" width={63} height={44} style={{ objectFit:"contain" }} />}

          <div style={{ display:"flex", alignItems:"center", gap: mob ? 6 : 10, flex:1, minWidth:0 }}>
            <span style={{ fontWeight:800, fontSize: mob ? 19 : 17, color:"#0f172a" }}>{inv.invoiceNumber}</span>
            <span style={{ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:20, flexShrink:0,
              background:(STATUS_COLORS[inv.status]||"#6b7280")+"22", color:STATUS_COLORS[inv.status]||"#6b7280" }}>
              {STATUS_LABELS[inv.status]||inv.status}
            </span>
            {inv.sentAt && !mob && <span style={{ fontSize:11, color:"#94a3b8" }}>Sent {new Date(inv.sentAt).toLocaleDateString("en-CA",{month:"short",day:"numeric"})}</span>}
            {inv.scheduledDate && (
              <span style={{ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:20, flexShrink:0, background:"#e0f2fe", color:"#0369a1" }}>
                📅 {new Date(inv.scheduledDate).toLocaleDateString("en-CA",{month:"short",day:"numeric"})}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display:"flex", gap: mob ? 5 : 8, flexWrap: mob ? "wrap" : "nowrap", width: mob ? "100%" : "auto" }}>
            <button onClick={convert} disabled={converting}
              style={{ padding: mob ? "7px 10px" : "8px 16px", borderRadius:8, border:"1px solid #0a0f1e", background:"#f1f5f9", color:"#0a0f1e", fontSize: mob ? 16 : 13, fontWeight:700, cursor:converting?"not-allowed":"pointer", opacity:converting?0.7:1, whiteSpace:"nowrap" }}>
              {converting ? "Creando..." : isEst ? "🧾 " + (mob ? "Invoice" : "Convertir a Invoice") : "📋 " + (mob ? "Estimado" : "Convertir a Estimado")}
            </button>
            {!isEst && inv.status !== "paid" && (
              <button onClick={markPaid}
                style={{ padding: mob ? "7px 10px" : "8px 16px", borderRadius:8, border:"1px solid #0a0f1e", background:"#f1f5f9", color:"#0a0f1e", fontSize: mob ? 16 : 13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                ✓ {mob ? "Paid" : "Mark Paid"}
              </button>
            )}
            {!isEst && inv.status === "paid" && (
              <button onClick={markUnpaid}
                style={{ padding: mob ? "7px 10px" : "8px 16px", borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", color:"#64748b", fontSize: mob ? 16 : 13, fontWeight:600, cursor:"pointer" }}>
                ↩ {mob ? "Unpaid" : "Mark Unpaid"}
              </button>
            )}
            <button onClick={() => { setScheduleDate(inv.scheduledDate ? inv.scheduledDate.slice(0,16) : ""); setShowScheduleModal(true); }}
              style={{ padding: mob ? "7px 10px" : "8px 16px", borderRadius:8, border: inv.scheduledDate ? "1px solid #0369a1" : "1px solid #e2e8f0",
                background: inv.scheduledDate ? "#e0f2fe" : "#fff", color: inv.scheduledDate ? "#0369a1" : "#374151", fontSize: mob ? 16 : 13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
              📅 {mob ? "Agenda" : inv.scheduledDate ? "Reprogramar" : "Programar trabajo"}
            </button>
            <button onClick={openPDF}
              style={{ padding: mob ? "7px 10px" : "8px 16px", borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", color:"#374151", fontSize: mob ? 16 : 13, fontWeight:600, cursor:"pointer" }}>
              📄 PDF
            </button>
            {inv.clientEmail ? (
              <button onClick={() => { setSendEmail(inv.clientEmail || ""); setSendBcc(true); setSendSms(false); setSendPhone(inv.clientPhone || ""); setShowSendModal(true); }} disabled={sending}
                style={{ padding: mob ? "7px 10px" : "8px 18px", borderRadius:8, border:"none", background:"#e63946", color:"#fff", fontSize: mob ? 16 : 13, fontWeight:700, cursor:sending?"not-allowed":"pointer", opacity:sending?0.7:1, whiteSpace:"nowrap" }}>
                {sending ? "Sending..." : "✉ " + (mob ? "Email" : isEst ? "Email Estimate" : "Email Invoice")}
              </button>
            ) : (
              <button onClick={() => setTab("edit")}
                style={{ padding: mob ? "7px 10px" : "8px 18px", borderRadius:8, border:"1px dashed #e63946", background:"#fff", color:"#e63946", fontSize: mob ? 16 : 13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                ✉ {mob ? "Add Email" : "Add Email to Send"}
              </button>
            )}
            <button onClick={() => { setShowDeleteConfirm(true); setDeletePassword(""); setDeleteError(""); }} title="Eliminar permanentemente"
              style={{ padding: mob ? "7px 10px" : "8px 12px", borderRadius:8, border:"1px solid #fee2e2", background:"#fff", color:"#dc2626", fontSize: mob ? 16 : 13, fontWeight:600, cursor:"pointer" }}>
              🗑️
            </button>
          </div>
        </div>

        {/* Row 2: tabs */}
        <div className="inv-detail-tabs" style={{ display:"flex", padding:"0 24px", gap:0 }}>
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
        <div style={{ background: msg.startsWith("✅") ? "#f8fafc" : "#fef2f2",
          borderBottom: `1px solid ${msg.startsWith("✅")?"#e2e8f0":"#fecaca"}`,
          padding:"10px 24px", fontSize:13, color: msg.startsWith("✅") ? "#0a0f1e" : "#dc2626", fontWeight:600 }}>
          {msg}
        </div>
      )}

      <div className="inv-detail-content" style={{ maxWidth:760, margin:"0 auto", padding:"28px 24px" }}>

        {/* ═══════════════ PREVIEW TAB ═══════════════ */}
        {tab === "preview" && (
          <div>
            {/* Invoice document — matches PDF format */}
            <div className="inv-doc" style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden", marginBottom:16 }}>
              <div className="inv-doc-scroll" style={{ overflowX:"auto" }}>

              {/* Top rule */}
              <div style={{ height:4, background:"#333" }} />

              {/* Header: Logo | Company info | Invoice meta */}
              <div style={{ padding:"20px 28px 16px", display:"grid", gridTemplateColumns:"120px 1fr 160px", gap:16, borderBottom:"1px solid #e8e8e8" }}>
                {/* Logo */}
                <div style={{ display:"flex", alignItems:"flex-start" }}>
                  <Image src="/mactor-logo.png" alt="MacTor Construction" width={115} height={80} style={{ objectFit:"contain" }} />
                </div>
                {/* Company info */}
                <div>
                  <p style={{ margin:"0 0 4px", fontSize:13, fontWeight:800, color:"#1a1a1a" }}>MACTOR Construction</p>
                  <p style={{ margin:"0 0 2px", fontSize:11, color:"#444" }}>Julio Cesar Macias</p>
                  <p style={{ margin:"0 0 2px", fontSize:11, color:"#444" }}>GST # 70823 0743</p>
                  <p style={{ margin:"0 0 2px", fontSize:11, color:"#444" }}>71 Sufi Cresc</p>
                  <p style={{ margin:"0 0 2px", fontSize:11, color:"#444" }}>North York On</p>
                  <p style={{ margin:"0 0 2px", fontSize:11, color:"#444" }}>M4A2X3</p>
                  <p style={{ margin:"0 0 2px", fontSize:11, color:"#444" }}>6475173343</p>
                  <p style={{ margin:"0 0 2px", fontSize:11, color:"#0a0f1e" }}>https://www.mactor.ca</p>
                  <p style={{ margin:0, fontSize:11, color:"#444" }}>julio@mactor.ca</p>
                </div>
                {/* Invoice meta */}
                <div style={{ textAlign:"right" }}>
                  <p style={{ margin:"0 0 2px", fontSize:9, fontWeight:700, color:"#666", textTransform:"uppercase", letterSpacing:".06em" }}>{isEst ? "ESTIMATE" : "INVOICE"}</p>
                  <p style={{ margin:"0 0 8px", fontSize:16, fontWeight:800, color:"#1a1a1a" }}>{inv.invoiceNumber}</p>
                  <p style={{ margin:"0 0 2px", fontSize:9, fontWeight:700, color:"#666", textTransform:"uppercase" }}>DATE</p>
                  <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:700, color:"#1a1a1a" }}>
                    {new Date(inv.invoiceDate).toLocaleDateString("en-CA",{month:"2-digit",day:"2-digit",year:"numeric"})}
                  </p>
                  {!isEst && <>
                    <p style={{ margin:"0 0 2px", fontSize:9, fontWeight:700, color:"#666", textTransform:"uppercase" }}>BALANCE DUE</p>
                    <p style={{ margin:0, fontSize:13, fontWeight:800, color:"#1a1a1a" }}>
                      CAD ${inv.status==="paid" ? "0.00" : Number(inv.total).toFixed(2)}
                    </p>
                  </>}
                </div>
              </div>

              {/* Bill To */}
              <div style={{ padding:"16px 28px 14px", borderBottom:"1px solid #e8e8e8" }}>
                <p style={{ margin:"0 0 6px", fontSize:9, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:".06em" }}>{isEst ? "ESTIMATE FOR" : "BILL TO"}</p>
                <p style={{ margin:"0 0 3px", fontSize:14, fontWeight:700, color:"#1a1a1a" }}>{inv.clientName}</p>
                {inv.clientAddress && <p style={{ margin:"2px 0", fontSize:12, color:"#555" }}>{inv.clientAddress}</p>}
                {inv.clientPhone   && <p style={{ margin:"2px 0", fontSize:12, color:"#555" }}>{inv.clientPhone}</p>}
                {inv.clientEmail   && <p style={{ margin:"2px 0", fontSize:12, color:"#0a0f1e" }}>{inv.clientEmail}</p>}
              </div>

              {/* Line items */}
              <div style={{ padding:"0 28px" }}>
                {/* Table header */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 80px 50px 80px", background:"#333", margin:"0 -28px", padding:"8px 28px" }}>
                  {["DESCRIPTION","RATE","QTY","AMOUNT"].map((h,i) => (
                    <span key={h} style={{ fontSize:9, fontWeight:800, color:"#fff", letterSpacing:".07em",
                      textAlign: i>0 ? "right" as const : "left" as const }}>{h}</span>
                  ))}
                </div>
                {(inv.lineItems||[]).map((item: any, i: number) => (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 80px 50px 80px",
                    padding:"12px 0", borderBottom:"1px solid #f0f0f0",
                    background: i%2===0 ? "#fff" : "#f7f7f7" }}>
                    <div>
                      <p style={{ margin:0, fontWeight:700, fontSize:13, color:"#1a1a1a" }}>{item.description}</p>
                      {item.notes && <p style={{ margin:"3px 0 0", fontSize:11, color:"#666", whiteSpace:"pre-line" }}>{item.notes}</p>}
                    </div>
                    <span style={{ fontSize:12, color:"#555", textAlign:"right", paddingTop:2 }}>${Number(item.rate||0).toFixed(2)}</span>
                    <span style={{ fontSize:12, color:"#555", textAlign:"right", paddingTop:2 }}>{item.qty}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:"#1a1a1a", textAlign:"right", paddingTop:2 }}>${Number(item.amount||0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Payment Info / Approve + Totals */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", padding:"20px 28px", gap:24, borderTop:"1px solid #e8e8e8" }}>
                {isEst ? (
                  <div>
                    <p style={{ margin:"0 0 10px", fontWeight:700, fontSize:13, color:"#1a1a1a" }}>Ready to Move Forward?</p>
                    {inv.status === "approved" ? (
                      <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:700, color:"#0a0f1e" }}>✓ Approved — we'll be in touch to schedule.</p>
                    ) : (
                      <p style={{ margin:"0 0 10px", fontSize:12 }}>
                        <a href={`${API}/api/estimate-approve/${inv.id}`} target="_blank" rel="noreferrer" style={{ color:"#0a0f1e", fontWeight:700 }}>Click here to approve this estimate</a>
                      </p>
                    )}
                    <p style={{ margin:0, fontSize:11, color:"#888" }}>Approving lets us know you'd like to proceed — we'll follow up to schedule the work.</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin:"0 0 10px", fontWeight:700, fontSize:13, color:"#1a1a1a" }}>Payment Info</p>
                    {inv.status !== "paid" && (
                      <>
                        <p style={{ margin:"0 0 2px", fontSize:9, fontWeight:700, color:"#888", textTransform:"uppercase" }}>PAY ONLINE</p>
                        <p style={{ margin:"0 0 10px", fontSize:12 }}>
                          <a href={`${API}/api/pay/${inv.id}`} target="_blank" rel="noreferrer" style={{ color:"#0a0f1e" }}>Click here to pay by card</a>
                        </p>
                      </>
                    )}
                    <p style={{ margin:"0 0 2px", fontSize:9, fontWeight:700, color:"#888", textTransform:"uppercase" }}>E-TRANSFER</p>
                    <p style={{ margin:"0 0 10px", fontSize:12, color:"#0a0f1e" }}>payments@mactor.ca</p>
                    <p style={{ margin:"0 0 2px", fontSize:9, fontWeight:700, color:"#888", textTransform:"uppercase" }}>BY CHEQUE</p>
                    <p style={{ margin:0, fontSize:12, color:"#444" }}>Mactor Construction or Julio Cesar Macias Aguilar</p>
                  </div>
                )}
                {/* Totals */}
                <div>
                  {([
                    ["Subtotal", inv.subtotal],
                    ...(inv.discount > 0 ? [["Descuento", -inv.discount]] : []),
                    ...(inv.hstEnabled !== false ? [["HST (13%)", inv.hst]] : []),
                  ] as [string, number][]).map(([l,v]) => (
                    <div key={String(l)} style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                      <span style={{ fontSize:12, color:"#666" }}>{l}</span>
                      <span style={{ fontSize:12, color:"#1a1a1a" }}>{v < 0 ? "-" : ""}${Math.abs(Number(v)).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop:"1px solid #ccc", paddingTop:7, marginTop:4, display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:13, fontWeight:800, color:"#1a1a1a" }}>TOTAL</span>
                    <span style={{ fontSize:14, fontWeight:800, color:"#1a1a1a" }}>
                      CAD ${Number(inv.total).toFixed(2)}
                    </span>
                  </div>
                  {!isEst && inv.status === "paid" && inv.paidAt && (
                    <>
                      <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                        <span style={{ fontSize:11, color:"#666" }}>Payment</span>
                        <span style={{ fontSize:11, color:"#1a1a1a" }}>-${Number(inv.total).toFixed(2)}</span>
                      </div>
                      <div style={{ borderTop:"1px solid #ccc", paddingTop:7, marginTop:4, display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:13, fontWeight:800, color:"#1a1a1a" }}>BALANCE DUE</span>
                        <span style={{ fontSize:14, fontWeight:800, color:"#1a1a1a" }}>CAD $0.00</span>
                      </div>
                    </>
                  )}
                  {!isEst && inv.status !== "paid" && (
                    <div style={{ borderTop:"1px solid #ccc", paddingTop:7, marginTop:4, display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:13, fontWeight:800, color:"#1a1a1a" }}>BALANCE DUE</span>
                      <span style={{ fontSize:14, fontWeight:800, color:"#1a1a1a" }}>CAD ${Number(inv.total).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {inv.notes && (
                <div style={{ padding:"0 28px 20px", borderTop:"1px solid #e8e8e8" }}>
                  <div style={{ width:"45%", borderTop:"1px solid #ccc", paddingTop:12, marginTop:16 }}>
                    <p style={{ margin:0, fontSize:12, color:"#444", whiteSpace:"pre-line", lineHeight:1.6 }}>{inv.notes}</p>
                  </div>
                </div>
              )}

              {/* Photos preview */}
              {(inv.photos||[]).length > 0 && (
                <div style={{ padding:"16px 28px", borderTop:"1px solid #e8e8e8" }}>
                  <p style={{ margin:"0 0 10px", fontSize:10, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:".05em" }}>
                    Photos ({inv.photos.length})
                  </p>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                    {inv.photos.map((url: string, i: number) => (
                      <div key={i} style={{ position:"relative", borderRadius:6, overflow:"hidden", aspectRatio:"4/3", background:"#f1f5f9" }}>
                        <Image src={url} alt={`photo ${i+1}`} fill style={{ objectFit:"cover" }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>{/* end inv-doc-scroll */}
            </div>

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
                {(isEst ? ["draft","sent","approved"] as const : ["draft","sent","paid","overdue"] as const).map(s => (
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
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={labelSt}>📅 Programar trabajo (opcional)</label>
                  <div style={{ display:"flex", gap:8 }}>
                    <input type="datetime-local" value={editScheduledDate} onChange={e => setEditScheduledDate(e.target.value)} style={{ ...inputSt, margin:0, flex:1 }} />
                    {editScheduledDate && (
                      <button onClick={() => setEditScheduledDate("")}
                        style={{ background:"#f1f5f9", border:"none", borderRadius:8, color:"#64748b", padding:"0 14px", cursor:"pointer", fontSize:13 }}>
                        Quitar
                      </button>
                    )}
                  </div>
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
              <div style={{ display:"grid", gridTemplateColumns: mob ? "1fr 70px 50px 70px 28px" : "1fr 90px 60px 90px 32px", gap:8, marginBottom:8 }}>
                {["Description","Rate","Qty","Amount",""].map(h => (
                  <span key={h} style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".04em" }}>{h}</span>
                ))}
              </div>

              {editItems.map((item, i) => (
                <div key={i} style={{ border:"1px solid #f1f5f9", borderRadius:8, padding:"12px", marginBottom:10, background:"#fafafa" }}>
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:6, marginBottom:8 }}>
                    <button onClick={() => moveItem(i, -1)} disabled={i === 0}
                      style={{ background:"#f1f5f9", border:"none", borderRadius:6, color: i===0 ? "#cbd5e1" : "#475569", cursor: i===0 ? "default" : "pointer", fontSize:13, fontWeight:700, padding:"2px 8px" }}>↑</button>
                    <button onClick={() => moveItem(i, 1)} disabled={i === editItems.length - 1}
                      style={{ background:"#f1f5f9", border:"none", borderRadius:6, color: i===editItems.length-1 ? "#cbd5e1" : "#475569", cursor: i===editItems.length-1 ? "default" : "pointer", fontSize:13, fontWeight:700, padding:"2px 8px" }}>↓</button>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns: mob ? "1fr 70px 50px 70px 28px" : "1fr 90px 60px 90px 32px", gap:8, marginBottom:8 }}>
                    <input value={item.description} onChange={e => updateItem(i,"description",e.target.value)}
                      placeholder="Description" style={{ ...inputSt, margin:0 }} />
                    <input type="number" value={item.rate} onChange={e => updateItem(i,"rate",parseFloat(e.target.value)||0)}
                      style={{ ...inputSt, margin:0 }} />
                    <input type="number" value={item.qty} onChange={e => updateItem(i,"qty",parseFloat(e.target.value)||1)}
                      style={{ ...inputSt, margin:0 }} />
                    <div style={{ ...inputSt as any, margin:0, background:"#f8fafc", color:"#0f172a", fontWeight:700, display:"flex", alignItems:"center" }}>
                      ${editDisplayItems[i].amount.toFixed(2)}
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

              {/* Card surcharge */}
              <label style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", marginTop:16,
                background:"#f8fafc", border:`1px solid ${editCardSurcharge ? "#94a3b8" : "#e2e8f0"}`,
                borderRadius:10, cursor:"pointer" }}>
                <input type="checkbox" checked={editCardSurcharge} onChange={e => setEditCardSurcharge(e.target.checked)} style={{ width:16, height:16, cursor:"pointer" }} />
                <span style={{ fontSize:13, color:"#374151" }}>
                  💳 Cliente pagará con tarjeta <span style={{ color:"#64748b" }}>— agrega 3% + $3 CAD, repartido entre los ítems</span>
                </span>
              </label>

              {/* Discount */}
              <div style={{ marginTop:10 }}>
                <label style={labelSt}>Descuento ($)</label>
                <input type="number" min="0" step="0.01" value={editDiscount || ""}
                  onChange={e => setEditDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00" style={{ ...inputSt, margin:0 }} />
              </div>

              {/* HST toggle */}
              <label style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", marginTop:10,
                background:"#f8fafc", border:`1px solid ${!editHstEnabled ? "#94a3b8" : "#e2e8f0"}`,
                borderRadius:10, cursor:"pointer" }}>
                <input type="checkbox" checked={editHstEnabled} onChange={e => setEditHstEnabled(e.target.checked)} style={{ width:16, height:16, cursor:"pointer" }} />
                <span style={{ fontSize:13, color:"#374151" }}>Aplicar HST (13%)</span>
              </label>

              {/* Totals preview */}
              <div style={{ marginTop:10, padding:"14px", background:"#f8fafc", borderRadius:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:13, color:"#64748b" }}>Subtotal</span>
                  <span style={{ fontSize:13 }}>${rawSubtotal.toFixed(2)}</span>
                </div>
                {editDiscount > 0 && (
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:13, color:"#64748b" }}>Descuento</span>
                    <span style={{ fontSize:13, color:"#dc2626" }}>-${Number(editDiscount).toFixed(2)}</span>
                  </div>
                )}
                {editHstEnabled && (
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:13, color:"#64748b" }}>HST (13%)</span>
                    <span style={{ fontSize:13 }}>${hst.toFixed(2)}</span>
                  </div>
                )}
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

      {/* Send email — lets Julio override the recipient for this send only, and BCC himself for a record */}
      {showSendModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          onClick={e => e.target === e.currentTarget && setShowSendModal(false)}>
          <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:400, padding: mob ? 20 : 28, boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h2 style={{ margin:0, fontSize:16, fontWeight:800, color:"#0f172a" }}>✉ {isEst ? "Enviar estimado" : "Enviar factura"}</h2>
              <button onClick={() => setShowSendModal(false)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#94a3b8" }}>×</button>
            </div>
            <label style={{ ...labelSt, display:"block", marginBottom:6 }}>Enviar a</label>
            <input type="email" autoFocus value={sendEmail}
              onChange={e => setSendEmail(e.target.value)}
              placeholder="cliente@ejemplo.com"
              style={{ ...inputSt, margin:0 }} />
            <p style={{ margin:"6px 0 0", fontSize:11, color:"#94a3b8" }}>
              Puedes cambiarlo por otro correo solo para este envío — no modifica el email guardado del cliente.
            </p>
            <label style={{ display:"flex", alignItems:"center", gap:8, marginTop:16, cursor:"pointer" }}>
              <input type="checkbox" checked={sendBcc} onChange={e => setSendBcc(e.target.checked)} style={{ width:16, height:16, cursor:"pointer" }} />
              <span style={{ fontSize:13, color:"#374151" }}>Enviarme copia oculta (BCC) a billing@mactor.ca</span>
            </label>
            <label style={{ display:"flex", alignItems:"center", gap:8, marginTop:12, cursor:"pointer" }}>
              <input type="checkbox" checked={sendSms} onChange={e => setSendSms(e.target.checked)} style={{ width:16, height:16, cursor:"pointer" }} />
              <span style={{ fontSize:13, color:"#374151" }}>También enviar por SMS</span>
            </label>
            {sendSms && (
              <input type="tel" value={sendPhone}
                onChange={e => setSendPhone(e.target.value)}
                placeholder="416-000-0000"
                style={{ ...inputSt, margin:"8px 0 0" }} />
            )}
            <div style={{ display:"flex", gap:8, marginTop:20 }}>
              <button onClick={send} disabled={sending || !sendEmail.trim() || (sendSms && !sendPhone.trim())}
                style={{ flex:1, padding:"11px", background: sending ? "#94a3b8" : "#e63946", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:(sending||!sendEmail.trim()||(sendSms&&!sendPhone.trim()))?"not-allowed":"pointer" }}>
                {sending ? "Enviando..." : "Enviar"}
              </button>
              <button onClick={() => setShowSendModal(false)} disabled={sending}
                style={{ padding:"11px 18px", background:"#f1f5f9", border:"none", borderRadius:10, fontSize:14, cursor:"pointer", color:"#64748b" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule work — sets scheduledDate, shows up on the Agenda page */}
      {showScheduleModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          onClick={e => e.target === e.currentTarget && !scheduling && setShowScheduleModal(false)}>
          <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:380, padding: mob ? 20 : 28, boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h2 style={{ margin:0, fontSize:16, fontWeight:800, color:"#0f172a" }}>📅 Programar trabajo</h2>
              <button onClick={() => setShowScheduleModal(false)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#94a3b8" }}>×</button>
            </div>
            <label style={{ ...labelSt, display:"block", marginBottom:6 }}>Fecha y hora</label>
            <input type="datetime-local" autoFocus value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
              style={{ ...inputSt, margin:0 }} />
            <p style={{ margin:"6px 0 0", fontSize:11, color:"#94a3b8" }}>
              Aparecerá en la Agenda para planear el trabajo.
            </p>
            <div style={{ display:"flex", gap:8, marginTop:20 }}>
              <button onClick={() => saveSchedule()} disabled={scheduling}
                style={{ flex:1, padding:"11px", background: scheduling ? "#94a3b8" : "#0369a1", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:scheduling?"not-allowed":"pointer" }}>
                {scheduling ? "Guardando..." : "Guardar"}
              </button>
              {inv.scheduledDate && (
                <button onClick={() => { setScheduleDate(""); saveSchedule(""); }} disabled={scheduling}
                  style={{ padding:"11px 16px", background:"#fee2e2", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:scheduling?"not-allowed":"pointer", color:"#dc2626" }}>
                  Quitar
                </button>
              )}
              <button onClick={() => setShowScheduleModal(false)} disabled={scheduling}
                style={{ padding:"11px 16px", background:"#f1f5f9", border:"none", borderRadius:10, fontSize:14, cursor:"pointer", color:"#64748b" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation — requires re-entering the password */}
      {showDeleteConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          onClick={e => e.target === e.currentTarget && !deleting && setShowDeleteConfirm(false)}>
          <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:380, padding: mob ? 20 : 28, boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <h2 style={{ margin:0, fontSize:16, fontWeight:800, color:"#dc2626" }}>⚠️ Eliminar permanentemente</h2>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#94a3b8" }}>×</button>
            </div>
            <p style={{ margin:"0 0 16px", fontSize:13, color:"#64748b" }}>
              Vas a eliminar {isEst ? "el estimado" : "la factura"} <strong style={{ color:"#0f172a" }}>{inv.invoiceNumber}</strong> de <strong style={{ color:"#0f172a" }}>{inv.clientName}</strong> de forma permanente. Esta acción no se puede deshacer.
            </p>
            <label style={{ ...labelSt, display:"block", marginBottom:6 }}>Confirma tu contraseña para continuar</label>
            <input type="password" autoFocus value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !deleting && deletePassword && confirmDelete()}
              placeholder="••••••" style={{ ...inputSt, margin:0 }} />
            {deleteError && <p style={{ color:"#dc2626", fontSize:12, margin:"8px 0 0" }}>{deleteError}</p>}
            <div style={{ display:"flex", gap:8, marginTop:20 }}>
              <button onClick={confirmDelete} disabled={deleting || !deletePassword}
                style={{ flex:1, padding:"11px", background: deleting ? "#94a3b8" : "#dc2626", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor: (deleting||!deletePassword)?"not-allowed":"pointer" }}>
                {deleting ? "Eliminando..." : "Eliminar definitivamente"}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                style={{ padding:"11px 18px", background:"#f1f5f9", border:"none", borderRadius:10, fontSize:14, cursor:"pointer", color:"#64748b" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
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
