"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
function token() { return localStorage.getItem("mactor_token") || ""; }

interface UserRow { id: string; username: string; name: string | null; createdAt: string; }

const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" };
const inp: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fff", color: "#0f172a" };

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
    <div style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color: "#111" }}>

      {/* Nav */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: mob ? "0 10px" : "0 24px", display: "flex", alignItems: "center", gap: mob ? 8 : 16, overflow: "hidden" }}>
        <button onClick={() => router.push("/invoices")} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer", padding: mob ? "12px 0" : "16px 0", flexShrink: 0 }}>←</button>
        {!mob && <Image src="/mactor-logo.png" alt="MacTor" width={100} height={48} style={{ objectFit: "contain", flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: mob ? 13 : 16, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Usuarios</h1>
          {!mob && <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{users.length} cuenta{users.length === 1 ? "" : "s"} con acceso al sistema</p>}
        </div>
        <button onClick={() => { setShowNew(true); setError(""); }}
          style={{ padding: mob ? "7px 12px" : "8px 16px", borderRadius: 8, border: "none", background: "#e63946", color: "#fff", fontSize: mob ? 12 : 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
          + {mob ? "Nuevo" : "Nuevo usuario"}
        </button>
      </div>

      {/* New user modal */}
      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420, padding: mob ? 20 : 28, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Nuevo Usuario</h2>
              <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
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
            {error && <p style={{ color: "#dc2626", fontSize: 12, margin: "10px 0 0" }}>{error}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={createUser} disabled={creating || !newUser.username.trim() || newUser.password.length < 6}
                style={{ flex: 1, padding: "11px", background: "#e63946", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: creating ? "not-allowed" : "pointer", opacity: creating ? 0.7 : 1 }}>
                {creating ? "Creando..." : "Crear usuario"}
              </button>
              <button onClick={() => setShowNew(false)}
                style={{ padding: "11px 18px", background: "#f1f5f9", border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer", color: "#64748b" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change password modal */}
      {pwFor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => e.target === e.currentTarget && setPwFor(null)}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 380, padding: mob ? 20 : 28, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Cambiar contraseña</h2>
              <button onClick={() => setPwFor(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#64748b" }}>Usuario: <strong style={{ color: "#0f172a" }}>{pwFor.username}</strong></p>
            <label style={{ ...lbl, display: "block", marginBottom: 4 }}>Nueva contraseña * (mín. 6 caracteres)</label>
            <input style={inp} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••" autoComplete="new-password" />
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={savePassword} disabled={savingPw || newPw.length < 6}
                style={{ flex: 1, padding: "11px", background: "#0891b2", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: savingPw ? "not-allowed" : "pointer", opacity: savingPw ? 0.7 : 1 }}>
                {savingPw ? "Guardando..." : "Guardar"}
              </button>
              <button onClick={() => { setPwFor(null); setNewPw(""); }}
                style={{ padding: "11px 18px", background: "#f1f5f9", border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer", color: "#64748b" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 800, margin: "0 auto", padding: mob ? "12px 10px" : "24px" }}>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 90px" : "1fr 1fr 140px 100px", padding: mob ? "8px 12px" : "10px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <span style={lbl}>Usuario</span>
            {!mob && <span style={lbl}>Nombre</span>}
            {!mob && <span style={lbl}>Creado</span>}
            <span style={{ ...lbl, textAlign: "right" }}></span>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>Cargando usuarios...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <p style={{ fontSize: 32, margin: 0 }}>👤</p>
              <p style={{ color: "#94a3b8", margin: "12px 0 0" }}>Sin usuarios todavía</p>
            </div>
          ) : users.map((u, i) => (
            <div key={u.id}
              style={{ display: "grid", gridTemplateColumns: mob ? "1fr 90px" : "1fr 1fr 140px 100px", padding: mob ? "10px 12px" : "12px 20px",
                borderBottom: i < users.length - 1 ? "1px solid #f1f5f9" : "none",
                background: i % 2 === 0 ? "#fff" : "#fafafa", alignItems: "center" }}>
              <span style={{ fontSize: mob ? 12 : 13, fontWeight: 700, color: "#0f172a" }}>{u.username}</span>
              {!mob && <span style={{ fontSize: 13, color: "#374151" }}>{u.name || "—"}</span>}
              {!mob && <span style={{ fontSize: 12, color: "#94a3b8" }}>{new Date(u.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>}
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button onClick={() => { setPwFor(u); setNewPw(""); }} title="Cambiar contraseña"
                  style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 6, padding: "4px 7px", cursor: "pointer", fontSize: 12, color: "#0891b2" }}>
                  🔑
                </button>
                <button onClick={() => deleteUser(u)} disabled={deletingId === u.id} title="Eliminar"
                  style={{ background: "#fff0f0", border: "1px solid #fecaca", borderRadius: 6, padding: "4px 7px", cursor: deletingId === u.id ? "not-allowed" : "pointer", fontSize: 12, color: "#dc2626", opacity: deletingId === u.id ? 0.6 : 1 }}>
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
