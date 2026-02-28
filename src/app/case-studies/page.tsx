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

/* ─── TYPES ─── */
type WhatItem = { num: string; title: string; desc: string };
type ResultBox = { num: string; label: string };
type CaseStudy = {
  id: string;
  type: "rvm" | "wa";
  industry: string;
  clientName: string;
  clientDetail: string;
  stat1num: string;
  stat1label: string;
  stat2num: string;
  stat2label: string;
  situation: React.ReactNode;
  challenges: string[];
  whatWeDid: WhatItem[];
  resultsTitle: string;
  results: ResultBox[];
  quote: string;
  quoteAttr: string;
  dataIndustry: string;
};

/* ─── DATA ─── */
const cases: CaseStudy[] = [
  {
    id: "meridian",
    type: "rvm",
    industry: "Real Estate",
    clientName: "Meridian Property Group",
    clientDetail: "Residential real estate team\nPhoenix, Arizona — 6 agents",
    stat1num: "31",
    stat1label: "Appointments booked — Month 1",
    stat2num: "4.1×",
    stat2label: "Return on investment",
    situation: <>Meridian Property Group had six experienced agents and a healthy inventory of listings — but their pipeline had gone quiet. Cold calling was eating 3+ hours per agent per day with a callback rate under 4%. <strong style={{ color: "#F5F2ED", fontWeight: 500 }}>Their cost per qualified lead had climbed to $340</strong>, and the team was burning out from dialling.<br /><br />They&apos;d tried boosting Facebook ads, which drove traffic but no serious buyers. They needed a way to reach a high volume of targeted prospects without adding headcount or burning more ad budget.</>,
    challenges: ["4% cold call callback rate", "$340 cost per qualified lead", "Agent time wasted on dead dials", "Facebook ads generating unqualified traffic", "No scalable outreach system"],
    whatWeDid: [
      { num: "01", title: "Targeted list build — motivated sellers & buyers", desc: "We built a segmented contact list of homeowners in their target zip codes who matched motivated seller signals — recent life events, extended listing periods, and equity positions." },
      { num: "02", title: "Two-script campaign — sellers & buyers separately", desc: "We wrote and produced two distinct voicemail scripts. One targeted potential sellers with a compelling market-timing message. The second hit active buyer prospects with a new listing alert approach." },
      { num: "03", title: "2,400 drops over 10 days — staggered delivery", desc: "Drops were staggered across optimal callback windows (Tuesday–Thursday, 10am–4pm local) to maximise listen rates and ensure agents could handle inbound volume without being overwhelmed." },
      { num: "04", title: "Week 3 script refinement based on callback data", desc: "We analysed which script was driving stronger callbacks and refined the underperforming one mid-campaign — pulling response rates up by a further 18% in the final week." },
    ],
    resultsTitle: "The Results — Month 1",
    results: [
      { num: "312", label: "Callbacks received from 2,400 drops" },
      { num: "31", label: "Qualified appointments booked" },
      { num: "$83", label: "Cost per qualified lead (down from $340)" },
      { num: "13%", label: "Callback rate (vs 4% from cold calls)" },
      { num: "4", label: "Signed listings in first 30 days" },
      { num: "4.1×", label: "ROI on first month's investment" },
    ],
    quote: "The first week I thought something was wrong — my phone wouldn't stop ringing. We booked 11 appointments before we'd even finished the campaign. The cost per lead dropped by 75% compared to what we were spending on ads.",
    quoteAttr: "— Daniel K., Managing Partner, Meridian Property Group",
    dataIndustry: "REALTY",
  },
  {
    id: "crestline",
    type: "rvm",
    industry: "Home Services",
    clientName: "Crestline Roofing Co.",
    clientDetail: "Residential roofing contractor\nDenver, Colorado — Owner-operated, 12 crew",
    stat1num: "$214K",
    stat1label: "New contracts — 60 days",
    stat2num: "22",
    stat2label: "Qualified inspections booked",
    situation: <>Crestline Roofing had built a strong reputation on word of mouth over 11 years — but referrals alone couldn&apos;t fill the schedule consistently. After two slow winters in a row, owner Marcus Webb was looking for a proactive way to generate leads without hiring a salesperson or locking into a long-term ad agency retainer.<br /><br /><strong style={{ color: "#F5F2ED", fontWeight: 500 }}>The core opportunity was geography.</strong> Several Denver suburbs had experienced hail damage the previous season, meaning a large number of homeowners were eligible for insurance-covered roof replacements — they just hadn&apos;t been told yet.</>,
    challenges: ["Over-reliance on referrals", "Inconsistent monthly revenue", "No outbound outreach system", "Owner doing all sales himself", "Budget constraints — no ad spend history"],
    whatWeDid: [
      { num: "01", title: "Hail damage zone targeting — hyper-local list build", desc: "We identified the specific zip codes that had received significant hail in the prior season and built a list of homeowners with properties aged 8+ years — the prime insurance replacement window." },
      { num: "02", title: "Urgency-led voicemail script — insurance angle", desc: "We scripted a message positioning Crestline as offering a free inspection to homeowners who may have storm damage they don't know about. The hook: most insurance claims go unfiled simply because homeowners don't know they qualify." },
      { num: "03", title: "1,800 targeted drops across 3 suburbs", desc: "Drops were sent to three targeted suburbs over two weeks. Each suburb was treated as a separate mini-campaign with a localised caller ID to increase familiarity and callback rates." },
      { num: "04", title: "Follow-up drop sequence for non-responders", desc: "Two weeks after the first drop, a shorter follow-up voicemail was sent to non-responders — referencing the previous message and adding a limited-availability angle. This drove an additional 34 callbacks." },
    ],
    resultsTitle: "The Results — 60 Days",
    results: [
      { num: "248", label: "Total callbacks from 1,800 drops" },
      { num: "22", label: "Free roof inspections booked" },
      { num: "14", label: "Inspections converted to signed contracts" },
      { num: "$214K", label: "Revenue from new contracts in 60 days" },
      { num: "63%", label: "Inspection-to-contract close rate" },
      { num: "178×", label: "Revenue vs monthly service investment" },
    ],
    quote: "I was sceptical because I'd never done anything like this before. But within 10 days I had more booked inspections than I'd had in the previous 3 months combined. We had to bring in an extra crew member just to keep up with the work.",
    quoteAttr: "— Marcus W., Owner, Crestline Roofing Co.",
    dataIndustry: "ROOFING",
  },
  {
    id: "ascend",
    type: "wa",
    industry: "Coaching / Consulting",
    clientName: "Ascend Business Academy",
    clientDetail: "Online business coaching program\nRemote — serving US & Australia",
    stat1num: "143",
    stat1label: "Qualified calls booked — Month 1",
    stat2num: "68%",
    stat2label: "Reduction in unqualified sales calls",
    situation: <>Ascend Business Academy ran a high-ticket coaching program at $6,500 per enrolment. Their funnel was working — ads were driving consistent traffic to a WhatsApp opt-in — but <strong style={{ color: "#F5F2ED", fontWeight: 500 }}>the sales team was drowning in conversations that went nowhere.</strong><br /><br />Of every 10 discovery calls booked, fewer than 3 were with prospects who met the minimum criteria (established business, $10K+ monthly revenue, genuine commitment to growth). The rest were tyre-kickers, students, and people looking for free advice — burning the team&apos;s time and morale.</>,
    challenges: ["Low lead-to-qualified ratio (28%)", "Sales team time wasted on bad fits", "No qualification before booking", "Leads going cold overnight & on weekends", "Inconsistent follow-up across time zones"],
    whatWeDid: [
      { num: "01", title: "Built a custom qualification agent — 5 criteria gates", desc: "We designed an agent that conversationally screened every lead against 5 qualification criteria: business type, monthly revenue, time in business, decision-making authority, and investment readiness. Only leads clearing all 5 gates could book a call." },
      { num: "02", title: "Warm, human-sounding conversation flow", desc: "The agent was trained to feel like a knowledgeable team member — not a bot. It used the prospect's name, acknowledged their answers, and asked intelligent follow-up questions. Prospects regularly asked to speak to \"her\" by name after the call." },
      { num: "03", title: "Auto-booking into the sales team's calendar", desc: "Qualified leads were automatically presented with available appointment slots and booked directly into Calendly — pre-loaded with their qualification data so the sales team knew exactly who they were talking to before the call started." },
      { num: "04", title: "24/7 response across US & Australian time zones", desc: "The agent operated around the clock — responding to Australian leads at 2am US time and US leads during the Australian night shift. No lead sat unanswered for more than 90 seconds." },
    ],
    resultsTitle: "The Results — Month 1",
    results: [
      { num: "387", label: "WhatsApp leads engaged by agent" },
      { num: "143", label: "Qualified discovery calls booked" },
      { num: "37%", label: "Lead-to-qualified conversion rate (up from 28%)" },
      { num: "68%", label: "Drop in unqualified calls for sales team" },
      { num: "<90s", label: "Average response time — 24/7" },
      { num: "$390K", label: "Pipeline value generated in 30 days" },
    ],
    quote: "Our sales team used to dread Monday mornings — half their calls were with people who had no business being on the call. Now every call is with someone who's already been through the filter. Close rates went up 40% because they're only talking to real buyers.",
    quoteAttr: "— Priya S., Head of Sales, Ascend Business Academy",
    dataIndustry: "COACHING",
  },
  {
    id: "stackframe",
    type: "wa",
    industry: "Web Design Agency",
    clientName: "Stackframe Studio",
    clientDetail: "Boutique web design & dev agency\nAustin, Texas — Team of 8",
    stat1num: "$127K",
    stat1label: "New project revenue — 45 days",
    stat2num: "3.2×",
    stat2label: "Increase in qualified project enquiries",
    situation: <>Stackframe Studio was doing quality work — their portfolio was strong and their existing clients loved them. But their new business process was a mess. Enquiries came in through their website contact form, social DMs, and referral emails — and response times were inconsistent. <strong style={{ color: "#F5F2ED", fontWeight: 500 }}>Leads were going cold before anyone got back to them.</strong><br /><br />Worse, when they did respond, they were spending hours scoping out projects that were way below their $8,000 minimum — or talking to prospects who expected a $500 WordPress site. The agency needed a way to instantly respond to every enquiry, qualify budget and project scope upfront, and only surface the opportunities worth chasing.</>,
    challenges: ["Slow response to inbound enquiries", "No budget qualification before scoping", "Hours wasted on below-minimum projects", "Leads arriving through multiple channels", "Small team — no capacity for a sales hire"],
    whatWeDid: [
      { num: "01", title: "WhatsApp as the single intake channel", desc: "We redirected all inbound enquiries — from the contact form, Instagram bio, and email signature — to a single WhatsApp number managed by the agent. One funnel. No more scattered conversations." },
      { num: "02", title: "Project & budget qualification flow", desc: "The agent gathered project type, timeline, budget range, and decision-making authority before any human was involved. Enquiries under $5,000 were politely directed to a self-serve resource page. Everything above was fast-tracked to the team." },
      { num: "03", title: "Instant response — sub-2-minute reply, 7 days a week", desc: "The biggest win for Stackframe was speed. Weekend enquiries — previously ignored until Monday — now received a response within 90 seconds. Several projects were qualified and scoped before competitors even saw the lead." },
      { num: "04", title: "Discovery call booking with full project brief pre-loaded", desc: "Qualified leads were booked into a 30-minute discovery call with the project director — and arrived with a complete brief already filled out by the agent. First calls became decision calls." },
    ],
    resultsTitle: "The Results — 45 Days",
    results: [
      { num: "94", label: "Total inbound enquiries handled by agent" },
      { num: "41", label: "Qualified discovery calls booked" },
      { num: "3.2×", label: "Increase in qualified project enquiries" },
      { num: "11", label: "New projects signed in 45 days" },
      { num: "$127K", label: "New project revenue generated" },
      { num: "Zero", label: "Below-minimum projects scoped by the team" },
    ],
    quote: "We used to lose leads constantly — someone would message on a Friday night and by Monday they'd gone with someone else. Now the agent picks it up in seconds, qualifies them, and books the call. We closed three projects that would have gone cold before we even saw the enquiry.",
    quoteAttr: "— Tom R., Founder, Stackframe Studio",
    dataIndustry: "DIGITAL",
  },
];

