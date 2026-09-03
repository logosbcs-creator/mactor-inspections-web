"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "../../components/AppHeader";
import { BarChart3 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const BG       = "#10131a";
const PANEL    = "#191e28";
const LINE     = "#323947";
const TEXT     = "#f3f6fc";
const MUTED    = "#aeb8ca";

interface Invoice {
  id: string; invoiceNumber: string; type: string; status: string;
  clientName: string; total: number; invoiceDate: string;
}

function token() { return localStorage.getItem("mactor_token") || ""; }

export default function SummaryPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [mob,      setMob]      = useState(false);

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

  const invoicesOnly  = invoices.filter(i => i.type === "invoice");
  const estimatesOnly = invoices.filter(i => i.type === "estimate");

  const invTotal       = invoicesOnly.reduce((s,i) => s + i.total, 0);
  const invOutstanding = invoicesOnly.filter(i => i.status !== "paid").reduce((s,i) => s + i.total, 0);
  const invPaid        = invoicesOnly.filter(i => i.status === "paid").reduce((s,i) => s + i.total, 0);

  const estTotal = estimatesOnly.reduce((s,i) => s + i.total, 0);
  const estSent  = estimatesOnly.filter(i => i.status === "sent").reduce((s,i) => s + i.total, 0);

  const card = (label: string, value: number) => (
    <div key={label} style={{ background: PANEL, borderRadius: 12, padding: mob ? "14px 14px" : "20px 24px", border: `1px solid ${LINE}` }}>
      <p style={{ margin: 0, fontSize: mob ? 14 : 12, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</p>
      <p style={{ margin: "4px 0 0", fontSize: mob ? 21 : 24, fontWeight: 700, color: TEXT }}>
        ${value.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <p style={{ margin: "6px 0 0", fontSize: 11, color: MUTED }}>CAD</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: BG, fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: TEXT }}>
      <AppHeader active="summary" />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: mob ? "14px 10px" : "28px 24px" }}>
        <h1 style={{ margin: "0 0 16px", fontSize: mob ? 19 : 20, fontWeight: 700, color: TEXT, display: "flex", alignItems: "center", gap: 10 }}><BarChart3 size={20} /> Resumen financiero</h1>

        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: MUTED, fontSize: 14 }}>Cargando...</div>
        ) : (
          <>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".05em" }}>Facturas</p>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3, 1fr)", gap: mob ? 8 : 16, marginBottom: mob ? 20 : 28 }}>
              {card("Total facturado", invTotal)}
              {card("Por cobrar", invOutstanding)}
              {card("Cobrado", invPaid)}
            </div>

            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".05em" }}>Estimados</p>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(2, 1fr)", gap: mob ? 8 : 16 }}>
              {card("Total estimado", estTotal)}
              {card("Enviados", estSent)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
