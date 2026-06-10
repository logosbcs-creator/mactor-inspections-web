"use client";
import { use, useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const btn: React.CSSProperties = {
  touchAction: "manipulation", cursor: "pointer",
  userSelect: "none", WebkitUserSelect: "none",
  outline: "none", WebkitTapHighlightColor: "transparent", border: "none",
};

const input: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: "10px",
  background: "var(--navy-700)", border: "1px solid var(--border)",
  color: "var(--white)", fontSize: "0.95rem", outline: "none",
  touchAction: "manipulation", fontFamily: "monospace",
};

interface LineItem {
  defect_type: string;
  description: string;
  qty: number;
  unit_price: number;
  materials_cost: number;
  total: number;
  notes: string;
  // legacy fields from AI
  labor_hours?: number;
  labor_rate?: number;
}

function calcTotal(item: LineItem) {
  return Math.round(((item.qty * item.unit_price) + item.materials_cost) * 100) / 100;
}

function normalizeItems(rawItems: any[]): LineItem[] {
  return rawItems.map(item => {
    const laborTotal = (Number(item.labor_hours) || 0) * (Number(item.labor_rate) || 0);
    const materials = Number(item.materials_cost) || 0;
    // Convert old labor_hours/labor_rate format to qty/unit_price
    const qty = Number(item.qty) || Number(item.labor_hours) || 1;
    const unitPrice = Number(item.unit_price) || Number(item.labor_rate) || (laborTotal > 0 ? laborTotal / qty : Number(item.total) || 0);
    const mats = materials;
    const total = Math.round(((qty * unitPrice) + mats) * 100) / 100;
    return {
      defect_type: item.defect_type || "",
      description: item.description || "",
      qty,
      unit_price: unitPrice,
      materials_cost: mats,
      total,
      notes: item.notes || "",
    };
  });
}

