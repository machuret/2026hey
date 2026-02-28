"use client";
import { useEffect, useState, useCallback } from "react";

type WhatItem = { num: string; title: string; desc: string };
type ResultBox = { num: string; label: string };
type CaseStudy = {
  id: string;
  type: "rvm" | "wa";
  industry: string;
  client_name: string;
  client_detail: string;
  data_industry: string;
  stat1_num: string;
  stat1_label: string;
  stat2_num: string;
  stat2_label: string;
  situation: string;
  challenges: string[];
  what_we_did: WhatItem[];
  results_title: string;
  results: ResultBox[];
  quote: string;
  quote_attr: string;
  sort_order: number;
  published: boolean;
};

const EMPTY: Omit<CaseStudy, "id"> = {
  type: "rvm", industry: "", client_name: "", client_detail: "", data_industry: "",
  stat1_num: "", stat1_label: "", stat2_num: "", stat2_label: "",
  situation: "", challenges: [], what_we_did: [], results_title: "The Results",
  results: [], quote: "", quote_attr: "", sort_order: 0, published: true,
};

const S = { fontFamily: "'DM Sans',sans-serif", color: "#F5F2ED" };
const inputS: React.CSSProperties = { background: "#141414", border: "1px solid #2C2C2C", color: "#F5F2ED", padding: "10px 14px", fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif", width: "100%" };
const labelS: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "#888880", display: "block", marginBottom: 6 };

