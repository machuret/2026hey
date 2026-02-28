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

/* ── colours ── */
const BLK = "#0A0A0A";
const DARK = "#111109";
const DARK2 = "#181710";
const DARK3 = "#221F14";
const DARK4 = "#2C281A";
const WHITE = "#FFF8F2";
const OFF = "#E8DDD0";
const MUTED = "#9A8E7A";
const O = "#FF5C00";
const OH = "#FF7A25";
const G = "#25D366";

const handleCards = [
  { icon: "✍️", title: "Script Writing", body: "We write your voicemail script from scratch — a short, punchy, direct-response message built around your specific offer and your ideal client's mindset. No templates. Every script is written to create curiosity and drive callbacks.", tag: "We do it", white: false },
  { icon: "🎙️", title: "Voice Production", body: "We produce the recording professionally — using AI voice cloning from a 60-second sample of your voice, or selecting from a library of professional voice talent. The result sounds natural, human, and trustworthy — not robotic or automated.", tag: "We do it", white: true },
  { icon: "📋", title: "Contact List Targeting", body: "We build and verify your contact list based on your ideal client profile — industry, location, company size, or homeowner criteria. Every contact is cleaned and verified before a single drop goes out. No wasted sends.", tag: "We do it", white: false },
  { icon: "📅", title: "Campaign Scheduling", body: "We configure delivery timing to maximise listen rates — right days, right hours, right frequency. We handle all compliance checks, DNC list management, and platform setup. You never touch the tech.", tag: "We do it", white: false },
  { icon: "📈", title: "Performance Monitoring", body: "We watch every campaign in real time — delivery rates, callback volume, response patterns. If something needs adjusting mid-campaign, we adjust it before it costs you opportunities. You hear about it in your monthly report, not after the damage is done.", tag: "We do it", white: true },
  { icon: "🔁", title: "Ongoing Optimisation", body: "After every campaign we analyse what worked, refine what didn't, and improve the next one. Scripts get sharper, targeting gets tighter, and callback rates climb. This is a compounding system — the longer you run it, the better it performs.", tag: "We do it", white: false },
];

const whoCards = [
  { icon: "🏠", title: "Real Estate", body: "Reach motivated sellers, prospective buyers, or property investors with targeted messages. Campaigns built around listing alerts, market updates, or free valuation offers drive exceptional callback rates.", accent: O },
  { icon: "🔧", title: "Home Services", body: "Roofers, HVAC, solar, landscaping, pest control — hyper-local targeting by zip code makes RVM one of the most efficient tools for filling a home services schedule without relying on referrals or expensive ads.", accent: BLK },
  { icon: "🛡️", title: "Insurance", body: "Reach prospects during open enrolment periods, after life events, or when renewals are approaching. Voicemail drops with a clear, compliance-friendly offer generate warm callbacks from people already thinking about coverage.", accent: "#C0AA90" },
  { icon: "💼", title: "B2B Services", body: "Consulting, accounting, legal, recruiting — RVM cuts through the email noise and gets your message in front of decision-makers in a format they actually notice. Business owners still check their voicemail.", accent: O },
  { icon: "💰", title: "Financial Services", body: "Mortgage brokers, financial advisors, and debt relief companies use RVM to reach prospects at exactly the right moment — interest rate changes, tax season, or life events — with a message that feels personal, not mass-market.", accent: BLK },
  { icon: "🎯", title: "Coaching & Consulting", body: "A well-crafted voicemail from a coach or consultant carries weight. It puts your voice directly in front of potential clients and creates a sense of personal outreach at scale — without sounding like a robocall.", accent: "#C0AA90" },
];

