"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "../../components/AppHeader";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
function token() { return localStorage.getItem("mactor_token") || ""; }

const BG       = "#10131a";
const PANEL    = "#191e28";
const ROW_ALT  = "#1c212b";
const SOFT     = "#242b37";
const LINE     = "#323947";
const TEXT     = "#f3f6fc";
const MUTED    = "#aeb8ca";
const RED      = "#ff5964";
const RED_SOFT = "#321a1e";

interface UserRow { id: string; username: string; name: string | null; createdAt: string; }

const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".05em" };
const inp: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${LINE}`, fontSize: 13, outline: "none", boxSizing: "border-box", background: BG, color: TEXT };

export default function UsersPage() {
  const router = useRouter();
  const [users,   setUsers]   = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mob,     setMob]     = useState(false);

  const [showNew,  setShowNew]  = useState(false);
  const [newUser,  setNewUser]  = useState({ username: "", password: "", name: "" });
  const [creating, setCreating] = useState(false);
  const [error,    setError]    = useState("");

  const [pwFor,    setPwFor]    = useState<UserRow | null>(null);
  const [newPw,    setNewPw]    = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    const r = await fetch(`${API}/api/users`, { headers: { Authorization: `Bearer ${token()}` } });
    if (r.status === 401) { router.push("/invoices/login"); return; }
    setUsers(await r.json());
    setLoading(false);
  }

  async function createUser() {
    if (!newUser.username.trim() || !newUser.password) return;
    setCreating(true); setError("");
    try {
      const r = await fetch(`${API}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(newUser),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Error al crear usuario"); return; }
      setShowNew(false);
      setNewUser({ username: "", password: "", name: "" });
      load();
    } finally {
      setCreating(false);
    }
  }

  async function savePassword() {
    if (!pwFor || newPw.length < 6) return;
    setSavingPw(true);
    try {
      const r = await fetch(`${API}/api/users/${pwFor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ password: newPw }),
      });
      if (r.ok) { setPwFor(null); setNewPw(""); }
    } finally {
      setSavingPw(false);
    }
  }

  async function deleteUser(u: UserRow) {
    if (!confirm(`¿Eliminar al usuario "${u.username}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(u.id);
    try {
      const r = await fetch(`${API}/api/users/${u.id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { alert(data.error || "Error al eliminar"); return; }
      load();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: BG, fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: TEXT }}>

      <AppHeader active="settings" />
      <div style={{ background: PANEL, borderBottom: `1px solid ${LINE}`, padding: mob ? "0 10px" : "0 24px", display: "flex", alignItems: "center", gap: mob ? 8 : 16, overflow: "hidden" }}>
        <div style={{ flex: 1, minWidth: 0, padding: mob ? "10px 0" : "14px 0" }}>
          <h1 style={{ margin: 0, fontSize: mob ? 17 : 16, fontWeight: 700, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>👤 Usuarios</h1>
          {!mob && <p style={{ margin: 0, fontSize: 11, color: MUTED }}>{users.length} cuenta{users.length === 1 ? "" : "s"} con acceso al sistema</p>}
        </div>
        <button onClick={() => { setShowNew(true); setError(""); }}
          style={{ padding: mob ? "7px 12px" : "8px 16px", borderRadius: 8, border: "none", background: RED, color: "#fff", fontSize: mob ? 16 : 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
          + {mob ? "Nuevo" : "Nuevo usuario"}
        </button>
      </div>

      {/* New user modal */}
      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, width: "100%", maxWidth: 420, padding: mob ? 20 : 28, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>Nuevo Usuario</h2>
              <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: MUTED }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ ...lbl, display: "block", marginBottom: 4 }}>Nombre para mostrar</label>
                <input style={inp} value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Alejandra" />
              </div>
              <div>
                <label style={{ ...lbl, display: "block", marginBottom: 4 }}>Usuario *</label>
                <input style={inp} value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} placeholder="ej: alejandra" autoComplete="off" />
              </div>
              <div>
                <label style={{ ...lbl, display: "block", marginBottom: 4 }}>Contraseña * (mín. 6 caracteres)</label>
                <input style={inp} type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="••••••" autoComplete="new-password" />
              </div>
            </div>
            {error && <p style={{ color: RED, fontSize: 12, margin: "10px 0 0" }}>{error}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={createUser} disabled={creating || !newUser.username.trim() || newUser.password.length < 6}
                style={{ flex: 1, padding: "11px", background: RED, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: creating ? "not-allowed" : "pointer", opacity: creating ? 0.7 : 1 }}>
                {creating ? "Creando..." : "Crear usuario"}
              </button>
              <button onClick={() => setShowNew(false)}
                style={{ padding: "11px 18px", background: SOFT, border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer", color: MUTED }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change password modal */}
      {pwFor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => e.target === e.currentTarget && setPwFor(null)}>
          <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, width: "100%", maxWidth: 380, padding: mob ? 20 : 28, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>Cambiar contraseña</h2>
              <button onClick={() => setPwFor(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: MUTED }}>×</button>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: MUTED }}>Usuario: <strong style={{ color: TEXT }}>{pwFor.username}</strong></p>
            <label style={{ ...lbl, display: "block", marginBottom: 4 }}>Nueva contraseña * (mín. 6 caracteres)</label>
            <input style={inp} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••" autoComplete="new-password" />
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={savePassword} disabled={savingPw || newPw.length < 6}
                style={{ flex: 1, padding: "11px", background: RED, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: savingPw ? "not-allowed" : "pointer", opacity: savingPw ? 0.7 : 1 }}>
                {savingPw ? "Guardando..." : "Guardar"}
              </button>
              <button onClick={() => { setPwFor(null); setNewPw(""); }}
                style={{ padding: "11px 18px", background: SOFT, border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer", color: MUTED }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 800, margin: "0 auto", padding: mob ? "12px 10px" : "24px" }}>
        <div style={{ background: PANEL, borderRadius: 12, border: `1px solid ${LINE}`, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 90px" : "1fr 1fr 140px 100px", padding: mob ? "8px 12px" : "10px 20px", background: SOFT, borderBottom: `1px solid ${LINE}` }}>
            <span style={lbl}>Usuario</span>
            {!mob && <span style={lbl}>Nombre</span>}
            {!mob && <span style={lbl}>Creado</span>}
            <span style={{ ...lbl, textAlign: "right" }}></span>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: MUTED }}>Cargando usuarios...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <p style={{ fontSize: 32, margin: 0 }}>👤</p>
              <p style={{ color: MUTED, margin: "12px 0 0" }}>Sin usuarios todavía</p>
            </div>
          ) : users.map((u, i) => (
            <div key={u.id}
              style={{ display: "grid", gridTemplateColumns: mob ? "1fr 90px" : "1fr 1fr 140px 100px", padding: mob ? "10px 12px" : "12px 20px",
                borderBottom: i < users.length - 1 ? `1px solid ${LINE}` : "none",
                background: i % 2 === 0 ? PANEL : ROW_ALT, alignItems: "center" }}>
              <span style={{ fontSize: mob ? 16 : 13, fontWeight: 700, color: TEXT }}>{u.username}</span>
              {!mob && <span style={{ fontSize: 13, color: MUTED }}>{u.name || "—"}</span>}
              {!mob && <span style={{ fontSize: 12, color: MUTED }}>{new Date(u.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>}
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button onClick={() => { setPwFor(u); setNewPw(""); }} title="Cambiar contraseña"
                  style={{ background: SOFT, border: `1px solid ${LINE}`, borderRadius: 6, padding: "4px 7px", cursor: "pointer", fontSize: 12, color: TEXT }}>
                  🔑
                </button>
                <button onClick={() => deleteUser(u)} disabled={deletingId === u.id} title="Eliminar"
                  style={{ background: PANEL, border: `1px solid ${RED_SOFT}`, borderRadius: 6, padding: "4px 7px", cursor: deletingId === u.id ? "not-allowed" : "pointer", fontSize: 12, color: RED, opacity: deletingId === u.id ? 0.6 : 1 }}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