export default function CaseStudiesAdmin() {
  const [items, setItems] = useState<CaseStudy[]>([]);
  const [editing, setEditing] = useState<CaseStudy | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/case-studies");
    const json = await res.json();
    setItems(json.data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startNew() {
    setEditing({ id: "", ...EMPTY });
    setIsNew(true);
    setMsg("");
  }

  function startEdit(item: CaseStudy) {
    setEditing({ ...item });
    setIsNew(false);
    setMsg("");
  }

  function setField<K extends keyof CaseStudy>(key: K, val: CaseStudy[K]) {
    setEditing(prev => prev ? { ...prev, [key]: val } : null);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const method = isNew ? "POST" : "PATCH";
    const body = isNew ? { ...editing } : editing;
    const res = await fetch("/api/admin/case-studies", {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (res.ok) {
      setMsg("Saved ✓");
      setEditing(null);
      load();
    } else {
      setMsg("Error saving.");
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this case study?")) return;
    await fetch("/api/admin/case-studies", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  async function togglePublished(item: CaseStudy) {
    await fetch("/api/admin/case-studies", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, published: !item.published }) });
    load();
  }

  return (
    <div style={{ padding: "40px 48px", ...S }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, letterSpacing: 1, lineHeight: 1 }}>Case Studies</h1>
          <p style={{ fontSize: 14, color: "#888880", marginTop: 6, fontWeight: 300 }}>{items.length} total</p>
        </div>
        <button onClick={startNew} style={{ background: "#FF5C00", color: "#0A0A0A", padding: "10px 24px", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
          + Add Case Study
        </button>
      </div>

      {msg && <div style={{ padding: "12px 16px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: "#25D366", fontSize: 14, marginBottom: 20 }}>{msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: editing ? "1fr 480px" : "1fr", gap: 20, alignItems: "start" }}>
        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, background: "#222222" }}>
          {items.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#888880", background: "#181818" }}>No case studies yet. Add one to get started.</div>}
          {items.map(item => (
            <div key={item.id} style={{ background: "#181818", padding: "18px 24px", display: "flex", alignItems: "center", gap: 16, borderLeft: `3px solid ${item.type === "wa" ? "#25D366" : "#FF5C00"}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: "#F5F2ED" }}>{item.client_name}</div>
                <div style={{ fontSize: 13, color: "#888880", marginTop: 2 }}>{item.industry} · {item.type === "wa" ? "WhatsApp AI" : "Ringless Voicemail"}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "3px 10px", background: item.published ? "rgba(37,211,102,0.1)" : "rgba(136,136,128,0.1)", color: item.published ? "#25D366" : "#888880" }}>
                {item.published ? "Published" : "Draft"}
              </span>
              <button onClick={() => togglePublished(item)} style={{ background: "none", border: "1px solid #333", color: "#888880", padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                {item.published ? "Unpublish" : "Publish"}
              </button>
              <button onClick={() => startEdit(item)} style={{ background: "#222222", border: "none", color: "#F5F2ED", padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Edit</button>
              <button onClick={() => remove(item.id)} style={{ background: "none", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>✕</button>
            </div>
          ))}
        </div>

        {/* Editor */}
        {editing && (
          <div style={{ background: "#181818", border: "1px solid #222222", borderTop: "3px solid #FF5C00", padding: 28, position: "sticky", top: 20, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 0.5 }}>{isNew ? "New Case Study" : "Edit Case Study"}</div>
              <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", color: "#888880", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Type */}
              <div>
                <label style={labelS}>Service Type</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["rvm", "wa"] as const).map(t => (
                    <button key={t} onClick={() => setField("type", t)} style={{ flex: 1, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", background: editing.type === t ? (t === "wa" ? "#25D366" : "#FF5C00") : "#141414", color: editing.type === t ? "#0A0A0A" : "#888880", border: "1px solid #2C2C2C" }}>
                      {t === "rvm" ? "📞 RVM" : "💬 WhatsApp AI"}
                    </button>
                  ))}
                </div>
              </div>

              {[
                { label: "Client Name", key: "client_name" as const },
                { label: "Industry", key: "industry" as const },
                { label: "Client Detail (use \\n for line break)", key: "client_detail" as const },
                { label: "Data Industry (watermark text e.g. ROOFING)", key: "data_industry" as const },
                { label: "Stat 1 Number", key: "stat1_num" as const },
                { label: "Stat 1 Label", key: "stat1_label" as const },
                { label: "Stat 2 Number", key: "stat2_num" as const },
                { label: "Stat 2 Label", key: "stat2_label" as const },
              ].map(f => (
                <div key={f.key}>
                  <label style={labelS}>{f.label}</label>
                  <input style={inputS} value={editing[f.key] as string} onChange={e => setField(f.key, e.target.value)} />
                </div>
              ))}

              <div>
                <label style={labelS}>Situation</label>
                <textarea style={{ ...inputS, minHeight: 100, resize: "vertical", lineHeight: 1.6 }} value={editing.situation} onChange={e => setField("situation", e.target.value)} />
              </div>

              <div>
                <label style={labelS}>Challenges (one per line)</label>
                <textarea style={{ ...inputS, minHeight: 80, resize: "vertical" }} value={editing.challenges.join("\n")} onChange={e => setField("challenges", e.target.value.split("\n").filter(Boolean))} />
              </div>

              <div>
                <label style={labelS}>What We Did (JSON array: [{`{"num":"01","title":"...","desc":"..."}`}])</label>
                <textarea style={{ ...inputS, minHeight: 100, resize: "vertical", fontSize: 12 }} value={JSON.stringify(editing.what_we_did, null, 2)} onChange={e => { try { setField("what_we_did", JSON.parse(e.target.value)); } catch {} }} />
              </div>

              <div>
                <label style={labelS}>Results Title</label>
                <input style={inputS} value={editing.results_title} onChange={e => setField("results_title", e.target.value)} />
              </div>

              <div>
                <label style={labelS}>Results (JSON array: [{`{"num":"312","label":"Callbacks received"}`}])</label>
                <textarea style={{ ...inputS, minHeight: 100, resize: "vertical", fontSize: 12 }} value={JSON.stringify(editing.results, null, 2)} onChange={e => { try { setField("results", JSON.parse(e.target.value)); } catch {} }} />
              </div>

              <div>
                <label style={labelS}>Quote</label>
                <textarea style={{ ...inputS, minHeight: 80, resize: "vertical" }} value={editing.quote} onChange={e => setField("quote", e.target.value)} />
              </div>

              <div>
                <label style={labelS}>Quote Attribution</label>
                <input style={inputS} value={editing.quote_attr} onChange={e => setField("quote_attr", e.target.value)} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelS}>Sort Order</label>
                  <input type="number" style={inputS} value={editing.sort_order} onChange={e => setField("sort_order", parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label style={labelS}>Published</label>
                  <button onClick={() => setField("published", !editing.published)} style={{ ...inputS, width: "100%", cursor: "pointer", background: editing.published ? "rgba(37,211,102,0.1)" : "#141414", color: editing.published ? "#25D366" : "#888880", textAlign: "center" }}>
                    {editing.published ? "✓ Published" : "Draft"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={save} disabled={saving} style={{ flex: 1, background: saving ? "#333" : "#FF5C00", color: saving ? "#888880" : "#0A0A0A", padding: "12px", fontSize: 15, fontWeight: 700, border: "none", cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>
                  {saving ? "Saving..." : "Save Case Study"}
                </button>
                <button onClick={() => setEditing(null)} style={{ padding: "12px 20px", background: "transparent", border: "1px solid #333", color: "#888880", fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
