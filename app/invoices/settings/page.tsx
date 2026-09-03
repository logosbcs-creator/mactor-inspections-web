"use client";
import { useRouter } from "next/navigation";
import AppHeader from "../../components/AppHeader";

const BG    = "#10131a";
const PANEL = "#191e28";
const LINE  = "#323947";
const TEXT  = "#f3f6fc";
const MUTED = "#aeb8ca";

const ITEMS = [
  { href: "/invoices/import", icon: "📥", label: "Importar historial", desc: "Sube facturas y estimados generados con ChatGPT" },
  { href: "/invoices/users",  icon: "👤", label: "Usuarios",           desc: "Cuentas con acceso al sistema" },
];

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100dvh", background: BG, fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: TEXT }}>
      <AppHeader active="settings" />

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "28px 24px" }}>
        <h1 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 700, color: TEXT }}>⚙️ Configuración</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ITEMS.map(item => (
            <button key={item.href} onClick={() => router.push(item.href)}
              style={{ display: "flex", alignItems: "center", gap: 16, textAlign: "left", padding: "18px 20px",
                background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, cursor: "pointer", width: "100%" }}>
              <span style={{ fontSize: 26 }}>{item.icon}</span>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: TEXT }}>{item.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: MUTED }}>{item.desc}</p>
              </div>
              <span style={{ marginLeft: "auto", color: MUTED, fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
