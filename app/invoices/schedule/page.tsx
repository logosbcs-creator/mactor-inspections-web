"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppHeader from "../../components/AppHeader";
import { Bell, ClipboardList, Trash2, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const BG       = "#10131a";
const PANEL    = "#191e28";
const SOFT     = "#242b37";
const HOVER    = "#20262f";
const LINE     = "#323947";
const TEXT     = "#f3f6fc";
const MUTED    = "#aeb8ca";
const RED      = "#ff5964";
const RED_SOFT = "#321a1e";

interface Job {
  id: string; invoiceNumber: string; type: string; status: string;
  clientName: string; companyName?: string; clientEmail?: string; clientPhone?: string; clientAddress?: string;
  total: number; scheduledDate: string; lineItems?: { description?: string }[];
}

function shortDescription(j: Job): string {
  const desc = (j.lineItems || []).map(i => i.description).filter(Boolean).join(" · ");
  if (!desc) return "";
  return desc.length > 42 ? desc.slice(0, 42).trim() + "…" : desc;
}

function token() { return localStorage.getItem("mactor_token") || ""; }

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador", sent: "Enviado", paid: "Pagado", overdue: "Vencido", approved: "Aprobado",
};

const inputSt: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8,
  border: `1px solid ${LINE}`, background: BG, color: TEXT, fontSize: 13,
};
const labelSt: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700, color: MUTED,
  textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4,
};

function ScheduleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [mob,     setMob]     = useState(false);
  const [viewMode, setViewMode] = useState<"today"|"week">("week");

  const [reminderJob,   setReminderJob]   = useState<Job|null>(null);
  const [remEmail,      setRemEmail]      = useState(true);
  const [remEmailAddr,  setRemEmailAddr]  = useState("");
  const [remSms,        setRemSms]        = useState(false);
  const [remPhone,      setRemPhone]      = useState("");
  const [reminding,     setReminding]     = useState(false);
  const [remMsg,        setRemMsg]        = useState("");

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskId,          setTaskId]          = useState<string|null>(null);
  const [taskName,        setTaskName]        = useState("");
  const [taskCompany,     setTaskCompany]     = useState("");
  const [taskEmail,       setTaskEmail]       = useState("");
  const [taskPhone,       setTaskPhone]       = useState("");
  const [taskAddress,     setTaskAddress]     = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDate,        setTaskDate]        = useState("");
  const [taskSaving,      setTaskSaving]      = useState(false);
  const [taskLoading,     setTaskLoading]     = useState(false);
  const [taskConverting,  setTaskConverting]  = useState(false);
  const [taskMsg,         setTaskMsg]         = useState("");

  useEffect(() => {
    if (!localStorage.getItem("mactor_token")) { router.push("/invoices/login"); return; }
    load();
    const check = () => setMob(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (searchParams.get("newTask") === "1") {
      openNewTask();
      router.replace("/invoices/schedule");
    }
  }, [searchParams]);

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

  function openNewTask() {
    setTaskId(null);
    setTaskName(""); setTaskCompany(""); setTaskEmail(""); setTaskPhone(""); setTaskAddress(""); setTaskDescription(""); setTaskDate("");
    setTaskMsg("");
    setTaskModalOpen(true);
  }

  async function openEditTask(j: Job) {
    // Wipe stale state from any previous session first (e.g. a
    // half-filled "new task" form) and only let Guardar be clickable
    // once the real record has actually loaded — otherwise a fast
    // click while this fetch is still in flight could save leftover
    // data (including an empty date) over the real task.
    setTaskId(null);
    setTaskName(""); setTaskCompany(""); setTaskEmail(""); setTaskPhone(""); setTaskAddress(""); setTaskDescription(""); setTaskDate("");
    setTaskLoading(true);
    setTaskModalOpen(true);
    setTaskMsg("");
    const r = await fetch(`${API}/api/invoices/${j.id}`, { headers: { Authorization: `Bearer ${token()}` } });
    const d = await r.json();
    setTaskId(d.id);
    setTaskName(d.clientName || "");
    setTaskCompany(d.companyName || "");
    setTaskEmail(d.clientEmail || "");
    setTaskPhone(d.clientPhone || "");
    setTaskAddress(d.clientAddress || "");
    setTaskDescription((d.lineItems || [])[0]?.description || "");
    setTaskDate(d.scheduledDate ? d.scheduledDate.slice(0, 16) : "");
    setTaskLoading(false);
  }

  async function saveTask() {
    if (!taskName.trim() || !taskDate) { setTaskMsg("❌ Nombre y fecha son requeridos"); return; }
    setTaskSaving(true); setTaskMsg("");
    const payload = {
      type: "task",
      clientName: taskName, companyName: taskCompany, clientEmail: taskEmail, clientPhone: taskPhone, clientAddress: taskAddress,
      lineItems: taskDescription.trim() ? [{ description: taskDescription, rate: 0, qty: 1, amount: 0 }] : [],
      scheduledDate: taskDate,
    };
    const r = taskId
      ? await fetch(`${API}/api/invoices/${taskId}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(payload) })
      : await fetch(`${API}/api/invoices`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(payload) });
    if (r.ok) {
      setTaskModalOpen(false);
      load();
    } else {
      const d = await r.json().catch(() => ({}));
      setTaskMsg(`❌ ${d.error || "Error guardando"}`);
    }
    setTaskSaving(false);
  }

  async function deleteTask() {
    if (!taskId) return;
    if (!confirm("¿Eliminar esta tarea?")) return;
    setTaskSaving(true);
    await fetch(`${API}/api/invoices/${taskId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    setTaskModalOpen(false);
    setTaskSaving(false);
    load();
  }

  async function convertTask() {
    if (!taskId) return;
    setTaskConverting(true);
    const r = await fetch(`${API}/api/invoices/${taskId}/convert`, { method: "POST", headers: { Authorization: `Bearer ${token()}` } });
    if (r.ok) {
      const created = await r.json();
      // The task is now the estimate — delete the task so it doesn't sit
      // duplicated in the Agenda alongside the real document.
      await fetch(`${API}/api/invoices/${taskId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
      router.push(`/invoices/${created.id}`);
    } else {
      setTaskMsg("❌ Error convirtiendo");
    }
    setTaskConverting(false);
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
  const bucketOrder = viewMode === "today" ? ["Vencidas", "Hoy"] : ["Vencidas", "Hoy", "Esta semana", "Más adelante"];
  const bucketColors: Record<string, string> = { Vencidas: RED, Hoy: RED, "Esta semana": TEXT, "Más adelante": MUTED };

  const hour = now.getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const dateStr = now.toLocaleDateString("es-CA", { weekday: "long", day: "numeric", month: "long" });
  const dateStrCap = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  const todayCount = buckets["Hoy"].length;

  return (
    <div style={{ minHeight: "100dvh", background: BG, fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: TEXT }}>
      <AppHeader active="agenda" />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: mob ? "14px 10px" : "28px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: "0 0 4px", fontSize: mob ? 19 : 20, fontWeight: 700, color: TEXT }}>{greeting}, Julio</h1>
            <p style={{ margin: 0, fontSize: 13, color: MUTED }}>
              {dateStrCap} · {todayCount} actividad{todayCount === 1 ? "" : "es"} programada{todayCount === 1 ? "" : "s"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {(["today","week"] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${LINE}`, cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                  background: viewMode === v ? RED_SOFT : "none",
                  color: viewMode === v ? RED : MUTED }}>
                {v === "today" ? "Hoy" : "Semana"}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: MUTED, fontSize: 14 }}>Cargando...</div>
        ) : jobs.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <p style={{ fontSize: 36, margin: 0 }}>📅</p>
            <p style={{ color: MUTED, marginTop: 12 }}>No hay trabajos programados</p>
            <p style={{ color: MUTED, fontSize: 13 }}>Abre un estimado o factura y usa "Programar trabajo" para agendarlo aquí.</p>
          </div>
        ) : bucketOrder.filter(b => buckets[b].length > 0).length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <p style={{ fontSize: 36, margin: 0 }}>✅</p>
            <p style={{ color: MUTED, marginTop: 12 }}>Nada pendiente para hoy</p>
          </div>
        ) : bucketOrder.filter(b => buckets[b].length > 0).map(b => (
          <div key={b} style={{ marginBottom: 24 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: bucketColors[b], textTransform: "uppercase", letterSpacing: ".05em" }}>
              {b} · {buckets[b].length}
            </p>
            <div style={{ background: PANEL, borderRadius: 12, border: `1px solid ${LINE}`, overflow: "hidden" }}>
              {buckets[b].map((j, i) => {
                const d = new Date(j.scheduledDate);
                const TYPE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
                  task:     { bg: SOFT,     color: MUTED, label: "Tarea" },
                  estimate: { bg: RED_SOFT, color: RED,   label: "Estimado" },
                  invoice:  { bg: SOFT,     color: TEXT,  label: "Factura" },
                };
                const ts = TYPE_STYLE[j.type] || TYPE_STYLE.invoice;
                return (
                <div key={j.id} onClick={() => j.type === "task" ? openEditTask(j) : router.push(`/invoices/${j.id}`)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: mob ? "12px" : "14px 18px",
                    borderBottom: i < buckets[b].length - 1 ? `1px solid ${LINE}` : "none", cursor: "pointer",
                    background: PANEL }}
                  onMouseEnter={e => (e.currentTarget.style.background = HOVER)}
                  onMouseLeave={e => (e.currentTarget.style.background = PANEL)}>
                  <div style={{ minWidth: mob ? 54 : 60, flexShrink: 0, textAlign: "center", background: BG, border: `1px solid ${LINE}`, borderRadius: 10, padding: "7px 4px" }}>
                    <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".04em" }}>
                      {d.toLocaleDateString("es-CA", { weekday: "short" })}
                    </p>
                    <p style={{ margin: "2px 0", fontSize: mob ? 14 : 13, fontWeight: 700, color: TEXT, lineHeight: 1 }}>
                      {d.toLocaleDateString("es-CA", { month: "short", day: "numeric" })}
                    </p>
                    <p style={{ margin: 0, fontSize: 10, color: MUTED, fontWeight: 700 }}>
                      {d.toLocaleTimeString("es-CA", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: mob ? 16 : 14, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {j.clientName}
                    </p>
                    {j.companyName && (
                      <p style={{ margin: "1px 0 0", fontSize: 12, color: MUTED, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {j.companyName}
                      </p>
                    )}
                    {shortDescription(j) && (
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {shortDescription(j)}
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: MUTED }}>{j.invoiceNumber}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 20, background: ts.bg, color: ts.color }}>
                        {ts.label}
                      </span>
                      {j.type !== "task" && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: SOFT, color: MUTED }}>
                          {STATUS_LABELS[j.status] || j.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); openReminder(j); }} title="Enviar recordatorio"
                    style={{ flexShrink: 0, background: SOFT, border: "none", borderRadius: 8, color: TEXT, padding: mob ? "9px" : "8px", cursor: "pointer", display: "flex" }}>
                    <Bell size={mob ? 16 : 15} />
                  </button>
                </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Reminder modal — job details only, no totals/payment */}
      {reminderJob && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => e.target === e.currentTarget && !reminding && setReminderJob(null)}>
          <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, width: "100%", maxWidth: 400, padding: mob ? 20 : 28, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: TEXT, display: "flex", alignItems: "center", gap: 8 }}><Bell size={16} /> Recordatorio</h2>
              <button onClick={() => setReminderJob(null)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}><X size={20} /></button>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: MUTED }}>
              {reminderJob.invoiceNumber} · {reminderJob.clientName} · {new Date(reminderJob.scheduledDate).toLocaleString("es-CA", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>

            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={remEmail} onChange={e => setRemEmail(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
              <span style={{ fontSize: 13, color: TEXT }}>Enviar por email</span>
            </label>
            {remEmail && (
              <input type="email" value={remEmailAddr} onChange={e => setRemEmailAddr(e.target.value)}
                placeholder="cliente@ejemplo.com"
                style={{ ...inputSt, margin: "8px 0 14px" }} />
            )}

            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={remSms} onChange={e => setRemSms(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
              <span style={{ fontSize: 13, color: TEXT }}>Enviar por SMS</span>
            </label>
            {remSms && (
              <input type="tel" value={remPhone} onChange={e => setRemPhone(e.target.value)}
                placeholder="416-000-0000"
                style={{ ...inputSt, margin: "8px 0 0" }} />
            )}

            {remMsg && <p style={{ margin: "14px 0 0", fontSize: 13, color: remMsg.startsWith("✅") ? TEXT : RED }}>{remMsg}</p>}

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={sendReminder} disabled={reminding || (!remEmail && !remSms) || (remEmail && !remEmailAddr.trim()) || (remSms && !remPhone.trim())}
                style={{ flex: 1, padding: "11px", background: reminding ? MUTED : RED, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: (reminding || (!remEmail && !remSms)) ? "not-allowed" : "pointer" }}>
                {reminding ? "Enviando..." : "Enviar"}
              </button>
              <button onClick={() => setReminderJob(null)} disabled={reminding}
                style={{ padding: "11px 16px", background: SOFT, border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer", color: MUTED }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/edit task — minimal agenda entry, no pricing */}
      {taskModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => e.target === e.currentTarget && !taskSaving && setTaskModalOpen(false)}>
          <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, width: "100%", maxWidth: 420, padding: mob ? 20 : 28, boxShadow: "0 20px 60px rgba(0,0,0,.5)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: TEXT }}>{taskId ? "Editar tarea" : "+ Nueva tarea"}</h2>
              <button onClick={() => setTaskModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}><X size={20} /></button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>Nombre *</label>
              <input type="text" value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="Nombre del cliente" style={inputSt} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>Empresa</label>
              <input type="text" value={taskCompany} onChange={e => setTaskCompany(e.target.value)} placeholder="Nombre de la empresa (opcional)" style={inputSt} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>Email</label>
              <input type="email" value={taskEmail} onChange={e => setTaskEmail(e.target.value)} placeholder="email@ejemplo.com" style={inputSt} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>Teléfono</label>
              <input type="tel" value={taskPhone} onChange={e => setTaskPhone(e.target.value)} placeholder="416-000-0000" style={inputSt} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>Dirección</label>
              <input type="text" value={taskAddress} onChange={e => setTaskAddress(e.target.value)} placeholder="123 Main St, Toronto ON" style={inputSt} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelSt}>Descripción del trabajo</label>
              <textarea value={taskDescription} onChange={e => setTaskDescription(e.target.value)} rows={3}
                placeholder="Qué se va a hacer..."
                style={{ ...inputSt, resize: "vertical" }} />
            </div>

            <div style={{ marginBottom: 4 }}>
              <label style={labelSt}>Fecha y hora *</label>
              <input type="datetime-local" value={taskDate} onChange={e => setTaskDate(e.target.value)} style={inputSt} />
            </div>

            {taskLoading && <p style={{ margin: "12px 0 0", fontSize: 13, color: MUTED }}>Cargando...</p>}
            {taskMsg && <p style={{ margin: "12px 0 0", fontSize: 13, color: taskMsg.startsWith("❌") ? RED : MUTED }}>{taskMsg}</p>}

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={saveTask} disabled={taskSaving || taskLoading}
                style={{ flex: 1, padding: "11px", background: (taskSaving || taskLoading) ? MUTED : RED, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: (taskSaving || taskLoading) ? "not-allowed" : "pointer" }}>
                {taskSaving ? "Guardando..." : "Guardar"}
              </button>
              <button onClick={() => setTaskModalOpen(false)} disabled={taskSaving}
                style={{ padding: "11px 16px", background: SOFT, border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer", color: MUTED }}>
                Cancelar
              </button>
            </div>

            {taskId && !taskLoading && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={convertTask} disabled={taskConverting || taskSaving}
                  style={{ flex: 1, padding: "10px", background: SOFT, border: `1px solid ${LINE}`, borderRadius: 10, fontSize: 13, fontWeight: 700, color: TEXT, cursor: taskConverting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {taskConverting ? "Convirtiendo..." : <><ClipboardList size={15} /> Convertir a Estimado</>}
                </button>
                <button onClick={deleteTask} disabled={taskSaving}
                  style={{ padding: "10px 14px", background: PANEL, border: `1px solid ${RED_SOFT}`, borderRadius: 10, cursor: "pointer", color: RED, display: "flex", alignItems: "center" }}>
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={null}>
      <ScheduleContent />
    </Suspense>
  );
}
