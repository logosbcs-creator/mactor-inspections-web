"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
function token() { return localStorage.getItem("mactor_token") || ""; }

interface ServiceItem {
  id: string; name: string; category: string | null; description: string | null;
  unit: string | null; lastPrice: number; minPrice: number; maxPrice: number;
  avgPrice: number; useCount: number;
  priceHistory: { date: string; price: number; estimateNumber: string; clientName: string }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Masonry: "#dc2626", Drainage: "#2563eb", Landscaping: "#16a34a",
  Cleanup: "#d97706", Foundation: "#7c3aed", Coating: "#0891b2",
  Fencing: "#92400e", Roofing: "#374151", "Windows & Doors": "#b45309",
  Concrete: "#6b7280", Flooring: "#a16207", Drywall: "#9f1239",
  "Spray & Coating": "#0f766e", General: "#64748b",
};

export default function CatalogPage() {
  const router  = useRouter();
  const [items,    setItems]    = useState<ServiceItem[]>([]);
  const [cats,     setCats]     = useState<{ category: string; count: number }[]>([]);
  const [search,   setSearch]   = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [selected, setSelected] = useState<ServiceItem | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [backfilling, setBackfilling] = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [newSvc,   setNewSvc]   = useState({ name: "", price: "", unit: "lump sum", category: "General", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("mactor_token")) { router.push("/invoices/login"); return; }
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [sRes, cRes] = await Promise.all([
      fetch(`${API}/api/catalog`,            { headers: { Authorization: `Bearer ${token()}` } }),
      fetch(`${API}/api/catalog/categories`, { headers: { Authorization: `Bearer ${token()}` } }),
    ]);
    if (sRes.status === 401) { router.push("/invoices/login"); return; }
    setItems(await sRes.json());
    setCats(await cRes.json());
    setLoading(false);
  }

  async function runBackfill() {
    setBackfilling(true);
    try {
      const r = await fetch(`${API}/api/catalog/backfill`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await r.json();
      alert(`Catálogo actualizado: ${data.processed} servicios procesados, ${data.skipped} omitidos.`);
      load();
    } catch {
      alert("Error al rellenar el catálogo");
    } finally {
      setBackfilling(false);
    }
  }

  async function createService() {
    if (!newSvc.name.trim() || !newSvc.price) return;
    setCreating(true);
    try {
      const r = await fetch(`${API}/api/catalog`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ ...newSvc, price: Number(newSvc.price) }),
      });
      const data = await r.json();
      if (!r.ok) { alert(data.error || "Error al crear servicio"); return; }
      setShowNew(false);
      setNewSvc({ name: "", price: "", unit: "lump sum", category: "General", description: "" });
      await load();
      setSelected(data);
    } finally {
      setCreating(false);
    }
  }

  const filtered = items.filter(s => {
    if (catFilter !== "all" && s.category !== catFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" };

  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color: "#111" }}>

      {/* Nav */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => router.push("/invoices")} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer", padding: "16px 0" }}>←</button>
        <Image src="/mactor-logo.png" alt="MacTor" width={100} height={48} style={{ objectFit: "contain" }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Catálogo de Servicios</h1>
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{items.length} servicios · aprende de estimados históricos</p>
        </div>
        <button onClick={runBackfill} disabled={backfilling}
          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: backfilling ? "#f1f5f9" : "#fff", fontSize: 13, fontWeight: 600, cursor: backfilling ? "not-allowed" : "pointer", color: "#7c3aed", opacity: backfilling ? 0.6 : 1 }}>
          {backfilling ? "Procesando..." : "🔄 Rellenar catálogo"}
        </button>
        <button onClick={() => setShowNew(true)}
          style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#e63946", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + Nuevo servicio
        </button>
      </div>

      {/* New service modal */}
      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Nuevo Servicio</h2>
              <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ ...lbl, display: "block", marginBottom: 4 }}>Nombre *</label>
                <input style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" as const, color: "#0f172a" }}
                  value={newSvc.name} onChange={e => setNewSvc(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Masonry Cleaning & Sealing" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ ...lbl, display: "block", marginBottom: 4 }}>Precio ($) *</label>
                  <input type="number" min="0" step="0.01"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" as const, color: "#0f172a" }}
                    value={newSvc.price} onChange={e => setNewSvc(p => ({ ...p, price: e.target.value }))}
                    placeholder="0.00" />
                </div>
                <div>
                  <label style={{ ...lbl, display: "block", marginBottom: 4 }}>Unidad</label>
                  <select style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#fff", color: "#0f172a" }}
                    value={newSvc.unit} onChange={e => setNewSvc(p => ({ ...p, unit: e.target.value }))}>
                    {["lump sum","sqft","lf","hr","unit","bag","load","each"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ ...lbl, display: "block", marginBottom: 4 }}>Categoría</label>
                <select style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#fff", color: "#0f172a" }}
                  value={newSvc.category} onChange={e => setNewSvc(p => ({ ...p, category: e.target.value }))}>
                  {["General","Masonry","Drainage","Landscaping","Cleanup","Foundation","Coating","Fencing","Roofing","Windows & Doors","Concrete","Flooring","Drywall","Spray & Coating","Eaves & Gutters","Insulation","Decking"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ ...lbl, display: "block", marginBottom: 4 }}>Descripción</label>
                <textarea style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" as const, minHeight: 60, resize: "vertical", color: "#0f172a" }}
                  value={newSvc.description} onChange={e => setNewSvc(p => ({ ...p, description: e.target.value }))}
                  placeholder="Descripción opcional del servicio..." />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={createService} disabled={creating || !newSvc.name.trim() || !newSvc.price}
                style={{ flex: 1, padding: "11px", background: "#e63946", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: creating ? "not-allowed" : "pointer", opacity: creating ? 0.7 : 1 }}>
                {creating ? "Guardando..." : "Crear servicio"}
              </button>
              <button onClick={() => setShowNew(false)}
                style={{ padding: "11px 18px", background: "#f1f5f9", border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer", color: "#64748b" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px" }}>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Servicios",    value: items.length,                    color: "#0f172a" },
            { label: "Categorías",   value: cats.length,                     color: "#7c3aed" },
            { label: "Más usado",    value: items[0]?.name?.split(" ").slice(0,2).join(" ") || "—", color: "#e63946", isText: true },
            { label: "Precio prom.", value: items.length ? `$${(items.reduce((s,i)=>s+i.avgPrice,0)/items.length).toFixed(0)}` : "—", color: "#16a34a", isText: true },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", border: "1px solid #e2e8f0" }}>
              <p style={{ ...lbl, margin: "0 0 6px" }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: s.isText ? 14 : 22, fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>

          {/* Sidebar — categories */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px", height: "fit-content" }}>
            <p style={{ ...lbl, marginBottom: 12 }}>Categorías</p>
            {[{ category: "all", count: items.length }, ...cats].map(c => (
              <button key={c.category} onClick={() => setCatFilter(c.category)}
                style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2,
                  background: catFilter === c.category ? "#fef2f2" : "transparent",
                  color: catFilter === c.category ? "#e63946" : "#374151", fontSize: 13, fontWeight: catFilter === c.category ? 700 : 400,
                  display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {c.category !== "all" && (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: CATEGORY_COLORS[c.category] || "#64748b", display: "inline-block" }} />
                  )}
                  {c.category === "all" ? "Todos" : c.category}
                </span>
                <span style={{ fontSize: 11, background: "#f1f5f9", borderRadius: 10, padding: "1px 7px", color: "#64748b" }}>{c.count}</span>
              </button>
            ))}
          </div>

          {/* Main content */}
          <div>
            {/* Search */}
            <div style={{ marginBottom: 16 }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar servicio..."
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" }} />
            </div>

            {loading ? (
              <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Cargando catálogo...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <p style={{ fontSize: 32, margin: 0 }}>🗂️</p>
                <p style={{ color: "#94a3b8", margin: "12px 0 0" }}>
                  {items.length === 0 ? "Catálogo vacío — importa estimados con sub-ítems para comenzar" : "No se encontraron servicios"}
                </p>
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                {/* Table header */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 90px 90px 90px 70px", padding: "10px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Servicio", "Última vez", "Mín", "Máx", "Promedio", "Usos"].map((h, i) => (
                    <span key={i} style={{ ...lbl, textAlign: i > 0 ? "right" : "left" }}>{h}</span>
                  ))}
                </div>
                {filtered.map((item, i) => (
                  <div key={item.id} onClick={() => setSelected(selected?.id === item.id ? null : item)}
                    style={{ display: "grid", gridTemplateColumns: "1fr 110px 90px 90px 90px 70px", padding: "14px 20px",
                      borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none",
                      cursor: "pointer", background: selected?.id === item.id ? "#fef2f2" : i % 2 === 0 ? "#fff" : "#fafafa",
                      transition: "background 0.1s" }}
                    onMouseEnter={e => { if (selected?.id !== item.id) e.currentTarget.style.background = "#f0f9ff"; }}
                    onMouseLeave={e => { if (selected?.id !== item.id) e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa"; }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: CATEGORY_COLORS[item.category || ""] || "#64748b", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{item.name}</span>
                      </div>
                      {item.category && <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 16 }}>{item.category} {item.unit ? `· ${item.unit}` : ""}</span>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right", color: "#0f172a" }}>${item.lastPrice.toLocaleString("en-CA", { minimumFractionDigits: 0 })}</span>
                    <span style={{ fontSize: 12, textAlign: "right", color: "#16a34a" }}>${item.minPrice.toLocaleString("en-CA", { minimumFractionDigits: 0 })}</span>
                    <span style={{ fontSize: 12, textAlign: "right", color: "#dc2626" }}>${item.maxPrice.toLocaleString("en-CA", { minimumFractionDigits: 0 })}</span>
                    <span style={{ fontSize: 12, textAlign: "right", color: "#7c3aed", fontWeight: 600 }}>${item.avgPrice.toLocaleString("en-CA", { minimumFractionDigits: 0 })}</span>
                    <span style={{ fontSize: 12, textAlign: "right", color: "#64748b" }}>{item.useCount}×</span>
                  </div>
                ))}

                {/* Price history panel */}
                {selected && (
                  <div style={{ borderTop: "2px solid #e63946", background: "#fff9f9", padding: "20px 24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{selected.name}</p>
                        {selected.description && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b", maxWidth: 600 }}>{selected.description}</p>}
                      </div>
                      <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8" }}>×</button>
                    </div>
                    <p style={{ ...lbl, marginBottom: 8 }}>Historial de precios</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[...selected.priceHistory].reverse().map((h, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 12px", background: "#fff", borderRadius: 8, border: "1px solid #fee2e2" }}>
                          <span style={{ fontSize: 12, color: "#94a3b8", minWidth: 90 }}>{h.date}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#e63946", minWidth: 80 }}>${Number(h.price).toLocaleString("en-CA", { minimumFractionDigits: 0 })}</span>
                          <span style={{ fontSize: 12, color: "#374151" }}>{h.estimateNumber}</span>
                          <span style={{ fontSize: 12, color: "#64748b" }}>— {h.clientName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
