"use client";
import { useState, useRef, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type Lang, getSavedLang, getLangFromUrl } from "../../i18n/translations";
import { M, MACTOR, CATEGORIES, CATEGORY_LIST, type IssueCategory, detectCategory } from "../../inspector-mactor/character";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const btn: React.CSSProperties = {
  touchAction: "manipulation", cursor: "pointer",
  userSelect: "none", WebkitUserSelect: "none",
  outline: "none", WebkitTapHighlightColor: "transparent", border: "none",
};

type Severity = "low" | "medium" | "high" | "critical";
type Step = "describe" | "category" | "photos";

interface Defect {
  defect_type: string;
  severity: Severity;
  location: string;
  danger_if_ignored: string;
  confidence: string;
  inspector_note?: string;
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
    inspector_note?: string;
  } | null;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "var(--red)", high: "var(--amber)", medium: "var(--blue)", low: "var(--green)",
};

const SEVERITY_LABELS: Record<Severity, Record<Lang, string>> = {
  critical: { en: "CRITICAL", es: "CRÍTICO",   zh: "严重", hi: "गंभीर",   tl: "KRITIKAL"    },
  high:     { en: "HIGH",     es: "ALTO",       zh: "高",   hi: "उच्च",    tl: "MATAAS"      },
  medium:   { en: "MEDIUM",   es: "MEDIO",      zh: "中",   hi: "मध्यम",   tl: "KATAMTAMAN"  },
  low:      { en: "LOW",      es: "BAJO",       zh: "低",   hi: "कम",      tl: "MABABA"      },
};

