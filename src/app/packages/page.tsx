"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

/* ─── DATA ─── */
const rvmFeatures = [
  "Voicemail script writing & production",
  "Contact list targeting & segmentation",
  "Full campaign setup & scheduling",
  "Platform management — zero tech work for you",
  "Weekly campaign monitoring & adjustment",
  "Monthly performance report & strategy review",
];
const rvmLimits = [
  { label: "Voicemail drops / month", value: "Up to 3,000", highlight: true },
  { label: "Active campaigns", value: "Up to 2", highlight: false },
  { label: "Script variations", value: "Up to 3", highlight: false },
  { label: "Onboarding time", value: "5–7 business days", highlight: false },
];

const stackFeatures = [
  "Full RVM campaign setup & management",
  "Custom AI WhatsApp agent — built for your business",
  "Unified strategy across both channels",
  "Priority onboarding & setup",
  "Dedicated account manager",
  "CRM & calendar integration",
  "Monthly strategy review call (1-on-1)",
  "Bi-weekly performance reporting",
];
const stackLimits = [
  { label: "Voicemail drops / month", value: "Up to 5,000", highlight: true },
  { label: "WhatsApp conversations", value: "Unlimited", highlight: true },
  { label: "Active RVM campaigns", value: "Up to 4", highlight: false },
  { label: "Onboarding time", value: "3–5 business days", highlight: false },
];

const waFeatures = [
  "Custom AI WhatsApp agent — built to your brief",
  "Qualification flow design & conversation scripting",
  "Custom criteria — only your ideal clients get through",
  "CRM & calendar integration for auto-booking",
  "Ongoing agent monitoring & optimisation",
  "Monthly performance report & flow refinement",
];
const waLimits = [
  { label: "WhatsApp conversations", value: "Unlimited", highlight: true },
  { label: "Qualification flows", value: "Up to 3", highlight: false },
  { label: "Integrations", value: "CRM + Calendar", highlight: false },
  { label: "Onboarding time", value: "5–7 business days", highlight: false },
];

const rvmBreakdown = [
  { group: "Strategy & Targeting", items: [
    { icon: "🎯", title: "Ideal Client Profiling", desc: "We define exactly who you want to reach — industry, geography, company size, role — so every drop lands in the right inbox, not just any inbox." },
    { icon: "📋", title: "Contact List Building & Verification", desc: "We source, clean, and verify contact lists to maximise delivery rates and minimise wasted drops. Quality over volume — always." },
  ]},
  { group: "Content & Production", items: [
    { icon: "✍️", title: "Script Writing", desc: "Direct-response voicemail scripts written to create curiosity, establish credibility, and drive callbacks. Short, punchy, and built around your offer — not a template." },
    { icon: "🎙️", title: "Voice Production", desc: "Professional voice recording or AI-cloned voice personalisation at scale. Your message sounds human, warm, and trustworthy — not robotic." },
  ]},
  { group: "Execution & Optimisation", items: [
    { icon: "⚙️", title: "Campaign Setup & Scheduling", desc: "We configure delivery timing, drop frequency, and campaign sequencing to hit prospects at the right moment — maximising listen rates and callbacks." },
    { icon: "📊", title: "Performance Tracking & Reporting", desc: "Delivery rates, callback rates, and response trends reported monthly. We tell you what's working, what's not, and what we're doing about it." },
  ]},
];

const waBreakdown = [
  { group: "Build & Design", items: [
    { icon: "🤖", title: "Custom Agent Architecture", desc: "We don't use generic chatbot builders. Your agent is built from scratch — trained on your offer, your language, and your ideal client's objections and questions." },
    { icon: "🗺️", title: "Conversation Flow Design", desc: "Every conversation path is mapped and scripted — from first message to appointment booking. The agent guides prospects naturally without feeling scripted or robotic." },
    { icon: "✅", title: "Qualification Criteria Setup", desc: "We define your exact qualification rules — budget, timeline, decision-making authority, geography — so only the right prospects make it through to your calendar." },
  ]},
  { group: "Integration & Automation", items: [
    { icon: "🔗", title: "CRM & Calendar Integration", desc: "Qualified leads are automatically logged to your CRM and appointments drop straight into your calendar — no manual data entry, no missed bookings." },
    { icon: "⚡", title: "Instant Response Configuration", desc: "The agent responds within seconds of a new message — 24 hours a day, 7 days a week. Hot leads never go cold because you were busy or asleep." },
  ]},
  { group: "Ongoing Management", items: [
    { icon: "🔧", title: "Weekly Monitoring & Tuning", desc: "We review conversation logs, identify drop-off points, and refine the agent's responses and logic every week. The agent gets smarter and more effective over time." },
    { icon: "📈", title: "Monthly Optimisation Report", desc: "Engagement rates, qualification rates, appointments booked — tracked and reported monthly with clear recommendations for the next 30 days." },
  ]},
];

