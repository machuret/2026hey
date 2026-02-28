"use client";
import { useEffect, useState, useCallback } from "react";

type ContentRow = {
  id: string;
  page: string;
  section: string;
  field: string;
  value: string;
};

type EditMap = Record<string, string>; // key = "section::field", value = edited string

const PAGES = [
  { id: "home", label: "🏠 Home" },
  { id: "about", label: "👥 About" },
  { id: "whatsapp", label: "💬 WhatsApp Agent" },
  { id: "rvm", label: "📞 Ringless Voicemail" },
  { id: "packages", label: "💰 Packages" },
  { id: "case-studies", label: "📁 Case Studies" },
  { id: "contact", label: "📅 Contact" },
];

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero Section",
  story: "Origin Story",
  beliefs: "What We Believe",
  process: "Process / How We Work",
  team: "Team Section",
  manifesto: "Manifesto Banner",
  final_cta: "Final CTA",
  stats: "Stats Bar",
  why: "Why WhatsApp",
  comparison: "Comparison Table",
  how_it_works: "How It Works",
  features: "Features Grid",
  what_is: "What Is RVM",
  what_we_handle: "What We Handle",
  who_its_for: "Who It's For",
  results: "Results / Numbers",
  testimonials: "Testimonials",
  compliance: "Compliance Strip",
  left_panel: "Left Panel (Form Page)",
  calendar: "Calendar Section",
  faq: "FAQ Section",
};

const FIELD_LABELS: Record<string, string> = {
  eyebrow: "Eyebrow Label",
  headline: "Main Headline",
  subheadline: "Sub-headline / Intro",
  body_1: "Body Paragraph 1",
  body_2: "Body Paragraph 2",
  body_3: "Body Paragraph 3",
  body_4: "Body Paragraph 4",
  body_5: "Body Paragraph 5",
  body_6: "Body Paragraph 6",
  pull_quote: "Pull Quote",
  cta_primary: "Primary CTA Button",
  cta_secondary: "Secondary CTA Button",
  text: "Text / Content",
  headline_1: "Headline Line 1",
  headline_2: "Headline Line 2",
  headline_3: "Headline Line 3",
  bottom_note: "Bottom Note",
  item_1_icon: "Item 1 — Icon (emoji)",
  item_1_title: "Item 1 — Title",
  item_1_body: "Item 1 — Body",
  item_2_icon: "Item 2 — Icon (emoji)",
  item_2_title: "Item 2 — Title",
  item_2_body: "Item 2 — Body",
  item_3_icon: "Item 3 — Icon (emoji)",
  item_3_title: "Item 3 — Title",
  item_3_body: "Item 3 — Body",
  stat1_num: "Stat 1 — Number",
  stat1_label: "Stat 1 — Label",
  stat2_num: "Stat 2 — Number",
  stat2_label: "Stat 2 — Label",
  stat3_num: "Stat 3 — Number",
  stat3_label: "Stat 3 — Label",
  stat4_num: "Stat 4 — Number",
  stat4_label: "Stat 4 — Label",
};

function isLong(field: string, value: string) {
  return field.startsWith("body") || field === "subheadline" || field === "text"
    || field === "pull_quote" || field === "bottom_note" || field.endsWith("_body")
    || value.length > 80;
}

