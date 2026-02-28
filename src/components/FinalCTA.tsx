"use client";
import { useState, useEffect } from "react";

type PC = Record<string, Record<string, string>>;
function useCMS(page: string) {
  const [c, setC] = useState<PC>({});
  useEffect(() => {
    fetch(`/api/admin/page-content?page=${page}`)
      .then(r => r.json())
      .then(j => {
        const out: PC = {};
        for (const row of (j.data ?? [])) {
          if (!out[row.section]) out[row.section] = {};
          out[row.section][row.field] = row.value;
        }
        setC(out);
      })
      .catch(() => {});
  }, [page]);
  return (section: string, field: string, fallback: string) => c?.[section]?.[field] ?? fallback;
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2,
  padding: "12px 16px", color: "#F5F2ED", fontSize: 15,
  fontFamily: "'DM Sans',sans-serif", outline: "none",
  marginBottom: 16, boxSizing: "border-box",
};

export default function FinalCTA() {
  const cms = useCMS("home");
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", business_type: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" style={{
      background: "#111111", padding: "140px 48px",
      textAlign: "center", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, rgba(255,92,0,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div className="reveal" style={{ position: "relative", zIndex: 1 }}>
        <div className="section-label" style={{ justifyContent: "center" }}>{cms("final_cta","eyebrow","Ready?")}</div>
        <h2 style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "clamp(56px, 8vw, 120px)",
          lineHeight: 0.9, color: "#F5F2ED",
          marginBottom: 24, letterSpacing: 1,
        }}>
          {cms("final_cta","headline","STOP WAITING\nFOR LEADS.\nSTART GETTING THEM.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
        </h2>
        <p style={{ fontSize: 18, color: "#888880", maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.6, fontWeight: 300 }}>
          {cms("final_cta","subheadline","Book a free strategy call and we'll show you exactly how to put this system to work — in days, not months. No pressure. No hard sell.")}
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 60 }}>
          <a href="#" className="btn-primary">Book My Free Strategy Call →</a>
          <a href="#" className="btn-secondary">Chat With Us On WhatsApp →</a>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} style={{
            maxWidth: 480, margin: "0 auto",
            background: "#181818", border: "1px solid #222222",
            borderRadius: 4, padding: "40px 36px", textAlign: "left",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#FF5C00", marginBottom: 20 }}>Or get a callback</div>

            <input
              required placeholder="Full Name *" style={inputStyle}
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <input
              required type="email" placeholder="Email Address *" style={inputStyle}
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            />
            <input
              placeholder="WhatsApp Number" style={inputStyle}
              value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })}
            />
            <select
              required style={{ ...inputStyle, marginBottom: 24 }}
              value={form.business_type} onChange={e => setForm({ ...form, business_type: e.target.value })}
            >
              <option value="">Business Type *</option>
              {["Real Estate", "Finance / Insurance", "Professional Services", "Home Services", "Coaching / Consulting", "Healthcare", "Other"].map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>

            {error && (
              <div style={{ fontSize: 13, color: "#FF5C00", marginBottom: 16, padding: "10px 14px", background: "rgba(255,92,0,0.08)", borderRadius: 2 }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading} className="btn-primary"
              style={{ width: "100%", textAlign: "center", fontSize: 16, opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer" }}
            >
              {loading ? "Sending…" : "Request a Callback →"}
            </button>
          </form>
        ) : (
          <div style={{
            maxWidth: 480, margin: "0 auto",
            background: "#181818", border: "1px solid rgba(255,92,0,0.3)",
            borderRadius: 4, padding: "40px 36px", textAlign: "center",
          }}>
            <div style={{ fontSize: 48, color: "#FF5C00", marginBottom: 12 }}>✓</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: "#FF5C00", marginBottom: 12 }}>YOU&apos;RE IN!</div>
            <p style={{ fontSize: 15, color: "#888880", fontWeight: 300, lineHeight: 1.6 }}>
              We&apos;ll be in touch within 24 hours to schedule your free strategy call.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
