"use client";
import { useEffect, useState, useCallback } from "react";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  emoji: string;
  sort_order: number;
  published: boolean;
};

const EMPTY: Omit<TeamMember, "id"> = {
  name: "", role: "", bio: "", emoji: "👤", sort_order: 0, published: true,
};

const inputS: React.CSSProperties = { background: "#141414", border: "1px solid #2C2C2C", color: "#F5F2ED", padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif", width: "100%" };
const labelS: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "#888880", display: "block", marginBottom: 6 };

export default function TeamAdmin() {
  const [items, setItems] = useState<TeamMember[]>([]);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/team");
    const json = await res.json();
    setItems(json.data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startNew() { setEditing({ id: "", ...EMPTY }); setIsNew(true); setMsg(""); }
  function startEdit(item: TeamMember) { setEditing({ ...item }); setIsNew(false); setMsg(""); }
  function setField<K extends keyof TeamMember>(key: K, val: TeamMember[K]) {
    setEditing(prev => prev ? { ...prev, [key]: val } : null);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const res = await fetch("/api/admin/team", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (res.ok) { setMsg("Saved ✓"); setEditing(null); load(); } else { setMsg("Error saving."); }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this team member?")) return;
    await fetch("/api/admin/team", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  async function togglePublished(item: TeamMember) {
    await fetch("/api/admin/team", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, published: !item.published }) });
    load();
  }

  return (
    <div style={{ padding: "40px 48px", fontFamily: "'DM Sans',sans-serif", color: "#F5F2ED" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, letterSpacing: 1, lineHeight: 1 }}>Team</h1>
          <p style={{ fontSize: 14, color: "#888880", marginTop: 6, fontWeight: 300 }}>{items.length} members</p>
        </div>
        <button onClick={startNew} style={{ background: "#FF5C00", color: "#0A0A0A", padding: "10px 24px", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
          + Add Member
        </button>
      </div>

      {msg && <div style={{ padding: "12px 16px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: "#25D366", fontSize: 14, marginBottom: 20 }}>{msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: editing ? "1fr 400px" : "1fr", gap: 20, alignItems: "start" }}>
        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, background: "#222222" }}>
          {items.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#888880", background: "#181818", gridColumn: "1/-1" }}>No team members yet.</div>}
          {items.map(item => (
            <div key={item.id} style={{ background: "#181818", padding: 28, position: "relative", borderTop: "3px solid #FF5C00" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{item.emoji}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 0.5, color: "#F5F2ED", marginBottom: 4 }}>{item.name}</div>
              <div style={{ fontSize: 13, color: "#FF5C00", fontWeight: 500, marginBottom: 12, letterSpacing: 0.5 }}>{item.role}</div>
              <div style={{ fontSize: 13, color: "#888880", lineHeight: 1.6, marginBottom: 20 }}>{item.bio.slice(0, 140)}{item.bio.length > 140 ? "…" : ""}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "3px 10px", background: item.published ? "rgba(37,211,102,0.1)" : "rgba(136,136,128,0.1)", color: item.published ? "#25D366" : "#888880" }}>
                  {item.published ? "Published" : "Draft"}
                </span>
                <button onClick={() => togglePublished(item)} style={{ background: "none", border: "1px solid #333", color: "#888880", padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>
                  {item.published ? "Unpublish" : "Publish"}
                </button>
                <button onClick={() => startEdit(item)} style={{ background: "#222", border: "none", color: "#F5F2ED", padding: "4px 12px", fontSize: 12, cursor: "pointer" }}>Edit</button>
                <button onClick={() => remove(item.id)} style={{ background: "none", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* Editor */}
        {editing && (
          <div style={{ background: "#181818", border: "1px solid #222222", borderTop: "3px solid #FF5C00", padding: 28, position: "sticky", top: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 0.5 }}>{isNew ? "New Member" : "Edit Member"}</div>
              <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", color: "#888880", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 12 }}>
                <div>
                  <label style={labelS}>Emoji</label>
                  <input style={{ ...inputS, textAlign: "center", fontSize: 24 }} value={editing.emoji} onChange={e => setField("emoji", e.target.value)} />
                </div>
                <div>
                  <label style={labelS}>Name</label>
                  <input style={inputS} value={editing.name} onChange={e => setField("name", e.target.value)} placeholder="Gabriel M." />
                </div>
              </div>
              <div>
                <label style={labelS}>Role / Title</label>
                <input style={inputS} value={editing.role} onChange={e => setField("role", e.target.value)} placeholder="Founder & Strategy Lead" />
              </div>
              <div>
                <label style={labelS}>Bio</label>
                <textarea style={{ ...inputS, minHeight: 120, resize: "vertical", lineHeight: 1.6 }} value={editing.bio} onChange={e => setField("bio", e.target.value)} />
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
                  {saving ? "Saving..." : "Save Member"}
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