export default function PagesAdmin() {
  const [activePage, setActivePage] = useState("home");
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [edits, setEdits] = useState<EditMap>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [addingField, setAddingField] = useState(false);
  const [newField, setNewField] = useState({ section: "", field: "", value: "" });
  const [savingAll, setSavingAll] = useState(false);
  const [savedAll, setSavedAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setEdits({});
    const res = await fetch(`/api/admin/page-content?page=${activePage}`);
    const json = await res.json();
    setRows(json.data ?? []);
    setLoading(false);
  }, [activePage]);

  useEffect(() => { load(); }, [load]);

  function key(r: ContentRow) { return `${r.section}::${r.field}`; }
  function val(r: ContentRow) { return edits[key(r)] !== undefined ? edits[key(r)] : r.value; }

  function onChange(r: ContentRow, v: string) {
    setEdits(prev => ({ ...prev, [key(r)]: v }));
    setSaved(prev => ({ ...prev, [key(r)]: false }));
  }

  async function saveField(r: ContentRow) {
    const k = key(r);
    setSaving(prev => ({ ...prev, [k]: true }));
    await fetch("/api/admin/page-content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: r.page, section: r.section, field: r.field, value: val(r) }),
    });
    setSaving(prev => ({ ...prev, [k]: false }));
    setSaved(prev => ({ ...prev, [k]: true }));
    setTimeout(() => setSaved(prev => ({ ...prev, [k]: false })), 2000);
  }

  async function saveAll() {
    const dirtyRows = rows.filter(r => edits[key(r)] !== undefined && edits[key(r)] !== r.value);
    if (dirtyRows.length === 0) return;
    setSavingAll(true);
    const payload = dirtyRows.map(r => ({
      page: r.page, section: r.section, field: r.field, value: edits[key(r)],
    }));
    await fetch("/api/admin/page-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSavingAll(false);
    setSavedAll(true);
    setEdits({});
    load();
    setTimeout(() => setSavedAll(false), 2500);
  }

  async function addField() {
    if (!newField.section || !newField.field || !newField.value) return;
    await fetch("/api/admin/page-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ page: activePage, ...newField }]),
    });
    setNewField({ section: "", field: "", value: "" });
    setAddingField(false);
    load();
  }

  // Group rows by section
  const sections: Record<string, ContentRow[]> = {};
  rows.forEach(r => {
    if (!sections[r.section]) sections[r.section] = [];
    sections[r.section].push(r);
  });

  const dirtyCount = rows.filter(r => edits[key(r)] !== undefined && edits[key(r)] !== r.value).length;

  const inputS: React.CSSProperties = {
    background: "#141414", border: "1px solid #2C2C2C", color: "#F5F2ED",
    padding: "10px 14px", fontSize: 14, outline: "none",
    fontFamily: "'DM Sans',sans-serif", width: "100%", lineHeight: 1.6,
    resize: "vertical" as const,
  };

  return (
    <div style={{ padding: "40px 48px", fontFamily: "'DM Sans',sans-serif", color: "#F5F2ED" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, letterSpacing: 1, lineHeight: 1 }}>Page Editor</h1>
          <p style={{ fontSize: 14, color: "#888880", marginTop: 6, fontWeight: 300 }}>Edit the content for any page — changes go live immediately.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {dirtyCount > 0 && (
            <span style={{ fontSize: 12, color: "#F59E0B", fontWeight: 600 }}>{dirtyCount} unsaved change{dirtyCount > 1 ? "s" : ""}</span>
          )}
          <button onClick={saveAll} disabled={savingAll || dirtyCount === 0} style={{
            background: savedAll ? "#25D366" : dirtyCount > 0 ? "#FF5C00" : "#222",
            color: dirtyCount > 0 ? "#0A0A0A" : "#888880",
            padding: "10px 24px", fontSize: 14, fontWeight: 600, border: "none",
            cursor: dirtyCount > 0 ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif",
            transition: "background 0.2s",
          }}>
            {savingAll ? "Saving…" : savedAll ? "✓ All Saved" : "Save All Changes"}
          </button>
        </div>
      </div>

      {/* Page tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 32, flexWrap: "wrap", background: "#222222" }}>
        {PAGES.map(p => (
          <button key={p.id} onClick={() => setActivePage(p.id)} style={{
            padding: "12px 20px", fontSize: 13, fontWeight: activePage === p.id ? 600 : 400,
            background: activePage === p.id ? "#FF5C00" : "#181818",
            color: activePage === p.id ? "#0A0A0A" : "#888880",
            border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
            transition: "all 0.15s", whiteSpace: "nowrap",
          }}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#888880" }}>Loading page content…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {Object.entries(sections).map(([section, sectionRows]) => (
            <div key={section} style={{ background: "#181818", border: "1px solid #222222" }}>
              {/* Section header */}
              <div style={{ padding: "14px 24px", borderBottom: "1px solid #222222", display: "flex", alignItems: "center", gap: 12, background: "#1a1a1a" }}>
                <div style={{ width: 3, height: 20, background: "#FF5C00", flexShrink: 0 }} />
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#F5F2ED" }}>
                  {SECTION_LABELS[section] || section.replace(/_/g, " ").toUpperCase()}
                </span>
                <span style={{ fontSize: 11, color: "#888880", marginLeft: "auto" }}>{sectionRows.length} field{sectionRows.length > 1 ? "s" : ""}</span>
              </div>

              {/* Fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {sectionRows.map(r => {
                  const k = key(r);
                  const v = val(r);
                  const isDirty = edits[k] !== undefined && edits[k] !== r.value;
                  const long = isLong(r.field, v);
                  return (
                    <div key={k} style={{ padding: "16px 24px", borderBottom: "1px solid #1e1e1e", display: "grid", gridTemplateColumns: "220px 1fr auto", gap: 16, alignItems: "start", background: isDirty ? "rgba(255,92,0,0.03)" : "transparent" }}>
                      {/* Label */}
                      <div style={{ paddingTop: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: isDirty ? "#FF5C00" : "#888880", marginBottom: 4 }}>
                          {FIELD_LABELS[r.field] || r.field.replace(/_/g, " ")}
                          {isDirty && <span style={{ marginLeft: 6, color: "#FF5C00" }}>●</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "#444", fontFamily: "monospace" }}>{r.section}/{r.field}</div>
                      </div>

                      {/* Input */}
                      {long ? (
                        <textarea
                          style={{ ...inputS, minHeight: v.length > 200 ? 120 : 70 }}
                          value={v}
                          onChange={e => onChange(r, e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveField(r); }}
                        />
                      ) : (
                        <input
                          type="text"
                          style={inputS}
                          value={v}
                          onChange={e => onChange(r, e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") saveField(r); }}
                        />
                      )}

                      {/* Save button */}
                      <button
                        onClick={() => saveField(r)}
                        disabled={!isDirty || saving[k]}
                        style={{
                          padding: "10px 16px", fontSize: 12, fontWeight: 600,
                          background: saved[k] ? "rgba(37,211,102,0.15)" : isDirty ? "rgba(255,92,0,0.15)" : "transparent",
                          color: saved[k] ? "#25D366" : isDirty ? "#FF5C00" : "#444",
                          border: `1px solid ${saved[k] ? "rgba(37,211,102,0.3)" : isDirty ? "rgba(255,92,0,0.3)" : "#2C2C2C"}`,
                          cursor: isDirty ? "pointer" : "not-allowed",
                          fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap", marginTop: 1,
                          transition: "all 0.2s",
                        }}>
                        {saving[k] ? "…" : saved[k] ? "✓ Saved" : "Save"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Add custom field */}
          {addingField ? (
            <div style={{ background: "#181818", border: "1px solid #FF5C00", padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#FF5C00", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>Add New Field</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr auto", gap: 12, alignItems: "end" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#888880", marginBottom: 6, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Section</div>
                  <input style={{ background: "#141414", border: "1px solid #2C2C2C", color: "#F5F2ED", padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif", width: "100%" }} placeholder="e.g. hero" value={newField.section} onChange={e => setNewField(p => ({ ...p, section: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#888880", marginBottom: 6, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Field Key</div>
                  <input style={{ background: "#141414", border: "1px solid #2C2C2C", color: "#F5F2ED", padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif", width: "100%" }} placeholder="e.g. body_7" value={newField.field} onChange={e => setNewField(p => ({ ...p, field: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#888880", marginBottom: 6, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Value</div>
                  <input style={{ background: "#141414", border: "1px solid #2C2C2C", color: "#F5F2ED", padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif", width: "100%" }} value={newField.value} onChange={e => setNewField(p => ({ ...p, value: e.target.value }))} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={addField} style={{ background: "#FF5C00", color: "#0A0A0A", padding: "10px 16px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>Add</button>
                  <button onClick={() => setAddingField(false)} style={{ background: "transparent", color: "#888880", padding: "10px 14px", fontSize: 13, border: "1px solid #333", cursor: "pointer" }}>✕</button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingField(true)} style={{ background: "transparent", border: "1px dashed #333", color: "#888880", padding: "16px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s" }}
              onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#FF5C00"; (e.currentTarget as HTMLButtonElement).style.color = "#FF5C00"; }}
              onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#333"; (e.currentTarget as HTMLButtonElement).style.color = "#888880"; }}>
              + Add Custom Field
            </button>
          )}
        </div>
      )}
    </div>
  );
}
