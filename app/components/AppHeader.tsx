"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export type AppSection = "agenda" | "estimates" | "invoices" | "clients" | "catalog" | "summary" | "settings";

const BG        = "#10131a";
const PANEL     = "#191e28";
const LINE      = "#323947";
const TEXT      = "#f3f6fc";
const MUTED     = "#aeb8ca";
const RED       = "#ff5964";
const RED_SOFT  = "#321a1e";

const DRAWER_ITEMS: { section: AppSection; label: string; icon: string; href: string }[] = [
  { section: "agenda",    label: "Agenda",    icon: "📅",  href: "/invoices/schedule" },
  { section: "estimates", label: "Estimados", icon: "📋",  href: "/invoices?type=estimate" },
  { section: "invoices",  label: "Facturas",  icon: "🧾",  href: "/invoices?type=invoice" },
  { section: "clients",   label: "Clientes",  icon: "👥",  href: "/invoices/clients" },
  { section: "catalog",   label: "Catálogo",  icon: "🗂️", href: "/invoices/catalog" },
  { section: "summary",   label: "Resumen financiero", icon: "📊", href: "/invoices/summary" },
  { section: "settings",  label: "Configuración", icon: "⚙️", href: "/invoices/settings" },
];

const TABS: { section: AppSection; label: string; href: string }[] = [
  { section: "agenda",    label: "Agenda",    href: "/invoices/schedule" },
  { section: "estimates", label: "Estimados", href: "/invoices?type=estimate" },
  { section: "invoices",  label: "Facturas",  href: "/invoices?type=invoice" },
];

function token() { return localStorage.getItem("mactor_token") || ""; }

export default function AppHeader({ active }: { active: AppSection }) {
  const router = useRouter();
  const [mob, setMob] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const check = () => setMob(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function go(href: string) {
    setDrawerOpen(false);
    setCreateOpen(false);
    router.push(href);
  }

  function logout() {
    localStorage.removeItem("mactor_token");
    router.push("/invoices/login");
  }

  return (
    <>
      <div style={{ background: PANEL, borderBottom: `1px solid ${LINE}`, padding: mob ? "0 8px" : "0 20px", display: "flex", alignItems: "center", gap: mob ? 6 : 10, position: "relative", zIndex: 100 }}>
        <button onClick={() => setDrawerOpen(true)} aria-label="Abrir menú"
          style={{ background: "none", border: "none", color: TEXT, fontSize: 20, cursor: "pointer", padding: mob ? "12px 6px" : "14px 6px", flexShrink: 0 }}>
          ☰
        </button>
        <Image src="/mactor-logo-obscuro.png" alt="MacTor" width={mob ? 40 : 60} height={mob ? 27 : 40}
          onClick={() => go("/invoices/schedule")}
          style={{ objectFit: "contain", cursor: "pointer", flexShrink: 0, height: "auto" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto", WebkitOverflowScrolling: "touch" as never, flex: mob ? 1 : "0 0 auto" }}>
          {TABS.map(t => {
            const isActive = active === t.section;
            return (
              <button key={t.section} onClick={() => go(t.href)}
                style={{ padding: mob ? "7px 10px" : "9px 14px", border: "none", borderRadius: 8, cursor: "pointer",
                  fontSize: mob ? 13 : 13, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap",
                  background: isActive ? RED_SOFT : "transparent",
                  color: isActive ? RED : MUTED }}>
                {t.label}
              </button>
            );
          })}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: mob ? 6 : 8, position: "relative", flexShrink: 0 }}>
          <button onClick={() => setCreateOpen(v => !v)}
            style={{ padding: mob ? "7px 10px" : "8px 16px", borderRadius: 8, border: "none", background: RED, color: "#fff", fontSize: mob ? 14 : 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            + {mob ? "" : "Crear"}
          </button>
          {createOpen && (
            <>
              <div onClick={() => setCreateOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 149 }} />
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: 190, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,.4)", zIndex: 150, padding: 6 }}>
                <button onClick={() => go("/invoices/schedule?newTask=1")}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", border: "none", background: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: TEXT }}>
                  📌 Nueva tarea
                </button>
                <button onClick={() => go("/invoices/new?type=estimate")}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", border: "none", background: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: TEXT }}>
                  📋 Nuevo estimado
                </button>
                <button onClick={() => go("/invoices/new?type=invoice")}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", border: "none", background: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: TEXT }}>
                  🧾 Nueva factura
                </button>
              </div>
            </>
          )}
          {!mob && (
            <button onClick={logout}
              style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${LINE}`, background: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", color: MUTED }}>
              Salir
            </button>
          )}
        </div>
      </div>

      {drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 199 }} />
          <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: mob ? "78vw" : 280, maxWidth: 300, background: PANEL, zIndex: 200, boxShadow: "18px 0 50px rgba(0,0,0,.4)", display: "flex", flexDirection: "column", padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <Image src="/mactor-logo-obscuro.png" alt="MacTor" width={70} height={47} style={{ objectFit: "contain", height: "auto" }} />
              <button onClick={() => setDrawerOpen(false)} aria-label="Cerrar menú"
                style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: MUTED }}>
                ×
              </button>
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {DRAWER_ITEMS.map(item => {
                const isActive = active === item.section;
                return (
                  <button key={item.section} onClick={() => go(item.href)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", border: "none", borderRadius: 10, cursor: "pointer",
                      textAlign: "left", fontSize: 15, fontWeight: 600,
                      background: isActive ? RED_SOFT : "transparent", color: isActive ? RED : TEXT }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span> {item.label}
                  </button>
                );
              })}
            </nav>
            {mob && (
              <button onClick={logout}
                style={{ marginTop: "auto", padding: "12px", borderRadius: 10, border: `1px solid ${LINE}`, background: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", color: MUTED }}>
                Salir
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
