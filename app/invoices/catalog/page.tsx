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
  Masonry: "#dc2626", Drainage: "#0a0f1e", Landscaping: "#0a0f1e",
  Cleanup: "#0f172a", Foundation: "#0a0f1e", Coating: "#0a0f1e",
  Fencing: "#0f172a", Roofing: "#374151", "Windows & Doors": "#64748b",
  Concrete: "#6b7280", Flooring: "#64748b", Drywall: "#e63946",
  "Spray & Coating": "#0a0f1e", General: "#64748b",
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
  const [showNew,    setShowNew]    = useState(false);
  const [newSvc,     setNewSvc]     = useState({ name: "", price: "", unit: "lump sum", category: "General", description: "" });
  const [creating,   setCreating]   = useState(false);
  const [editingSvc, setEditingSvc] = useState(false);
  const [editSvcForm, setEditSvcForm] = useState({ name: "", category: "General", unit: "lump sum", lastPrice: "", description: "" });
  const [savingSvc,  setSavingSvc]  = useState(false);
  const [deletingSvc, setDeletingSvc] = useState(false);
  const [mob, setMob] = useState(false);

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

  function openEdit(item: ServiceItem) {
    setEditSvcForm({ name: item.name, category: item.category || "General", unit: item.unit || "lump sum", lastPrice: String(item.lastPrice), description: item.description || "" });
    setEditingSvc(true);
  }

  async function saveService() {
    if (!selected) return;
    setSavingSvc(true);
    const r = await fetch(`${API}/api/catalog/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ ...editSvcForm, lastPrice: Number(editSvcForm.lastPrice) }),
    });
    const updated = await r.json();
    setSavingSvc(false);
    setEditingSvc(false);
    setSelected(updated);
    load();
  }

  async function deleteService(item?: ServiceItem) {
    const target = item || selected;
    if (!target) return;
    if (!confirm(`¿Eliminar "${target.name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingSvc(true);
    await fetch(`${API}/api/catalog/${target.id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token()}` },
    });
    setDeletingSvc(false);
    if (selected?.id === target.id) setSelected(null);
    load();
  }

  const filtered = items.filter(s => {
    if (catFilter !== "all" && s.category !== catFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" };
  const tableCols = mob ? "1fr 80px 64px" : "1fr 100px 80px 80px 80px 60px 80px";

  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color: "#111" }}>

      {/* Nav */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: mob ? "0 10px" : "0 24px", display: "flex", alignItems: "center", gap: mob ? 8 : 16, flexWrap: "nowrap", overflow: "hidden" }}>
        <button onClick={() => router.push("/invoices")} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer", padding: mob ? "12px 0" : "16px 0", flexShrink: 0 }}>←</button>
        {!mob && <Image src="/mactor-logo.png" alt="MacTor" width={69} height={48} style={{ objectFit: "contain", flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: mob ? 15 : 16, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Catálogo de Servicios</h1>
          {!mob && <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{items.length} servicios</p>}
        </div>
        {!mob && (
          <button onClick={runBackfill} disabled={backfilling}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: backfilling ? "#f1f5f9" : "#fff", fontSize: 13, fontWeight: 600, cursor: backfilling ? "not-allowed" : "pointer", color: "#0a0f1e", opacity: backfilling ? 0.6 : 1, whiteSpace: "nowrap", flexShrink: 0 }}>
            {backfilling ? "Procesando..." : "🔄 Rellenar"}
          </button>
        )}
        <button onClick={() => setShowNew(true)}
          style={{ padding: mob ? "7px 12px" : "8px 16px", borderRadius: 8, border: "none", background: "#e63946", color: "#fff", fontSize: mob ? 14 : 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
          + {mob ? "Nuevo" : "Nuevo servicio"}
        </button>
      </div>

      {/* New service modal */}
      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480, padding: mob ? 20 : 28, boxShadow: "0 20px 60px rgba(0,0,0,.2)", maxHeight: "90dvh", overflowY: "auto" }}>
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

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: mob ? "12px 10px" : "24px" }}>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4, 1fr)", gap: mob ? 8 : 12, marginBottom: mob ? 14 : 24 }}>
          {[
            { label: "Servicios",    value: items.length,                    color: "#0f172a" },
            { label: "Categorías",   value: cats.length,                     color: "#0a0f1e" },
            { label: mob ? "Top" : "Más usado", value: items[0]?.name?.split(" ").slice(0,2).join(" ") || "—", color: "#e63946", isText: true },
            { label: "Precio prom.", value: items.length ? `$${(items.reduce((s,i)=>s+i.avgPrice,0)/items.length).toFixed(0)}` : "—", color: "#0a0f1e", isText: true },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 10, padding: mob ? "12px 14px" : "16px 20px", border: "1px solid #e2e8f0" }}>
              <p style={{ ...lbl, margin: "0 0 4px", fontSize: mob ? 12 : 11 }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: s.isText ? (mob ? 14 : 14) : (mob ? 18 : 22), fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Category pills on mobile — full-width horizontal scroll */}
        {mob && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", WebkitOverflowScrolling: "touch" as never, marginBottom: 12, paddingBottom: 2 }}>
            {[{ category: "all", count: items.length }, ...cats].map(c => (
              <button key={c.category} onClick={() => setCatFilter(c.category)}
                style={{ padding: "5px 12px", borderRadius: 20, border: "1px solid #e2e8f0", background: catFilter === c.category ? "#fef2f2" : "#fff",
                  color: catFilter === c.category ? "#e63946" : "#374151", fontSize: 12, fontWeight: catFilter === c.category ? 700 : 500,
                  whiteSpace: "nowrap", cursor: "pointer", flexShrink: 0,
                  display: "flex", alignItems: "center", gap: 5 }}>
                {c.category !== "all" && (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: CATEGORY_COLORS[c.category] || "#64748b", display: "inline-block", flexShrink: 0 }} />
                )}
                {c.category === "all" ? "Todos" : c.category}
                <span style={{ fontSize: 10, color: "#94a3b8" }}>{c.count}</span>
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "220px 1fr", gap: 16 }}>

          {/* Sidebar — categories (desktop only) */}
          {!mob && (
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
          )}

          {/* Main content */}
          <div>
            {/* Search */}
            <div style={{ marginBottom: 12 }}>
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
                <div style={{ display: "grid", gridTemplateColumns: tableCols, padding: mob ? "8px 12px" : "10px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <span style={{ ...lbl }}>Servicio</span>
                  <span style={{ ...lbl, textAlign: "right" }}>Precio</span>
                  {!mob && <span style={{ ...lbl, textAlign: "right" }}>Mín</span>}
                  {!mob && <span style={{ ...lbl, textAlign: "right" }}>Máx</span>}
                  {!mob && <span style={{ ...lbl, textAlign: "right" }}>Promedio</span>}
                  {!mob && <span style={{ ...lbl, textAlign: "right" }}>Usos</span>}
                  <span style={{ ...lbl, textAlign: "right" }}></span>
                </div>
                {filtered.map((item, i) => (
                  <div key={item.id}>
                    <div
                      style={{ display: "grid", gridTemplateColumns: tableCols, padding: mob ? "10px 12px" : "12px 20px",
                        borderBottom: "1px solid #f1f5f9",
                        background: selected?.id === item.id ? "#fef2f2" : i % 2 === 0 ? "#fff" : "#fafafa",
                        transition: "background 0.1s", alignItems: "center" }}
                      onMouseEnter={e => { if (selected?.id !== item.id) e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={e => { if (selected?.id !== item.id) e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa"; }}>
                      <div style={{ cursor: "pointer", minWidth: 0 }} onClick={() => setSelected(selected?.id === item.id ? null : item)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: CATEGORY_COLORS[item.category || ""] || "#64748b", flexShrink: 0 }} />
                          <span style={{ fontSize: mob ? 14 : 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                        </div>
                        {!mob && item.category && <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 16 }}>{item.category} {item.unit ? `· ${item.unit}` : ""}</span>}
                      </div>
                      <span style={{ fontSize: mob ? 14 : 13, fontWeight: 700, textAlign: "right", color: "#0f172a" }}>${item.lastPrice.toLocaleString("en-CA", { minimumFractionDigits: 0 })}</span>
                      {!mob && <span style={{ fontSize: 12, textAlign: "right", color: "#0a0f1e" }}>${item.minPrice.toLocaleString("en-CA", { minimumFractionDigits: 0 })}</span>}
                      {!mob && <span style={{ fontSize: 12, textAlign: "right", color: "#dc2626" }}>${item.maxPrice.toLocaleString("en-CA", { minimumFractionDigits: 0 })}</span>}
                      {!mob && <span style={{ fontSize: 12, textAlign: "right", color: "#0a0f1e", fontWeight: 600 }}>${item.avgPrice.toLocaleString("en-CA", { minimumFractionDigits: 0 })}</span>}
                      {!mob && <span style={{ fontSize: 12, textAlign: "right", color: "#64748b" }}>{item.useCount}×</span>}
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(item); openEdit(item); }}
                          title="Editar"
                          style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 7px", cursor: "pointer", fontSize: 12, color: "#0a0f1e" }}>
                          ✏️
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); deleteService(item); }}
                          title="Eliminar"
                          style={{ background: "#fff0f0", border: "1px solid #fecaca", borderRadius: 6, padding: "4px 7px", cursor: "pointer", fontSize: 12, color: "#dc2626" }}>
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Price history / edit panel — inline on mobile */}
                    {selected?.id === item.id && (
                      <div style={{ borderTop: "2px solid #e63946", background: "#fff9f9", padding: mob ? "14px 12px" : "20px 24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 8 }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#0f172a", wordBreak: "break-word" }}>{selected.name}</p>
                            {selected.description && !editingSvc && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>{selected.description}</p>}
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                            <button onClick={() => editingSvc ? setEditingSvc(false) : openEdit(selected)}
                              title="Editar"
                              style={{ background: editingSvc ? "#f1f5f9" : "none", border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 14, color: "#0a0f1e" }}>
                              ✏️
                            </button>
                            <button onClick={() => deleteService()} disabled={deletingSvc}
                              title="Eliminar"
                              style={{ background: "none", border: "1px solid #fee2e2", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 14, color: "#dc2626" }}>
                              🗑️
                            </button>
                            <button onClick={() => { setSelected(null); setEditingSvc(false); }}
                              style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8", marginLeft: 2 }}>×</button>
                          </div>
                        </div>

                        {editingSvc ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {[
                              { label: "Nombre",      key: "name",        type: "text",   placeholder: "Nombre del servicio" },
                              { label: "Precio ($)",  key: "lastPrice",   type: "number", placeholder: "0.00" },
                              { label: "Descripción", key: "description", type: "text",   placeholder: "Descripción opcional" },
                            ].map(f => (
                              <div key={f.key} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <span style={{ ...lbl, minWidth: 72, margin: 0 }}>{f.label}</span>
                                <input type={f.type}
                                  style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#fff", color: "#0f172a", minWidth: 0 }}
                                  value={(editSvcForm as Record<string,string>)[f.key]}
                                  onChange={e => setEditSvcForm(p => ({ ...p, [f.key]: e.target.value }))}
                                  placeholder={f.placeholder} />
                              </div>
                            ))}
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <span style={{ ...lbl, minWidth: 72, margin: 0 }}>Categoría</span>
                              <select style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#fff", color: "#0f172a" }}
                                value={editSvcForm.category} onChange={e => setEditSvcForm(p => ({ ...p, category: e.target.value }))}>
                                {["General","Masonry","Drainage","Landscaping","Cleanup","Foundation","Coating","Fencing","Roofing","Windows & Doors","Concrete","Flooring","Drywall","Spray & Coating","Eaves & Gutters","Insulation","Decking"].map(c => <option key={c}>{c}</option>)}
                              </select>
                            </div>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <span style={{ ...lbl, minWidth: 72, margin: 0 }}>Unidad</span>
                              <select style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", background: "#fff", color: "#0f172a" }}
                                value={editSvcForm.unit} onChange={e => setEditSvcForm(p => ({ ...p, unit: e.target.value }))}>
                                {["lump sum","sqft","lf","hr","unit","bag","load","each"].map(u => <option key={u}>{u}</option>)}
                              </select>
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                              <button onClick={saveService} disabled={savingSvc}
                                style={{ flex: 1, padding: "9px", background: "#0a0f1e", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                {savingSvc ? "Guardando..." : "Guardar cambios"}
                              </button>
                              <button onClick={() => setEditingSvc(false)}
                                style={{ padding: "9px 14px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p style={{ ...lbl, marginBottom: 8 }}>Historial de precios</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {[...selected.priceHistory].reverse().map((h, idx) => (
                                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fff", borderRadius: 8, border: "1px solid #fee2e2", flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{h.date}</span>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: "#e63946" }}>${Number(h.price).toLocaleString("en-CA", { minimumFractionDigits: 0 })}</span>
                                  <span style={{ fontSize: 12, color: "#374151" }}>{h.estimateNumber}</span>
                                  <span style={{ fontSize: 12, color: "#64748b" }}>— {h.clientName}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
