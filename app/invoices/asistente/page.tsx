"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "../../components/AppHeader";
import { Bot, Mail, CheckCircle2, AlertTriangle, Pause, Play, RefreshCw } from "lucide-react";

const API   = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
const BG    = "#10131a";
const PANEL = "#191e28";
const LINE  = "#323947";
const TEXT  = "#f3f6fc";
const MUTED = "#aeb8ca";
const GREEN = "#3ccf91";
const AMBER = "#f5b942";
const RED   = "#ff5964";

function token() { return localStorage.getItem("mactor_token") || ""; }

type Mailbox = { label: string; mailbox: string; address?: string; connected: boolean; status?: string; error?: string };
type Action = { id: string; shortCode: number; kind: string; summary: string; status: string; createdAt: string; result?: { error?: string } };
type Event = { id: string; createdAt: string; direction: string; channel: string; text: string };
type Status = {
  configured: boolean; whatsappFrom: boolean; templateConfigured: boolean; paused: boolean;
  lastInboundAt?: string; mailboxes: Mailbox[]; pending: Action[]; recentActions: Action[]; events: Event[];
};

const when = (d?: string) => d ? new Date(d).toLocaleString("es-CA", { dateStyle: "medium", timeStyle: "short" }) : "—";
const card = { background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: "16px 18px" } as const;
const btn = (bg: string) => ({ background: bg, color: "#0b0e14", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" });

export default function AssistantPage() {
  const router = useRouter();
  const [s, setS] = useState<Status | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const r = await fetch(`${API}/api/assistant/status`, { headers: { Authorization: `Bearer ${token()}` } });
    if (r.status === 401) { router.push("/invoices/login"); return; }
    if (!r.ok) { setErr((await r.json().catch(() => ({}))).error || `Error ${r.status}`); return; }
    setErr(""); setS(await r.json());
  }, [router]);

  useEffect(() => {
    if (!localStorage.getItem("mactor_token")) { router.push("/invoices/login"); return; }
    load();
  }, [load, router]);

  async function decide(code: number, decision: "confirm" | "cancel") {
    await fetch(`${API}/api/assistant/actions/${code}/${decision}`, { method: "POST", headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  async function setPaused(paused: boolean) {
    await fetch(`${API}/api/assistant/pause`, {
      method: "POST", headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" }, body: JSON.stringify({ paused }),
    });
    load();
  }

  function connect(m: Mailbox) {
    const provider = m.label === "zoho" ? "zoho" : "google";
    window.location.href = `${API}/api/assistant/oauth/${provider}/start?label=${m.label}&token=${encodeURIComponent(token())}`;
  }

  return (
    <div style={{ minHeight: "100dvh", background: BG, fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: TEXT }}>
      <AppHeader active="settings" />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}><Bot size={20} /> Asistente Mac</h1>
          <button onClick={load} aria-label="Actualizar" style={{ marginLeft: "auto", background: "none", border: "none", color: MUTED, cursor: "pointer" }}><RefreshCw size={18} /></button>
        </div>

        {err && <div style={{ ...card, borderColor: RED, color: RED }}>{err}</div>}
        {!s && !err && <p style={{ color: MUTED }}>Cargando…</p>}

        {s && <>
          <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <Pill ok={s.configured} label={s.configured ? "Agente configurado" : "Agente sin configurar"} />
            <Pill ok={s.whatsappFrom} label={s.whatsappFrom ? "WhatsApp listo" : "Falta el sender de WhatsApp"} />
            <Pill ok={s.templateConfigured} label={s.templateConfigured ? "Template 24h listo" : "Falta el template de WhatsApp"} />
            <span style={{ color: MUTED, fontSize: 13 }}>Último mensaje tuyo: {when(s.lastInboundAt)}</span>
            <button onClick={() => setPaused(!s.paused)} style={{ ...btn(s.paused ? GREEN : AMBER), marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
              {s.paused ? <><Play size={14} /> Reanudar</> : <><Pause size={14} /> Pausar</>}
            </button>
          </div>

          <Section title="Correos conectados">
            {s.mailboxes.map(m => (
              <div key={m.label} style={{ ...card, display: "flex", alignItems: "center", gap: 12 }}>
                <Mail size={20} color={m.connected ? (m.status === "error" ? AMBER : GREEN) : MUTED} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{m.mailbox}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: m.error ? AMBER : MUTED, overflowWrap: "anywhere" }}>
                    {m.connected ? (m.error ? `Error: ${m.error}` : m.address) : "No conectado"}
                  </p>
                </div>
                <button onClick={() => connect(m)} style={{ ...btn(m.connected ? LINE : GREEN), color: m.connected ? TEXT : "#0b0e14", marginLeft: "auto", flexShrink: 0 }}>
                  {m.connected ? "Reconectar" : "Conectar"}
                </button>
              </div>
            ))}
          </Section>

          <Section title={`Acciones pendientes (${s.pending.length})`}>
            {s.pending.length === 0 && <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Nada esperando tu OK.</p>}
            {s.pending.map(a => (
              <div key={a.id} style={card}>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: MUTED }}>#{a.shortCode} · {when(a.createdAt)}</p>
                <p style={{ margin: "0 0 12px", fontSize: 14, whiteSpace: "pre-wrap" }}>{a.summary}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => decide(a.shortCode, "confirm")} style={btn(GREEN)}>Ejecutar</button>
                  <button onClick={() => decide(a.shortCode, "cancel")} style={{ ...btn(LINE), color: TEXT }}>Cancelar</button>
                </div>
              </div>
            ))}
          </Section>

          <Section title="Acciones recientes">
            {s.recentActions.map(a => (
              <div key={a.id} style={{ ...card, display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px" }}>
                {a.status === "executed" ? <CheckCircle2 size={16} color={GREEN} /> : <AlertTriangle size={16} color={a.status === "failed" ? RED : MUTED} />}
                <div style={{ fontSize: 13, minWidth: 0 }}>
                  <span style={{ color: MUTED }}>#{a.shortCode} · {a.status} · {when(a.createdAt)}</span>
                  <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{a.summary.split("\n")[0]}</p>
                  {a.result?.error && <p style={{ margin: "4px 0 0", color: RED }}>{a.result.error}</p>}
                </div>
              </div>
            ))}
          </Section>

          <Section title="Actividad">
            <div style={{ ...card, padding: 0 }}>
              {s.events.map((e, i) => (
                <div key={e.id} style={{ padding: "10px 14px", borderTop: i ? `1px solid ${LINE}` : "none", fontSize: 13 }}>
                  <span style={{ color: e.direction === "in" ? GREEN : e.direction === "alert" ? AMBER : MUTED, fontWeight: 700 }}>
                    {{ in: "Tú", out: "Mac", alert: "Alerta", system: "Sistema" }[e.direction] || e.direction}
                  </span>
                  <span style={{ color: MUTED }}> · {when(e.createdAt)}</span>
                  <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{e.text.slice(0, 400)}</p>
                </div>
              ))}
            </div>
          </Section>
        </>}
      </div>
    </div>
  );
}

function Pill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: ok ? "#143428" : "#3a2f14", color: ok ? GREEN : AMBER }}>
      {label}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h2 style={{ margin: "8px 0 0", fontSize: 14, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</h2>
      {children}
    </section>
  );
}