const resultCards = [
  { num: "13%", label: "Average Callback Rate", sub: "Compared to under 4% from traditional cold calling. Warm inbound calls from people who already heard your message.", odd: true },
  { num: "3,000", label: "Drops Per Month (Included)", sub: "Up to 3,000 targeted voicemail drops per month in The Drop package — with up to 5,000 in The Full Stack.", odd: false },
  { num: "75%", label: "Reduction in Cost Per Lead", sub: "Most clients see their cost per qualified lead drop by 60–75% compared to paid ads or traditional outreach methods.", odd: true },
  { num: "48h", label: "To First Callbacks", sub: "Most campaigns generate initial callbacks within 48–72 hours of the first drop going out. Results are fast and measurable.", odd: false },
  { num: "5–7", label: "Days To Go Live", sub: "From strategy call to first drop — our team has your campaign built, verified, and live within 5 to 7 business days.", odd: true },
  { num: "4×", label: "Average ROI — Month 1", sub: "Based on client data across industries. Real estate, home services, and B2B consulting clients consistently report 3–5× ROI in the first 30 days.", odd: false },
];

const testimonials = [
  { quote: "The first week I thought something was wrong — my phone wouldn't stop ringing. We booked 11 appointments before we'd even finished the campaign. The cost per lead dropped by 75% compared to what we were spending on ads.", name: "Daniel K.", role: "Managing Partner — Meridian Property Group, Phoenix AZ", white: false },
  { quote: "I was sceptical because I'd never done anything like this before. Within 10 days I had more booked inspections than in the previous 3 months combined. We had to bring in an extra crew member just to keep up with the work.", name: "Marcus W.", role: "Owner — Crestline Roofing Co., Denver CO", white: true },
  { quote: "We went from 3 leads a week to 27 in the first month. The callbacks were warm — these people already knew who we were. Closing felt easier because they called us, not the other way around.", name: "Yolanda F.", role: "Director — Apex Financial Solutions, Dallas TX", white: false },
];

const waveBars = [8, 20, 14, 28, 16, 24, 10, 32, 18, 22, 12, 26, 8, 20, 14, 6];

