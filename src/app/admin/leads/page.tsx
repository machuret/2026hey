"use client";
import { useEffect, useState, useCallback } from "react";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  business?: string;
  industry?: string;
  package?: string;
  message?: string;
  status: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  new: "#FF5C00",
  contacted: "#F59E0B",
  qualified: "#25D366",
  closed: "#888880",
  lost: "#EF4444",
};

const STATUSES = ["all", "new", "contacted", "qualified", "closed", "lost"];
const INDUSTRIES = ["all", "real-estate", "home-services", "insurance", "financial-services", "coaching", "web-design", "b2b-services", "other"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status !== "all") params.set("status", status);
    if (industry !== "all") params.set("industry", industry);
    const res = await fetch(`/api/admin/leads?${params}`);
    const json = await res.json();
    setLeads(json.data ?? []);
    setCount(json.count ?? 0);
    setLoading(false);
  }, [page, status, industry]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, newStatus: string) {
    await fetch("/api/admin/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: newStatus }) });
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);
    load();
  }

  async function deleteLead(id: string) {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    await fetch("/api/admin/leads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setSelected(null);
    load();
  }

  function exportCSV() {
    const headers = ["Name", "Email", "Phone", "Business", "Industry", "Package", "Status", "Date", "Message"];
    const rows = leads.map(l => [l.name, l.email, l.phone ?? "", l.business ?? "", l.industry ?? "", l.package ?? "", l.status, new Date(l.created_at).toLocaleDateString(), (l.message ?? "").replace(/,/g, ";")]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "leads.csv"; a.click();
  }

  const totalPages = Math.ceil(count / 20);

  const S: React.CSSProperties = { fontFamily: "'DM Sans',sans-serif", color: "#F5F2ED" };
  const inputS: React.CSSProperties = { background: "#141414", border: "1px solid #2C2C2C", color: "#F5F2ED", padding: "8px 14px", fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif" };

  return (
    <div style={{ padding: "40px 48px", ...S }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, letterSpacing: 1, lineHeight: 1 }}>Leads</h1>
          <p style={{ fontSize: 14, color: "#888880", marginTop: 6, fontWeight: 300 }}>{count} total submissions</p>
        </div>
        <button onClick={exportCSV} style={{ background: "#222222", border: "1px solid #333", color: "#F5F2ED", padding: "10px 20px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
          ⬇ Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "#888880" }}>Status:</span>
          <div style={{ display: "flex", gap: 0 }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => { setStatus(s); setPage(1); }} style={{ ...inputS, background: status === s ? "#FF5C00" : "#141414", color: status === s ? "#0A0A0A" : "#888880", fontWeight: status === s ? 600 : 400, padding: "7px 14px", cursor: "pointer", borderRight: "none", textTransform: "capitalize" }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 16, alignItems: "start" }}>
        {/* Table */}
        <div style={{ background: "#181818", border: "1px solid #222222", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#888880" }}>Loading...</div>
          ) : leads.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#888880" }}>No leads found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#222222" }}>
                  {["Name", "Business", "Package", "Industry", "Status", "Date"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "#888880" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => (
                  <tr key={lead.id}
                    onClick={() => setSelected(selected?.id === lead.id ? null : lead)}
                    style={{ borderBottom: "1px solid #222222", cursor: "pointer", background: selected?.id === lead.id ? "rgba(255,92,0,0.06)" : i % 2 === 0 ? "#181818" : "#1a1a1a", transition: "background 0.15s" }}
                    onMouseOver={e => { if (selected?.id !== lead.id) (e.currentTarget as HTMLTableRowElement).style.background = "#1e1e1e"; }}
                    onMouseOut={e => { if (selected?.id !== lead.id) (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? "#181818" : "#1a1a1a"; }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#F5F2ED" }}>{lead.name}</div>
                      <div style={{ fontSize: 12, color: "#888880", marginTop: 2 }}>{lead.email}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#888880" }}>{lead.business || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#F5F2ED" }}>{lead.package || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#888880", textTransform: "capitalize" }}>{(lead.industry || "—").replace(/-/g, " ")}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "3px 10px", background: `${STATUS_COLORS[lead.status] || "#888880"}18`, color: STATUS_COLORS[lead.status] || "#888880", borderRadius: 2 }}>{lead.status}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#888880" }}>{new Date(lead.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: "16px 20px", borderTop: "1px solid #222222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#888880" }}>Page {page} of {totalPages}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ ...inputS, cursor: "pointer", opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ ...inputS, cursor: "pointer", opacity: page === totalPages ? 0.4 : 1 }}>Next →</button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: "#181818", border: "1px solid #222222", borderTop: "3px solid #FF5C00", padding: 28, position: "sticky", top: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 0.5, color: "#F5F2ED" }}>{selected.name}</div>
                <div style={{ fontSize: 13, color: "#888880", marginTop: 2 }}>{selected.email}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#888880", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>

            {[
              { label: "Business", value: selected.business },
              { label: "Phone", value: selected.phone },
              { label: "Industry", value: selected.industry?.replace(/-/g, " ") },
              { label: "Package", value: selected.package },
              { label: "Date", value: new Date(selected.created_at).toLocaleString() },
            ].map(f => f.value ? (
              <div key={f.label} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #222222" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#888880", marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 14, color: "#F5F2ED", textTransform: "capitalize" }}>{f.value}</div>
              </div>
            ) : null)}

            {selected.message && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#888880", marginBottom: 8 }}>Message</div>
                <div style={{ fontSize: 13, color: "#888880", lineHeight: 1.6, background: "#141414", padding: 14, border: "1px solid #222222" }}>{selected.message}</div>
              </div>
            )}

            {/* Status update */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#888880", marginBottom: 8 }}>Update Status</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {STATUSES.filter(s => s !== "all").map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", background: selected.status === s ? STATUS_COLORS[s] : "transparent", color: selected.status === s ? "#0A0A0A" : STATUS_COLORS[s] || "#888880", border: `1px solid ${STATUS_COLORS[s] || "#444"}` }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => deleteLead(selected.id)} style={{ width: "100%", padding: "10px", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              Delete Lead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
