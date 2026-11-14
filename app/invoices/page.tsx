"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppHeader from "../components/AppHeader";
import { ClipboardList, Receipt, BarChart3, Mail, Bell, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const BG       = "#10131a";
const PANEL    = "#191e28";
const ROW_ALT  = "#1c212b";
const SOFT     = "#242b37";
const HOVER    = "#20262f";
const LINE     = "#323947";
const TEXT     = "#f3f6fc";
const MUTED    = "#aeb8ca";
const RED      = "#ff5964";
const RED_SOFT = "#321a1e";

interface Invoice {
  id: string; invoiceNumber: string; nickname?: string; type: string; status: string;
  clientName: string; clientEmail?: string; clientPhone?: string;
  total: number; invoiceDate: string; sentAt?: string; paidAt?: string;
  sendLogs?: { sentAt: string }[];   // latest payment reminder only (see GET /api/invoices)
}

type Tab = "all" | "outstanding" | "paid";

function token() { return localStorage.getItem("mactor_token") || ""; }

function InvoicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tab,      setTab]      = useState<Tab>("all");
  const [typeFilter, setTypeFilter] = useState<"all"|"invoice"|"estimate">(searchParams.get("type") === "estimate" ? "estimate" : "invoice");
  const [search,   setSearch]   = useState(searchParams.get("q") || "");
  const [loading,  setLoading]  = useState(true);
  const [perPage,  setPerPage]  = useState(50);
  const [mob,      setMob]      = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Payment reminder modal
  const [remInv,     setRemInv]     = useState<Invoice | null>(null);
  const [remPhone,   setRemPhone]   = useState("");
  const [remText,    setRemText]    = useState("");
  const [remLast,    setRemLast]    = useState<string | null>(null);
  const [remLoading, setRemLoading] = useState(false);
  const [remSending, setRemSending] = useState(false);
  const [remError,   setRemError]   = useState("");
  const [toast,      setToast]      = useState("");

  useEffect(() => {
    if (!localStorage.getItem("mactor_token")) { router.push("/invoices/login"); return; }
    load();
    const check = () => setMob(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setTypeFilter(searchParams.get("type") === "estimate" ? "estimate" : "invoice");
  }, [searchParams]);

  async function load() {
    setLoading(true);
    const r = await fetch(`${API}/api/invoices`, { headers: { Authorization: `Bearer ${token()}` } });
    if (r.status === 401) { router.push("/invoices/login"); return; }
    setInvoices(await r.json());
    setLoading(false);
  }

  const isEst = typeFilter === "estimate";
  const label = isEst ? "estimate" : "invoice";

  // Filter
  const filtered = invoices.filter(inv => {
    if (typeFilter !== "all" && inv.type !== typeFilter) return false;
    if (tab === "outstanding") {
      if (isEst ? inv.status !== "sent" : inv.status === "paid") return false;
    }
    if (tab === "paid") {
      if (isEst ? inv.status !== "draft" : inv.status !== "paid") return false;
    }
    if (search && !inv.clientName.toLowerCase().includes(search.toLowerCase()) &&
        !inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) &&
        !(inv.nickname || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).slice(0, perPage);

  // Group by year
  const byYear: Record<string, Invoice[]> = {};
  filtered.forEach(inv => {
    const yr = new Date(inv.invoiceDate).getFullYear().toString();
    if (!byYear[yr]) byYear[yr] = [];
    byYear[yr].push(inv);
  });
  const years = Object.keys(byYear).sort((a,b) => Number(b)-Number(a));

  const scoped = typeFilter === "all" ? invoices : invoices.filter(i => i.type === typeFilter);

  function badge(bg: string, color: string): React.CSSProperties {
    return { background: bg, color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" as const };
  }

  function nextAction(inv: Invoice): { label: string; urgent?: boolean; convert?: boolean } | null {
    if (inv.status === "draft")    return { label: "Completar y enviar" };
    if (inv.status === "sent")     return { label: "Seguimiento" };
    if (inv.status === "overdue")  return { label: "Cobrar", urgent: true };
    if (inv.status === "approved") return { label: "Convertir a factura", convert: true };
    return null;
  }

  // Only invoices that went out and are still unpaid can be nudged.
  const canRemind = (inv: Invoice) => inv.type === "invoice" && (inv.status === "sent" || inv.status === "overdue");
  const lastReminder = (inv: Invoice) => inv.sendLogs?.[0]?.sentAt || null;
  const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("es-CA", { month: "short", day: "numeric" });

  async function openReminder(e: React.MouseEvent, inv: Invoice) {
    e.stopPropagation();
    setRemInv(inv); setRemPhone(inv.clientPhone || ""); setRemText(""); setRemLast(null); setRemError(""); setRemLoading(true);
    try {
      const r = await fetch(`${API}/api/invoices/${inv.id}/payment-reminder`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setRemError(d.error || "No se pudo preparar el recordatorio"); return; }
      setRemText(d.message || ""); setRemPhone(d.phone || inv.clientPhone || ""); setRemLast(d.lastReminderAt || null);
    } catch { setRemError("No se pudo preparar el recordatorio"); }
    finally { setRemLoading(false); }
  }

  async function sendReminder() {
    if (!remInv) return;
    setRemSending(true); setRemError("");
    try {
      const r = await fetch(`${API}/api/invoices/${remInv.id}/payment-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ phone: remPhone.trim(), message: remText }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setRemError(d.error || "No se pudo enviar el SMS"); return; }
      setInvoices(prev => prev.map(i => i.id === remInv.id ? { ...i, sendLogs: [{ sentAt: d.sentAt }] } : i));
      setToast(`Recordatorio enviado — ${remInv.invoiceNumber}`);
      setTimeout(() => setToast(""), 4000);
      setRemInv(null);
    } catch { setRemError("No se pudo enviar el SMS"); }
    finally { setRemSending(false); }
  }

  async function convertRow(e: React.MouseEvent, inv: Invoice) {
    e.stopPropagation();
    setConvertingId(inv.id);
    try {
      const r = await fetch(`${API}/api/invoices/${inv.id}/convert`, { method: "POST", headers: { Authorization: `Bearer ${token()}` } });
      if (r.ok) {
        const created = await r.json();
        router.push(`/invoices/${created.id}`);
      }
    } finally {
      setConvertingId(null);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: BG, fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: TEXT }}>

      <AppHeader active={isEst ? "estimates" : "invoices"} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: mob ? "14px 10px" : "28px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: mob ? 19 : 20, fontWeight: 700, color: TEXT, display: "flex", alignItems: "center", gap: 10 }}>
            {isEst ? <ClipboardList size={20} /> : <Receipt size={20} />} {isEst ? "Estimados" : "Facturas"}
          </h1>
          <button onClick={() => router.push("/invoices/summary")}
            style={{ background: "none", border: `1px solid ${LINE}`, borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600, color: MUTED, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <BarChart3 size={14} /> Resumen financiero
          </button>
        </div>

        {/* Filters */}
        <div style={{ background: PANEL, borderRadius: 12, border: `1px solid ${LINE}` }}>

          {/* Tab bar + search */}
          <div style={{ display: "flex", alignItems: "center", padding: mob ? "0 10px" : "0 20px", borderBottom: `1px solid ${LINE}`, gap: 0, overflowX: "auto", WebkitOverflowScrolling: "touch" as never }}>
            {(isEst
              ? [["all","Todos"],["outstanding","Enviados"],["paid","Borradores"]] as [Tab,string][]
              : [["all","Todas"],["paid","Pagadas"],["outstanding","No pagadas"]] as [Tab,string][]
            ).map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: mob ? "12px 10px" : "14px 16px", border: "none", background: "none", cursor: "pointer",
                  fontSize: mob ? 16 : 13, fontWeight: 600, flexShrink: 0,
                  color: tab === t ? RED : MUTED,
                  borderBottom: tab === t ? `2px solid ${RED}` : "2px solid transparent" }}>
                {l}
                <span style={{ marginLeft: 4, background: tab === t ? RED_SOFT : SOFT, color: tab === t ? RED : MUTED,
                  borderRadius: 20, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>
                  {t === "all" ? scoped.length
                    : t === "outstanding" ? scoped.filter(i => isEst ? i.status === "sent" : i.status !== "paid").length
                    : scoped.filter(i => isEst ? i.status === "draft" : i.status === "paid").length}
                </span>
              </button>
            ))}
            {!mob && (
              <div style={{ marginLeft: "auto" }}>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by client name..."
                  style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${LINE}`, background: BG, fontSize: 13, outline: "none", width: 220, color: TEXT }} />
              </div>
            )}
          </div>
          {/* Mobile search */}
          {mob && (
            <div style={{ padding: "8px 10px", borderBottom: `1px solid ${LINE}` }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${LINE}`, background: BG, fontSize: 13, outline: "none", width: "100%", color: TEXT, boxSizing: "border-box" }} />
            </div>
          )}

          {/* Table header */}
          {(() => {
            const cols = mob ? "98px 1fr 100px" : "130px 1fr 120px 130px 170px";
            const hdr: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase" as const, letterSpacing: ".05em" };
            return (
              <div style={{ display: "grid", gridTemplateColumns: cols, padding: mob ? "8px 10px" : "10px 20px", background: SOFT, borderBottom: `1px solid ${LINE}` }}>
                <span style={hdr}>{isEst ? "Est." : "Inv."}</span>
                <span style={hdr}>Cliente</span>
                {!mob && <span style={hdr}>Fecha</span>}
                <span style={{ ...hdr, textAlign: "right" }}>{isEst ? "Total" : "Saldo"}</span>
                {!mob && <span style={{ ...hdr, textAlign: "right" }}>Siguiente acción</span>}
              </div>
            );
          })()}

          {/* Rows grouped by year */}
          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: MUTED, fontSize: 14 }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <p style={{ fontSize: 36, margin: 0 }}>📄</p>
              <p style={{ color: MUTED, marginTop: 12 }}>No {label}s found</p>
              <button onClick={() => router.push("/invoices/new")}
                style={{ marginTop: 12, background: RED, color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {isEst ? "Create first estimate" : "Create first invoice"}
              </button>
            </div>
          ) : years.map(yr => {
            const cols = mob ? "98px 1fr 100px" : "130px 1fr 120px 130px 170px";
            return (
              <div key={yr}>
                {/* Year header */}
                <div style={{ display: "grid", gridTemplateColumns: cols, padding: mob ? "6px 10px" : "8px 20px", background: SOFT, borderBottom: `1px solid ${LINE}` }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: TEXT }}>{yr}</span>
                  <span></span>
                  {!mob && <span></span>}
                  <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, textAlign: "right" }}>
                    ${byYear[yr].reduce((s,i)=>s+i.total,0).toLocaleString("en-CA",{minimumFractionDigits:2})}
                  </span>
                  {!mob && <span></span>}
                </div>
                {byYear[yr].map((inv, i) => (
                  <div key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)}
                    style={{ display: "grid", gridTemplateColumns: cols,
                      padding: mob ? "11px 10px" : "14px 20px",
                      borderBottom: `1px solid ${LINE}`, cursor: "pointer",
                      background: i%2===0 ? PANEL : ROW_ALT,
                      transition: "background 0.1s", alignItems: "center" }}
                    onMouseEnter={e => (e.currentTarget.style.background=HOVER)}
                    onMouseLeave={e => (e.currentTarget.style.background=i%2===0?PANEL:ROW_ALT)}>
                    <span style={{ fontSize: mob ? 16 : 13, fontWeight: 700, color: RED, display: "flex", alignItems: "center", gap: 5 }}>
                      {inv.invoiceNumber}
                      {inv.sentAt && (
                        <span title={`Enviado el ${new Date(inv.sentAt).toLocaleDateString("es-CA",{month:"short",day:"numeric",year:"numeric"})}`} style={{ display:"flex" }}>
                          <Mail size={mob ? 12 : 11} color={MUTED} />
                        </span>
                      )}
                    </span>
                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                      <div style={{ fontSize: mob ? 16 : 13, color: TEXT, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.clientName}</div>
                      {inv.nickname && (
                        <div style={{ fontSize: mob ? 12 : 11, color: MUTED, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.nickname}</div>
                      )}
                      {canRemind(inv) && lastReminder(inv) && (
                        <div style={{ fontSize: 11, color: MUTED, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                          <Bell size={10} /> {mob ? "Recordado" : "Recordatorio enviado"} {fmtDay(lastReminder(inv)!)}
                        </div>
                      )}
                    </div>
                    {!mob && <span style={{ fontSize: 13, color: MUTED }}>{new Date(inv.invoiceDate).toLocaleDateString("en-CA",{month:"short",day:"numeric",year:"numeric"})}</span>}
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                      {!isEst && inv.status === "paid"
                        ? <span style={{ ...badge(SOFT, TEXT), fontSize: mob ? 14 : 12 }}>Pagado</span>
                        : <span style={{ fontSize: mob ? 16 : 13, fontWeight: 700, color: TEXT }}>${inv.total.toLocaleString("en-CA",{minimumFractionDigits:2})}</span>
                      }
                      {mob && canRemind(inv) && (
                        <button onClick={e => openReminder(e, inv)}
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 8, border: `1px solid ${inv.status === "overdue" ? RED_SOFT : LINE}`,
                            background: inv.status === "overdue" ? RED_SOFT : "none", color: inv.status === "overdue" ? RED : MUTED, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                          <Bell size={11} /> Recordar
                        </button>
                      )}
                    </div>
                    {!mob && (
                      <div style={{ textAlign: "right", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
                        {canRemind(inv) && (
                          <button onClick={e => openReminder(e, inv)} title="Enviar recordatorio de pago por SMS"
                            style={{ padding: "6px 9px", borderRadius: 8, border: `1px solid ${inv.status === "overdue" ? RED_SOFT : LINE}`, display: "flex", alignItems: "center",
                              background: inv.status === "overdue" ? RED_SOFT : "none", color: inv.status === "overdue" ? RED : MUTED, cursor: "pointer" }}>
                            <Bell size={14} />
                          </button>
                        )}
                        {(() => {
                          const action = nextAction(inv);
                          if (!action) return null;
                          const busy = convertingId === inv.id;
                          return (
                            <button
                              onClick={e => action.convert ? convertRow(e, inv) : (e.stopPropagation(), router.push(`/invoices/${inv.id}`))}
                              disabled={busy}
                              style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", whiteSpace: "nowrap",
                                border: `1px solid ${action.urgent ? RED_SOFT : LINE}`,
                                background: action.urgent ? RED_SOFT : "none",
                                color: action.urgent ? RED : MUTED, opacity: busy ? 0.6 : 1 }}>
                              {busy ? "Convirtiendo..." : action.label}
                            </button>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Footer */}
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: MUTED }}>Showing {Math.min(filtered.length, perPage)} of {scoped.filter(i => {
              if (tab==="outstanding" && i.status==="paid") return false;
              if (tab==="paid" && i.status!=="paid") return false;
              return true;
            }).length} {label}s</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: MUTED }}>Per page:</span>
              {[25,50,100].map(n => (
                <button key={n} onClick={() => setPerPage(n)}
                  style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${LINE}`, background: perPage===n?RED:"transparent",
                    color: perPage===n?"#fff":MUTED, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment reminder — preview of the exact SMS, editable before it goes out */}
      {remInv && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => e.target === e.currentTarget && !remSending && setRemInv(null)}>
          <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto", padding: mob ? 20 : 28, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: TEXT, display: "flex", alignItems: "center", gap: 8 }}><Bell size={16} /> Recordatorio de pago</h2>
              <button onClick={() => !remSending && setRemInv(null)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}><X size={20} /></button>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: MUTED }}>
              {remInv.invoiceNumber} · {remInv.clientName} · ${remInv.total.toLocaleString("en-CA", { minimumFractionDigits: 2 })}
            </p>
            {remLast && (
              <p style={{ margin: "0 0 14px", fontSize: 12, color: MUTED, fontStyle: "italic", display: "flex", alignItems: "center", gap: 6 }}>
                <Bell size={12} /> Último recordatorio: {new Date(remLast).toLocaleString("es-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
            )}

            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>Enviar por SMS a</label>
            <input type="tel" value={remPhone} onChange={e => setRemPhone(e.target.value)} placeholder="416-000-0000"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: `1px solid ${LINE}`, background: BG, color: TEXT, fontSize: 14 }} />
            <p style={{ margin: "6px 0 14px", fontSize: 11, color: MUTED }}>Solo para este envío — no cambia el teléfono guardado del cliente.</p>

            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>Mensaje</label>
            <textarea value={remLoading ? "Preparando mensaje..." : remText} onChange={e => setRemText(e.target.value)} disabled={remLoading} rows={9}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: `1px solid ${LINE}`, background: BG, color: TEXT, fontSize: 13, lineHeight: 1.45, resize: "vertical", fontFamily: "inherit" }} />
            <p style={{ margin: "6px 0 0", fontSize: 11, color: MUTED }}>
              Puedes editarlo antes de enviar. {remText.length > 0 && `${remText.length} caracteres · ${Math.ceil(remText.length / 153)} SMS`}
            </p>

            {remError && <p style={{ margin: "12px 0 0", fontSize: 13, color: RED, fontWeight: 600 }}>{remError}</p>}

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button onClick={sendReminder} disabled={remSending || remLoading || !remPhone.trim() || !remText.trim()}
                style={{ flex: 1, padding: "11px", background: (remSending || remLoading || !remPhone.trim() || !remText.trim()) ? MUTED : RED, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: (remSending || remLoading || !remPhone.trim() || !remText.trim()) ? "not-allowed" : "pointer" }}>
                {remSending ? "Enviando..." : "Enviar recordatorio"}
              </button>
              <button onClick={() => setRemInv(null)} disabled={remSending}
                style={{ padding: "11px 18px", background: SOFT, border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer", color: MUTED }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 300, background: PANEL, border: `1px solid ${LINE}`, color: TEXT,
          padding: "11px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,.5)", display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={14} /> {toast}
        </div>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={null}>
      <InvoicesContent />
    </Suspense>
  );
}
