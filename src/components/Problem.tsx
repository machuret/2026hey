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

const pills = [
  { icon: "📞", title: "Cold Calling", desc: "80% of calls go straight to voicemail. Nobody picks up unknown numbers anymore." },
  { icon: "💸", title: "Paid Ads", desc: "Rising CPCs, blind audiences, and inconsistent returns are draining budgets fast." },
  { icon: "📧", title: "Email Marketing", desc: "Average open rates are below 22%. Most messages never get seen." },
  { icon: "🎯", title: "Hey More Leads", desc: "Reach real prospects. Qualify them automatically. Receive appointments.", highlight: true },
];

export default function Problem() {
  const cms = useCMS("home");
  return (
    <section className="reveal" style={{ background: "#111111", padding: "100px 48px", position: "relative", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", maxWidth: 1200, margin: "0 auto" }}>
        <div>
          <div className="section-label">{cms("problem","eyebrow","The Problem")}</div>
          <h2 className="section-headline">{cms("problem","headline","COLD CALLS GET IGNORED.\nADS ARE EXPENSIVE.\nEMAIL IS DEAD.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}</h2>
          <div style={{ fontSize: 17, lineHeight: 1.8, color: "#888880", fontWeight: 300 }}>
            <p style={{ marginBottom: 20 }}>{cms("problem","body_1","You're running a business. You don't have time to chase prospects who don't pick up, scroll past your ads, or delete your emails without reading them.")}</p>
            <p style={{ marginBottom: 20 }}>{cms("problem","body_2","The old playbook is broken. Your competitors are still using it. That means right now — while you're reading this — there's a gap wide open for businesses willing to reach people the right way.")}</p>
            <p>{cms("problem","body_3","That's exactly what we built Hey More Leads to do.")}</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {pills.map((p) => (
            <div key={p.title} style={{
              display: "flex", alignItems: "center", gap: 20,
              padding: "20px 24px", background: "#181818",
              border: "1px solid #222222",
              borderLeft: `3px solid ${p.highlight ? "#FF7A25" : "#FF5C00"}`,
              borderRadius: 2, transition: "border-color 0.2s",
            }}>
              <div style={{
                width: 44, height: 44, background: "rgba(255,92,0,0.1)",
                borderRadius: 2, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 20, flexShrink: 0,
              }}>{p.icon}</div>
              <div>
                <strong style={{ display: "block", fontSize: 15, color: "#F5F2ED", marginBottom: 4, fontWeight: 500 }}>{p.title}</strong>
                <span style={{ fontSize: 13, color: "#888880", fontWeight: 300 }}>{p.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
