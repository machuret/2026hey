"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

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
import Footer from "@/components/Footer";

const compareRows = [
  { feat: "Getting Started", human: "3–6 weeks to recruit and onboard", ai: "Live within 5–7 business days" },
  { feat: "Cost Structure", human: "% of revenue — rises as you scale", ai: "Fixed monthly rate — predictable, always" },
  { feat: "Training Required", human: "10–30 hours of your time upfront", ai: "Zero training time from you — we handle it" },
  { feat: "Script Accuracy", human: "Improvised, distorted, inconsistent", ai: "100% faithful to your message every time" },
  { feat: "Availability", human: "9am–6pm, weekdays only", ai: "24/7 — every timezone, no exceptions" },
  { feat: "Response Time", human: "Minutes to hours — if they remember", ai: "Under 30 seconds — every single time" },
  { feat: "Staff Turnover", human: "Frequent — train, lose, repeat", ai: "Absolute stability — it never quits" },
  { feat: "Error Rate", human: "Bad days, bad moods, missed details", ai: "Zero errors — same quality, every conversation" },
];

const features = [
  { icon: "🤖", title: "Custom AI Agent Build", body: "Your agent is built from scratch — trained on your offer, your ideal client, your tone, and your qualification criteria. Not a generic chatbot. A purpose-built closer that sounds like the best version of your sales team.", tag: "Core", accent: false },
  { icon: "⚡", title: "Real-Time WhatsApp Automation", body: "Every message receives a response in under 30 seconds — with a natural, human-like tone that feels like a conversation, not a chatbot. Prospects regularly don't realise they're talking to AI until the appointment is already booked.", tag: "Core", accent: false },
  { icon: "🎯", title: "Lead Qualification Engine", body: "The agent asks smart sales questions, handles objections, and applies your exact qualification criteria to every conversation. Only prospects who clear every gate make it through to your calendar. Everyone else is politely redirected.", tag: "Core", accent: false },
  { icon: "📅", title: "Booking System Integration", body: "Connects directly with Calendly, Tidycal, and most major scheduling tools. Qualified leads book their own appointments inside the WhatsApp conversation. No back-and-forth. No manual scheduling. No no-shows from \"I'll book later.\"", tag: "Included", accent: false },
  { icon: "🔗", title: "Webhooks & Lead Capture", body: "Connect your existing lead capture forms — Systeme.io, Shopify, WordPress, Facebook Lead Ads, and more. Every lead that hits your funnel gets instantly routed to the agent for immediate follow-up. Zero leads slip through.", tag: "Integration", accent: true },
  { icon: "📊", title: "Centralised Dashboard", body: "All conversations, KPIs, reply rates, qualification rates, and conversion data in one place. You see exactly what the agent is doing, how leads are responding, and where results are improving — without digging through chat histories manually.", tag: "Reporting", accent: false },
  { icon: "🔄", title: "Automated Follow-Up Sequences", body: "Leads who don't respond to the first message get smart, timed follow-ups that re-engage them without feeling spammy. We configure the timing, tone, and triggers — so no warm lead ever truly goes cold.", tag: "Automation", accent: false },
  { icon: "📤", title: "CSV & Google Sheets Import", body: "Already have a lead list? Import contacts directly via CSV or Google Sheets and the agent kicks off outbound WhatsApp conversations automatically. Turn a cold list into live conversations without lifting a finger.", tag: "Outbound", accent: true },
  { icon: "🧪", title: "Agent Testing & Refinement", body: "Before going live, every agent goes through our testing process — simulated conversations, edge case handling, and response quality checks. We only activate when we're confident the agent is performing at the level your leads deserve.", tag: "Quality", accent: false },
];

const steps = [
  { num: "01", icon: "⚡", title: "Instant Engagement", body: "The moment a lead messages your WhatsApp number — from an ad, your website, a referral, anywhere — the agent responds in under 30 seconds with a warm, natural opening. No delay. No missed opportunities. No leads going cold.", accent: false },
  { num: "02", icon: "🎯", title: "Smart Qualification", body: "The agent guides a real conversation — asking intelligent questions, handling objections naturally, and gathering the information you need. Budget, timeline, decision-making authority, project scope — all collected before a human gets involved.", accent: false },
  { num: "03", icon: "📅", title: "Automatic Booking", body: "Qualified leads are presented with your available appointment slots and book directly into your calendar — Calendly, Tidycal, or whichever scheduling tool you use. The appointment arrives pre-loaded with everything you need to know about the prospect.", accent: false },
  { num: "04", icon: "🏆", title: "You Close The Deal", body: "You show up to a call with a warm, qualified, appointment-ready prospect who already understands what you do and wants to move forward. Your only job is to close. That's it.", accent: true },
];