const compareRows: { group?: string; feature?: string; drop?: string; stack?: string; agent?: string }[] = [
  { group: "Ringless Voicemail" },
  { feature: "Voicemail script writing & production", drop: "✓", stack: "✓", agent: "—" },
  { feature: "Contact list targeting & segmentation", drop: "✓", stack: "✓", agent: "—" },
  { feature: "Voicemail drops per month", drop: "Up to 3,000", stack: "Up to 5,000", agent: "—" },
  { feature: "Active campaigns", drop: "Up to 2", stack: "Up to 4", agent: "—" },
  { feature: "Script variations", drop: "Up to 3", stack: "Up to 6", agent: "—" },
  { group: "AI WhatsApp Agent" },
  { feature: "Custom AI agent build", drop: "—", stack: "✓", agent: "✓" },
  { feature: "Qualification flow design", drop: "—", stack: "✓", agent: "✓" },
  { feature: "WhatsApp conversations / month", drop: "—", stack: "Unlimited", agent: "Unlimited" },
  { feature: "Qualification flows", drop: "—", stack: "Up to 5", agent: "Up to 3" },
  { feature: "CRM & calendar integration", drop: "—", stack: "✓", agent: "✓" },
  { group: "Account Management" },
  { feature: "Setup & onboarding included", drop: "✓", stack: "✓", agent: "✓" },
  { feature: "Weekly monitoring & optimisation", drop: "✓", stack: "✓", agent: "✓" },
  { feature: "Monthly performance report", drop: "✓", stack: "✓", agent: "✓" },
  { feature: "Dedicated account manager", drop: "—", stack: "✓", agent: "—" },
  { feature: "Monthly 1-on-1 strategy call", drop: "—", stack: "✓", agent: "—" },
  { feature: "Priority onboarding (3–5 days)", drop: "—", stack: "✓", agent: "—" },
  { group: "Pricing" },
  { feature: "Monthly investment", drop: "$1,200 / mo", stack: "$1,800 / mo", agent: "$1,200 / mo" },
  { feature: "If purchased separately", drop: "$1,200", stack: "Save $600/mo", agent: "$1,200" },
];

const pricingFaqs = [
  { q: "Is there a long-term contract?", a: "No lock-in contracts. All packages are month-to-month. We ask for 30 days notice if you decide to cancel — that's it. We'd rather earn your business every month than trap you in a contract." },
  { q: "Are there any hidden fees or setup costs?", a: "None. The price you see covers everything — strategy, setup, execution, management, and reporting. Onboarding is included in your first month. The only thing we'll ever charge extra for is if you want to significantly scale beyond the included campaign limits." },
  { q: "Can I upgrade from one package to The Full Stack later?", a: "Absolutely. Many clients start with one service to get comfortable with the system, then upgrade to The Full Stack once they see the results. The upgrade is seamless — we handle the build and integration, and you only pay the difference going forward." },
  { q: "What happens if I need more voicemail drops than my limit?", a: "We can discuss a volume extension based on your needs. Contact us before you hit your limit and we'll work out the most cost-effective way to scale — without surprising you mid-campaign." },
  { q: "Do you offer a trial or guarantee?", a: "We don't offer a free trial — this is a managed service that requires real setup time and resources. What we do offer is full transparency on what to expect before you sign up. Book a strategy call and we'll give you honest projections for your specific business and market." },
];

