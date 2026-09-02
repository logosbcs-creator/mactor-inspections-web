"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

interface Job {
  id: string; invoiceNumber: string; type: string; status: string;
  clientName: string; clientEmail?: string; clientPhone?: string; clientAddress?: string;
  total: number; scheduledDate: string;
}

function token() { return localStorage.getItem("mactor_token") || ""; }

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador", sent: "Enviado", paid: "Pagado", overdue: "Vencido", approved: "Aprobado",
};

export default function SchedulePage() {
  const router = useRouter();
  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [mob,     setMob]     = useState(false);

  const [reminderJob,   setReminderJob]   = useState<Job|null>(null);
  const [remEmail,      setRemEmail]      = useState(true);
  const [remEmailAddr,  setRemEmailAddr]  = useState("");
  const [remSms,        setRemSms]        = useState(false);
  const [remPhone,      setRemPhone]      = useState("");
  const [reminding,     setReminding]     = useState(false);
  const [remMsg,        setRemMsg]        = useState("");

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
    const all: Job[] = await r.json();
    setJobs(all.filter(j => j.scheduledDate).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()));
    setLoading(false);
  }

  function openReminder(j: Job) {
    setReminderJob(j);
    setRemEmail(!!j.clientEmail);
    setRemEmailAddr(j.clientEmail || "");
    setRemSms(!j.clientEmail && !!j.clientPhone);
    setRemPhone(j.clientPhone || "");
    setRemMsg("");
  }

  async function sendReminder() {
    if (!reminderJob) return;
    setReminding(true); setRemMsg("");
    const r = await fetch(`${API}/api/invoices/${reminderJob.id}/remind`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        sendEmail: remEmail, email: remEmailAddr || undefined,
        sendSms: remSms, phone: remPhone || undefined,
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      if (d.emailError || d.smsError) {
        setRemMsg(`⚠️ ${[d.emailError && `Email: ${d.emailError}`, d.smsError && `SMS: ${d.smsError}`].filter(Boolean).join(" · ")}`);
      } else {
        setRemMsg("✅ Recordatorio enviado");
        setTimeout(() => setReminderJob(null), 1200);
      }
    } else {
      setRemMsg(`❌ ${d.error || "Error enviando recordatorio"}`);
    }
    setReminding(false);
  }

  const now          = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek     = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

  function bucketFor(d: Date) {
    if (d < startOfToday) return "Vencidas";
    if (d.toDateString() === now.toDateString()) return "Hoy";
    if (d < endOfWeek) return "Esta semana";
    return "Más adelante";
  }

  const buckets: Record<string, Job[]> = { Vencidas: [], Hoy: [], "Esta semana": [], "Más adelante": [] };
  jobs.forEach(j => buckets[bucketFor(new Date(j.scheduledDate))].push(j));
  const bucketOrder = ["Vencidas", "Hoy", "Esta semana", "Más adelante"];
  const bucketColors: Record<string, string> = { Vencidas: "#dc2626", Hoy: "#e63946", "Esta semana": "#0f172a", "Más adelante": "#64748b" };

  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color: "#111" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: mob ? "10px 12px" : "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.push("/invoices")} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
        {!mob && <Image src="/mactor-logo.png" alt="MacTor" width={63} height={44} onClick={() => router.push("/invoices")} style={{ objectFit: "contain", cursor: "pointer" }} />}
        <h1 style={{ margin: 0, fontSize: mob ? 19 : 17, fontWeight: 800, color: "#0f172a" }}>📅 Agenda</h1>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: mob ? "14px 10px" : "28px 24px" }}>
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Cargando...</div>
        ) : jobs.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <p style={{ fontSize: 36, margin: 0 }}>📅</p>
            <p style={{ color: "#94a3b8", marginTop: 12 }}>No hay trabajos programados</p>
            <p style={{ color: "#94a3b8", fontSize: 13 }}>Abre un estimado o factura y usa "Programar trabajo" para agendarlo aquí.</p>
          </div>
        ) : bucketOrder.filter(b => buckets[b].length > 0).map(b => (
          <div key={b} style={{ marginBottom: 24 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 800, color: bucketColors[b], textTransform: "uppercase", letterSpacing: ".05em" }}>
              {b} · {buckets[b].length}
            </p>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              {buckets[b].map((j, i) => (
                <div key={j.id} onClick={() => router.push(`/invoices/${j.id}`)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: mob ? "12px" : "14px 18px",
                    borderBottom: i < buckets[b].length - 1 ? "1px solid #f1f5f9" : "none", cursor: "pointer",
                    background: "#fff" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                  <div style={{ minWidth: mob ? 60 : 76, textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: mob ? 15 : 13, fontWeight: 800, color: "#0f172a" }}>
                      {new Date(j.scheduledDate).toLocaleDateString("es-CA", { month: "short", day: "numeric" })}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                      {new Date(j.scheduledDate).toLocaleTimeString("es-CA", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: mob ? 15 : 13, fontWeight: 700, color: "#e63946" }}>{j.invoiceNumber}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                        background: j.type === "estimate" ? "#fef2f2" : "#f0fdf4", color: j.type === "estimate" ? "#e63946" : "#16a34a" }}>
                        {j.type === "estimate" ? "Estimado" : "Factura"}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "#f1f5f9", color: "#64748b" }}>
                        {STATUS_LABELS[j.status] || j.status}
                      </span>
                    </div>
                    <p style={{ margin: "3px 0 0", fontSize: mob ? 15 : 13, color: "#0f172a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {j.clientName}
                    </p>
                    {(j.clientAddress || j.clientPhone) && (
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {[j.clientAddress, j.clientPhone].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: mob ? 15 : 13, fontWeight: 700, color: "#0f172a", flexShrink: 0 }}>
                    ${j.total.toLocaleString("en-CA", { minimumFractionDigits: 2 })}
                  </span>
                  <button onClick={e => { e.stopPropagation(); openReminder(j); }} title="Enviar recordatorio"
                    style={{ flexShrink: 0, background: "#e0f2fe", border: "none", borderRadius: 8, color: "#0369a1", padding: mob ? "7px 9px" : "7px 10px", cursor: "pointer", fontSize: mob ? 15 : 13 }}>
                    🔔
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Reminder modal — job details only, no totals/payment */}
      {reminderJob && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => e.target === e.currentTarget && !reminding && setReminderJob(null)}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 400, padding: mob ? 20 : 28, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>🔔 Recordatorio</h2>
              <button onClick={() => setReminderJob(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "#94a3b8" }}>
              {reminderJob.invoiceNumber} · {reminderJob.clientName} · {new Date(reminderJob.scheduledDate).toLocaleString("es-CA", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>

            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={remEmail} onChange={e => setRemEmail(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
              <span style={{ fontSize: 13, color: "#374151" }}>Enviar por email</span>
            </label>
            {remEmail && (
              <input type="email" value={remEmailAddr} onChange={e => setRemEmailAddr(e.target.value)}
                placeholder="cliente@ejemplo.com"
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, margin: "8px 0 14px" }} />
            )}

            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={remSms} onChange={e => setRemSms(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
              <span style={{ fontSize: 13, color: "#374151" }}>Enviar por SMS</span>
            </label>
            {remSms && (
              <input type="tel" value={remPhone} onChange={e => setRemPhone(e.target.value)}
                placeholder="416-000-0000"
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, margin: "8px 0 0" }} />
            )}

            {remMsg && <p style={{ margin: "14px 0 0", fontSize: 13, color: remMsg.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{remMsg}</p>}

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={sendReminder} disabled={reminding || (!remEmail && !remSms) || (remEmail && !remEmailAddr.trim()) || (remSms && !remPhone.trim())}
                style={{ flex: 1, padding: "11px", background: reminding ? "#94a3b8" : "#0369a1", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: (reminding || (!remEmail && !remSms)) ? "not-allowed" : "pointer" }}>
                {reminding ? "Enviando..." : "Enviar"}
              </button>
              <button onClick={() => setReminderJob(null)} disabled={reminding}
                style={{ padding: "11px 16px", background: "#f1f5f9", border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer", color: "#64748b" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