/* ── colours ── */
const G = "#25D366";
const O = "#FF5C00";
const BG = "#0A0A0A";
const DARK = "#0D1410";
const DARK2 = "#131A16";
const DARK3 = "#1C2420";
const DARK4 = "#243029";
const WHITE = "#F0F7F3";
const MUTED = "#7A9186";

export default function WhatsAppAgentPage() {
  const cms = useCMS("whatsapp");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.07 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: BG, color: WHITE, fontFamily: "'DM Sans',sans-serif" }}>
      <Navbar activePage="whatsapp-agent" />

      {/* ── HERO ── */}
      <section className="hero-2col" style={{
        minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr",
        alignItems: "center", padding: "120px 64px 80px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Centered radial glow */}
        <div style={{ position: "absolute", top: "50%", left: "40%", transform: "translate(-50%,-50%)", width: 900, height: 900, background: `radial-gradient(circle, rgba(37,211,102,0.08) 0%, transparent 65%)`, pointerEvents: "none" }} />
        {/* Subtle grid lines */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(37,211,102,0.03) 1px, transparent 1px)", backgroundSize: "100% 80px", maskImage: "radial-gradient(ellipse 80% 80% at 40% 50%, black 40%, transparent 100%)" }} />

        {/* Left copy */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          {/* Eyebrow — line left + right */}
          <div className="anim-fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 14, fontSize: 12, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: G, marginBottom: 28 }}>
            <span style={{ display: "block", width: 40, height: 1, background: G, opacity: 0.6 }} />
            {cms("hero","eyebrow","AI WhatsApp Agent")}
            <span style={{ display: "block", width: 40, height: 1, background: G, opacity: 0.6 }} />
          </div>
          <h1 className="anim-fade-up-1" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(64px,8vw,118px)", lineHeight: 0.88, letterSpacing: 1.5, color: WHITE, marginBottom: 28 }}>
            {cms("hero","headline","WHILE YOU\nSLEEP, IT\nQUALIFIES.\nCONVERTS.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
          </h1>
          {/* Accent underline bar */}
          <div style={{ width: 80, height: 3, background: G, opacity: 0.5, marginBottom: 28 }} />
          <p className="anim-fade-up-2" style={{ fontSize: 17, lineHeight: 1.7, color: MUTED, maxWidth: 460, marginBottom: 44, fontWeight: 300 }}>
            {cms("hero","subheadline","Your competitors are losing leads to slow response times and unqualified conversations. Our AI WhatsApp Agent responds in under 30 seconds, qualifies every prospect, and delivers appointment-ready leads directly to your calendar — 24 hours a day, 7 days a week.")}
          </p>
          <div className="anim-fade-up-3" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <a href="/#contact" style={{ background: G, color: BG, padding: "16px 40px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", textDecoration: "none", clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))", display: "inline-block" }}>Deploy My Agent →</a>
            <a href="#how-it-works" style={{ background: "transparent", color: WHITE, padding: "16px 40px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 19, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", textDecoration: "none", border: "1px solid rgba(37,211,102,0.3)", display: "inline-block", transition: "border-color 0.2s, color 0.2s" }}>See How It Works</a>
          </div>
        </div>

        {/* Right — chat mockup */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
          {/* Float badges */}
          <div className="float-badge" style={{ position: "absolute", top: -20, left: -60, background: DARK2, border: `1px solid rgba(37,211,102,0.25)`, borderRadius: 6, padding: "12px 16px", fontSize: 12, whiteSpace: "nowrap", animation: "float 4s ease-in-out infinite" }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: G, display: "block", lineHeight: 1 }}>&lt;30s</span>
            <span style={{ fontSize: 11, color: MUTED, display: "block", marginTop: 2 }}>Average response time</span>
          </div>
          <div className="float-badge" style={{ position: "absolute", bottom: -20, right: -60, background: DARK2, border: `1px solid rgba(37,211,102,0.25)`, borderRadius: 6, padding: "12px 16px", fontSize: 12, whiteSpace: "nowrap", animation: "float 4s ease-in-out 2s infinite" }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, color: G, display: "block", lineHeight: 1 }}>77%</span>
            <span style={{ fontSize: 11, color: MUTED, display: "block", marginTop: 2 }}>Lead reply rate</span>
          </div>

          {/* Chat window */}
          <div className="hero-mockup" style={{ background: DARK2, border: `1px solid rgba(37,211,102,0.25)`, borderRadius: 12, width: 340, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(37,211,102,0.08)" }}>
            {/* Header */}
            <div style={{ background: DARK3, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${DARK4}` }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, boxShadow: "0 0 12px rgba(37,211,102,0.4)" }}>🤖</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: WHITE }}>Hey More Leads — AI Agent</div>
                <div style={{ fontSize: 11, color: G, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ display: "block", width: 6, height: 6, background: G, borderRadius: "50%" }} />Online now
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12, background: DARK }}>
              {[
                { side: "them", text: "Hi, I saw your ad — how does your service work?", time: "2:41 PM" },
                { side: "us", text: "Hey! Great to hear from you 👋 I'd love to tell you more. To make sure we're a good fit — what type of business are you running?", time: "2:41 PM · Delivered in 18s" },
                { side: "them", text: "We run a roofing company in Denver, about 12 employees.", time: "2:43 PM" },
                { side: "us", text: "Perfect — home services is one of our strongest verticals. Are you currently running any outreach campaigns, or is most of your business from referrals?", time: "2:43 PM" },
                { side: "them", text: "Mostly referrals. We want to grow but don't know where to start.", time: "2:45 PM" },
              ].map((m, i) => (
                <div key={i} style={{ maxWidth: "85%", alignSelf: m.side === "them" ? "flex-start" : "flex-end" }}>
                  <div style={{
                    padding: "10px 14px", borderRadius: m.side === "them" ? "2px 8px 8px 8px" : "8px 2px 8px 8px",
                    fontSize: 13, lineHeight: 1.5, fontWeight: 300,
                    background: m.side === "them" ? DARK3 : "rgba(37,211,102,0.18)",
                    color: WHITE,
                    border: m.side === "us" ? "1px solid rgba(37,211,102,0.2)" : "none",
                  }}>{m.text}</div>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 4, textAlign: m.side === "us" ? "right" : "left" }}>{m.time}</div>
                </div>
              ))}
              {/* Typing indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: DARK3, padding: "10px 14px", borderRadius: "2px 8px 8px 8px", width: "fit-content" }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <span key={i} style={{ width: 6, height: 6, background: G, borderRadius: "50%", display: "block", animation: `bounce 1.2s ease ${d}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 16px", background: DARK2, borderTop: `1px solid ${DARK4}`, display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ flex: 1, background: DARK3, border: `1px solid ${DARK4}`, borderRadius: 20, padding: "8px 14px", fontSize: 12, color: MUTED }}>Type a message...</div>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer", flexShrink: 0 }}>➤</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="reveal" style={{ borderTop: `1px solid ${DARK3}`, borderBottom: `1px solid ${DARK3}`, display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: DARK3, gap: 1 }}>
        {[
          { num: "30s", label: "Average time to engage a new lead — day or night", orange: true },
          { num: "77%", label: "Reply rate from contacted leads vs under 20% for email", orange: false },
          { num: "5×", label: "More booked appointments compared to manual follow-up", orange: false },
          { num: "24/7", label: "Always on — every timezone, every hour, zero breaks", orange: false },
        ].map((s) => (
          <div key={s.num} style={{ background: DARK2, padding: "36px 32px", display: "flex", flexDirection: "column", gap: 8, borderLeft: s.orange ? `3px solid ${O}` : undefined }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 56, lineHeight: 1, color: s.orange ? O : G, letterSpacing: -1 }}>{s.num}</div>
            <div style={{ fontSize: 14, color: MUTED, fontWeight: 300, lineHeight: 1.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── WHY WHATSAPP ── */}
      <section style={{ background: DARK, padding: "100px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="reveal">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" as const, color: O, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              {cms("why","eyebrow","The Platform")}<span style={{ display: "block", height: 1, width: 40, background: O }} />
            </div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(40px,5vw,70px)", lineHeight: 0.95, color: WHITE, marginBottom: 20 }}>
              {cms("why","headline","WHY WHATSAPP IS THE\nMOST POWERFUL SALES CHANNEL\nNOBODY IS USING PROPERLY.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
            </h2>
          </div>
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", marginTop: 60 }}>
            <div style={{ fontSize: 17, lineHeight: 1.8, color: MUTED, fontWeight: 300 }}>
              <p style={{ marginBottom: 24 }}>{cms("why","body_1","Email open rates sit at 20% on a good day. Cold calls go unanswered 80% of the time. But WhatsApp? 98% open rate. 45–60% click-through rate. 2.6 billion active users.")}</p>
              <p style={{ marginBottom: 24 }}>{cms("why","body_2","The problem isn't the platform. The problem is that most businesses either ignore it entirely, or they try to manage it manually — and manual doesn't scale.")}</p>
              <p>{cms("why","body_3","Our AI WhatsApp Agent solves this. It engages every lead the moment they reach out — with a natural, human-feeling conversation that qualifies them in real time.")}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, background: DARK3 }}>
              {[
                { num: "98%", label: "Message open rate — compared to 20% for email", orange: true },
                { num: "60%", label: "Average click-through rate on WhatsApp messages", orange: false },
                { num: "2.6B+", label: "Active users globally — your prospects are already there", orange: false },
                { num: "70%", label: "Engagement rate — higher than any other messaging platform", orange: false },
              ].map((s) => (
                <div key={s.num} style={{ background: DARK2, padding: "32px 28px", position: "relative", overflow: "hidden" }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, lineHeight: 1, color: s.orange ? O : G, marginBottom: 8 }}>{s.num}</div>
                  <div style={{ fontSize: 13, color: MUTED, fontWeight: 300, lineHeight: 1.4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HUMAN VS AI COMPARISON ── */}
      <section style={{ background: BG, padding: "100px 48px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="reveal">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" as const, color: G, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              {cms("comparison","eyebrow","The Honest Comparison")}<span style={{ display: "block", height: 1, width: 40, background: G }} />
            </div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(40px,5vw,70px)", lineHeight: 0.95, color: WHITE, marginBottom: 20 }}>
              {cms("comparison","headline","BY THE TIME YOU TRAIN\nA SALES REP, YOU'VE ALREADY\nLOST 40 LEADS.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
            </h2>
          </div>

          {/* Table header */}
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, background: DARK3, marginTop: 60 }}>
            <div style={{ background: DARK2, padding: "24px 28px", fontSize: 13, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase" as const, color: MUTED }}>What You&apos;re Comparing</div>
            <div style={{ background: DARK2, padding: "24px 28px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.5, color: WHITE }}>Human Setter</div>
            <div style={{ background: "rgba(37,211,102,0.08)", padding: "24px 28px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.5, color: G, borderTop: `2px solid ${G}`, display: "flex", alignItems: "center", gap: 10 }}>🤖 Hey More Leads AI Agent</div>
          </div>

          <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: 2, background: DARK3 }}>
            {compareRows.map((row) => (
              <div key={row.feat} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, background: DARK3 }}>
                <div style={{ background: DARK2, padding: "18px 28px", fontSize: 14, fontWeight: 500, color: WHITE, display: "flex", alignItems: "center" }}>{row.feat}</div>
                <div style={{ background: DARK2, padding: "18px 28px", fontSize: 14, color: MUTED, fontWeight: 300, lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ color: "#EF4444", fontSize: 16, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✗</span>{row.human}
                </div>
                <div style={{ background: "rgba(37,211,102,0.04)", padding: "18px 28px", fontSize: 14, color: WHITE, fontWeight: 300, lineHeight: 1.5, borderLeft: "1px solid rgba(37,211,102,0.12)", borderRight: "1px solid rgba(37,211,102,0.12)", display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ color: G, fontSize: 16, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>{row.ai}
                </div>
              </div>
            ))}
          </div>

          <div className="reveal" style={{ background: DARK3, padding: "24px 28px", borderLeft: `3px solid ${O}`, marginTop: 2, fontSize: 15, color: WHITE, fontWeight: 400, lineHeight: 1.6 }}>
{cms("comparison","bottom_note","The bottom line: a human setter costs more, takes longer to deploy, works shorter hours, and delivers inconsistent results. Our AI agent is live in days, costs a fixed rate, never takes a day off, and follows your qualification process perfectly — every time.")}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: DARK, padding: "100px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="reveal">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" as const, color: G, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              {cms("how_it_works","eyebrow","How It Works")}<span style={{ display: "block", height: 1, width: 40, background: G }} />
            </div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(40px,5vw,70px)", lineHeight: 0.95, color: WHITE, marginBottom: 20 }}>
              {cms("how_it_works","headline","FOUR STEPS FROM\nFIRST MESSAGE TO\nBOOKED APPOINTMENT.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
            </h2>
          </div>
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2, background: DARK3, marginTop: 60 }}>
            {steps.map((s) => (
              <div key={s.num} style={{ background: DARK2, padding: "36px 28px", position: "relative", overflow: "hidden", transition: "background 0.3s" }}
                onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.background = DARK4; }}
                onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = DARK2; }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 64, color: s.accent ? "rgba(255,92,0,0.1)" : "rgba(37,211,102,0.1)", lineHeight: 1, marginBottom: 16 }}>{s.num}</div>
                <span style={{ fontSize: 28, marginBottom: 16, display: "block" }}>{s.icon}</span>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 21, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.5, color: s.accent ? O : WHITE, marginBottom: 12 }}>{s.title}</div>
                <div style={{ fontSize: 13, lineHeight: 1.65, color: MUTED, fontWeight: 300 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background: BG, padding: "100px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="reveal">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" as const, color: G, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              {cms("features","eyebrow","What's Inside")}<span style={{ display: "block", height: 1, width: 40, background: G }} />
            </div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(40px,5vw,70px)", lineHeight: 0.95, color: WHITE, marginBottom: 20 }}>
              {cms("features","headline","EVERYTHING BUILT IN.\nNOTHING LEFT OUT.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
            </h2>
            <p style={{ fontSize: 16, color: MUTED, fontWeight: 300, lineHeight: 1.7, maxWidth: 580, marginTop: 12 }}>{cms("features","subheadline","Every AI agent we deploy is custom-built for your business — then backed by a full suite of tools that make the whole system run without you having to touch it.")}</p>
          </div>
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, background: DARK3, marginTop: 60 }}>
            {features.map((f) => (
              <div key={f.title} style={{ background: DARK2, padding: "36px 32px", position: "relative", overflow: "hidden", transition: "background 0.3s", cursor: "default" }}
                onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.background = DARK4; }}
                onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = DARK2; }}>
                <span style={{ fontSize: 32, marginBottom: 18, display: "block", filter: f.accent ? "drop-shadow(0 0 8px rgba(255,92,0,0.3))" : "drop-shadow(0 0 8px rgba(37,211,102,0.3))" }}>{f.icon}</span>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.5, color: WHITE, marginBottom: 10 }}>{f.title}</div>
                <div style={{ fontSize: 13, lineHeight: 1.65, color: MUTED, fontWeight: 300 }}>{f.body}</div>
                <span style={{ display: "inline-block", marginTop: 14, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" as const, padding: "4px 10px", borderRadius: 1, background: f.accent ? "rgba(255,92,0,0.1)" : "rgba(37,211,102,0.12)", color: f.accent ? O : G }}>{f.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MANIFESTO ── */}
      <div className="reveal" style={{ background: G, padding: "70px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(100px,15vw,200px)", color: "rgba(0,0,0,0.07)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", whiteSpace: "nowrap", pointerEvents: "none", letterSpacing: 4, userSelect: "none" }}>ALWAYS ON</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(32px,5vw,62px)", lineHeight: 1.05, color: BG, maxWidth: 860, margin: "0 auto", letterSpacing: 0.5, position: "relative" }}>
          {cms("manifesto","text","A lead who messages you at 10pm on a Friday has already made a decision. The only question is whether you're the one who answers.")}
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <section id="contact" style={{ background: DARK, padding: "130px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(37,211,102,0.06) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: 400, height: 400, background: "radial-gradient(circle, rgba(255,92,0,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="reveal" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 20 }}>
            <div style={{ height: 1, width: 40, background: G }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" as const, color: G }}>{cms("final_cta","eyebrow","Ready to deploy?")}</span>
            <div style={{ height: 1, width: 40, background: G }} />
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(52px,8vw,110px)", lineHeight: 0.9, color: WHITE, marginBottom: 24, letterSpacing: 1 }}>
            {cms("final_cta","headline","YOUR AGENT\nCAN BE LIVE\nTHIS WEEK.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
          </h2>
          <p style={{ fontSize: 18, color: MUTED, maxWidth: 540, margin: "0 auto 48px", lineHeight: 1.7, fontWeight: 300 }}>
            {cms("final_cta","subheadline","Book a free strategy call. We'll walk you through exactly how the agent would be built for your business, what qualification criteria we'd use, and what results you can realistically expect in the first 30 days.")}
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/#contact" style={{ background: G, color: BG, padding: "16px 40px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", textDecoration: "none", clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))", display: "inline-block" }}>Deploy My AI Agent →</a>
            <a href="/packages" style={{ background: O, color: BG, padding: "16px 40px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", textDecoration: "none", clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))", display: "inline-block" }}>View All Packages →</a>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
      `}</style>
    </div>
  );
}
