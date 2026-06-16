"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

interface Invoice {
  id: string; invoiceNumber: string; type: string; status: string;
  clientName: string; clientEmail?: string;
  total: number; invoiceDate: string; sentAt?: string; paidAt?: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft:    "#6b7280",
  sent:     "#2563eb",
  paid:     "#16a34a",
  overdue:  "#dc2626",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador", sent: "Enviado", paid: "Pagado", overdue: "Vencido",
};

export default function InvoicesPage() {
  const router  = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter,   setFilter]   = useState<"all"|"invoice"|"estimate">("all");
  const [loading,  setLoading]  = useState(true);

  function token() { return localStorage.getItem("mactor_token") || ""; }

  useEffect(() => {
    const t = localStorage.getItem("mactor_token");
    if (!t) { router.push("/invoices/login"); return; }
    loadInvoices();
  }, [filter]);

  async function loadInvoices() {
    setLoading(true);
    const q = filter !== "all" ? `?type=${filter}` : "";
    const r = await fetch(`${API}/api/invoices${q}`, { headers: { Authorization: `Bearer ${token()}` } });
    if (r.status === 401) { router.push("/invoices/login"); return; }
    setInvoices(await r.json());
    setLoading(false);
  }

  const totalPending = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.total, 0);
  const totalPaid    = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0f1e", color: "#fff", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#111827", borderBottom: "1px solid #1f2937", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>🏗️</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>MACTOR · Facturación</h1>
            <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>inspector.fixmyproperty.ca</p>
          </div>
        </div>
        <button onClick={() => router.push("/invoices/new")}
          style={{ background: "#e63946", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + Nueva
        </button>
      </div>

      <div style={{ padding: "20px", maxWidth: 800, margin: "0 auto" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Por cobrar", value: `$${totalPending.toFixed(2)}`, color: "#e63946" },
            { label: "Cobrado",    value: `$${totalPaid.toFixed(2)}`,    color: "#16a34a" },
          ].map(s => (
            <div key={s.label} style={{ background: "#111827", borderRadius: 12, padding: "16px 18px" }}>
              <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".05em" }}>{s.label}</p>
              <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, color: s.color }}>CAD {s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["all","invoice","estimate"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: filter === f ? "#e63946" : "#1f2937", color: filter === f ? "#fff" : "#9ca3af" }}>
              {f === "all" ? "Todos" : f === "invoice" ? "Facturas" : "Estimados"}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <p style={{ color: "#9ca3af", textAlign: "center", padding: 40 }}>Cargando...</p>
        ) : invoices.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <p style={{ fontSize: 40, margin: 0 }}>📄</p>
            <p style={{ color: "#9ca3af", marginTop: 12 }}>No hay documentos aún</p>
            <button onClick={() => router.push("/invoices/new")}
              style={{ marginTop: 16, background: "#e63946", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Crear primera factura
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {invoices.map(inv => (
              <div key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)}
                style={{ background: "#111827", borderRadius: 12, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#e63946" }}>{inv.invoiceNumber}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: STATUS_COLORS[inv.status] + "22", color: STATUS_COLORS[inv.status] }}>
                      {STATUS_LABELS[inv.status] || inv.status}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.clientName}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>{new Date(inv.invoiceDate).toLocaleDateString("en-CA")}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: inv.status === "paid" ? "#16a34a" : "#fff" }}>
                    ${inv.total.toFixed(2)}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "#9ca3af" }}>CAD</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