/* ─── CASE CARD ─── */
function CaseCard({ c }: { c: CaseStudy }) {
  const isWa = c.type === "wa";
  const accent = isWa ? "#25D366" : "#FF5C00";
  const tagBg = isWa ? "rgba(37,211,102,0.1)" : "rgba(255,92,0,0.12)";
  const numLabel = isWa ? "wa-label" : "rvm-label";

  return (
    <div className="reveal" style={{
      maxWidth: 1400, margin: "0 auto 3px",
      background: "#181818", display: "grid",
      gridTemplateColumns: "380px 1fr", minHeight: 520,
      position: "relative", overflow: "hidden",
    }}>
      {/* LEFT */}
      <div style={{
        background: "#111111", padding: "48px 40px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
        borderRight: `1px solid ${isWa ? "rgba(37,211,102,0.15)" : "#222222"}`,
      }}>
        {/* Top accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent }} />
        {/* Watermark */}
        <div style={{
          position: "absolute", bottom: -20, right: -10,
          fontFamily: "'Bebas Neue',sans-serif", fontSize: 100,
          color: "rgba(255,255,255,0.03)", lineHeight: 1,
          pointerEvents: "none", letterSpacing: 2, whiteSpace: "nowrap", userSelect: "none",
        }}>{c.dataIndustry}</div>

        <div>
          <div style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "5px 12px", borderRadius: 1, marginBottom: 24, background: tagBg, color: accent }}>{c.industry}</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 42, letterSpacing: 1, color: "#F5F2ED", lineHeight: 1, marginBottom: 8 }}>{c.clientName}</div>
          <div style={{ fontSize: 13, color: "#888880", fontWeight: 300, marginBottom: 36, lineHeight: 1.5, whiteSpace: "pre-line" }}>{c.clientDetail}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 36 }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, lineHeight: 1, letterSpacing: -1, marginBottom: 2, color: accent }}>{c.stat1num}</div>
            <div style={{ fontSize: 12, color: "#888880", fontWeight: 300, textTransform: "uppercase", letterSpacing: 1 }}>{c.stat1label}</div>
          </div>
          <div style={{ height: 1, background: "#222222" }} />
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, lineHeight: 1, letterSpacing: -1, marginBottom: 2, color: accent }}>{c.stat2num}</div>
            <div style={{ fontSize: 12, color: "#888880", fontWeight: 300, textTransform: "uppercase", letterSpacing: 1 }}>{c.stat2label}</div>
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: accent }} className={numLabel}>
          {isWa ? "AI WhatsApp Agent — The Agent" : "Ringless Voicemail Drops — The Drop"}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ padding: "48px 52px", display: "flex", flexDirection: "column", gap: 36 }}>

        {/* Situation */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "#888880", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #222222" }}>The Situation</div>
          <div style={{ fontSize: 15, lineHeight: 1.8, color: "#888880", fontWeight: 300 }}>{c.situation}</div>
        </div>

        {/* Challenges */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "#888880", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #222222" }}>The Challenges</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {c.challenges.map((ch) => (
              <span key={ch} style={{ padding: "8px 16px", background: "#222222", borderRadius: 2, fontSize: 13, color: "#F5F2ED", fontWeight: 300, borderLeft: "2px solid #2A2A2A" }}>{ch}</span>
            ))}
          </div>
        </div>

        {/* What We Did */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "#888880", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #222222" }}>What We Did</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {c.whatWeDid.map((w) => (
              <div key={w.num} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, lineHeight: 1, flexShrink: 0, marginTop: -2, color: isWa ? "rgba(37,211,102,0.35)" : "rgba(255,92,0,0.4)" }}>{w.num}</div>
                <div>
                  <strong style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#F5F2ED", marginBottom: 3 }}>{w.title}</strong>
                  <span style={{ fontSize: 13, color: "#888880", fontWeight: 300, lineHeight: 1.5 }}>{w.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "#888880", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #222222" }}>{c.resultsTitle}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, background: "#222222" }}>
            {c.results.map((r) => (
              <div key={r.label} style={{ background: "#111111", padding: "20px", display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 38, lineHeight: 1, letterSpacing: -0.5, color: accent }}>{r.num}</div>
                <div style={{ fontSize: 12, color: "#888880", fontWeight: 300, lineHeight: 1.4 }}>{r.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div style={{ background: "#222222", borderLeft: `3px solid ${accent}`, padding: "20px 24px", fontSize: 15, lineHeight: 1.65, color: "#F5F2ED", fontWeight: 300, fontStyle: "italic" }}>
          &quot;{c.quote}&quot;
          <span style={{ display: "block", marginTop: 10, fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", fontStyle: "normal", color: accent }}>{c.quoteAttr}</span>
        </div>

      </div>
    </div>
  );
}

/* ─── PAGE ─── */
export default function CaseStudiesPage() {
  const cms = useCMS("case-studies");
  const [filter, setFilter] = useState<"all" | "rvm" | "wa">("all");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.06 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filter]);

  const rvmCases = cases.filter((c) => c.type === "rvm");
  const waCases = cases.filter((c) => c.type === "wa");

  return (
    <>
      <Navbar activePage="case-studies" />

      {/* HERO */}
      <section className="page-hero" style={{
        minHeight: "68vh", display: "flex", flexDirection: "column",
        justifyContent: "flex-end", padding: "140px 64px 88px",
        position: "relative", overflow: "hidden",
        borderBottom: "1px solid #222222", background: "#0A0A0A",
      }}>
        <div style={{ position: "absolute", fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(140px,18vw,280px)", color: "rgba(255,92,0,0.03)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", whiteSpace: "nowrap", pointerEvents: "none", letterSpacing: 8, userSelect: "none" }}>RESULTS</div>
        <div style={{ position: "absolute", right: -150, top: "50%", transform: "translateY(-50%)", width: 700, height: 700, background: "radial-gradient(circle, rgba(255,92,0,0.09) 0%, transparent 68%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,92,0,0.04) 1px, transparent 1px)", backgroundSize: "100% 80px", maskImage: "radial-gradient(ellipse 90% 90% at 70% 50%, black 40%, transparent 100%)" }} />

        <div className="anim-fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 14, fontSize: 12, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: "#FF5C00", marginBottom: 28 }}>
          <span style={{ display: "block", width: 40, height: 1, background: "#FF5C00", opacity: 0.6 }} />
          {cms("hero","eyebrow","Proof It Works")}
          <span style={{ display: "block", width: 40, height: 1, background: "#FF5C00", opacity: 0.6 }} />
        </div>
        <h1 className="anim-fade-up-1" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(60px,8vw,124px)", lineHeight: 0.88, letterSpacing: 1.5, color: "#F5F2ED", maxWidth: 900, marginBottom: 24 }}>
          {cms("hero","headline","REAL BUSINESSES.\nREAL RESULTS.").split("\n").map((l,i,a)=><span key={i}>{l}{i<a.length-1&&<br/>}</span>)}
        </h1>
        <div style={{ width: 80, height: 3, background: "#FF5C00", opacity: 0.5, marginBottom: 24 }} />
        <p className="anim-fade-up-2" style={{ fontSize: 18, color: "#888880", lineHeight: 1.7, fontWeight: 300, maxWidth: 580 }}>
          {cms("hero","subheadline","Four businesses. Four industries. Two tools. One consistent outcome — more qualified leads, more appointments, more revenue. No fluff. Just the numbers.")}
        </p>
      </section>

      {/* FILTER BAR */}
      <div style={{
        background: "#111111", borderBottom: "1px solid #222222",
        padding: "0 48px", display: "flex", alignItems: "center", gap: 0,
        position: "sticky", top: 68, zIndex: 50,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#888880", padding: "20px 24px 20px 0", borderRight: "1px solid #222222", marginRight: 24, whiteSpace: "nowrap" }}>Filter by</div>
        <div style={{ display: "flex" }}>
          {(["all", "rvm", "wa"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "20px 24px", fontSize: 13, fontWeight: 500, letterSpacing: 0.5,
              textTransform: "uppercase", color: filter === f ? "#FF5C00" : "#888880",
              cursor: "pointer", border: "none", background: "none",
              borderBottom: filter === f ? "2px solid #FF5C00" : "2px solid transparent",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}>
              {f === "all" ? "All Case Studies" : f === "rvm" ? "Ringless Voicemail" : "AI WhatsApp Agent"}
            </button>
          ))}
        </div>
      </div>

      {/* RVM GROUP */}
      {(filter === "all" || filter === "rvm") && (
        <>
          <div className="reveal" style={{ padding: "60px 48px 40px", maxWidth: 1400, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 20px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, borderRadius: 2, whiteSpace: "nowrap", background: "rgba(255,92,0,0.12)", color: "#FF5C00", border: "1px solid rgba(255,92,0,0.25)" }}>📞 Ringless Voicemail Drops</span>
              <div style={{ flex: 1, height: 1, background: "#222222" }} />
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "#888880", whiteSpace: "nowrap" }}>2 Case Studies</span>
            </div>
          </div>
          <div style={{ padding: "0 48px 100px" }}>
            {rvmCases.map((c) => <CaseCard key={c.id} c={c} />)}
          </div>
        </>
      )}

      {/* WA GROUP */}
      {(filter === "all" || filter === "wa") && (
        <>
          <div className="reveal" style={{ padding: "60px 48px 40px", maxWidth: 1400, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 20px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, borderRadius: 2, whiteSpace: "nowrap", background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>💬 AI WhatsApp Agent</span>
              <div style={{ flex: 1, height: 1, background: "#222222" }} />
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "#888880", whiteSpace: "nowrap" }}>2 Case Studies</span>
            </div>
          </div>
          <div style={{ padding: "0 48px 100px" }}>
            {waCases.map((c) => <CaseCard key={c.id} c={c} />)}
          </div>
        </>
      )}

      {/* BOTTOM CTA */}
      <section style={{ background: "#111111", padding: "120px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(255,92,0,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div className="reveal" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 20 }}>
            <div style={{ height: 1, width: 40, background: "#FF5C00" }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: "#FF5C00" }}>Your Business Is Next</span>
            <div style={{ height: 1, width: 40, background: "#FF5C00" }} />
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(48px,7vw,96px)", lineHeight: 0.92, color: "#F5F2ED", marginBottom: 24, letterSpacing: 1 }}>
            READY TO WRITE<br />YOUR OWN <span style={{ color: "#FF5C00" }}>CASE STUDY?</span>
          </h2>
          <p style={{ fontSize: 17, color: "#888880", maxWidth: 520, margin: "0 auto 48px", lineHeight: 1.7, fontWeight: 300 }}>
            Book a free strategy call. We&apos;ll map out exactly what a campaign looks like for your business — the target list, the approach, and the results you can realistically expect.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/#contact" className="btn-primary">Book My Free Strategy Call →</a>
            <a href="/packages" className="btn-secondary">View All Packages →</a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
