"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "../../components/AppHeader";
import { Users, Pencil, Trash2, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
function token() { return localStorage.getItem("mactor_token") || ""; }

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

interface HistoryEntry { date: string; type: string; number: string; total: number; status: string; }
interface Client {
  id: string; name: string; email: string | null; phone: string | null;
  address: string | null; notes: string | null;
  invoiceCount: number; estimateCount: number;
  totalInvoiced: number; totalPaid: number; lastActivity: string | null;
  history: HistoryEntry[];
}

const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".05em" };
const inp: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${LINE}`, fontSize: 13, outline: "none", boxSizing: "border-box", background: BG, color: TEXT };

function statusBadge(s: string) {
  const map: Record<string, [string, string]> = {
    paid: [SOFT, TEXT], sent: [SOFT, TEXT],
    draft: [SOFT, MUTED], overdue: [RED_SOFT, RED],
  };
  const [bg, color] = map[s] || [SOFT, MUTED];
  return <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{s}</span>;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients,  setClients]  = useState<Client[]>([]);
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<Client | null>(null);
  const [editing,  setEditing]  = useState(false);
  const [notes,    setNotes]    = useState("");
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", address: "", notes: "" });
  const [creating, setCreating] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [deleting, setDeleting] = useState(false);
  const [mob, setMob] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

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
    const r = await fetch(`${API}/api/clients`, { headers: { Authorization: `Bearer ${token()}` } });
    if (r.status === 401) { router.push("/invoices/login"); return; }
    setClients(await r.json());
    setLoading(false);
  }

  async function saveNotes() {
    if (!selected) return;
    setSaving(true);
    await fetch(`${API}/api/clients/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
    setEditing(false);
    load();
  }

  async function createClient() {
    if (!newClient.name.trim()) return;
    setCreating(true);
    try {
      const r = await fetch(`${API}/api/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(newClient),
      });
      const data = await r.json();
      if (!r.ok) { alert(data.error || "Error al crear cliente"); return; }
      setShowNew(false);
      setNewClient({ name: "", email: "", phone: "", address: "", notes: "" });
      await load();
      select(data);
    } finally {
      setCreating(false);
    }
  }

  async function saveContact() {
    if (!selected) return;
    setSaving(true);
    const r = await fetch(`${API}/api/clients/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify(editForm),
    });
    const updated = await r.json();
    setSaving(false);
    setEditingContact(false);
    setSelected(updated);
    load();
  }

  async function deleteClient() {
    if (!selected) return;
    if (!confirm(`¿Eliminar a "${selected.name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    await fetch(`${API}/api/clients/${selected.id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token()}` },
    });
    setDeleting(false);
    setSelected(null);
    setShowDetail(false);
    load();
  }

  function select(c: Client) {
    setSelected(c); setNotes(c.notes || ""); setEditing(false); setEditingContact(false);
    setEditForm({ name: c.name, email: c.email || "", phone: c.phone || "", address: c.address || "" });
    if (mob) setShowDetail(true);
  }

  const filtered = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search)
  );

  const outstanding = clients.reduce((s, c) => s + (c.totalInvoiced - c.totalPaid), 0);
  const totalPaid   = clients.reduce((s, c) => s + c.totalPaid, 0);
  const tableCols   = mob ? "1fr 80px" : "1fr 110px 100px 90px 80px";

  // Mobile detail overlay
  const DetailPanel = () => !selected ? null : (
    <div style={{ background: PANEL, borderRadius: mob ? 0 : 12, border: mob ? "none" : `1px solid ${LINE}`, overflow: "hidden", height: "fit-content" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${LINE}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: TEXT }}>{selected.name}</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: MUTED }}>
            {selected.invoiceCount} facturas · {selected.estimateCount} estimados
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={() => setEditingContact(v => !v)}
            title="Editar"
            style={{ background: editingContact ? SOFT : "none", border: `1px solid ${LINE}`, borderRadius: 8, padding: "6px", cursor: "pointer", color: TEXT, display: "flex" }}>
            <Pencil size={14} />
          </button>
          <button onClick={deleteClient} disabled={deleting}
            title="Eliminar"
            style={{ background: "none", border: `1px solid ${RED_SOFT}`, borderRadius: 8, padding: "6px", cursor: "pointer", color: RED, display: "flex" }}>
            <Trash2 size={14} />
          </button>
          <button onClick={() => { setSelected(null); setEditingContact(false); setShowDetail(false); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, marginLeft: 2, display: "flex" }}><X size={18} /></button>
        </div>
      </div>

      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ ...lbl, margin: 0 }}>Contacto</p>
        </div>
        {editingContact ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Nombre", key: "name", placeholder: "Nombre del cliente" },
              { label: "Email",  key: "email", placeholder: "email@ejemplo.com" },
              { label: "Tel",    key: "phone", placeholder: "416-000-0000" },
              { label: "Dir",    key: "address", placeholder: "123 Main St" },
            ].map(f => (
              <div key={f.key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ ...lbl, minWidth: 36, margin: 0 }}>{f.label}</span>
                <input style={{ ...inp, flex: 1 }}
                  value={(editForm as Record<string,string>)[f.key]}
                  onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={saveContact} disabled={saving}
                style={{ flex: 1, padding: "8px", background: RED, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <button onClick={() => setEditingContact(false)}
                style={{ padding: "8px 12px", background: SOFT, border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", color: MUTED }}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {[
              { icon: "📧", val: selected.email },
              { icon: "📞", val: selected.phone },
              { icon: "📍", val: selected.address },
            ].map(r => r.val && (
              <div key={r.icon} style={{ display: "flex", gap: 8, fontSize: 13, color: TEXT }}>
                <span>{r.icon}</span><span>{r.val}</span>
              </div>
            ))}
            {!selected.email && !selected.phone && !selected.address && (
              <p style={{ margin: 0, fontSize: 12, color: MUTED }}>Sin datos de contacto — usa el ícono de editar para agregar</p>
            )}
          </div>
        )}

        {/* Totals */}
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Facturado",  value: selected.totalInvoiced },
            { label: "Cobrado",    value: selected.totalPaid },
            { label: "Por cobrar", value: selected.totalInvoiced - selected.totalPaid },
          ].map(s => (
            <div key={s.label} style={{ background: SOFT, borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ ...lbl, margin: "0 0 4px" }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>
                ${Number(s.value).toLocaleString("en-CA", { minimumFractionDigits: 0 })}
              </p>
            </div>
          ))}
        </div>

        {/* Notes */}
        <p style={{ ...lbl, marginBottom: 8 }}>Notas</p>
        {editing ? (
          <div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              style={{ ...inp, minHeight: 80, resize: "vertical", marginBottom: 8 } as React.CSSProperties}
              placeholder="Notas sobre este cliente..." />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveNotes} disabled={saving}
                style={{ flex: 1, padding: "8px", background: RED, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button onClick={() => setEditing(false)}
                style={{ padding: "8px 14px", background: SOFT, border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", color: MUTED }}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div onClick={() => setEditing(true)}
            style={{ background: SOFT, borderRadius: 8, padding: "10px 12px", cursor: "pointer", minHeight: 48, marginBottom: 16, border: `1px dashed ${LINE}` }}>
            <p style={{ margin: 0, fontSize: 12, color: selected.notes ? TEXT : MUTED }}>
              {selected.notes || "Clic para agregar notas..."}
            </p>
          </div>
        )}

        {/* History */}
        <p style={{ ...lbl, marginBottom: 8 }}>Historial ({selected.history.length})</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" }}>
          {[...selected.history].reverse().map((h, i) => (
            <div key={i}
              onClick={() => router.push(`/invoices/${encodeURIComponent(h.number)}`)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: SOFT, borderRadius: 8, border: `1px solid ${LINE}`, cursor: "pointer", transition: "background 0.1s" }}
              onMouseEnter={e => (e.currentTarget.style.background = HOVER)}
              onMouseLeave={e => (e.currentTarget.style.background = SOFT)}
            >
              <span style={{ fontSize: 14 }}>{h.type === "invoice" ? "📄" : "📋"}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: TEXT }}>{h.number}</p>
                <p style={{ margin: 0, fontSize: 11, color: MUTED }}>{h.date}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT }}>
                  ${Number(h.total).toLocaleString("en-CA", { minimumFractionDigits: 0 })}
                </p>
                {statusBadge(h.status)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: BG, fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: TEXT }}>

      {/* Mobile detail overlay */}
      {mob && showDetail && selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: BG, overflowY: "auto" }}>
          <DetailPanel />
        </div>
      )}

      <AppHeader active="clients" />
      <div style={{ background: PANEL, borderBottom: `1px solid ${LINE}`, padding: mob ? "0 10px" : "0 24px", display: "flex", alignItems: "center", gap: mob ? 8 : 16, overflow: "hidden" }}>
        <div style={{ flex: 1, minWidth: 0, padding: mob ? "10px 0" : "14px 0" }}>
          <h1 style={{ margin: 0, fontSize: mob ? 17 : 16, fontWeight: 700, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 8 }}><Users size={17} /> Catálogo de Clientes</h1>
          {!mob && <p style={{ margin: 0, fontSize: 11, color: MUTED }}>{clients.length} clientes · se alimenta automáticamente</p>}
        </div>
        <button onClick={() => setShowNew(true)}
          style={{ padding: mob ? "7px 12px" : "8px 16px", borderRadius: 8, border: "none", background: RED, color: "#fff", fontSize: mob ? 16 : 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
          + {mob ? "Nuevo" : "Nuevo cliente"}
        </button>
      </div>

      {/* New client modal */}
      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, width: "100%", maxWidth: 480, padding: mob ? 20 : 28, boxShadow: "0 20px 60px rgba(0,0,0,.5)", maxHeight: "90dvh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>Nuevo Cliente</h2>
              <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}><X size={20} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Nombre *", key: "name", placeholder: "Nombre del cliente" },
                { label: "Email",    key: "email", placeholder: "email@ejemplo.com" },
                { label: "Teléfono", key: "phone", placeholder: "416-000-0000" },
                { label: "Dirección", key: "address", placeholder: "123 Main St, Toronto ON" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ ...lbl, display: "block", marginBottom: 4 }}>{f.label}</label>
                  <input style={inp} value={(newClient as Record<string,string>)[f.key]}
                    onChange={e => setNewClient(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    onKeyDown={e => e.key === "Enter" && f.key === "name" && createClient()} />
                </div>
              ))}
              <div>
                <label style={{ ...lbl, display: "block", marginBottom: 4 }}>Notas</label>
                <textarea style={{ ...inp, minHeight: 60, resize: "vertical" } as React.CSSProperties}
                  value={newClient.notes}
                  onChange={e => setNewClient(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Notas opcionales..." />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={createClient} disabled={creating || !newClient.name.trim()}
                style={{ flex: 1, padding: "11px", background: RED, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: creating ? "not-allowed" : "pointer", opacity: creating ? 0.7 : 1 }}>
                {creating ? "Guardando..." : "Crear cliente"}
              </button>
              <button onClick={() => setShowNew(false)}
                style={{ padding: "11px 18px", background: SOFT, border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer", color: MUTED }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: mob ? "12px 10px" : "24px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(4, 1fr)", gap: mob ? 8 : 12, marginBottom: mob ? 14 : 24 }}>
          {[
            { label: "Clientes",        value: clients.length,                                fmt: "n" },
            { label: mob ? "Facturado" : "Total facturado",  value: clients.reduce((s,c)=>s+c.totalInvoiced,0), fmt: "$" },
            { label: mob ? "Cobrado" : "Total cobrado",      value: totalPaid,                fmt: "$" },
            { label: "Por cobrar",      value: outstanding,                                   fmt: "$" },
          ].map(s => (
            <div key={s.label} style={{ background: PANEL, borderRadius: 10, padding: mob ? "12px 14px" : "16px 20px", border: `1px solid ${LINE}` }}>
              <p style={{ ...lbl, margin: "0 0 4px", fontSize: mob ? 14 : 11 }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: mob ? 20 : 20, fontWeight: 700, color: TEXT }}>
                {s.fmt === "$" ? `$${Number(s.value).toLocaleString("en-CA", { minimumFractionDigits: 0 })}` : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Desktop: side-by-side list + detail */}
        {!mob && (
          <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 420px" : "1fr", gap: 16 }}>
            {/* Client list */}
            <div style={{ background: PANEL, borderRadius: 12, border: `1px solid ${LINE}`, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${LINE}` }}>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, email o teléfono..."
                  style={inp} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: tableCols, padding: "10px 20px", background: SOFT, borderBottom: `1px solid ${LINE}` }}>
                {["Cliente", "Última actividad", "Facturado", "Cobrado", "Docs"].map((h, i) => (
                  <span key={i} style={{ ...lbl, textAlign: i > 0 ? "right" : "left" }}>{h}</span>
                ))}
              </div>
              {loading ? (
                <div style={{ padding: 48, textAlign: "center", color: MUTED }}>Cargando clientes...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                  <p style={{ fontSize: 32, margin: 0 }}>👥</p>
                  <p style={{ color: MUTED, margin: "12px 0 0" }}>
                    {clients.length === 0 ? "Catálogo vacío — importa facturas o estimados para comenzar" : "No se encontraron clientes"}
                  </p>
                </div>
              ) : filtered.map((c, i) => (
                <div key={c.id} onClick={() => select(c)}
                  style={{ display: "grid", gridTemplateColumns: tableCols, padding: "14px 20px",
                    borderBottom: i < filtered.length - 1 ? `1px solid ${LINE}` : "none",
                    cursor: "pointer", background: selected?.id === c.id ? RED_SOFT : i % 2 === 0 ? PANEL : ROW_ALT,
                    transition: "background 0.1s" }}
                  onMouseEnter={e => { if (selected?.id !== c.id) e.currentTarget.style.background = HOVER; }}
                  onMouseLeave={e => { if (selected?.id !== c.id) e.currentTarget.style.background = i % 2 === 0 ? PANEL : ROW_ALT; }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT }}>{c.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: MUTED }}>
                      {[c.email, c.phone].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span style={{ fontSize: 12, color: MUTED, textAlign: "right" }}>
                    {c.lastActivity ? new Date(c.lastActivity).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, textAlign: "right" }}>
                    ${c.totalInvoiced.toLocaleString("en-CA", { minimumFractionDigits: 0 })}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, textAlign: "right" }}>
                    ${c.totalPaid.toLocaleString("en-CA", { minimumFractionDigits: 0 })}
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, color: MUTED }}>
                      {c.invoiceCount > 0 && `${c.invoiceCount} inv`}
                      {c.invoiceCount > 0 && c.estimateCount > 0 && " · "}
                      {c.estimateCount > 0 && `${c.estimateCount} est`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop detail panel */}
            {selected && <DetailPanel />}
          </div>
        )}

        {/* Mobile: list only (detail is fullscreen overlay) */}
        {mob && (
          <div style={{ background: PANEL, borderRadius: 12, border: `1px solid ${LINE}`, overflow: "hidden" }}>
            <div style={{ padding: "12px 12px", borderBottom: `1px solid ${LINE}` }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                style={inp} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: tableCols, padding: "8px 12px", background: SOFT, borderBottom: `1px solid ${LINE}` }}>
              <span style={{ ...lbl }}>Cliente</span>
              <span style={{ ...lbl, textAlign: "right" }}>Facturado</span>
            </div>
            {loading ? (
              <div style={{ padding: 48, textAlign: "center", color: MUTED }}>Cargando clientes...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <p style={{ fontSize: 32, margin: 0 }}>👥</p>
                <p style={{ color: MUTED, margin: "12px 0 0" }}>
                  {clients.length === 0 ? "Catálogo vacío" : "No se encontraron clientes"}
                </p>
              </div>
            ) : filtered.map((c, i) => (
              <div key={c.id} onClick={() => select(c)}
                style={{ display: "grid", gridTemplateColumns: tableCols, padding: "12px 12px",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${LINE}` : "none",
                  cursor: "pointer", background: i % 2 === 0 ? PANEL : ROW_ALT }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: MUTED }}>
                    {c.invoiceCount > 0 && `${c.invoiceCount} inv`}{c.invoiceCount > 0 && c.estimateCount > 0 && " · "}{c.estimateCount > 0 && `${c.estimateCount} est`}
                  </p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, textAlign: "right", alignSelf: "center" }}>
                  ${c.totalInvoiced.toLocaleString("en-CA", { minimumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
