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

const CYCLING_WORDS = ["VOICEMAIL.", "PIPELINE.", "INBOX.", "CALLBACK.", "RESULTS."];

function CyclingWord() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const outTimer = setTimeout(() => setPhase("out"), 2200);
    const nextTimer = setTimeout(() => {
      setIndex(i => (i + 1) % CYCLING_WORDS.length);
      setPhase("in");
    }, 2600);
    return () => { clearTimeout(outTimer); clearTimeout(nextTimer); };
  }, [index]);

  return (
    <span style={{ position: "relative", display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}>
      <span style={{ visibility: "hidden", display: "inline-block" }}>VOICEMAIL.</span>
      <span key={index} className={phase === "in" ? "word-in" : "word-out"} style={{
        position: "absolute", left: 0, top: 0, color: "#FF5C00", whiteSpace: "nowrap",
      }}>
        {CYCLING_WORDS[index]}
      </span>
    </span>
  );
}

const PROOF_STATS = [
  { num: "247", label: "Voicemails delivered\ntoday — live", live: true },
  { num: "98%", label: "WhatsApp open rate\nvs 20% for email", live: false },
  { num: "13%", label: "Avg callback rate\nvs 4% cold calling", live: false },
  { num: "100%", label: "Done for you —\nstart to finish", live: false },
];

export default function Hero() {
  const cms = useCMS("home");
  return (
    <section style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "140px 48px 0",
      position: "relative",
      overflow: "hidden",
      background: "#0A0A0A",
    }}>
      {/* Centered radial glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 900, height: 900,
        background: "radial-gradient(circle, rgba(255,92,0,0.09) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* Subtle grid lines */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,92,0,0.04) 1px, transparent 1px)",
        backgroundSize: "100% 80px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
      }} />

      {/* Eyebrow — lines both sides */}
      <div className="anim-fade-up" style={{
        display: "inline-flex", alignItems: "center", gap: 14,
        fontSize: 12, fontWeight: 600, letterSpacing: 3,
        textTransform: "uppercase", color: "#FF5C00", marginBottom: 32,
        position: "relative",
      }}>
        <span style={{ display: "block", width: 40, height: 1, background: "#FF5C00", opacity: 0.6 }} />
        {cms("hero", "eyebrow", "Done-For-You Lead Generation")}
        <span style={{ display: "block", width: 40, height: 1, background: "#FF5C00", opacity: 0.6 }} />
      </div>

      {/* Headline */}
      <h1 className="anim-fade-up-1" style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "clamp(72px, 11vw, 148px)",
        lineHeight: 0.88,
        letterSpacing: 2,
        color: "#F5F2ED",
        marginBottom: 0,
        maxWidth: 1100,
        position: "relative",
      }}>
        YOUR NEXT 10 CLIENTS<br />
        ARE IN A{" "}
        <span style={{ position: "relative", display: "inline-block" }}>
          <CyclingWord />
          <span style={{
            position: "absolute", bottom: 6, left: 0, right: 0,
            height: 4, background: "#FF5C00", opacity: 0.35,
            pointerEvents: "none",
          }} />
        </span>
      </h1>

      {/* Subheadline */}
      <p className="anim-fade-up-2" style={{
        fontSize: 19, lineHeight: 1.65, color: "#888880",
        maxWidth: 580, margin: "36px auto 52px", fontWeight: 300,
        position: "relative",
      }}>
        {cms("hero", "subheadline", "We combine Ringless Voicemail Drops and AI-powered WhatsApp Agents to fill your pipeline with appointment-ready prospects — without you lifting a finger.")}
      </p>

      {/* CTAs */}
      <div className="anim-fade-up-3" style={{
        display: "flex", gap: 16, flexWrap: "wrap",
        justifyContent: "center", position: "relative", marginBottom: 80,
      }}>
        <a href="#contact" className="btn-primary">{cms("hero", "cta_primary", "Get More Leads Now →")}</a>
        <a href="#how" className="btn-secondary">{cms("hero", "cta_secondary", "See How It Works")}</a>
      </div>

      {/* Proof stats row */}
      <div className="anim-fade-in" style={{
        display: "flex", alignItems: "stretch",
        background: "#181818", border: "1px solid rgba(255,92,0,0.15)",
        position: "relative",
      }}>
        {PROOF_STATS.map((stat, i) => (
          <div key={i} style={{
            padding: "20px 36px", display: "flex", flexDirection: "column", gap: 4,
            borderRight: i < PROOF_STATS.length - 1 ? "1px solid rgba(255,92,0,0.1)" : "none",
            minWidth: 160, textAlign: "left",
          }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, lineHeight: 1,
              color: "#FF5C00", letterSpacing: -0.5,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              {stat.live && (
                <span className="anim-blink" style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#4ADE80", flexShrink: 0,
                  boxShadow: "0 0 6px #4ADE80", display: "inline-block",
                }} />
              )}
              {stat.num}
            </div>
            <div style={{ fontSize: 11, color: "#888880", fontWeight: 300, lineHeight: 1.4, whiteSpace: "pre-line" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
