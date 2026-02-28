"use client";
import { useEffect, useState } from "react";

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

export default function Hero() {
  const cms = useCMS("home");
  return (
    <section style={{
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      alignItems: "center",
      padding: "120px 48px 80px",
      position: "relative",
      overflow: "hidden",
      background: "#0A0A0A",
    }}>
      {/* Glow */}
      <div style={{
        position: "absolute", right: -100, top: "50%", transform: "translateY(-50%)",
        width: 700, height: 700,
        background: "radial-gradient(circle, rgba(255,92,0,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* LEFT — CONTENT */}
      <div>
        <div className="anim-fade-up" style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          fontSize: 12, fontWeight: 600, letterSpacing: 2,
          textTransform: "uppercase", color: "#FF5C00", marginBottom: 24,
        }}>
          <span style={{ display: "block", width: 32, height: 2, background: "#FF5C00" }} />
          {cms("hero","eyebrow","Done-For-You Lead Generation")}
        </div>

        <h1 className="anim-fade-up-1" style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(64px, 8vw, 110px)",
          lineHeight: 0.92,
          letterSpacing: 1,
          color: "#F5F2ED",
          marginBottom: 32,
        }}>
          {cms("hero","headline","YOUR NEXT\n10 CLIENTS\nARE IN A\nVOICEMAIL.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
        </h1>

        <p className="anim-fade-up-2" style={{
          fontSize: 18, lineHeight: 1.6, color: "#888880",
          maxWidth: 480, marginBottom: 48, fontWeight: 300,
        }}>
          {cms("hero","subheadline","We combine Ringless Voicemail Drops and AI-powered WhatsApp Agents to fill your pipeline with appointment-ready prospects — without you lifting a finger.")}
        </p>

        <div className="anim-fade-up-3" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <a href="#contact" className="btn-primary">{cms("hero","cta_primary","Get More Leads Now →")}</a>
          <a href="#how" className="btn-secondary">{cms("hero","cta_secondary","See How It Works")}</a>
        </div>
      </div>

      {/* RIGHT — DASHBOARD CARD */}
      <div className="anim-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
        <div style={{
          background: "#181818", border: "1px solid rgba(255,92,0,0.2)",
          borderRadius: 4, padding: 32, width: 340, position: "relative",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#FF5C00" }} />
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#FF5C00", marginBottom: 20 }}>Live Campaign Dashboard</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 24 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, lineHeight: 1, color: "#F5F2ED" }}>247</div>
            <div style={{ fontSize: 14, color: "#888880", fontWeight: 300 }}>voicemails<br />delivered today</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { color: "#FF5C00", text: "RVM drop delivered — Michael T.", time: "2m ago", cls: "anim-pulse" },
              { color: "#4ADE80", text: "WhatsApp lead qualified ✓", time: "6m ago", cls: "anim-pulse-1" },
              { color: "#60A5FA", text: "Appointment booked — Sarah K.", time: "12m ago", cls: "anim-pulse-2" },
            ].map((item, i) => (
              <div key={i} className={item.cls} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", background: "#222222", borderRadius: 2,
                fontSize: 13, color: "#F5F2ED",
              }}>
                <div className="anim-blink" style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                <span>{item.text}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#888880" }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating badges */}
        <div className="anim-float" style={{
          position: "absolute", top: -30, right: -60,
          background: "#181818", border: "1px solid rgba(255,92,0,0.2)",
          borderRadius: 4, padding: "14px 18px", fontSize: 12, whiteSpace: "nowrap",
        }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#FF5C00", display: "block", lineHeight: 1 }}>94%</span>
          <span style={{ fontSize: 11, color: "#888880", display: "block", marginTop: 2 }}>Listen Rate</span>
        </div>
        <div className="anim-float-delayed" style={{
          position: "absolute", bottom: -30, left: -60,
          background: "#181818", border: "1px solid rgba(255,92,0,0.2)",
          borderRadius: 4, padding: "14px 18px", fontSize: 12, whiteSpace: "nowrap",
        }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#FF5C00", display: "block", lineHeight: 1 }}>3.2×</span>
          <span style={{ fontSize: 11, color: "#888880", display: "block", marginTop: 2 }}>Avg ROI</span>
        </div>
      </div>
    </section>
  );
}
