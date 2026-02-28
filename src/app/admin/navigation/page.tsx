"use client";
import { useEffect, useState } from "react";

type NavItem = {
  id: string;
  label: string;
  href: string;
  sort_order: number;
  visible: boolean;
  is_cta: boolean;
  open_new_tab: boolean;
};

const emptyItem = (): Omit<NavItem, "id"> => ({
  label: "",
  href: "",
  sort_order: 99,
  visible: true,
  is_cta: false,
  open_new_tab: false,
});

export default function NavigationAdmin() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState(emptyItem());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/nav");
    const j = await res.json();
    setItems(j.data ?? []);
    setLoading(false);
  }

  function flash(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 2500);
  }

  async function saveItem(item: NavItem) {
    setSaving(item.id);
    const res = await fetch("/api/admin/nav", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    setSaving(null);
    if (res.ok) flash("Saved");
    else setError("Save failed");
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this nav item?")) return;
    await fetch("/api/admin/nav", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems(prev => prev.filter(i => i.id !== id));
    flash("Deleted");
  }

  async function addItem() {
    if (!newItem.label || !newItem.href) { setError("Label and URL are required"); return; }
    setError("");
    const maxOrder = items.length ? Math.max(...items.map(i => i.sort_order)) + 1 : 1;
    const res = await fetch("/api/admin/nav", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newItem, sort_order: maxOrder }),
    });
    const j = await res.json();
    if (res.ok) {
      setItems(prev => [...prev, j.data]);
      setNewItem(emptyItem());
      setAdding(false);
      flash("Added");
    } else {
      setError(j.error ?? "Failed to add");
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const newItems = [...items];
    const swapIndex = index + dir;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    const reordered = newItems.map((item, i) => ({ ...item, sort_order: i + 1 }));
    setItems(reordered);
    await fetch("/api/admin/nav", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reordered.map(({ id, sort_order }) => ({ id, sort_order }))),
    });
    flash("Order saved");
  }

  function updateField(id: string, field: keyof NavItem, value: string | boolean) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  }

  const cell: React.CSSProperties = { padding: "14px 16px", borderBottom: "1px solid #222", fontSize: 13, color: "#F5F2ED", verticalAlign: "middle" };
  const input: React.CSSProperties = { background: "#222", border: "1px solid #333", borderRadius: 2, padding: "7px 10px", color: "#F5F2ED", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", width: "100%", boxSizing: "border-box" };
  const btn = (color = "#FF5C00"): React.CSSProperties => ({ background: color, border: "none", borderRadius: 2, color: "#0A0A0A", fontWeight: 700, fontSize: 12, padding: "6px 14px", cursor: "pointer", letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif" });

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1100, margin: "0 auto", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 42, color: "#F5F2ED", letterSpacing: 1, marginBottom: 6 }}>Navigation Manager</h1>
        <p style={{ color: "#888880", fontSize: 14 }}>Edit labels, URLs, order, and visibility of header nav items. Changes go live immediately.</p>
      </div>

      {success && <div style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 2, padding: "10px 16px", color: "#4ADE80", fontSize: 13, marginBottom: 20 }}>{success}</div>}
      {error && <div style={{ background: "rgba(255,92,0,0.1)", border: "1px solid rgba(255,92,0,0.3)", borderRadius: 2, padding: "10px 16px", color: "#FF5C00", fontSize: 13, marginBottom: 20 }}>{error}</div>}

      {loading ? (
        <div style={{ color: "#888880", fontSize: 14 }}>Loading…</div>
      ) : (
        <div style={{ background: "#111", border: "1px solid #222", borderRadius: 4, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 80px 70px 70px 80px 120px", background: "#181818", borderBottom: "2px solid #FF5C00" }}>
            {["#", "Label", "URL / Path", "Visible", "CTA", "New Tab", "Order", "Actions"].map(h => (
              <div key={h} style={{ padding: "12px 16px", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#888880" }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {items.map((item, index) => (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 80px 70px 70px 80px 120px", alignItems: "center", background: index % 2 === 0 ? "#111" : "#131313" }}>
              <div style={{ ...cell, color: "#FF5C00", fontFamily: "'Bebas Neue',sans-serif", fontSize: 18 }}>{item.sort_order}</div>
              <div style={cell}>
                <input style={input} value={item.label} onChange={e => updateField(item.id, "label", e.target.value)} />
              </div>
              <div style={cell}>
                <input style={input} value={item.href} onChange={e => updateField(item.id, "href", e.target.value)} placeholder="e.g. /about or https://..." />
              </div>
              <div style={{ ...cell, textAlign: "center" }}>
                <input type="checkbox" checked={item.visible} onChange={e => updateField(item.id, "visible", e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#FF5C00", cursor: "pointer" }} />
              </div>
              <div style={{ ...cell, textAlign: "center" }}>
                <input type="checkbox" checked={item.is_cta} onChange={e => updateField(item.id, "is_cta", e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#FF5C00", cursor: "pointer" }} />
              </div>
              <div style={{ ...cell, textAlign: "center" }}>
                <input type="checkbox" checked={item.open_new_tab} onChange={e => updateField(item.id, "open_new_tab", e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#FF5C00", cursor: "pointer" }} />
              </div>
              <div style={{ ...cell, display: "flex", gap: 4 }}>
                <button onClick={() => move(index, -1)} disabled={index === 0} title="Move up"
                  style={{ background: "#222", border: "1px solid #333", borderRadius: 2, color: "#F5F2ED", fontSize: 14, width: 28, height: 28, cursor: index === 0 ? "not-allowed" : "pointer", opacity: index === 0 ? 0.3 : 1 }}>↑</button>
                <button onClick={() => move(index, 1)} disabled={index === items.length - 1} title="Move down"
                  style={{ background: "#222", border: "1px solid #333", borderRadius: 2, color: "#F5F2ED", fontSize: 14, width: 28, height: 28, cursor: index === items.length - 1 ? "not-allowed" : "pointer", opacity: index === items.length - 1 ? 0.3 : 1 }}>↓</button>
              </div>
              <div style={{ ...cell, display: "flex", gap: 6 }}>
                <button onClick={() => saveItem(item)} style={btn()} disabled={saving === item.id}>
                  {saving === item.id ? "…" : "Save"}
                </button>
                <button onClick={() => deleteItem(item.id)} style={btn("#333")} >✕</button>
              </div>
            </div>
          ))}

          {/* Add new row */}
          {adding ? (
            <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 80px 70px 70px 80px 120px", alignItems: "center", background: "#181818", borderTop: "1px solid #333" }}>
              <div style={cell} />
              <div style={cell}>
                <input style={{ ...input, borderColor: "#FF5C00" }} placeholder="Label *" value={newItem.label} onChange={e => setNewItem(p => ({ ...p, label: e.target.value }))} autoFocus />
              </div>
              <div style={cell}>
                <input style={{ ...input, borderColor: "#FF5C00" }} placeholder="URL / Path *" value={newItem.href} onChange={e => setNewItem(p => ({ ...p, href: e.target.value }))} />
              </div>
              <div style={{ ...cell, textAlign: "center" }}>
                <input type="checkbox" checked={newItem.visible} onChange={e => setNewItem(p => ({ ...p, visible: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#FF5C00", cursor: "pointer" }} />
              </div>
              <div style={{ ...cell, textAlign: "center" }}>
                <input type="checkbox" checked={newItem.is_cta} onChange={e => setNewItem(p => ({ ...p, is_cta: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#FF5C00", cursor: "pointer" }} />
              </div>
              <div style={{ ...cell, textAlign: "center" }}>
                <input type="checkbox" checked={newItem.open_new_tab} onChange={e => setNewItem(p => ({ ...p, open_new_tab: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#FF5C00", cursor: "pointer" }} />
              </div>
              <div style={cell} />
              <div style={{ ...cell, display: "flex", gap: 6 }}>
                <button onClick={addItem} style={btn()}>Add</button>
                <button onClick={() => { setAdding(false); setNewItem(emptyItem()); setError(""); }} style={btn("#333")}>✕</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "16px 20px", borderTop: "1px solid #222" }}>
              <button onClick={() => setAdding(true)} style={{ ...btn("#181818"), border: "1px dashed #444", color: "#888880", padding: "10px 20px", fontSize: 13 }}>
                + Add Nav Item
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 24, padding: "14px 20px", background: "#111", border: "1px solid #222", borderLeft: "3px solid #FF5C00", borderRadius: 2, fontSize: 13, color: "#888880", lineHeight: 1.6 }}>
        <strong style={{ color: "#F5F2ED" }}>Tips:</strong> Use <code style={{ color: "#FF5C00" }}>is_cta</code> to style a link as the orange button. Use <code style={{ color: "#FF5C00" }}>↑ ↓</code> to reorder. Hidden items won't appear in the nav but are kept in the database. Changes to label/URL require clicking <strong style={{ color: "#F5F2ED" }}>Save</strong> on that row.
      </div>
    </div>
  );
}
