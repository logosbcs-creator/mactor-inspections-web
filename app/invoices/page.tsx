"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppHeader from "../components/AppHeader";
import { ClipboardList, Receipt, BarChart3 } from "lucide-react";

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
  id: string; invoiceNumber: string; type: string; status: string;
  clientName: string; clientEmail?: string;
  total: number; invoiceDate: string; sentAt?: string; paidAt?: string;
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
        !inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())) return false;
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
            const cols = mob ? "72px 1fr 96px" : "130px 1fr 120px 130px 170px";
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
            const cols = mob ? "72px 1fr 96px" : "130px 1fr 120px 130px 170px";
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
                    <span style={{ fontSize: mob ? 16 : 13, fontWeight: 700, color: RED }}>{inv.invoiceNumber}</span>
                    <span style={{ fontSize: mob ? 16 : 13, color: TEXT, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.clientName}</span>
                    {!mob && <span style={{ fontSize: 13, color: MUTED }}>{new Date(inv.invoiceDate).toLocaleDateString("en-CA",{month:"short",day:"numeric",year:"numeric"})}</span>}
                    <div style={{ textAlign: "right" }}>
                      {!isEst && inv.status === "paid"
                        ? <span style={{ ...badge(SOFT, TEXT), fontSize: mob ? 14 : 12 }}>Pagado</span>
                        : <span style={{ fontSize: mob ? 16 : 13, fontWeight: 700, color: TEXT }}>${inv.total.toLocaleString("en-CA",{minimumFractionDigits:2})}</span>
                      }
                    </div>
                    {!mob && (
                      <div style={{ textAlign: "right" }}>
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