export default function RinglessVoicemailPage() {
  const cms = useCMS("rvm");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.07 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: BLK, color: WHITE, fontFamily: "'DM Sans',sans-serif" }}>
      <Navbar activePage="ringless-voicemail" />

      {/* ── HERO ── */}
      <section style={{
        minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr",
        alignItems: "center", padding: "120px 48px 80px",
        position: "relative", overflow: "hidden", background: DARK,
      }}>
        <div style={{ position: "absolute", right: -60, top: "30%", width: 700, height: 700, background: `radial-gradient(circle, rgba(255,92,0,0.13) 0%, transparent 68%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: -80, bottom: -60, width: 500, height: 500, background: `radial-gradient(circle, rgba(255,150,0,0.05) 0%, transparent 70%)`, pointerEvents: "none" }} />

        {/* Left copy */}
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: O, marginBottom: 24 }}>
            <span style={{ display: "block", width: 32, height: 2, background: O }} />{cms("hero","eyebrow","Ringless Voicemail Drops")}
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(60px,8vw,112px)", lineHeight: 0.88, letterSpacing: 0.5, marginBottom: 32 }}>
            <span style={{ color: WHITE }}>{cms("hero","headline_1","STOP CHASING.")}</span><br />
            <span style={{ color: O }}>{cms("hero","headline_2","START")}</span><br />
            <span style={{ color: WHITE }}>{cms("hero","headline_3","RECEIVING.")}</span>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.65, color: MUTED, maxWidth: 500, marginBottom: 48, fontWeight: 300 }}>
            {cms("hero","subheadline","We send thousands of ringless voicemails directly to your prospects' inboxes — without their phone ever ringing. Your voice lands. They listen. They call back. We handle every single step from script to delivery. You just pick up the phone.")}
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <a href="/#contact" style={{ background: O, color: BLK, padding: "16px 40px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", textDecoration: "none", clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))", display: "inline-block" }}>Start Getting Callbacks →</a>
            <a href="#how-it-works" style={{ background: "transparent", color: WHITE, padding: "16px 40px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 19, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", textDecoration: "none", border: "1px solid rgba(255,92,0,0.35)", display: "inline-block" }}>See How It Works</a>
          </div>
        </div>

        {/* Right — voicemail mockup */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
          {/* Float badges — 6 total */}
          <div style={{ position: "absolute", top: -28, left: -80, background: DARK2, border: `1px solid rgba(255,92,0,0.3)`, borderRadius: 6, padding: "14px 20px", whiteSpace: "nowrap", animation: "float 4s ease-in-out infinite" }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: O, display: "block", lineHeight: 1 }}>3,000</span>
            <span style={{ fontSize: 11, color: MUTED, display: "block", marginTop: 4 }}>Drops per month</span>
          </div>
          <div style={{ position: "absolute", bottom: -28, right: -80, background: DARK2, border: `1px solid rgba(255,92,0,0.3)`, borderRadius: 6, padding: "14px 20px", whiteSpace: "nowrap", animation: "float 4s ease-in-out 2s infinite" }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: O, display: "block", lineHeight: 1 }}>13%</span>
            <span style={{ fontSize: 11, color: MUTED, display: "block", marginTop: 4 }}>Avg callback rate</span>
          </div>
          <div style={{ position: "absolute", top: -28, right: -80, background: DARK2, border: `1px solid rgba(255,92,0,0.3)`, borderRadius: 6, padding: "14px 20px", whiteSpace: "nowrap", animation: "float 4s ease-in-out 0.5s infinite" }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: O, display: "block", lineHeight: 1 }}>98%</span>
            <span style={{ fontSize: 11, color: MUTED, display: "block", marginTop: 4 }}>Listen rate</span>
          </div>
          <div style={{ position: "absolute", bottom: -28, left: -80, background: DARK2, border: `1px solid rgba(255,92,0,0.3)`, borderRadius: 6, padding: "14px 20px", whiteSpace: "nowrap", animation: "float 4s ease-in-out 1.5s infinite" }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: O, display: "block", lineHeight: 1 }}>75%</span>
            <span style={{ fontSize: 11, color: MUTED, display: "block", marginTop: 4 }}>Lower cost per lead</span>
          </div>
          <div style={{ position: "absolute", top: "30%", left: -88, background: DARK2, border: `1px solid rgba(255,92,0,0.3)`, borderRadius: 6, padding: "14px 20px", whiteSpace: "nowrap", animation: "float 4s ease-in-out 1s infinite" }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: O, display: "block", lineHeight: 1 }}>5×</span>
            <span style={{ fontSize: 11, color: MUTED, display: "block", marginTop: 4 }}>More replies vs cold call</span>
          </div>
          <div style={{ position: "absolute", top: "30%", right: -88, background: DARK2, border: `1px solid rgba(255,92,0,0.3)`, borderRadius: 6, padding: "14px 20px", whiteSpace: "nowrap", animation: "float 4s ease-in-out 2.5s infinite" }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: O, display: "block", lineHeight: 1 }}>100%</span>
            <span style={{ fontSize: 11, color: MUTED, display: "block", marginTop: 4 }}>Done for you</span>
          </div>

          {/* Mockup */}
          <div style={{ width: 320, background: DARK2, border: `1px solid rgba(255,92,0,0.3)`, borderRadius: 16, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,92,0,0.06)" }}>
            {/* Header */}
            <div style={{ background: DARK3, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${DARK4}` }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: WHITE }}>Voicemail</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>3 new messages</div>
              </div>
              <div style={{ background: O, color: BLK, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "4px 10px", borderRadius: 10 }}>New</div>
            </div>

            {/* Notifications */}
            <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { time: "Just now" },
                { time: "4m ago" },
                { time: "12m ago" },
              ].map((n, i) => (
                <div key={i} style={{ background: DARK3, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, border: `1px solid ${DARK4}` }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,92,0,0.12)", border: `1px solid rgba(255,92,0,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📞</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: WHITE }}>1 New Voicemail</div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Hey More Leads Campaign</div>
                  </div>
                  <div style={{ fontSize: 10, color: O, whiteSpace: "nowrap", flexShrink: 0 }}>{n.time}</div>
                </div>
              ))}
            </div>

            {/* Waveform */}
            <div style={{ padding: "16px 16px 8px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 3, alignItems: "center", flex: 1 }}>
                {waveBars.map((h, i) => (
                  <div key={i} style={{ width: 3, height: h, background: O, borderRadius: 2, animation: `wave 1s ease-in-out ${i * 0.06}s infinite` }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: MUTED, whiteSpace: "nowrap" }}>0:28</div>
            </div>

            {/* Play row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px 20px" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: O, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer", flexShrink: 0, boxShadow: "0 0 20px rgba(255,92,0,0.4)" }}>▶</div>
              <div style={{ fontSize: 13, color: WHITE, fontWeight: 500 }}>
                Hey More Leads
                <span style={{ display: "block", fontSize: 11, color: MUTED, fontWeight: 300 }}>Campaign message — tap to call back</span>
              </div>
            </div>

            <div style={{ margin: "0 16px 16px", display: "block", textAlign: "center", background: O, color: BLK, padding: 12, borderRadius: 8, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              📲 Call Back Now
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: O, gap: 1 }}>
        {[
          { num: "13%", label: "Average callback rate — vs under 4% for cold calling", white: false },
          { num: "3,000+", label: "Voicemail drops delivered per month per client", white: true },
          { num: "75%", label: "Average reduction in cost per qualified lead", white: false },
          { num: "100%", label: "Done for you — we handle everything, start to finish", white: true },
        ].map((s, i) => (
          <div key={i} style={{ background: DARK2, padding: "36px 32px", display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: i === 1 ? WHITE : O }} />
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 56, lineHeight: 1, color: s.white ? WHITE : O, letterSpacing: -1 }}>{s.num}</div>
            <div style={{ fontSize: 14, color: MUTED, fontWeight: 300, lineHeight: 1.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── WHAT IS RVM ── */}
      <section style={{ background: DARK, padding: "100px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="reveal">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" as const, color: O, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              {cms("what_is","eyebrow","What It Is")}<span style={{ display: "block", height: 1, width: 40, background: O }} />
            </div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(40px,5vw,72px)", lineHeight: 0.93, color: WHITE, marginBottom: 20 }}>
              {cms("what_is","headline","YOUR VOICE IN THEIR\nINBOX — WITHOUT THEIR\nPHONE EVER RINGING.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start", marginTop: 60 }}>
            <div className="reveal" style={{ fontSize: 17, lineHeight: 1.85, color: MUTED, fontWeight: 300 }}>
              <p style={{ marginBottom: 24 }}>{cms("what_is","body_1","Ringless Voicemail Drops (RVMs) use server-to-server technology to deliver a pre-recorded voice message directly into a prospect's voicemail inbox — bypassing the phone call entirely.")}</p>
              <p style={{ marginBottom: 24 }}>{cms("what_is","body_2","No interruption. No friction. No hang-up. The prospect listens on their own terms, already hearing your voice and your offer before any conversation has taken place.")}</p>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, lineHeight: 1.1, color: WHITE, borderLeft: `3px solid ${O}`, paddingLeft: 24, margin: "36px 0", letterSpacing: 0.5 }}>
                {cms("what_is","pull_quote","Cold calling interrupts. Ringless voicemail intrigues.")}
              </div>
              <p style={{ marginBottom: 24 }}>{cms("what_is","body_3","And unlike cold calls — where 80% of dials go unanswered — every voicemail drop is delivered directly. The prospect receives it. They choose when to listen.")}</p>
              <p>{cms("what_is","body_4","We handle the entire process. You never touch a platform, upload a list, or record a message unless you want to. We do all of it for you.")}</p>
            </div>

            <div className="reveal" style={{ transitionDelay: "0.12s" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: MUTED, marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${DARK3}` }}>What Happens Behind The Scenes</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, background: DARK3 }}>
                {[
                  { num: "01", title: "We build your campaign", desc: "Script written, voice recorded, contact list sourced and verified — all by our team." },
                  { num: "02", title: "We schedule and deliver", desc: "Drops are sent via server-to-server technology directly to the voicemail server — bypassing the phone call entirely." },
                  { num: "03", title: "They receive a notification", desc: "The prospect sees a new voicemail waiting. No missed call anxiety. Just curiosity." },
                  { num: "04", title: "They listen — and call back", desc: "On their own time. Already warm. Already knowing who you are and what you offer." },
                  { num: "05", title: "We report everything to you", desc: "Delivery rates, callbacks, response trends — clear reporting every month. No logins, no dashboards. Just results." },
                ].map((s) => (
                  <div key={s.num} style={{ background: DARK2, padding: "24px 28px", display: "flex", gap: 20, alignItems: "flex-start", transition: "background 0.2s" }}
                    onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.background = DARK4; }}
                    onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = DARK2; }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: O, lineHeight: 1, flexShrink: 0, opacity: 0.6 }}>{s.num}</div>
                    <div>
                      <strong style={{ display: "block", fontSize: 15, fontWeight: 500, color: WHITE, marginBottom: 4 }}>{s.title}</strong>
                      <span style={{ fontSize: 13, color: MUTED, fontWeight: 300, lineHeight: 1.5 }}>{s.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW WE DO IT (ORANGE BLEED) ── */}
      <section id="how-it-works" style={{ background: O, padding: "100px 48px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(200px,28vw,420px)", color: "rgba(0,0,0,0.06)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", whiteSpace: "nowrap", pointerEvents: "none", letterSpacing: 6, userSelect: "none" }}>HOW</div>
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <div className="reveal">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" as const, color: "rgba(0,0,0,0.45)", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              {cms("process","eyebrow","Our Process")}<span style={{ display: "block", height: 1, width: 40, background: "rgba(0,0,0,0.35)" }} />
            </div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(40px,5vw,72px)", lineHeight: 0.93, color: BLK, marginBottom: 20 }}>
              {cms("process","headline","FOUR STEPS.\nZERO EFFORT\nON YOUR END.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
            </h2>
          </div>
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 3, background: "rgba(0,0,0,0.35)", marginTop: 60 }}>
            {[
              { num: "01", icon: "🎯", title: "We Target Your Ideal Prospect", body: "We build a verified contact list based on your ideal client profile — industry, geography, company size, role, and any other criteria that matter. No generic blasts. Every drop reaches a prospect worth calling back." },
              { num: "02", icon: "🎙️", title: "We Write And Record Your Message", body: "Our team writes a direct-response voicemail script built around your offer. We produce it professionally — either recorded by a voice talent or AI-cloned from your own voice. Every word earns its place. Short, curious-inducing, and impossible to ignore." },
              { num: "03", icon: "⚡", title: "We Launch And Manage The Campaign", body: "We handle delivery scheduling, timing optimisation, compliance checks, and platform management. You never log into anything. Drops go out at the right time, to the right people, with the right message. We watch the results in real time and adjust as needed." },
              { num: "04", icon: "📊", title: "We Report — You Close", body: "Every month you receive a clear performance report — delivery rates, callback volume, response trends, and what we're doing to improve results. No dashboards to navigate, no metrics to decode. Just a clean summary and a plan for what's next." },
            ].map((s) => (
              <div key={s.num} style={{ background: "#0D0C08", padding: "36px 28px", position: "relative", borderTop: `3px solid ${O}`, transition: "background 0.2s" }}
                onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.background = "#161410"; }}
                onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = "#0D0C08"; }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 72, color: "rgba(255,92,0,0.15)", lineHeight: 1, marginBottom: 16 }}>{s.num}</div>
                <span style={{ fontSize: 32, marginBottom: 14, display: "block" }}>{s.icon}</span>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.5, color: WHITE, marginBottom: 12 }}>{s.title}</div>
                <div style={{ fontSize: 13, lineHeight: 1.65, color: MUTED, fontWeight: 300 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT WE HANDLE ── */}
      <section style={{ background: BLK, padding: "100px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="reveal">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" as const, color: O, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              {cms("what_we_handle","eyebrow","What We Handle For You")}<span style={{ display: "block", height: 1, width: 40, background: O }} />
            </div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(40px,5vw,72px)", lineHeight: 0.93, color: WHITE, marginBottom: 20 }}>
              {cms("what_we_handle","headline","EVERYTHING. WE MEAN\nEVERYTHING.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
            </h2>
            <p style={{ fontSize: 16, color: MUTED, fontWeight: 300, lineHeight: 1.7, maxWidth: 580, marginTop: 12 }}>{cms("what_we_handle","subheadline","This is a fully managed service. You have no platform to learn, no list to build, no script to write, no campaign to run. We do all of it. Here's exactly what that looks like.")}</p>
          </div>
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, background: DARK3, marginTop: 60 }}>
            {handleCards.map((c) => (
              <div key={c.title} style={{ background: DARK2, padding: "36px 32px", position: "relative", overflow: "hidden", transition: "background 0.3s" }}
                onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.background = DARK4; }}
                onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = DARK2; }}>
                <span style={{ fontSize: 30, marginBottom: 18, display: "block" }}>{c.icon}</span>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 21, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.5, color: WHITE, marginBottom: 10 }}>{c.title}</div>
                <div style={{ fontSize: 13, lineHeight: 1.65, color: MUTED, fontWeight: 300 }}>{c.body}</div>
                <span style={{ display: "inline-block", marginTop: 16, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" as const, padding: "4px 10px", borderRadius: 1, background: c.white ? "rgba(255,248,242,0.06)" : "rgba(255,92,0,0.12)", color: c.white ? OFF : O }}>{c.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR (WHITE SECTION) ── */}
      <section style={{ background: WHITE, padding: "100px 48px", color: BLK }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="reveal">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" as const, color: O, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              {cms("who_its_for","eyebrow","Industries We Serve")}<span style={{ display: "block", height: 1, width: 40, background: O }} />
            </div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(40px,5vw,72px)", lineHeight: 0.93, color: BLK, marginBottom: 20 }}>
              {cms("who_its_for","headline","WORKS FOR ANY\nBUSINESS THAT\nSELLS TO PEOPLE.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "#555", fontWeight: 300, maxWidth: 640, marginBottom: 60 }}>{cms("who_its_for","subheadline","Ringless voicemail works best for businesses with a clear offer, a defined target audience, and a sales process that benefits from warm inbound calls.")}</p>
          </div>
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, background: "#E0D5C8" }}>
            {whoCards.map((c) => (
              <div key={c.title} style={{ background: WHITE, padding: "36px 32px", borderTop: `3px solid ${c.accent}`, transition: "background 0.2s" }}
                onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.background = "#FFF3EC"; }}
                onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = WHITE; }}>
                <span style={{ fontSize: 32, marginBottom: 16, display: "block" }}>{c.icon}</span>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.5, color: BLK, marginBottom: 10 }}>{c.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.65, color: "#666", fontWeight: 300 }}>{c.body}</div>
              </div>
            ))}
          </div>
          <div className="reveal" style={{ marginTop: 60, background: BLK, padding: "36px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: WHITE, letterSpacing: 0.5, lineHeight: 1.1, maxWidth: 600 }}>
              Not sure if RVM is right for your industry?<br />
              <span style={{ color: O }}>Book a call and we&apos;ll tell you honestly.</span>
            </div>
            <a href="/#contact" style={{ background: O, color: BLK, padding: "16px 40px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", textDecoration: "none", clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))", display: "inline-block", flexShrink: 0 }}>Talk To Our Team →</a>
          </div>
        </div>
      </section>

      {/* ── RESULTS ── */}
      <section style={{ background: DARK, padding: "100px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="reveal">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" as const, color: O, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              {cms("results","eyebrow","What To Expect")}<span style={{ display: "block", height: 1, width: 40, background: O }} />
            </div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(40px,5vw,72px)", lineHeight: 0.93, color: WHITE, marginBottom: 20 }}>
              {cms("results","headline","REAL NUMBERS FROM\nREAL CAMPAIGNS.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
            </h2>
            <p style={{ fontSize: 16, color: MUTED, fontWeight: 300, lineHeight: 1.7, maxWidth: 580, marginTop: 12 }}>{cms("results","subheadline","Results vary by industry, offer, and list quality — but here's what our managed campaigns consistently deliver for clients running The Drop package.")}</p>
          </div>
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, background: DARK3, marginTop: 60 }}>
            {resultCards.map((r) => (
              <div key={r.label} style={{ background: DARK2, padding: "40px 32px", position: "relative", overflow: "hidden", transition: "background 0.3s" }}
                onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.background = DARK4; }}
                onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = DARK2; }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 64, lineHeight: 1, letterSpacing: -1, marginBottom: 8, color: r.odd ? O : WHITE }}>{r.num}</div>
                <div style={{ fontSize: 15, color: WHITE, fontWeight: 500, marginBottom: 8 }}>{r.label}</div>
                <div style={{ fontSize: 13, color: MUTED, fontWeight: 300, lineHeight: 1.5 }}>{r.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: BLK, padding: "100px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="reveal">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" as const, color: O, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              {cms("testimonials","eyebrow","From Our Clients")}<span style={{ display: "block", height: 1, width: 40, background: O }} />
            </div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(40px,5vw,72px)", lineHeight: 0.93, color: WHITE, marginBottom: 20 }}>
              {cms("testimonials","headline","WHAT HAPPENS WHEN\nYOUR PHONE STARTS RINGING.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
            </h2>
          </div>
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, background: DARK3, marginTop: 60 }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ background: DARK2, padding: "40px 32px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: t.white ? WHITE : O }} />
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 80, color: "rgba(255,92,0,0.12)", lineHeight: 0.8, marginBottom: 12 }}>&ldquo;</div>
                <div style={{ fontSize: 15, lineHeight: 1.7, color: WHITE, fontWeight: 300, fontStyle: "italic", marginBottom: 24 }}>{t.quote}</div>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: O }}>{t.name}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 3, fontWeight: 300 }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPLIANCE STRIP ── */}
      <div className="reveal" style={{ background: DARK3, padding: "40px 48px", display: "flex", alignItems: "center", gap: 48, flexWrap: "wrap" }}>
        {[
          { icon: "🛡️", title: "TCPA Compliant Campaigns", sub: "Built-in compliance checks on every send" },
          { icon: "🚫", title: "DNC List Management", sub: "Automated scrubbing before every campaign" },
        ].map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <div style={{ width: 48, height: 48, borderRadius: 2, background: "rgba(255,92,0,0.12)", border: "1px solid rgba(255,92,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{b.icon}</div>
            <div>
              <strong style={{ display: "block", fontSize: 14, fontWeight: 500, color: WHITE }}>{b.title}</strong>
              <span style={{ fontSize: 12, color: MUTED, fontWeight: 300 }}>{b.sub}</span>
            </div>
            {i === 0 && <div style={{ height: 40, width: 1, background: DARK4, flexShrink: 0, marginLeft: 34 }} />}
          </div>
        ))}
        <div style={{ fontSize: 13, color: MUTED, fontWeight: 300, lineHeight: 1.6, flex: 1, minWidth: 280 }}>
          <strong style={{ color: WHITE, fontWeight: 500 }}>We handle all compliance, so you don&apos;t have to.</strong> Every campaign we run includes DNC scrubbing, spam report checks, and delivery timing that keeps you on the right side of applicable regulations. We keep up with the rules — you focus on the callbacks.
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <section id="contact" style={{ background: DARK, padding: "130px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(255,92,0,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div className="reveal" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 20 }}>
            <div style={{ height: 1, width: 40, background: O }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" as const, color: O }}>Ready to start?</span>
            <div style={{ height: 1, width: 40, background: O }} />
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(52px,8vw,110px)", lineHeight: 0.9, color: WHITE, marginBottom: 24, letterSpacing: 1 }}>
            YOUR NEXT <span style={{ color: O }}>10 CLIENTS</span><br />ARE WAITING IN<br />A <span style={{ color: WHITE }}>VOICEMAIL.</span>
          </h2>
          <p style={{ fontSize: 18, color: MUTED, maxWidth: 540, margin: "0 auto 48px", lineHeight: 1.7, fontWeight: 300 }}>
            Book a free strategy call. We&apos;ll tell you exactly how we&apos;d build your campaign — the list, the script, the targeting — and what you can realistically expect in the first 30 days.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/#contact" style={{ background: O, color: BLK, padding: "16px 40px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", textDecoration: "none", clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))", display: "inline-block" }}>Book My Free Strategy Call →</a>
            <a href="/packages" style={{ background: WHITE, color: BLK, padding: "16px 40px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", textDecoration: "none", clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))", display: "inline-block" }}>View All Packages →</a>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes wave { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(0.4); } }
      `}</style>
    </div>
  );
}
