"use client";
import { use } from "react";
import Link from "next/link";

export default function StatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  void id;

  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center", background: "var(--navy)" }}>

      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(59,130,246,0.15)", border: "2px solid var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "24px" }}>
        ✅
      </div>

      <p style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--blue-light)", letterSpacing: "3px", marginBottom: "12px" }}>
        REPORTE ENVIADO
      </p>

      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--white)", margin: "0 0 12px", lineHeight: 1.2 }}>
        ¡Listo!
      </h1>

      <p style={{ color: "var(--muted)", fontSize: "1rem", maxWidth: "320px", lineHeight: 1.6, marginBottom: "32px" }}>
        Recibimos tu inspección. Nuestro equipo la revisará y te enviará el <strong style={{ color: "var(--white)" }}>estimado de costo por email</strong> en las próximas horas.
      </p>

      <div style={{ padding: "18px 20px", borderRadius: "16px", background: "var(--navy-800)", border: "1px solid var(--border)", marginBottom: "32px", width: "100%", maxWidth: "340px" }}>
        {[
          { icon: "📋", text: "Reporte guardado en nuestro sistema" },
          { icon: "📧", text: "Recibirás el estimado por email" },
          { icon: "✏️", text: "MacTor revisará los precios antes de enviarte" },
          { icon: "📞", text: "Si aceptas, te llamamos para agendar" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
            <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
            <span style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "left" }}>{item.text}</span>
          </div>
        ))}
      </div>

      <Link href="/" style={{ display: "inline-block", padding: "16px 32px", borderRadius: "16px", background: "var(--navy-800)", border: "1px solid var(--border)", color: "var(--white)", fontWeight: 600, textDecoration: "none", touchAction: "manipulation" }}>
        Nueva Inspección
      </Link>

      <p style={{ marginTop: "24px", fontFamily: "monospace", fontSize: "11px", color: "var(--muted)" }}>
        MacTor Maintenance · mactor.maintenance@gmail.com
      </p>
    </main>
  );
}
