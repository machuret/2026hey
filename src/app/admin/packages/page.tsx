"use client";
import { useEffect, useState, useCallback } from "react";

type PackageLimit = { label: string; value: string; highlight: boolean };
type Package = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  color: string;
  badge: string | null;
  featured: boolean;
  features: string[];
  limits: PackageLimit[];
  quote: string | null;
  cta_label: string;
  sort_order: number;
  published: boolean;
};

const inputS: React.CSSProperties = { background: "#141414", border: "1px solid #2C2C2C", color: "#F5F2ED", padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif", width: "100%" };
const labelS: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "#888880", display: "block", marginBottom: 6 };

export default function PackagesAdmin() {
  const [items, setItems] = useState<Package[]>([]);
  const [editing, setEditing] = useState<Package | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/packages");
    const json = await res.json();
    setItems(json.data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(item: Package) { setEditing({ ...item }); setMsg(""); }
  function setField<K extends keyof Package>(key: K, val: Package[K]) {
    setEditing(prev => prev ? { ...prev, [key]: val } : null);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const res = await fetch("/api/admin/packages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (res.ok) { setMsg("Saved ✓"); setEditing(null); load(); } else { setMsg("Error saving."); }
    setSaving(false);
  }

  return (
    <div style={{ padding: "40px 48px", fontFamily: "'DM Sans',sans-serif", color: "#F5F2ED" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, letterSpacing: 1, lineHeight: 1 }}>Packages</h1>
        <p style={{ fontSize: 14, color: "#888880", marginTop: 6, fontWeight: 300 }}>Edit pricing, features, and copy for each package.</p>
      </div>

      {msg && <div style={{ padding: "12px 16px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: "#25D366", fontSize: 14, marginBottom: 20 }}>{msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: editing ? "1fr 480px" : "1fr", gap: 20, alignItems: "start" }}>
        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, background: "#222222" }}>
          {items.map(item => (
            <div key={item.id} style={{ background: "#181818", padding: 28, position: "relative", borderTop: `3px solid ${item.color}` }}>
              {item.featured && <div style={{ position: "absolute", top: 12, right: 12, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", background: "#FF5C00", color: "#0A0A0A", padding: "3px 8px" }}>Featured</div>}
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: item.color, marginBottom: 8 }}>{item.tagline}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 1, color: "#F5F2ED", marginBottom: 8 }}>{item.name}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: "#F5F2ED", lineHeight: 1, marginBottom: 12 }}>
                <span style={{ fontSize: 20, color: item.color }}>$</span>{item.price}<span style={{ fontSize: 14, color: "#888880" }}>/mo</span>
              </div>
              <div style={{ fontSize: 13, color: "#888880", lineHeight: 1.5, marginBottom: 20 }}>{item.description}</div>
              <div style={{ fontSize: 12, color: "#888880", marginBottom: 8 }}>{item.features.length} features · {item.limits.length} limits</div>
              <button onClick={() => startEdit(item)} style={{ width: "100%", background: item.color, color: "#0A0A0A", padding: "10px", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>
                Edit Package
              </button>
            </div>
          ))}
        </div>

        {/* Editor */}
        {editing && (
          <div style={{ background: "#181818", border: "1px solid #222222", borderTop: `3px solid ${editing.color}`, padding: 28, position: "sticky", top: 20, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 0.5 }}>Edit: {editing.name}</div>
              <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", color: "#888880", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelS}>Name</label>
                  <input style={inputS} value={editing.name} onChange={e => setField("name", e.target.value)} />
                </div>
                <div>
                  <label style={labelS}>Price (USD/mo)</label>
                  <input type="number" style={inputS} value={editing.price} onChange={e => setField("price", parseInt(e.target.value) || 0)} />
                </div>
              </div>

              <div>
                <label style={labelS}>Tagline (shown as service type badge)</label>
                <input style={inputS} value={editing.tagline} onChange={e => setField("tagline", e.target.value)} />
              </div>

              <div>
                <label style={labelS}>Description</label>
                <textarea style={{ ...inputS, minHeight: 80, resize: "vertical" }} value={editing.description} onChange={e => setField("description", e.target.value)} />
              </div>

              <div>
                <label style={labelS}>Badge (leave empty for none)</label>
                <input style={inputS} value={editing.badge || ""} onChange={e => setField("badge", e.target.value || null)} placeholder="★ Most Popular — Best Value" />
              </div>

              <div>
                <label style={labelS}>Accent Color (hex)</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input style={{ ...inputS, flex: 1 }} value={editing.color} onChange={e => setField("color", e.target.value)} />
                  <div style={{ width: 40, height: 40, background: editing.color, flexShrink: 0, border: "1px solid #333" }} />
                </div>
              </div>

              <div>
                <label style={labelS}>CTA Button Label</label>
                <input style={inputS} value={editing.cta_label} onChange={e => setField("cta_label", e.target.value)} />
              </div>

              <div>
                <label style={labelS}>Features (one per line)</label>
                <textarea style={{ ...inputS, minHeight: 120, resize: "vertical" }} value={editing.features.join("\n")} onChange={e => setField("features", e.target.value.split("\n").filter(Boolean))} />
              </div>

              <div>
                <label style={labelS}>Campaign Limits (JSON)</label>
                <textarea style={{ ...inputS, minHeight: 100, resize: "vertical", fontSize: 12 }} value={JSON.stringify(editing.limits, null, 2)} onChange={e => { try { setField("limits", JSON.parse(e.target.value)); } catch {} }} />
              </div>

              <div>
                <label style={labelS}>Pull Quote (optional)</label>
                <textarea style={{ ...inputS, minHeight: 80, resize: "vertical" }} value={editing.quote || ""} onChange={e => setField("quote", e.target.value || null)} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelS}>Sort Order</label>
                  <input type="number" style={inputS} value={editing.sort_order} onChange={e => setField("sort_order", parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label style={labelS}>Featured</label>
                  <button onClick={() => setField("featured", !editing.featured)} style={{ ...inputS, cursor: "pointer", background: editing.featured ? "rgba(255,92,0,0.1)" : "#141414", color: editing.featured ? "#FF5C00" : "#888880", textAlign: "center" }}>
                    {editing.featured ? "★ Featured" : "Not Featured"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={save} disabled={saving} style={{ flex: 1, background: saving ? "#333" : "#FF5C00", color: saving ? "#888880" : "#0A0A0A", padding: "12px", fontSize: 15, fontWeight: 700, border: "none", cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>
                  {saving ? "Saving..." : "Save Package"}
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