// ── MacTor speech bubble ──────────────────────────────────────────────────────
function MacTorBubble({ text, sub }: { text: string; sub?: string }) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "28px" }}>
      {/* Avatar */}
      <div style={{
        flexShrink: 0, width: 44, height: 44, borderRadius: "50%",
        background: "linear-gradient(135deg,rgba(245,158,11,0.2),rgba(59,130,246,0.15))",
        border: "2px solid var(--gold)", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "1.3rem",
      }}>
        {MACTOR.avatar}
      </div>
      {/* Bubble */}
      <div style={{ flex: 1 }}>
        <p style={{
          margin: 0, fontSize: "0.7rem", fontFamily: "'Space Mono',monospace",
          color: "var(--gold)", letterSpacing: "1.5px", marginBottom: "6px",
        }}>
          INSPECTOR MACTOR
        </p>
        <div style={{
          background: "var(--navy-800)", border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: "0 14px 14px 14px", padding: "14px 16px",
        }}>
          <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--white)", lineHeight: 1.45 }}>
            {text}
          </p>
          {sub && (
            <p style={{ margin: "6px 0 0", fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.5 }}>
              {sub}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [lang, setLang]             = useState<Lang>("en");
  const [step, setStep]             = useState<Step>("describe");
  const [description, setDescription] = useState("");
  const [category, setCategory]     = useState<IssueCategory>("other");
  const [detectedCat, setDetectedCat] = useState<IssueCategory>("other");
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [photos, setPhotos]         = useState<PhotoEntry[]>([]);
  const [savingContext, setSavingContext] = useState(false);

  useEffect(() => {
    setLang(getLangFromUrl() || getSavedLang() || "en");
  }, []);

  const m = M[lang];
  const MAX_PHOTOS = 10;

  // ── Step 1 → 2: save description, detect category ──────────────────────────
  const handleDescribeNext = () => {
    if (!description.trim()) return;
    const detected = detectCategory(description);
    setDetectedCat(detected);
    setCategory(detected);
    setStep("category");
  };

  // ── Step 2 → 3: save context to API ────────────────────────────────────────
  const handleCategoryNext = async () => {
    setSavingContext(true);
    try {
      await fetch(`${API_URL}/api/inspection/${id}/context`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemDescription: description, issueCategory: category }),
      });
    } catch { /* non-blocking */ }
    setSavingContext(false);
    setStep("photos");
  };

  // ── Photo handling ──────────────────────────────────────────────────────────
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

        setPhotos(prev => prev.map(p => p.preview === preview ? { ...p, status: "analyzing" } : p));

        const res = await fetch(`${API_URL}/api/inspection/${id}/photo`, { method: "POST", body: formData });
        const data = await res.json();

        setPhotos(prev => prev.map(p =>
          p.preview === preview ? { ...p, url: data.photoUrl, analysis: data.analysis, status: "done" } : p
        ));
      } catch {
        setPhotos(prev => prev.map(p => p.preview === preview ? { ...p, status: "error" } : p));
      }
    }
  };

  const removePhoto = (preview: string) => setPhotos(prev => prev.filter(p => p.preview !== preview));

  const allDone    = photos.length > 0 && photos.every(p => p.status === "done" || p.status === "error");
  const hasAnalysis = photos.some(p => p.analysis !== null);
  const totalDefects = photos.flatMap(p => p.analysis?.observed_defects || []).length;

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1 — DESCRIBE
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === "describe") {
    return (
      <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--navy)" }}>
        <header style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
          <button type="button" onClick={() => router.back()}
            style={{ ...btn, width: 40, height: 40, borderRadius: 12, background: "var(--navy-800)", border: "1px solid var(--border)", color: "var(--white)", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ←
          </button>
          <div>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--gold)", letterSpacing: "2px", margin: 0 }}>INSPECTOR MACTOR · STEP 1 OF 3</p>
            <h1 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--white)" }}>{m.describeTitle}</h1>
          </div>
        </header>

        <div style={{ flex: 1, padding: "24px 20px", overflowY: "auto" }}>
          <MacTorBubble text={m.describePrompt} sub={m.describeHint} />

          <textarea
            autoFocus
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={m.describePlaceholder}
            rows={4}
            style={{
              width: "100%", padding: "16px", borderRadius: "14px",
              background: "var(--navy-800)", border: `1px solid ${description.trim() ? "rgba(245,158,11,0.4)" : "var(--border)"}`,
              color: "var(--white)", fontSize: "1rem", outline: "none",
              resize: "none", fontFamily: "'Outfit',sans-serif", lineHeight: 1.5,
              touchAction: "manipulation", boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && description.trim()) { e.preventDefault(); handleDescribeNext(); } }}
          />

          {/* Word count hint */}
          <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "8px 0 0", fontFamily: "'Space Mono',monospace" }}>
            {description.trim().split(/\s+/).filter(Boolean).length} / 100 words
          </p>
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
          <button type="button"
            onClick={handleDescribeNext}
            disabled={!description.trim()}
            style={{
              ...btn, width: "100%", padding: "18px", borderRadius: "16px",
              background: description.trim() ? "linear-gradient(135deg,#f59e0b,#d97706)" : "rgba(245,158,11,0.2)",
              color: description.trim() ? "#0a0f1e" : "var(--gold-light)",
              fontWeight: 800, fontSize: "1.05rem",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}>
            {m.describeNext}
          </button>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2 — CATEGORY
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === "category") {
    const catDef = CATEGORIES[category];
    return (
      <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--navy)" }}>
        <header style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
          <button type="button" onClick={() => setStep("describe")}
            style={{ ...btn, width: 40, height: 40, borderRadius: 12, background: "var(--navy-800)", border: "1px solid var(--border)", color: "var(--white)", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ←
          </button>
          <div>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--gold)", letterSpacing: "2px", margin: 0 }}>INSPECTOR MACTOR · STEP 2 OF 3</p>
            <h1 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--white)" }}>{m.categoryTitle}</h1>
          </div>
        </header>

        <div style={{ flex: 1, padding: "24px 20px", overflowY: "auto" }}>
          <MacTorBubble
            text={m.categoryDetected(catDef.name[lang])}
            sub={!showCatPicker ? m.categoryChange : undefined}
          />

          {/* Quick confirm — show detected category prominently */}
          {!showCatPicker && (
            <>
              <div style={{
                padding: "20px", borderRadius: "16px", marginBottom: "16px",
                background: "rgba(245,158,11,0.08)", border: "2px solid rgba(245,158,11,0.4)",
                display: "flex", alignItems: "center", gap: "16px",
              }}>
                <span style={{ fontSize: "2rem" }}>{catDef.icon}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: "var(--white)", fontSize: "1.1rem" }}>{catDef.name[lang]}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--muted)" }}>{description}</p>
                </div>
              </div>

              <button type="button" onClick={() => setShowCatPicker(true)}
                style={{ ...btn, width: "100%", padding: "12px", borderRadius: "12px", marginBottom: "20px",
                  background: "var(--navy-800)", border: "1px solid var(--border)",
                  color: "var(--muted)", fontSize: "0.85rem",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                🔄 {m.categoryChange}
              </button>
            </>
          )}

          {/* Full category picker */}
          {showCatPicker && (
            <>
              <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0 0 12px", fontFamily: "'Space Mono',monospace" }}>
                {m.categorySelect}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {CATEGORY_LIST.map(cat => {
                  const def = CATEGORIES[cat];
                  const isSelected = cat === category;
                  return (
                    <button key={cat} type="button"
                      onClick={() => { setCategory(cat); setShowCatPicker(false); }}
                      style={{
                        ...btn, padding: "14px 12px", borderRadius: "14px",
                        background: isSelected ? "rgba(245,158,11,0.12)" : "var(--navy-800)",
                        border: `1px solid ${isSelected ? "var(--gold)" : "var(--border)"}`,
                        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px",
                      }}>
                      <span style={{ fontSize: "1.4rem" }}>{def.icon}</span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: isSelected ? "var(--gold)" : "var(--white)", textAlign: "left", lineHeight: 1.3 }}>
                        {def.name[lang]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
          <button type="button"
            onClick={handleCategoryNext}
            disabled={savingContext}
            style={{
              ...btn, width: "100%", padding: "18px", borderRadius: "16px",
              background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#0a0f1e",
              fontWeight: 800, fontSize: "1.05rem",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              opacity: savingContext ? 0.7 : 1,
            }}>
            {savingContext ? "…" : m.next}
          </button>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3 — PHOTOS
  // ─────────────────────────────────────────────────────────────────────────────
  const catDef = CATEGORIES[category];

  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--navy)" }}>
      {/* Header */}
      <header style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
        <button type="button" onClick={() => setStep("category")}
          style={{ ...btn, width: 40, height: 40, borderRadius: 12, background: "var(--navy-800)", border: "1px solid var(--border)", color: "var(--white)", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ←
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--gold)", letterSpacing: "2px", margin: 0 }}>
            INSPECTOR MACTOR · STEP 3 OF 3
          </p>
          <h1 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--white)" }}>{m.photoTitle}</h1>
        </div>
        {/* Photo counter */}
        <div style={{
          fontFamily: "'Space Mono',monospace", fontSize: "13px", fontWeight: 700,
          color: photos.length >= MAX_PHOTOS ? "var(--amber)" : "var(--gold-light)",
          background: "var(--navy-800)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: 20,
        }}>
          {photos.length}/{MAX_PHOTOS}
        </div>
      </header>

      <div style={{ flex: 1, padding: "20px", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

        {/* MacTor guidance */}
        {photos.length === 0 && (
          <MacTorBubble text={m.photoPrompt} sub={catDef.photoHint[lang]} />
        )}

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
                {photos.length === 0 ? m.addPhoto : m.addMore}
              </span>
              <span style={{ color: "var(--muted)", fontSize: "0.78rem", fontFamily: "'Space Mono',monospace" }}>
                {m.maxPhotos(MAX_PHOTOS)}
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
                    {photo.status === "uploading" ? m.uploading : m.analyzing}
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

            {/* Analysis results */}
            <div style={{ padding: "14px" }}>
              {photo.status === "done" && photo.analysis ? (
                <>
                  {photo.analysis.observed_defects.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {photo.analysis.observed_defects.map((d, j) => (
                        <div key={j} style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--white)" }}>{d.defect_type}</span>
                            <span style={{
                              fontSize: "0.65rem", fontWeight: 700, fontFamily: "'Space Mono',monospace",
                              padding: "2px 8px", borderRadius: 20,
                              background: `${SEVERITY_COLORS[d.severity]}22`,
                              color: SEVERITY_COLORS[d.severity],
                              border: `1px solid ${SEVERITY_COLORS[d.severity]}44`,
                            }}>
                              {SEVERITY_LABELS[d.severity]?.[lang] || d.severity.toUpperCase()}
                            </span>
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
                      {m.noDamage}
                    </p>
                  )}
                  {/* MacTor's note */}
                  {photo.analysis.inspector_note && (
                    <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "8px 0 0", fontStyle: "italic", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
                      🔍 {photo.analysis.inspector_note}
                    </p>
                  )}
                </>
              ) : photo.status === "error" ? (
                <p style={{ fontSize: "0.8rem", color: "var(--red)", margin: 0 }}>{m.photoError}</p>
              ) : null}
            </div>
          </div>
        ))}

        {/* Analyzing progress bar */}
        {photos.length > 0 && !allDone && (
          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.85rem", color: "var(--gold-light)" }}>
              {m.progress(photos.filter(p => p.status === "done").length, photos.length)}
            </span>
          </div>
        )}

        {/* CTA to report */}
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
            {allDone ? m.reportCTA(totalDefects) : m.partialCTA}
          </button>
        )}

        {photos.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 20px", color: "var(--muted)" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>{catDef.icon}</p>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{catDef.photoHint[lang]}</p>
          </div>
        )}
      </div>
    </main>
  );
}
