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

const rvm = [
  "Script writing and voice production",
  "Contact list targeting and setup",
  "Campaign scheduling and delivery",
  "Platform management — you never touch the tech",
  "Performance tracking and reporting",
  "Ongoing optimization to improve response rates",
];

const whatsapp = [
  "Custom AI agent build, setup, and training",
  "Qualification criteria based on your ideal client",
  "Full conversation flow design",
  "CRM integration and appointment scheduling",
  "Monitoring, management, and optimization",
];

export default function Services() {
  const cms = useCMS("home");
  return (
    <section id="services" style={{ background: "#0A0A0A", padding: "100px 48px" }}>
      <div className="reveal" style={{ maxWidth: 1200, margin: "0 auto 60px", textAlign: "center" }}>
        <div className="section-label" style={{ justifyContent: "center" }}>{cms("services","eyebrow","Our System")}</div>
        <h2 className="section-headline" style={{ textAlign: "center" }}>{cms("services","headline","ONE SYSTEM.\nTWO POWERFUL TOOLS.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}</h2>
        <p className="section-sub" style={{ margin: "0 auto", textAlign: "center" }}>{cms("services","subheadline","We handle everything — setup, scripting, targeting, execution, optimization. Your only job is showing up for the appointments we send you.")}</p>
      </div>

      <div className="reveal" style={{
        maxWidth: 1200, margin: "0 auto",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 2, background: "#222222",
      }}>
        {/* RVM */}
        <div style={{ background: "#111111", padding: "56px 48px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#FF5C00" }} />
          <div style={{ position: "absolute", top: 20, right: 24, fontFamily: "'Bebas Neue',sans-serif", fontSize: 120, color: "rgba(255,92,0,0.06)", lineHeight: 1, pointerEvents: "none" }}>01</div>
          <div style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: "rgba(255,92,0,0.12)", color: "#FF5C00", padding: "6px 12px", borderRadius: 1, marginBottom: 24 }}>Tool #1 — Ringless Voicemail</div>
          <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, lineHeight: 1, color: "#F5F2ED", marginBottom: 20, letterSpacing: 0.5 }}>{cms("services","rvm_title","WE DROP YOUR VOICE STRAIGHT INTO THEIR INBOX.")}</h3>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#888880", marginBottom: 32, fontWeight: 300 }}>{cms("services","rvm_body","Your message lands directly in their voicemail — without their phone ever ringing. No interruption. No friction. They listen when they're ready, already hearing your voice, your offer, your business.")}</p>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginBottom: 36, padding: 0 }}>
            {rvm.map((item) => (
              <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 14, color: "#F5F2ED", fontWeight: 300 }}>
                <span style={{ color: "#FF5C00", flexShrink: 0 }}>→</span>{item}
              </li>
            ))}
          </ul>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5, color: "#FF5C00", paddingTop: 24, borderTop: "1px solid #222222" }}>{cms("services","rvm_result","THE RESULT: Warm prospects calling YOU back — already familiar with your name and offer.")}</div>
        </div>

        {/* WhatsApp */}
        <div style={{ background: "#111111", padding: "56px 48px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #25D366, #128C7E)" }} />
          <div style={{ position: "absolute", top: 20, right: 24, fontFamily: "'Bebas Neue',sans-serif", fontSize: 120, color: "rgba(255,92,0,0.06)", lineHeight: 1, pointerEvents: "none" }}>02</div>
          <div style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: "rgba(37,211,102,0.1)", color: "#25D366", padding: "6px 12px", borderRadius: 1, marginBottom: 24 }}>Tool #2 — AI WhatsApp Agent</div>
          <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, lineHeight: 1, color: "#F5F2ED", marginBottom: 20, letterSpacing: 0.5 }}>{cms("services","wa_title","YOUR AI AGENT WORKS LEADS 24/7 SO YOU DON'T HAVE TO.")}</h3>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#888880", marginBottom: 32, fontWeight: 300 }}>{cms("services","wa_body","WhatsApp has a 98% message open rate. Our AI agent engages leads the moment they respond, asks the right qualifying questions, filters out the tire-kickers, and delivers only serious, appointment-ready prospects to you.")}</p>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginBottom: 36, padding: 0 }}>
            {whatsapp.map((item) => (
              <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 14, color: "#F5F2ED", fontWeight: 300 }}>
                <span style={{ color: "#25D366", flexShrink: 0 }}>→</span>{item}
              </li>
            ))}
          </ul>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5, color: "#25D366", paddingTop: 24, borderTop: "1px solid #222222" }}>{cms("services","wa_result","THE RESULT: A qualification machine that hands you pre-vetted, motivated prospects ready to buy.")}</div>
        </div>
      </div>
    </section>
  );
}