/* ─── HELPERS ─── */
function PkgFeatures({ items, check }: { items: string[]; check: string }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 13 }}>
      {items.map((f) => (
        <li key={f} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 14, color: "#F5F2ED", fontWeight: 300, lineHeight: 1.45 }}>
          <span style={{ color: check, flexShrink: 0, fontWeight: 700, marginTop: 1 }}>→</span>{f}
        </li>
      ))}
    </ul>
  );
}

function PkgLimits({ items, accent }: { items: { label: string; value: string; highlight: boolean }[]; accent: string }) {
  return (
    <div style={{ background: "#222222", borderRadius: 2, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#888880", marginBottom: 4 }}>Campaign limits</div>
      {items.map((row) => (
        <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
          <span style={{ color: "#888880", fontWeight: 300 }}>{row.label}</span>
          <span style={{ color: row.highlight ? accent : "#F5F2ED", fontWeight: row.highlight ? 500 : 400, fontSize: 14 }}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function BreakdownCard({ color, tag, title, intro, groups }: {
  color: string;
  tag: string;
  title: string;
  intro: string;
  groups: { group: string; items: { icon: string; title: string; desc: string }[] }[];
}) {
  return (
    <div style={{ background: "#181818", padding: "48px 44px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color }} />
      <div style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "5px 12px", marginBottom: 20, borderRadius: 1, background: color === "#FF5C00" ? "rgba(255,92,0,0.12)" : "rgba(37,211,102,0.1)", color }}>{tag}</div>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 40, letterSpacing: 0.5, color: "#F5F2ED", lineHeight: 1, marginBottom: 16 }}>{title}</div>
      <div style={{ fontSize: 15, color: "#888880", fontWeight: 300, lineHeight: 1.7, marginBottom: 36 }}>{intro}</div>
      {groups.map((g) => (
        <div key={g.group} style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#888880", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #222222" }}>{g.group}</div>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {g.items.map((item) => (
              <li key={item.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, background: color === "#FF5C00" ? "rgba(255,92,0,0.1)" : "rgba(37,211,102,0.08)" }}>{item.icon}</div>
                <div>
                  <strong style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#F5F2ED", marginBottom: 2 }}>{item.title}</strong>
                  <span style={{ fontSize: 13, color: "#888880", fontWeight: 300, lineHeight: 1.5 }}>{item.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ─── PAGE ─── */
export default function PackagesPage() {
  const cms = useCMS("packages");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.07 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Navbar activePage="packages" />

      {/* HERO */}
      <section style={{
        minHeight: "68vh", display: "flex", flexDirection: "column",
        justifyContent: "flex-end", padding: "140px 64px 88px",
        position: "relative", overflow: "hidden",
        borderBottom: "1px solid #222222", background: "#0A0A0A",
      }}>
        <div style={{ position: "absolute", fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(160px,20vw,300px)", color: "rgba(255,92,0,0.03)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", whiteSpace: "nowrap", pointerEvents: "none", letterSpacing: 8, userSelect: "none" }}>PRICING</div>
        <div style={{ position: "absolute", right: -150, top: "50%", transform: "translateY(-50%)", width: 700, height: 700, background: "radial-gradient(circle, rgba(255,92,0,0.09) 0%, transparent 68%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,92,0,0.04) 1px, transparent 1px)", backgroundSize: "100% 80px", maskImage: "radial-gradient(ellipse 90% 90% at 70% 50%, black 40%, transparent 100%)" }} />

        <div className="anim-fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 14, fontSize: 12, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: "#FF5C00", marginBottom: 28 }}>
          <span style={{ display: "block", width: 40, height: 1, background: "#FF5C00", opacity: 0.6 }} />
          {cms("hero","eyebrow","Transparent Pricing")}
          <span style={{ display: "block", width: 40, height: 1, background: "#FF5C00", opacity: 0.6 }} />
        </div>
        <h1 className="anim-fade-up-1" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(60px,8vw,124px)", lineHeight: 0.88, letterSpacing: 1.5, color: "#F5F2ED", maxWidth: 900, marginBottom: 24 }}>
          {cms("hero","headline","SIMPLE PRICING.\nSERIOUS RESULTS.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
        </h1>
        <div style={{ width: 80, height: 3, background: "#FF5C00", opacity: 0.5, marginBottom: 24 }} />
        <p className="anim-fade-up-2" style={{ fontSize: 18, color: "#888880", lineHeight: 1.7, fontWeight: 300, maxWidth: 580 }}>
          {cms("hero","subheadline","No hidden fees. No long-term lock-ins. Just a done-for-you system that fills your pipeline — month after month.")}
        </p>
      </section>

      {/* PACKAGE CARDS */}
      <section style={{ background: "#111111", padding: "100px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Billing note */}
          <div className="reveal" style={{ background: "#181818", border: "1px solid #222222", borderLeft: "3px solid #FF5C00", padding: "16px 24px", fontSize: 14, color: "#888880", fontWeight: 300, lineHeight: 1.6, marginBottom: 60 }}>
            <strong style={{ color: "#F5F2ED", fontWeight: 500 }}>All packages are billed monthly.</strong> Setup and onboarding is included in your first month — no additional fees. Cancel anytime with 30 days notice. Prices in USD.
          </div>

          {/* Cards */}
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, background: "#222222", marginBottom: 2 }}>

            {/* THE DROP */}
            <div style={{ background: "#181818", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#FF5C00" }} />
              <div style={{ padding: "44px 40px 32px", borderBottom: "1px solid #222222" }}>
                <div style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "5px 12px", marginBottom: 20, background: "rgba(255,92,0,0.12)", color: "#FF5C00" }}>Ringless Voicemail</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, letterSpacing: 1, color: "#F5F2ED", lineHeight: 1, marginBottom: 10 }}>The Drop</div>
                <div style={{ fontSize: 14, color: "#888880", fontWeight: 300, lineHeight: 1.55, marginBottom: 28 }}>Reach thousands of targeted prospects with your voice — without a single cold call.</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 600, color: "#FF5C00" }}>$</span>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 76, lineHeight: 1, color: "#F5F2ED", letterSpacing: -1 }}>1200</span>
                  <span style={{ fontSize: 14, color: "#888880", fontWeight: 300, alignSelf: "flex-end", paddingBottom: 10 }}>/ month</span>
                </div>
                <div style={{ fontSize: 12, color: "#888880", fontWeight: 300 }}>Setup & onboarding <strong style={{ color: "#25D366", fontWeight: 500 }}>included</strong></div>
              </div>
              <div style={{ padding: "32px 40px", flex: 1, display: "flex", flexDirection: "column", gap: 28 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#888880", marginBottom: 14 }}>What&apos;s included</div>
                  <PkgFeatures items={rvmFeatures} check="#FF5C00" />
                </div>
                <PkgLimits items={rvmLimits} accent="#FF5C00" />
                <div style={{ background: "rgba(255,92,0,0.06)", borderLeft: "2px solid #FF5C00", padding: "16px 18px", fontSize: 13, color: "#F5F2ED", lineHeight: 1.55, fontStyle: "italic" }}>
                  &quot;Warm prospects calling you back — already familiar with your name, your voice, and your offer.&quot;
                </div>
              </div>
              <div style={{ padding: "28px 40px 40px", borderTop: "1px solid #222222", display: "flex", flexDirection: "column", gap: 12 }}>
                <a href="/#contact" style={{ display: "block", textAlign: "center", background: "#FF5C00", color: "#0A0A0A", padding: "15px 24px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", textDecoration: "none", clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}>Start With The Drop →</a>
                <a href="#compare" style={{ display: "block", textAlign: "center", background: "transparent", color: "#888880", padding: "12px 24px", fontSize: 13, textDecoration: "none", border: "1px solid #222222" }}>Compare all packages ↓</a>
              </div>
            </div>

            {/* THE FULL STACK — FEATURED */}
            <div style={{ background: "#111111", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", border: "1px solid #FF5C00", transform: "scaleY(1.01)", zIndex: 2, boxShadow: "0 0 60px rgba(255,92,0,0.08)" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#FF5C00" }} />
              <div style={{ padding: "44px 40px 32px", borderBottom: "1px solid #222222" }}>
                <div style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "5px 12px", marginBottom: 20, background: "#FF5C00", color: "#0A0A0A" }}>★ Most Popular — Best Value</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, letterSpacing: 1, color: "#F5F2ED", lineHeight: 1, marginBottom: 10 }}>The Full Stack</div>
                <div style={{ fontSize: 14, color: "#888880", fontWeight: 300, lineHeight: 1.55, marginBottom: 28 }}>The complete done-for-you lead engine. Outreach + qualification running 24/7.</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 600, color: "#FF5C00" }}>$</span>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 76, lineHeight: 1, color: "#F5F2ED", letterSpacing: -1 }}>1800</span>
                  <span style={{ fontSize: 14, color: "#888880", fontWeight: 300, alignSelf: "flex-end", paddingBottom: 10 }}>/ month</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#FF5C00", letterSpacing: 0.5, marginBottom: 4 }}>Save $600/mo vs buying separately ($2,400)</div>
                <div style={{ fontSize: 12, color: "#888880", fontWeight: 300 }}>Setup & onboarding <strong style={{ color: "#25D366", fontWeight: 500 }}>included</strong></div>
              </div>
              <div style={{ padding: "32px 40px", flex: 1, display: "flex", flexDirection: "column", gap: 28 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#888880", marginBottom: 14 }}>Everything in both packages, plus:</div>
                  <PkgFeatures items={stackFeatures} check="#FF5C00" />
                </div>
                <PkgLimits items={stackLimits} accent="#FF5C00" />
                <div style={{ background: "rgba(255,92,0,0.06)", borderLeft: "2px solid #FF5C00", padding: "16px 18px", fontSize: 13, color: "#F5F2ED", lineHeight: 1.55, fontStyle: "italic" }}>
                  &quot;A complete outbound-to-qualified-lead pipeline. RVM gets you heard. WhatsApp converts the conversation. You close the deal.&quot;
                </div>
              </div>
              <div style={{ padding: "28px 40px 40px", borderTop: "1px solid #222222", display: "flex", flexDirection: "column", gap: 12 }}>
                <a href="/#contact" style={{ display: "block", textAlign: "center", background: "#FF5C00", color: "#0A0A0A", padding: "15px 24px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", textDecoration: "none", clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}>Get The Full Stack →</a>
                <a href="#compare" style={{ display: "block", textAlign: "center", background: "transparent", color: "#888880", padding: "12px 24px", fontSize: 13, textDecoration: "none", border: "1px solid #222222" }}>Compare all packages ↓</a>
              </div>
            </div>

            {/* THE AGENT */}
            <div style={{ background: "#181818", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#25D366" }} />
              <div style={{ padding: "44px 40px 32px", borderBottom: "1px solid #222222" }}>
                <div style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "5px 12px", marginBottom: 20, background: "rgba(37,211,102,0.1)", color: "#25D366" }}>AI WhatsApp Agent</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, letterSpacing: 1, color: "#F5F2ED", lineHeight: 1, marginBottom: 10 }}>The Agent</div>
                <div style={{ fontSize: 14, color: "#888880", fontWeight: 300, lineHeight: 1.55, marginBottom: 28 }}>Your AI-powered qualification machine — engaging, filtering, and delivering leads around the clock.</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 600, color: "#25D366" }}>$</span>
                  <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 76, lineHeight: 1, color: "#F5F2ED", letterSpacing: -1 }}>1200</span>
                  <span style={{ fontSize: 14, color: "#888880", fontWeight: 300, alignSelf: "flex-end", paddingBottom: 10 }}>/ month</span>
                </div>
                <div style={{ fontSize: 12, color: "#888880", fontWeight: 300 }}>Setup & onboarding <strong style={{ color: "#25D366", fontWeight: 500 }}>included</strong></div>
              </div>
              <div style={{ padding: "32px 40px", flex: 1, display: "flex", flexDirection: "column", gap: 28 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#888880", marginBottom: 14 }}>What&apos;s included</div>
                  <PkgFeatures items={waFeatures} check="#25D366" />
                </div>
                <PkgLimits items={waLimits} accent="#25D366" />
                <div style={{ background: "rgba(37,211,102,0.05)", borderLeft: "2px solid #25D366", padding: "16px 18px", fontSize: 13, color: "#F5F2ED", lineHeight: 1.55, fontStyle: "italic" }}>
                  &quot;Never miss a lead. Never let a hot prospect go cold. Your agent works every hour you don&apos;t.&quot;
                </div>
              </div>
              <div style={{ padding: "28px 40px 40px", borderTop: "1px solid #222222", display: "flex", flexDirection: "column", gap: 12 }}>
                <a href="/#contact" style={{ display: "block", textAlign: "center", background: "#25D366", color: "#0A0A0A", padding: "15px 24px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", textDecoration: "none", clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}>Deploy My Agent →</a>
                <a href="#compare" style={{ display: "block", textAlign: "center", background: "transparent", color: "#888880", padding: "12px 24px", fontSize: 13, textDecoration: "none", border: "1px solid #222222" }}>Compare all packages ↓</a>
              </div>
            </div>

          </div>{/* /cards */}

          {/* Savings banner */}
          <div className="reveal" style={{ background: "#FF5C00", padding: "24px 48px", display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#0A0A0A" }}>Bundle both services and save</span>
            <span style={{ background: "#0A0A0A", color: "#FF5C00", padding: "6px 16px", fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 1 }}>$600 / MONTH</span>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#0A0A0A" }}>with The Full Stack</span>
          </div>

        </div>
      </section>

      {/* WHAT'S INSIDE — BREAKDOWN */}
      <section style={{ background: "#0A0A0A", padding: "100px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="reveal">
            <div className="section-label">Deep Dive</div>
            <h2 className="section-headline">WHAT YOU&apos;RE ACTUALLY<br />GETTING FOR YOUR MONEY.</h2>
            <p style={{ fontSize: 16, color: "#888880", fontWeight: 300, lineHeight: 1.7, maxWidth: 620, marginTop: 12 }}>We don&apos;t believe in vague promises. Here&apos;s exactly what goes into each service — and why it takes a specialist team to run it properly.</p>
          </div>
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, background: "#222222", marginTop: 60 }}>
            <BreakdownCard color="#FF5C00" tag="Ringless Voicemail Drops" title="WHAT GOES INTO THE DROP" intro="Ringless voicemail sounds simple — record a message, send it out. In reality, the difference between a campaign that gets callbacks and one that gets ignored is entirely in the execution. Here's what we do." groups={rvmBreakdown} />
            <BreakdownCard color="#25D366" tag="AI WhatsApp Agent" title="WHAT GOES INTO THE AGENT" intro="Building an AI agent that actually qualifies leads — not just answers messages — requires careful design, testing, and ongoing tuning. Here's the full picture of what we build and maintain for you." groups={waBreakdown} />
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section id="compare" style={{ background: "#111111", padding: "100px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="reveal">
            <div className="section-label">Side By Side</div>
            <h2 className="section-headline">COMPARE ALL PACKAGES.</h2>
          </div>
          <div className="reveal" style={{ overflowX: "auto", marginTop: 60 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#181818" }}>
              <thead>
                <tr style={{ background: "#222222" }}>
                  <th style={{ padding: "28px 28px 24px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#888880", verticalAlign: "bottom" }}>Feature</th>
                  {[
                    { name: "The Drop", price: "$1,200 / mo", period: "RVM only", featured: false, priceColor: "#FF5C00" },
                    { name: "The Full Stack ★", price: "$1,800 / mo", period: "RVM + WhatsApp AI", featured: true, priceColor: "#FF5C00" },
                    { name: "The Agent", price: "$1,200 / mo", period: "WhatsApp AI only", featured: false, priceColor: "#25D366" },
                  ].map((h) => (
                    <th key={h.name} style={{ padding: "28px 20px 24px", textAlign: "center", verticalAlign: "bottom", borderLeft: "1px solid #2A2A2A", background: h.featured ? "rgba(255,92,0,0.06)" : "transparent", borderTop: h.featured ? "2px solid #FF5C00" : undefined }}>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 1, color: "#F5F2ED", display: "block", marginBottom: 4 }}>{h.name}</span>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700, color: h.priceColor, display: "block", marginBottom: 2 }}>{h.price}</span>
                      <span style={{ fontSize: 11, color: "#888880", fontWeight: 300 }}>{h.period}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, i) => {
                  if (row.group) {
                    return (
                      <tr key={i} style={{ background: "#222222", borderBottom: "1px solid #2A2A2A" }}>
                        <td colSpan={4} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#FF5C00", padding: "12px 28px" }}>{row.group}</td>
                      </tr>
                    );
                  }
                  const cellStyle = (_col: string, featured: boolean): React.CSSProperties => ({
                    padding: "16px 20px", textAlign: "center",
                    verticalAlign: "middle",
                    background: featured ? "rgba(255,92,0,0.03)" : "transparent",
                    borderLeft: featured ? "1px solid rgba(255,92,0,0.15)" : "1px solid #222222",
                  });
                  const renderVal = (val: string | undefined, isStack: boolean, isAgent: boolean) => {
                    if (!val) return null;
                    if (val === "✓") return <span style={{ color: "#FF5C00", fontSize: 18, fontWeight: 700 }}>✓</span>;
                    if (val === "—") return <span style={{ color: "#2A2A2A", fontSize: 18 }}>—</span>;
                    if (val === "Unlimited") return <span style={{ fontSize: 13, color: isAgent ? "#25D366" : "#FF5C00", fontWeight: 600 }}>{val}</span>;
                    if (val.includes("Save")) return <span style={{ fontSize: 13, color: "#FF5C00", fontWeight: 600 }}>{val}</span>;
                    if (isStack && !["$1,200 / mo", "$1,200"].includes(val)) return <span style={{ fontSize: 13, color: "#FF5C00", fontWeight: 600 }}>{val}</span>;
                    if (isAgent && val === "✓") return <span style={{ color: "#25D366", fontSize: 18, fontWeight: 700 }}>✓</span>;
                    return <span style={{ fontSize: 13, color: "#F5F2ED", fontWeight: 400 }}>{val}</span>;
                  };
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #222222" }}>
                      <td style={{ fontSize: 14, color: "#F5F2ED", fontWeight: 300, padding: "16px 28px" }}>{row.feature}</td>
                      <td style={cellStyle(row.drop!, false)}>{renderVal(row.drop, false, false)}</td>
                      <td style={cellStyle(row.stack!, true)}>{renderVal(row.stack, true, false)}</td>
                      <td style={cellStyle(row.agent!, false)}>{renderVal(row.agent, false, true)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PRICING FAQ */}
      <section style={{ background: "#0A0A0A", padding: "100px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }} className="reveal">
          <div className="section-label">Pricing FAQ</div>
          <h2 className="section-headline">QUESTIONS ABOUT<br />COST & COMMITMENT.</h2>
        </div>
        <div className="reveal" style={{ maxWidth: 800, margin: "60px auto 0" }}>
          {pricingFaqs.map((faq, i) => (
            <div key={i} style={{ borderBottom: "1px solid #222222", padding: "26px 0", cursor: "pointer" }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#F5F2ED", display: "flex", justifyContent: "space-between", alignItems: "center", userSelect: "none" }}>
                {faq.q}
                <span style={{ color: "#FF5C00", fontSize: 22, fontWeight: 300, transition: "transform 0.3s", transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)", flexShrink: 0, marginLeft: 16 }}>+</span>
              </div>
              <div style={{ fontSize: 15, color: "#888880", lineHeight: 1.7, fontWeight: 300, maxHeight: openFaq === i ? 220 : 0, overflow: "hidden", transition: "max-height 0.4s ease, padding 0.3s", paddingTop: openFaq === i ? 14 : 0 }}>
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: "#111111", padding: "120px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(255,92,0,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div className="reveal" style={{ position: "relative", zIndex: 1 }}>
          <div className="section-label" style={{ justifyContent: "center" }}>Ready to get started?</div>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(48px,7vw,96px)", lineHeight: 0.92, color: "#F5F2ED", marginBottom: 24, letterSpacing: 1 }}>
            NOT SURE WHICH<br />PACKAGE IS <span style={{ color: "#FF5C00" }}>RIGHT?</span>
          </h2>
          <p style={{ fontSize: 17, color: "#888880", maxWidth: 500, margin: "0 auto 48px", lineHeight: 1.7, fontWeight: 300 }}>
            Book a free strategy call. We&apos;ll review your business, your goals, and your market — then recommend exactly what to start with. No pressure. Just clarity.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/#contact" className="btn-primary">Book My Free Strategy Call →</a>
            <a href="#" className="btn-secondary">Chat With Us On WhatsApp →</a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
