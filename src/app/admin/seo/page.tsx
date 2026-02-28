"use client";
import { useEffect, useState } from "react";

type SeoRow = {
  page: string;
  title: string;
  description: string;
};

const PAGES = [
  { id: "home",               label: "🏠 Home" },
  { id: "about",              label: "👥 About" },
  { id: "whatsapp-agent",     label: "💬 WhatsApp Agent" },
  { id: "ringless-voicemail", label: "📞 Ringless Voicemail" },
  { id: "packages",           label: "💰 Packages" },
  { id: "case-studies",       label: "📁 Case Studies" },
  { id: "contact",            label: "📅 Contact" },
];

export default function SeoAdmin() {
  const [rows, setRows] = useState<SeoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/seo");
    const j = await res.json();
    const fetched: SeoRow[] = j.data ?? [];
    const merged = PAGES.map(p => {
      const found = fetched.find(r => r.page === p.id);
      return found ?? { page: p.id, title: "", description: "" };
    });
    setRows(merged);
    setLoading(false);
  }

  function flash(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 2500);
  }

  function update(page: string, field: "title" | "description", value: string) {
    setRows(prev => prev.map(r => r.page === page ? { ...r, [field]: value } : r));
  }

  async function save(row: SeoRow) {
    if (!row.title.trim()) { setError("Title is required"); return; }
    setError("");
    setSaving(row.page);
    const res = await fetch("/api/admin/seo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    setSaving(null);
    if (res.ok) flash(`Saved — ${row.page}`);
    else setError("Save failed");
  }

  const input: React.CSSProperties = {
    background: "#181818", border: "1px solid #2A2A2A", borderRadius: 2,
    padding: "9px 12px", color: "#F5F2ED", fontSize: 13,
    fontFamily: "'DM Sans',sans-serif", outline: "none", width: "100%",
    boxSizing: "border-box", transition: "border-color 0.2s",
  };

  return (
    <div style={{ padding: "40px 48px", maxWidth: 960, margin: "0 auto", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 42, color: "#F5F2ED", letterSpacing: 1, marginBottom: 6 }}>SEO Manager</h1>
        <p style={{ color: "#888880", fontSize: 14 }}>Edit the browser tab title and meta description for each page. Changes go live on the next page visit.</p>
      </div>

      {success && (
        <div style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 2, padding: "10px 16px", color: "#4ADE80", fontSize: 13, marginBottom: 20 }}>
          ✓ {success}
        </div>
      )}
      {error && (
        <div style={{ background: "rgba(255,92,0,0.1)", border: "1px solid rgba(255,92,0,0.3)", borderRadius: 2, padding: "10px 16px", color: "#FF5C00", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: "#888880" }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {rows.map((row, i) => {
            const pageLabel = PAGES.find(p => p.id === row.page)?.label ?? row.page;
            const titleLen = row.title.length;
            const descLen = row.description.length;
            return (
              <div key={row.page} style={{
                background: "#111", border: "1px solid #1E1E1E", borderRadius: 4,
                padding: "24px 28px", borderLeft: `3px solid ${i % 2 === 0 ? "#FF5C00" : "#333"}`,
              }}>
                {/* Page label */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F2ED", letterSpacing: 0.3 }}>{pageLabel}</div>
                  <div style={{ fontSize: 11, color: "#444", fontFamily: "monospace" }}>/{row.page === "home" ? "" : row.page}</div>
                </div>

                {/* Title */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#888880" }}>Page Title</label>
                    <span style={{ fontSize: 11, color: titleLen > 60 ? "#EF4444" : titleLen > 50 ? "#F59E0B" : "#555" }}>{titleLen}/60</span>
                  </div>
                  <input
                    style={{ ...input, borderColor: titleLen > 60 ? "rgba(239,68,68,0.5)" : "#2A2A2A" }}
                    value={row.title}
                    onChange={e => update(row.page, "title", e.target.value)}
                    onFocus={e => (e.currentTarget.style.borderColor = "#FF5C00")}
                    onBlur={e => (e.currentTarget.style.borderColor = titleLen > 60 ? "rgba(239,68,68,0.5)" : "#2A2A2A")}
                    placeholder="e.g. Hey More Leads — More Conversations. More Closings."
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#888880" }}>Meta Description</label>
                    <span style={{ fontSize: 11, color: descLen > 160 ? "#EF4444" : descLen > 140 ? "#F59E0B" : "#555" }}>{descLen}/160</span>
                  </div>
                  <textarea
                    rows={3}
                    style={{ ...input, resize: "vertical", lineHeight: 1.6 }}
                    value={row.description}
                    onChange={e => update(row.page, "description", e.target.value)}
                    onFocus={e => (e.currentTarget.style.borderColor = "#FF5C00")}
                    onBlur={e => (e.currentTarget.style.borderColor = "#2A2A2A")}
                    placeholder="Brief description shown in Google search results (aim for 120–160 chars)"
                  />
                </div>

                {/* Google preview */}
                <div style={{ background: "#0D0D0D", border: "1px solid #1A1A1A", borderRadius: 2, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#444", marginBottom: 8 }}>Google Preview</div>
                  <div style={{ fontSize: 18, color: "#8AB4F8", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {row.title || <span style={{ color: "#333" }}>Your page title…</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#4A9E6B", marginBottom: 4 }}>
                    heymoreleads.com/{row.page === "home" ? "" : row.page}
                  </div>
                  <div style={{ fontSize: 13, color: "#888", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {row.description || <span style={{ color: "#333" }}>Your meta description…</span>}
                  </div>
                </div>

                <button
                  onClick={() => save(row)}
                  disabled={saving === row.page}
                  style={{
                    background: saving === row.page ? "#222" : "#FF5C00",
                    border: "none", borderRadius: 2, color: saving === row.page ? "#888" : "#0A0A0A",
                    fontWeight: 700, fontSize: 12, padding: "8px 20px", cursor: saving === row.page ? "not-allowed" : "pointer",
                    letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif", transition: "background 0.2s",
                  }}
                >
                  {saving === row.page ? "Saving…" : "Save"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 24, padding: "14px 20px", background: "#111", border: "1px solid #1E1E1E", borderLeft: "3px solid #FF5C00", borderRadius: 2, fontSize: 13, color: "#888880", lineHeight: 1.6 }}>
        <strong style={{ color: "#F5F2ED" }}>Tips:</strong> Keep titles under 60 chars and descriptions under 160 chars to avoid Google truncation. The character counter turns <span style={{ color: "#F59E0B" }}>amber</span> at 85% and <span style={{ color: "#EF4444" }}>red</span> over the limit.
      </div>
    </div>
  );
}
