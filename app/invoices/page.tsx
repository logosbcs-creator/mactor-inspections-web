"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

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
  const [typeFilter, setTypeFilter] = useState<"all"|"invoice"|"estimate">("invoice");
  const [search,   setSearch]   = useState(searchParams.get("q") || "");
  const [loading,  setLoading]  = useState(true);
  const [perPage,  setPerPage]  = useState(50);
  const [mob,      setMob]      = useState(false);

  function logout() {
    localStorage.removeItem("mactor_token");
    router.push("/invoices/login");
  }

  useEffect(() => {
    if (!localStorage.getItem("mactor_token")) { router.push("/invoices/login"); return; }
    load();
    const check = () => setMob(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

  // Stats — scoped to current type filter
  const scoped      = typeFilter === "all" ? invoices : invoices.filter(i => i.type === typeFilter);
  const outstanding = scoped.filter(i => i.status !== "paid").reduce((s,i) => s + i.total, 0);
  const paid        = scoped.filter(i => i.status === "paid").reduce((s,i) => s + i.total, 0);
  const total       = scoped.reduce((s,i) => s + i.total, 0);

  const statusBadge = (inv: Invoice) => {
    if (inv.status === "paid")    return <span style={badge("#f1f5f9","#0a0f1e")}>Paid</span>;
    if (inv.status === "sent")    return <span style={badge("#f1f5f9","#0a0f1e")}>Sent</span>;
    if (inv.status === "overdue") return <span style={badge("#fee2e2","#dc2626")}>Overdue</span>;
    return <span style={badge("#f3f4f6","#6b7280")}>Draft</span>;
  };

  function badge(bg: string, color: string): React.CSSProperties {
    return { background: bg, color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" as const };
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color: "#111" }}>

      {/* Top nav — mobile: no logo, no secondary buttons */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: mob ? "0 10px" : "0 24px", display: "flex", alignItems: "center", gap: 0, overflow: "hidden" }}>
        {!mob && (
          <div style={{ display: "flex", alignItems: "center", padding: "8px 0", marginRight: 28, flexShrink: 0 }}>
            <Image src="/mactor-logo.png" alt="MacTor Construction" width={69} height={48} style={{ objectFit: "contain" }} />
          </div>
        )}
        {(["Invoices","Estimates"] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t === "Invoices" ? "invoice" : "estimate")}
            style={{ padding: mob ? "14px 10px" : "18px 16px", border: "none", background: "none", cursor: "pointer",
              fontSize: mob ? 16 : 13, fontWeight: 600, flexShrink: 0,
              color: (t === "Invoices" ? typeFilter === "invoice" : typeFilter === "estimate") ? "#e63946" : "#64748b",
              borderBottom: (t === "Invoices" ? typeFilter === "invoice" : typeFilter === "estimate") ? "2px solid #e63946" : "2px solid transparent" }}>
            {t}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: mob ? 6 : 8, alignItems: "center" }}>
          {!mob && <>
            <button onClick={() => router.push("/invoices/schedule")}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#0a0f1e" }}>
              📅 Agenda
            </button>
            <button onClick={() => router.push("/invoices/clients")}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#0a0f1e" }}>
              👥 Clientes
            </button>
            <button onClick={() => router.push("/invoices/catalog")}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#0a0f1e" }}>
              🗂️ Catálogo
            </button>
            <button onClick={() => router.push("/invoices/import")}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151" }}>
              📥 Importar
            </button>
            <button onClick={() => router.push("/invoices/users")}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#0f172a" }}>
              👤 Usuarios
            </button>
          </>}
          <button onClick={() => router.push("/invoices/new")}
            style={{ padding: mob ? "7px 12px" : "8px 18px", borderRadius: 8, border: "none", background: "#e63946", color: "#fff", fontSize: mob ? 16 : 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            + {isEst ? "Estimado" : "Factura"}
          </button>
          <button onClick={logout}
            style={{ padding: mob ? "6px 9px" : "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: mob ? 15 : 12, fontWeight: 600, cursor: "pointer", color: "#94a3b8" }}>
            Salir
          </button>
        </div>
      </div>

      {/* Mobile menu row for secondary nav */}
      {mob && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "8px 10px", display: "flex", gap: 6, overflowX: "auto" }}>
          <button onClick={() => router.push("/invoices/schedule")}
            style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#0a0f1e", whiteSpace: "nowrap" }}>
            📅 Agenda
          </button>
          <button onClick={() => router.push("/invoices/clients")}
            style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#0a0f1e", whiteSpace: "nowrap" }}>
            👥 Clientes
          </button>
          <button onClick={() => router.push("/invoices/catalog")}
            style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid #e2e8f0", background: "#f1f5f9", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#0a0f1e", whiteSpace: "nowrap" }}>
            🗂️ Catálogo
          </button>
          <button onClick={() => router.push("/invoices/import")}
            style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#374151", whiteSpace: "nowrap" }}>
            📥 Importar
          </button>
          <button onClick={() => router.push("/invoices/users")}
            style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#0f172a", whiteSpace: "nowrap" }}>
            👤 Usuarios
          </button>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: mob ? "14px 10px" : "28px 24px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: mob ? 8 : 16, marginBottom: mob ? 16 : 28 }}>
          {(isEst ? [
            { label: "Total Estimado", value: total,  color: "#0f172a", icon: "📊" },
            { label: "Enviados",       value: scoped.filter(i => i.status === "sent").reduce((s,i) => s + i.total, 0), color: "#0a0f1e", icon: "📤" },
          ] : mob ? [
            { label: "Total Invoiced", value: total, color: "#0f172a", icon: "📊" },
            { label: "Paid",           value: paid,  color: "#0a0f1e", icon: "✅" },
          ] : [
            { label: "Total Invoiced", value: total,       color: "#0f172a", icon: "📊" },
            { label: "Outstanding",    value: outstanding, color: "#0f172a", icon: "⏳" },
            { label: "Paid",           value: paid,        color: "#0a0f1e", icon: "✅" },
          ]).map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: mob ? "14px 14px" : "20px 24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ margin: 0, fontSize: mob ? 14 : 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>{s.label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: mob ? 21 : 24, fontWeight: 800, color: s.color }}>
                    ${s.value.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                {!mob && <span style={{ fontSize: 22 }}>{s.icon}</span>}
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#94a3b8" }}>CAD</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>

          {/* Tab bar + search */}
          <div style={{ display: "flex", alignItems: "center", padding: mob ? "0 10px" : "0 20px", borderBottom: "1px solid #e2e8f0", gap: 0, overflowX: "auto", WebkitOverflowScrolling: "touch" as never }}>
            {(isEst
              ? [["all","Todos"],["outstanding","Enviados"],["paid","Borradores"]] as [Tab,string][]
              : mob
                ? [["all","Todas"],["paid","Pagadas"]] as [Tab,string][]
                : [["all","All Invoices"],["outstanding","Outstanding"],["paid","Paid"]] as [Tab,string][]
            ).map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: mob ? "12px 10px" : "14px 16px", border: "none", background: "none", cursor: "pointer",
                  fontSize: mob ? 16 : 13, fontWeight: 600, flexShrink: 0,
                  color: tab === t ? "#e63946" : "#64748b",
                  borderBottom: tab === t ? "2px solid #e63946" : "2px solid transparent" }}>
                {l}
                <span style={{ marginLeft: 4, background: tab === t ? "#fee2e2" : "#f1f5f9", color: tab === t ? "#e63946" : "#94a3b8",
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
                  style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", width: 220, color: "#374151" }} />
              </div>
            )}
          </div>
          {/* Mobile search */}
          {mob && (
            <div style={{ padding: "8px 10px", borderBottom: "1px solid #e2e8f0" }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", width: "100%", color: "#374151", boxSizing: "border-box" }} />
            </div>
          )}

          {/* Table header */}
          {(() => {
            const cols = mob ? "72px 1fr 96px" : "130px 1fr 130px 140px 40px";
            const hdr: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: ".05em" };
            return (
              <div style={{ display: "grid", gridTemplateColumns: cols, padding: mob ? "8px 10px" : "10px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <span style={hdr}>{isEst ? "Est." : "Inv."}</span>
                <span style={hdr}>Cliente</span>
                {!mob && <span style={hdr}>Fecha</span>}
                <span style={{ ...hdr, textAlign: "right" }}>{isEst ? "Total" : "Saldo"}</span>
                {!mob && <span style={hdr}></span>}
              </div>
            );
          })()}

          {/* Rows grouped by year */}
          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <p style={{ fontSize: 36, margin: 0 }}>📄</p>
              <p style={{ color: "#94a3b8", marginTop: 12 }}>No {label}s found</p>
              <button onClick={() => router.push("/invoices/new")}
                style={{ marginTop: 12, background: "#e63946", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {isEst ? "Create first estimate" : "Create first invoice"}
              </button>
            </div>
          ) : years.map(yr => {
            const cols = mob ? "72px 1fr 96px" : "130px 1fr 130px 140px 40px";
            return (
              <div key={yr}>
                {/* Year header */}
                <div style={{ display: "grid", gridTemplateColumns: cols, padding: mob ? "6px 10px" : "8px 20px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#374151" }}>{yr}</span>
                  <span></span>
                  {!mob && <span></span>}
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "right" }}>
                    ${byYear[yr].reduce((s,i)=>s+i.total,0).toLocaleString("en-CA",{minimumFractionDigits:2})}
                  </span>
                  {!mob && <span></span>}
                </div>
                {byYear[yr].map((inv, i) => (
                  <div key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)}
                    style={{ display: "grid", gridTemplateColumns: cols,
                      padding: mob ? "11px 10px" : "14px 20px",
                      borderBottom: "1px solid #f1f5f9", cursor: "pointer",
                      background: i%2===0 ? "#fff" : "#fafafa",
                      transition: "background 0.1s", alignItems: "center" }}
                    onMouseEnter={e => (e.currentTarget.style.background="#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background=i%2===0?"#fff":"#fafafa")}>
                    <span style={{ fontSize: mob ? 16 : 13, fontWeight: 700, color: "#e63946" }}>{inv.invoiceNumber}</span>
                    <span style={{ fontSize: mob ? 16 : 13, color: "#0f172a", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.clientName}</span>
                    {!mob && <span style={{ fontSize: 13, color: "#64748b" }}>{new Date(inv.invoiceDate).toLocaleDateString("en-CA",{month:"short",day:"numeric",year:"numeric"})}</span>}
                    <div style={{ textAlign: "right" }}>
                      {!isEst && inv.status === "paid"
                        ? <span style={{ ...badge("#f1f5f9","#0a0f1e"), fontSize: mob ? 14 : 12 }}>Pagado</span>
                        : <span style={{ fontSize: mob ? 16 : 13, fontWeight: 700, color: "#0f172a" }}>${inv.total.toLocaleString("en-CA",{minimumFractionDigits:2})}</span>
                      }
                    </div>
                    {!mob && <div style={{ textAlign: "right" }}>{statusBadge(inv)}</div>}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Footer */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Showing {Math.min(filtered.length, perPage)} of {scoped.filter(i => {
              if (tab==="outstanding" && i.status==="paid") return false;
              if (tab==="paid" && i.status!=="paid") return false;
              return true;
            }).length} {label}s</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Per page:</span>
              {[25,50,100].map(n => (
                <button key={n} onClick={() => setPerPage(n)}
                  style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: perPage===n?"#e63946":"#fff",
                    color: perPage===n?"#fff":"#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
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