export default function ApprovePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [lineNotes, setLineNotes] = useState<Record<string, string>>({});
  const [globalNote, setGlobalNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [activeEngine, setActiveEngine] = useState<"claude" | "openai">("claude");

  useEffect(() => {
    fetch(`${API_URL}/api/approve/${token}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        const raw = d.aiEstimate?.recommended?.line_items || d.aiEstimate?.claude?.line_items || d.aiEstimate?.openai?.line_items || [];
        setLineItems(normalizeItems(raw));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const switchEngine = (engine: "claude" | "openai") => {
    if (!data?.aiEstimate) return;
    const raw = data.aiEstimate[engine]?.line_items || [];
    setLineItems(normalizeItems(raw));
    setActiveEngine(engine);
  };

  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, [field]: typeof value === "string" ? parseFloat(value) || 0 : value };
      if (["qty", "unit_price", "materials_cost"].includes(field as string)) {
        updated.total = calcTotal(updated);
      }
      return updated;
    }));
  };

  const removeItem = (i: number) => {
    setLineItems(prev => prev.filter((_, idx) => idx !== i));
  };

  const addItem = () => {
    setLineItems(prev => [...prev, {
      defect_type: "Additional work",
      description: "",
      qty: 1,
      unit_price: 85,
      materials_cost: 0,
      total: 85,
      notes: "",
    }]);
  };

  const subtotal = lineItems.reduce((s, i) => s + i.total, 0);
  const hst = Math.round(subtotal * 0.13 * 100) / 100;
  const total = Math.round((subtotal + hst) * 100) / 100;

  const handleSend = async () => {
    if (!data || lineItems.length === 0) return;
    setSubmitting(true);
    try {
      const approvedEstimate = { line_items: lineItems, subtotal, hst, total, currency: "CAD", valid_days: 30, disclaimer: "This estimate is approximate and may vary after an in-person inspection." };
      await fetch(`${API_URL}/api/approve/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedEstimate, approvalNotes: globalNote, lineItemNotes: lineNotes }),
      });
      setSent(true);
    } catch {
      alert("Error sending. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--navy)", gap: 16 }}>
      <span className="pulse-dot" style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--blue)" }} />
      <p style={{ color: "var(--muted)", fontFamily: "monospace", fontSize: "12px" }}>Generating AI estimate…</p>
    </main>
  );

  if (sent) return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, background: "var(--navy)" }}>
      <span style={{ fontSize: "3rem", marginBottom: 16 }}>📧</span>
      <h1 style={{ color: "var(--green)", fontSize: "1.6rem", fontWeight: 800, marginBottom: 8 }}>Estimate sent</h1>
      <p style={{ color: "var(--muted)" }}>The client will receive the estimate by email shortly.</p>
    </main>
  );

  if (!data) return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--navy)" }}>
      <p style={{ color: "var(--red)" }}>Invalid or expired token.</p>
    </main>
  );

  const defects = data.aiSummary?.all_defects || [];

  return (
    <main style={{ minHeight: "100dvh", background: "var(--navy)", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: "var(--navy-800)", borderBottom: "1px solid var(--border)", padding: "16px 20px" }}>
        <p style={{ fontFamily: "monospace", fontSize: "10px", color: "var(--blue-light)", letterSpacing: "2px", margin: "0 0 4px" }}>APPROVAL PANEL · MACTOR</p>
        <h1 style={{ color: "var(--white)", fontSize: "1.15rem", fontWeight: 800, margin: "0 0 8px" }}>Review and Approve Estimate</h1>
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>👤 {data.clientName}</span>
          <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>📍 {data.address}</span>
          <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>🏠 {data.propertyType === "commercial" ? "Commercial" : "Residential"}</span>
        </div>
      </div>

      <div style={{ padding: "16px 20px" }}>

        {/* Photos strip */}
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--muted)", letterSpacing: "2px", marginBottom: "8px" }}>PHOTOS ({(data.photos || []).length})</p>
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px" }}>
            {(data.photos || []).map((url: string, i: number) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt={`photo ${i + 1}`}
                style={{ width: 80, height: 64, objectFit: "cover", borderRadius: 8, flexShrink: 0, border: "1px solid var(--border)" }} />
            ))}
          </div>
        </div>

        {/* Defects summary */}
        <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "14px", background: "var(--navy-800)", border: "1px solid var(--border)" }}>
          <p style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--muted)", letterSpacing: "2px", marginBottom: "8px" }}>DETECTED ISSUES ({defects.length})</p>
          {defects.map((d: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < defects.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--white)" }}>{d.defect_type}</span>
              <span className={`badge-${d.severity}`}>{d.severity?.toUpperCase()}</span>
            </div>
          ))}
        </div>

        {/* AI Engine toggle */}
        {data.aiEstimate?.openai?.line_items?.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <p style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--muted)", letterSpacing: "2px", marginBottom: "8px" }}>AI ENGINE</p>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["claude", "openai"] as const).map(engine => (
                <button key={engine} type="button" onClick={() => switchEngine(engine)}
                  style={{
                    ...btn, flex: 1, padding: "10px 8px", borderRadius: "12px",
                    background: activeEngine === engine ? "rgba(59,130,246,0.2)" : "var(--navy-800)",
                    border: activeEngine === engine ? "1.5px solid var(--blue)" : "1px solid var(--border)",
                    color: activeEngine === engine ? "var(--blue-light)" : "var(--muted)",
                    fontFamily: "monospace", fontSize: "12px", fontWeight: 700,
                  }}>
                  {engine === "claude" ? "🤖 Claude" : "🧠 GPT-4o"}
                  <span style={{ display: "block", fontSize: "11px", marginTop: "2px" }}>
                    ${(data.aiEstimate[engine]?.total || 0).toLocaleString()} CAD
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Line items — editable */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <p style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--muted)", letterSpacing: "2px", margin: 0 }}>ESTIMATE LINE ITEMS</p>
          <button type="button" onClick={addItem}
            style={{ ...btn, padding: "6px 14px", borderRadius: "10px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "var(--blue-light)", fontSize: "0.8rem", fontWeight: 700 }}>
            + Add item
          </button>
        </div>

        {lineItems.length === 0 && (
          <div style={{ padding: "20px", textAlign: "center", borderRadius: "14px", background: "var(--navy-800)", border: "1px solid var(--border)", marginBottom: "14px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>No items yet. Use &quot;+ Add item&quot; to create manually.</p>
          </div>
        )}

        {lineItems.map((item, i) => (
          <div key={i} style={{ marginBottom: "12px", borderRadius: "14px", background: "var(--navy-800)", border: "1px solid var(--border)", overflow: "hidden" }}>
            {/* Item header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px 8px" }}>
              <input
                value={item.defect_type}
                onChange={e => setLineItems(prev => prev.map((it, idx) => idx === i ? { ...it, defect_type: e.target.value } : it))}
                style={{ ...input, fontFamily: "inherit", fontWeight: 700, fontSize: "0.9rem", flex: 1, marginRight: "8px" }}
                placeholder="Work description"
              />
              <button type="button" onClick={() => removeItem(i)}
                style={{ ...btn, width: 32, height: 32, borderRadius: "8px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: "16px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                ×
              </button>
            </div>

            {/* Description */}
            <div style={{ padding: "0 14px 10px" }}>
              <input
                value={item.description}
                onChange={e => setLineItems(prev => prev.map((it, idx) => idx === i ? { ...it, description: e.target.value } : it))}
                style={{ ...input, fontSize: "0.82rem", color: "var(--muted)" }}
                placeholder="Work details…"
              />
            </div>

            {/* Price fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", padding: "0 14px 10px" }}>
              {[
                { label: "Qty", field: "qty" as keyof LineItem, value: item.qty },
                { label: "$/unit", field: "unit_price" as keyof LineItem, value: item.unit_price },
                { label: "Materials $", field: "materials_cost" as keyof LineItem, value: item.materials_cost },
              ].map(f => (
                <div key={f.field}>
                  <label style={{ fontFamily: "monospace", fontSize: "10px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>{f.label}</label>
                  <input
                    type="number"
                    value={f.value}
                    onChange={e => updateItem(i, f.field, e.target.value)}
                    style={{ ...input, padding: "8px 10px" }}
                  />
                </div>
              ))}
            </div>

            {/* Total row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px 10px", borderTop: "1px solid var(--border)", background: "rgba(59,130,246,0.05)" }}>
              <span style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--muted)" }}>
                {item.qty} × ${item.unit_price} + ${item.materials_cost} mat.
              </span>
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--blue-light)", fontSize: "1rem" }}>${item.total.toLocaleString()} CAD</span>
            </div>

            {/* Note */}
            <div style={{ padding: "0 14px 12px" }}>
              <input
                placeholder="Note (for AI training)…"
                value={lineNotes[item.defect_type] || ""}
                onChange={e => setLineNotes(prev => ({ ...prev, [item.defect_type]: e.target.value }))}
                style={{ ...input, fontSize: "0.78rem", color: "var(--muted)" }}
              />
            </div>
          </div>
        ))}

        {/* Totals */}
        <div style={{ padding: "14px 16px", borderRadius: "14px", background: "var(--navy-800)", border: "1px solid var(--border)", marginBottom: "14px" }}>
          {[
            { label: "Subtotal", value: subtotal },
            { label: "HST (13%)", value: hst },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{row.label}</span>
              <span style={{ fontFamily: "monospace", color: "var(--white)" }}>${row.value.toLocaleString()} CAD</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
            <span style={{ fontWeight: 700, color: "var(--white)", fontSize: "1.05rem" }}>TOTAL</span>
            <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--blue-light)", fontSize: "1.2rem" }}>${total.toLocaleString()} CAD</span>
          </div>
        </div>

        {/* Global note */}
        <div style={{ marginBottom: "18px" }}>
          <label style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--muted)", letterSpacing: "2px", display: "block", marginBottom: "6px" }}>GENERAL NOTE</label>
          <textarea
            value={globalNote}
            onChange={e => setGlobalNote(e.target.value)}
            placeholder="Notes for the client or internal use…"
            rows={2}
            style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "var(--navy-800)", border: "1px solid var(--border)", color: "var(--white)", fontSize: "0.9rem", outline: "none", resize: "none", touchAction: "manipulation" }}
          />
        </div>

        <button type="button" onClick={handleSend} disabled={submitting || lineItems.length === 0}
          style={{
            ...btn, width: "100%", padding: "18px", borderRadius: "18px",
            background: submitting || lineItems.length === 0 ? "var(--navy-700)" : "var(--green)",
            color: "white", fontWeight: 700, fontSize: "1.05rem", minHeight: "60px",
            opacity: submitting || lineItems.length === 0 ? 0.5 : 1,
          }}>
          {submitting ? "Sending…" : `📧 Send Estimate to Client · $${total.toLocaleString()} CAD`}
        </button>
      </div>
    </main>
  );
}
