"use client";
import { useState, useRef, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { T, type Lang, getSavedLang, getLangFromUrl } from "../../i18n/translations";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const btn: React.CSSProperties = {
  touchAction: "manipulation", cursor: "pointer",
  userSelect: "none", WebkitUserSelect: "none",
  outline: "none", WebkitTapHighlightColor: "transparent", border: "none",
};

type Severity = "low" | "medium" | "high" | "critical";

interface Defect {
  defect_type: string;
  severity: Severity;
  location: string;
  danger_if_ignored: string;
  confidence: string;
}

interface PhotoEntry {
  url: string;
  preview: string;
  status: "uploading" | "analyzing" | "done" | "error";
  analysis: {
    area_detected: string;
    overall_condition: string;
    observed_defects: Defect[];
    priority_level: string;
  } | null;
}

const SEVERITY_LABELS: Record<Severity, Record<Lang, string>> = {
  critical: { en: "CRITICAL", es: "CRÍTICO", zh: "严重", hi: "गंभीर",   tl: "KRITIKAL" },
  high:     { en: "HIGH",     es: "ALTO",    zh: "高",   hi: "उच्च",    tl: "MATAAS"   },
  medium:   { en: "MEDIUM",   es: "MEDIO",   zh: "中",   hi: "मध्यम",   tl: "KATAMTAMAN" },
  low:      { en: "LOW",      es: "BAJO",    zh: "低",   hi: "कम",      tl: "MABABA"   },
};

export default function InspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    setLang(getLangFromUrl() || getSavedLang() || "en");
  }, []);

  const t = T[lang];
  const MAX_PHOTOS = 10;

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_PHOTOS - photos.length;
    const toProcess = Array.from(files).slice(0, remaining);
    if (toProcess.length === 0) return;

    for (const file of toProcess) {
      const preview = URL.createObjectURL(file);
      const entry: PhotoEntry = { url: "", preview, status: "uploading", analysis: null };
      setPhotos(prev => [...prev, entry]);

      try {
        let exifCoords = null;
        try {
          const exifr = (await import("exifr")).default;
          const gps = await exifr.gps(file);
          if (gps?.latitude) exifCoords = { lat: gps.latitude, lng: gps.longitude };
        } catch { /* no exif */ }

        const formData = new FormData();
        formData.append("photo", file);
        if (exifCoords) formData.append("exifCoords", JSON.stringify(exifCoords));

        setPhotos(prev => prev.map(p =>
          p.preview === preview ? { ...p, status: "analyzing" } : p
        ));

        const res = await fetch(`${API_URL}/api/inspection/${id}/photo`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        setPhotos(prev => prev.map(p =>
          p.preview === preview
            ? { ...p, url: data.photoUrl, analysis: data.analysis, status: "done" }
            : p
        ));
      } catch {
        setPhotos(prev => prev.map(p =>
          p.preview === preview ? { ...p, status: "error" } : p
        ));
      }
    }
  };

  const removePhoto = (preview: string) => setPhotos(prev => prev.filter(p => p.preview !== preview));

  const allDone = photos.length > 0 && photos.every(p => p.status === "done" || p.status === "error");
  const totalDefects = photos.flatMap(p => p.analysis?.observed_defects || []).length;
  const hasAnalysis = photos.some(p => p.analysis !== null);

  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--navy)" }}>
      {/* Header */}
      <header style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
        <button type="button" onClick={() => router.back()}
          style={{ ...btn, width: 40, height: 40, borderRadius: 12, background: "var(--navy-800)", border: "1px solid var(--border)", color: "var(--white)", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ←
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--gold)", letterSpacing: "2px", margin: 0 }}>{t.inspectionPhotos}</p>
          <h1 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--white)" }}>{t.documentDamage}</h1>
        </div>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: "13px", fontWeight: 700,
          color: photos.length >= MAX_PHOTOS ? "var(--amber)" : "var(--gold-light)",
          background: "var(--navy-800)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: 20 }}>
          {photos.length}/{MAX_PHOTOS}
        </div>
      </header>

      <div style={{ flex: 1, padding: "20px", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

        {/* Upload button */}
        {photos.length < MAX_PHOTOS && (
          <>
            <input ref={fileRef} type="file" accept="image/*" multiple capture="environment"
              onChange={e => handleFiles(e.target.files)} style={{ display: "none" }} />
            <button type="button" onClick={() => fileRef.current?.click()}
              style={{
                ...btn, width: "100%", padding: "28px 16px", marginBottom: "20px",
                borderRadius: "18px", background: "var(--navy-800)",
                border: "2px dashed rgba(245,158,11,0.3)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
              }}>
              <span style={{ fontSize: "2.5rem" }}>📷</span>
              <span style={{ color: "var(--gold-light)", fontWeight: 700, fontSize: "1rem" }}>
                {photos.length === 0 ? t.takePhotos : t.addMorePhotos}
              </span>
              <span style={{ color: "var(--muted)", fontSize: "0.78rem", fontFamily: "'Space Mono',monospace" }}>
                {t.maxPhotos(MAX_PHOTOS)}
              </span>
            </button>
          </>
        )}

        {/* Photo cards */}
        {photos.map((photo, i) => (
          <div key={photo.preview} style={{ marginBottom: "16px", borderRadius: "16px", overflow: "hidden", background: "var(--navy-800)", border: "1px solid var(--border)" }}>
            <div style={{ position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.preview} alt={`photo ${i + 1}`}
                style={{ width: "100%", maxHeight: "220px", objectFit: "cover", display: "block" }} />

              {(photo.status === "uploading" || photo.status === "analyzing") && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(10,15,30,0.75)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  {photo.status === "analyzing" && <div className="scan-line" style={{ top: 0 }} />}
                  <span className="pulse-dot" style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--gold)" }} />
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "12px", color: "var(--gold-light)" }}>
                    {photo.status === "uploading" ? t.uploadingPhoto : t.aiAnalyzing}
                  </span>
                </div>
              )}

              {photo.status === "done" && (
                <button type="button" onClick={() => removePhoto(photo.preview)}
                  style={{ ...btn, position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: "50%", background: "rgba(239,68,68,0.85)", color: "white", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ✕
                </button>
              )}

              <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(10,15,30,0.8)", border: "1px solid var(--border)", borderRadius: "8px", padding: "3px 10px", fontFamily: "'Space Mono',monospace", fontSize: "11px", color: "var(--muted)" }}>
                #{i + 1}
              </div>
            </div>

            <div style={{ padding: "14px" }}>
              {photo.status === "done" && photo.analysis ? (
                <div>
                  {photo.analysis.observed_defects.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {photo.analysis.observed_defects.map((d, j) => (
                        <div key={j} style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--white)" }}>{d.defect_type}</span>
                            <span className={`badge-${d.severity}`}>{SEVERITY_LABELS[d.severity]?.[lang] || d.severity.toUpperCase()}</span>
                          </div>
                          {d.danger_if_ignored && (
                            <p style={{ fontSize: "0.75rem", color: "var(--amber)", margin: 0 }}>
                              ⚠ {d.danger_if_ignored}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.8rem", color: "var(--green)", fontFamily: "'Space Mono',monospace", margin: 0 }}>
                      {t.noDamagePhoto}
                    </p>
                  )}
                </div>
              ) : photo.status === "error" ? (
                <p style={{ fontSize: "0.8rem", color: "var(--red)", margin: 0 }}>{t.errorPhoto}</p>
              ) : null}
            </div>
          </div>
        ))}

        {/* Analyzing bar */}
        {photos.length > 0 && !allDone && (
          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.85rem", color: "var(--gold-light)" }}>
              {t.analyzingBar(photos.filter(p => p.status === "done").length, photos.length)}
            </span>
          </div>
        )}

        {/* CTA */}
        {hasAnalysis && (
          <button type="button"
            onClick={() => router.push(`/report/${id}?lang=${lang}`)}
            style={{
              ...btn, width: "100%", padding: "18px", borderRadius: "18px",
              background: allDone ? "linear-gradient(135deg,#f59e0b,#d97706)" : "rgba(245,158,11,0.4)",
              color: allDone ? "#0a0f1e" : "var(--gold-light)",
              fontWeight: 800, fontSize: "1.05rem", minHeight: "60px", marginBottom: "8px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              boxShadow: allDone ? "0 4px 16px rgba(245,158,11,0.3)" : "none",
            }}>
            {allDone ? t.viewReport(totalDefects) : t.viewPartialReport}
          </button>
        )}

        {photos.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔍</p>
            <p style={{ fontSize: "0.9rem", whiteSpace: "pre-line", lineHeight: 1.6 }}>{t.takeDamagePhotos}</p>
          </div>
        )}
      </div>
    </main>
  );
}
