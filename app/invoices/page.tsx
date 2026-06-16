"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

interface Invoice {
  id: string; invoiceNumber: string; type: string; status: string;
  clientName: string; clientEmail?: string;
  total: number; invoiceDate: string; sentAt?: string; paidAt?: string;
}

type Tab = "all" | "outstanding" | "paid";

function token() { return localStorage.getItem("mactor_token") || ""; }

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tab,      setTab]      = useState<Tab>("all");
  const [typeFilter, setTypeFilter] = useState<"all"|"invoice"|"estimate">("all");
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [perPage,  setPerPage]  = useState(50);

  useEffect(() => {
    if (!localStorage.getItem("mactor_token")) { router.push("/invoices/login"); return; }
    load();
  }, []);

  async function load() {
    setLoading(true);
    const r = await fetch(`${API}/api/invoices`, { headers: { Authorization: `Bearer ${token()}` } });
    if (r.status === 401) { router.push("/invoices/login"); return; }
    setInvoices(await r.json());
    setLoading(false);
  }

  // Filter
  const filtered = invoices.filter(inv => {
    if (tab === "outstanding" && inv.status === "paid") return false;
    if (tab === "paid"        && inv.status !== "paid") return false;
    if (typeFilter !== "all"  && inv.type !== typeFilter) return false;
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

  const isEst = typeFilter === "estimate";
  const label = isEst ? "estimate" : "invoice";

  // Stats — scoped to current type filter
  const scoped      = typeFilter === "all" ? invoices : invoices.filter(i => i.type === typeFilter);
  const outstanding = scoped.filter(i => i.status !== "paid").reduce((s,i) => s + i.total, 0);
  const paid        = scoped.filter(i => i.status === "paid").reduce((s,i) => s + i.total, 0);
  const total       = scoped.reduce((s,i) => s + i.total, 0);

  const statusBadge = (inv: Invoice) => {
    if (inv.status === "paid")    return <span style={badge("#dcfce7","#16a34a")}>Paid</span>;
    if (inv.status === "sent")    return <span style={badge("#dbeafe","#1d4ed8")}>Sent</span>;
    if (inv.status === "overdue") return <span style={badge("#fee2e2","#dc2626")}>Overdue</span>;
    return <span style={badge("#f3f4f6","#6b7280")}>Draft</span>;
  };

  function badge(bg: string, color: string): React.CSSProperties {
    return { background: bg, color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" as const };
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color: "#111" }}>

      {/* Top nav */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", display: "flex", alignItems: "center", gap: 0 }}>
        <div style={{ display: "flex", alignItems: "center", padding: "8px 0", marginRight: 32 }}>
          <Image src="/mactor-logo.png" alt="MacTor Construction" width={110} height={52} style={{ objectFit: "contain" }} />
        </div>
        {(["Invoices","Estimates"] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t === "Invoices" ? "invoice" : "estimate")}
            style={{ padding: "18px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              color: (t === "Invoices" ? typeFilter === "invoice" : typeFilter === "estimate") ? "#e63946" : "#64748b",
              borderBottom: (t === "Invoices" ? typeFilter === "invoice" : typeFilter === "estimate") ? "2px solid #e63946" : "2px solid transparent" }}>
            {t}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button onClick={() => router.push("/invoices/catalog")}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#7c3aed" }}>
            🗂️ Catálogo
          </button>
          <button onClick={() => router.push("/invoices/import")}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151" }}>
            📥 Importar
          </button>
          <button onClick={() => router.push("/invoices/new")}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#e63946", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            + {isEst ? "Nuevo estimado" : "Nueva factura"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
          {[
            { label: isEst ? "Total Estimated" : "Total Invoiced", value: total,       color: "#0f172a", icon: "📊" },
            { label: "Outstanding",    value: outstanding, color: "#d97706", icon: "⏳" },
            { label: "Paid",           value: paid,        color: "#16a34a", icon: "✅" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>{s.label}</p>
                  <p style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 800, color: s.color }}>
                    ${s.value.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#94a3b8" }}>CAD</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.04)", overflow: "hidden" }}>

          {/* Tab bar + search */}
          <div style={{ display: "flex", alignItems: "center", padding: "0 20px", borderBottom: "1px solid #e2e8f0", gap: 0 }}>
            {([["all", isEst ? "All Estimates" : "All Invoices"],["outstanding","Outstanding"],["paid","Paid"]] as [Tab,string][]).map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: "14px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  color: tab === t ? "#e63946" : "#64748b",
                  borderBottom: tab === t ? "2px solid #e63946" : "2px solid transparent" }}>
                {l}
                <span style={{ marginLeft: 6, background: tab === t ? "#fee2e2" : "#f1f5f9", color: tab === t ? "#e63946" : "#94a3b8",
                  borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>
                  {t === "all" ? scoped.length : t === "outstanding" ? scoped.filter(i=>i.status!=="paid").length : scoped.filter(i=>i.status==="paid").length}
                </span>
              </button>
            ))}
            <div style={{ marginLeft: "auto" }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by client name..."
                style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", width: 220, color: "#374151" }} />
            </div>
          </div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 130px 140px 40px", padding: "10px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            {[isEst ? "Estimate" : "Invoice","Client","Date","Balance Due",""].map((h,i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em",
                textAlign: i >= 3 ? "right" : "left" }}>{h}</span>
            ))}
          </div>

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
          ) : years.map(yr => (
            <div key={yr}>
              {/* Year header */}
              <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 130px 140px 40px", padding: "8px 20px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#374151" }}>{yr}</span>
                <span></span><span></span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "right" }}>
                  ${byYear[yr].reduce((s,i)=>s+i.total,0).toLocaleString("en-CA",{minimumFractionDigits:2})}
                </span>
                <span></span>
              </div>
              {byYear[yr].map((inv, i) => (
                <div key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)}
                  style={{ display: "grid", gridTemplateColumns: "130px 1fr 130px 140px 40px", padding: "14px 20px",
                    borderBottom: "1px solid #f1f5f9", cursor: "pointer", background: i%2===0 ? "#fff" : "#fafafa",
                    transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background="#f0f9ff")}
                  onMouseLeave={e => (e.currentTarget.style.background=i%2===0?"#fff":"#fafafa")}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#e63946" }}>{inv.invoiceNumber}</span>
                  <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 500 }}>{inv.clientName}</span>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{new Date(inv.invoiceDate).toLocaleDateString("en-CA",{month:"short",day:"numeric",year:"numeric"})}</span>
                  <div style={{ textAlign: "right" }}>
                    {inv.status === "paid"
                      ? <span style={{ ...badge("#dcfce7","#16a34a"), fontSize: 12 }}>$0.00 Paid</span>
                      : <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>${inv.total.toLocaleString("en-CA",{minimumFractionDigits:2})}</span>
                    }
                  </div>
                  <div style={{ textAlign: "right" }}>{statusBadge(inv)}</div>
                </div>
              ))}
            </div>
          ))}

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
