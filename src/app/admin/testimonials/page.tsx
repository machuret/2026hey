"use client";
import { useEffect, useState, useCallback } from "react";

type Testimonial = {
  id: string;
  name: string;
  role: string;
  quote: string;
  service: "rvm" | "wa" | "general";
  accent_white: boolean;
  sort_order: number;
  published: boolean;
};

const EMPTY: Omit<Testimonial, "id"> = {
  name: "", role: "", quote: "", service: "general",
  accent_white: false, sort_order: 0, published: true,
};

const inputS: React.CSSProperties = { background: "#141414", border: "1px solid #2C2C2C", color: "#F5F2ED", padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif", width: "100%" };
const labelS: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "#888880", display: "block", marginBottom: 6 };

export default function TestimonialsAdmin() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/testimonials");
    const json = await res.json();
    setItems(json.data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startNew() { setEditing({ id: "", ...EMPTY }); setIsNew(true); setMsg(""); }
  function startEdit(item: Testimonial) { setEditing({ ...item }); setIsNew(false); setMsg(""); }
  function setField<K extends keyof Testimonial>(key: K, val: Testimonial[K]) {
    setEditing(prev => prev ? { ...prev, [key]: val } : null);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const res = await fetch("/api/admin/testimonials", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (res.ok) { setMsg("Saved ✓"); setEditing(null); load(); } else { setMsg("Error saving."); }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    await fetch("/api/admin/testimonials", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  async function togglePublished(item: Testimonial) {
    await fetch("/api/admin/testimonials", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, published: !item.published }) });
    load();
  }

  const serviceColor = (s: string) => s === "rvm" ? "#FF5C00" : s === "wa" ? "#25D366" : "#888880";

  return (
    <div style={{ padding: "40px 48px", fontFamily: "'DM Sans',sans-serif", color: "#F5F2ED" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, letterSpacing: 1, lineHeight: 1 }}>Testimonials</h1>
          <p style={{ fontSize: 14, color: "#888880", marginTop: 6, fontWeight: 300 }}>{items.length} total</p>
        </div>
        <button onClick={startNew} style={{ background: "#FF5C00", color: "#0A0A0A", padding: "10px 24px", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
          + Add Testimonial
        </button>
      </div>

      {msg && <div style={{ padding: "12px 16px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: "#25D366", fontSize: 14, marginBottom: 20 }}>{msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: editing ? "1fr 400px" : "1fr", gap: 20, alignItems: "start" }}>
        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, background: "#222222" }}>
          {items.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#888880", background: "#181818" }}>No testimonials yet.</div>}
          {items.map(item => (
            <div key={item.id} style={{ background: "#181818", padding: "18px 24px", display: "flex", alignItems: "flex-start", gap: 16, borderLeft: `3px solid ${serviceColor(item.service)}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: "#F5F2ED" }}>{item.name}</div>
                <div style={{ fontSize: 12, color: "#888880", marginTop: 2 }}>{item.role}</div>
                <div style={{ fontSize: 13, color: "#888880", marginTop: 8, lineHeight: 1.5, fontStyle: "italic" }}>"{item.quote.slice(0, 120)}{item.quote.length > 120 ? "…" : ""}"</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "3px 10px", background: item.published ? "rgba(37,211,102,0.1)" : "rgba(136,136,128,0.1)", color: item.published ? "#25D366" : "#888880" }}>
                  {item.published ? "Published" : "Draft"}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => togglePublished(item)} style={{ background: "none", border: "1px solid #333", color: "#888880", padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>
                    {item.published ? "Unpublish" : "Publish"}
                  </button>
                  <button onClick={() => startEdit(item)} style={{ background: "#222222", border: "none", color: "#F5F2ED", padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>Edit</button>
                  <button onClick={() => remove(item.id)} style={{ background: "none", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Editor */}
        {editing && (
          <div style={{ background: "#181818", border: "1px solid #222222", borderTop: "3px solid #FF5C00", padding: 28, position: "sticky", top: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 0.5 }}>{isNew ? "New Testimonial" : "Edit Testimonial"}</div>
              <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", color: "#888880", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelS}>Name</label>
                <input style={inputS} value={editing.name} onChange={e => setField("name", e.target.value)} placeholder="Daniel K." />
              </div>
              <div>
                <label style={labelS}>Role / Company</label>
                <input style={inputS} value={editing.role} onChange={e => setField("role", e.target.value)} placeholder="Managing Partner — Meridian Property Group" />
              </div>
              <div>
                <label style={labelS}>Quote</label>
                <textarea style={{ ...inputS, minHeight: 120, resize: "vertical", lineHeight: 1.6 }} value={editing.quote} onChange={e => setField("quote", e.target.value)} />
              </div>
              <div>
                <label style={labelS}>Service</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["rvm", "wa", "general"] as const).map(s => (
                    <button key={s} onClick={() => setField("service", s)} style={{ flex: 1, padding: "9px", fontSize: 12, fontWeight: 600, cursor: "pointer", background: editing.service === s ? serviceColor(s) : "#141414", color: editing.service === s ? "#0A0A0A" : "#888880", border: "1px solid #2C2C2C", fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase" }}>
                      {s === "rvm" ? "📞 RVM" : s === "wa" ? "💬 WA" : "🌐 General"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelS}>Sort Order</label>
                  <input type="number" style={inputS} value={editing.sort_order} onChange={e => setField("sort_order", parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label style={labelS}>Published</label>
                  <button onClick={() => setField("published", !editing.published)} style={{ ...inputS, cursor: "pointer", background: editing.published ? "rgba(37,211,102,0.1)" : "#141414", color: editing.published ? "#25D366" : "#888880", textAlign: "center" }}>
                    {editing.published ? "✓ Published" : "Draft"}
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={save} disabled={saving} style={{ flex: 1, background: saving ? "#333" : "#FF5C00", color: saving ? "#888880" : "#0A0A0A", padding: "12px", fontSize: 15, fontWeight: 700, border: "none", cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>
                  {saving ? "Saving..." : "Save Testimonial"}
                </button>
                <button onClick={() => setEditing(null)} style={{ padding: "12px 20px", background: "transparent", border: "1px solid #333", color: "#888880", fontSize: 14, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
