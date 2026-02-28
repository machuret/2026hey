"use client";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const beliefs = [
  {
    icon: "🎯",
    title: "Outcomes Over Activity",
    body: "We don't measure success by the number of emails sent or calls made. We measure it by appointments booked and deals closed. If it doesn't move your pipeline, we don't do it.",
  },
  {
    icon: "⚙️",
    title: "Systems Beat Hustle",
    body: "Grinding harder on broken channels doesn't work. Building the right system — and letting it run — does. We believe in automation done with precision, not shortcuts.",
  },
  {
    icon: "🤝",
    title: "No Guesswork. No BS.",
    body: "We tell you what to expect, we show you what's happening, and we take responsibility when something isn't working. Transparency isn't a feature. It's how we operate.",
  },
];

const processRows = [
  { num: "01", title: "We Learn Your Business", tag: "Week 1 — Strategy", desc: "Before we write a single script or build a single flow, we get deep into your offer, your ideal client, your market, and your goals. No templates. No copy-paste campaigns. Everything we build is specific to you." },
  { num: "02", title: "We Build Everything", tag: "Week 1–2 — Build", desc: "Scripts. Voice production. Contact targeting. AI agent flows. CRM integrations. We handle every single technical component. You review, approve, and we launch. No logins. No dashboards. No tech headaches on your end." },
  { num: "03", title: "We Launch and Monitor", tag: "Week 2 — Live", desc: "Campaigns go live. Your AI agent activates. We watch everything in real time — delivery rates, response rates, qualification data. If something needs to be adjusted, we adjust it before it costs you money." },
  { num: "04", title: "We Optimize Weekly", tag: "Ongoing — Growth", desc: "We don't set and forget. Every week we analyse what's working, what's not, and where to push harder. Scripts get refined. Targeting gets sharper. Results compound over time." },
  { num: "05", title: "You Close The Deals", tag: "Always — Your Job", desc: "Appointment-ready leads land in your calendar. They already know who you are, what you do, and why they're talking to you. Your job is to show up and close. That's it." },
];

const team = [
  { initials: "MR", name: "Marcus Reid", role: "Founder & Strategy Lead", bio: "10+ years running outreach systems for B2B businesses across financial services, real estate, and professional consulting. Built Hey More Leads after burning through every traditional channel and finding what actually works." },
  { initials: "AL", name: "Ana Lima", role: "Head of AI & Automation", bio: "Conversational AI architect with a background in CRM systems and sales automation. Designs and trains every WhatsApp agent we deploy — obsessively optimising qualification flows until response rates are where they need to be." },
  { initials: "JC", name: "Jake Carver", role: "Campaign & Copy Director", bio: "Direct response copywriter and campaign manager with 8 years experience in voicemail, SMS, and multi-channel outreach. Responsible for the scripts that get callbacks — and the ones that don't go out until they do." },
];

export default function AboutPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Navbar activePage="about" />

      {/* PAGE HERO */}
      <section style={{
        minHeight: "70vh", display: "flex", flexDirection: "column",
        justifyContent: "flex-end", padding: "140px 48px 80px",
        position: "relative", overflow: "hidden",
        borderBottom: "1px solid #222222", background: "#0A0A0A",
      }}>
        {/* Background watermark */}
        <div style={{
          position: "absolute", fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "clamp(180px,22vw,340px)", color: "rgba(255,92,0,0.04)",
          top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          whiteSpace: "nowrap", pointerEvents: "none", letterSpacing: 8,
          userSelect: "none",
        }}>ABOUT</div>
        {/* Glow */}
        <div style={{
          position: "absolute", left: -200, bottom: -100,
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(255,92,0,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="anim-fade-up" style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          fontSize: 12, fontWeight: 600, letterSpacing: 2,
          textTransform: "uppercase", color: "#FF5C00", marginBottom: 24,
        }}>
          <span style={{ display: "block", width: 32, height: 2, background: "#FF5C00" }} />
          Who We Are
        </div>

        <h1 className="anim-fade-up-1" style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "clamp(56px,9vw,130px)",
          lineHeight: 0.88, letterSpacing: 1,
          color: "#F5F2ED", maxWidth: 900,
        }}>
          WE BUILT THIS BECAUSE<br />THE <span style={{ color: "#FF5C00" }}>OLD WAY</span><br />STOPPED WORKING.
        </h1>

        <p className="anim-fade-up-2" style={{
          fontSize: 18, color: "#888880", lineHeight: 1.7,
          fontWeight: 300, maxWidth: 560, marginTop: 32,
        }}>
          Hey More Leads is a done-for-you lead generation system built by a small team who got tired of watching great businesses lose to inferior ones — simply because their outreach was broken.
        </p>
      </section>

      {/* ORIGIN STORY */}
      <section style={{ background: "#111111", padding: "100px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 100, alignItems: "start" }}>
          <div className="reveal" style={{ position: "sticky", top: 120 }}>
            <div className="section-label">Why We Built This</div>
            <h2 className="section-headline">THE STORY BEHIND THE SYSTEM.</h2>
          </div>
          <div className="reveal" style={{ fontSize: 17, lineHeight: 1.85, color: "#888880", fontWeight: 300 }}>
            <p style={{ marginBottom: 28 }}>A few years ago, our founder was running a small B2B consulting firm. The offer was solid. The results for clients were real. But the pipeline? A mess of cold calls that went to voicemail, Facebook ads that burned cash, and email campaigns that disappeared into spam folders.</p>
            <p style={{ marginBottom: 28 }}><strong style={{ color: "#F5F2ED", fontWeight: 500 }}>The leads weren&apos;t the problem. The channels were.</strong> Every &quot;proven&quot; outreach method had become so overcrowded, so overused, that it stopped performing. And the agencies promising to fix it were charging enterprise rates for amateur results.</p>

            <div style={{
              fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, lineHeight: 1.1,
              color: "#F5F2ED", borderLeft: "3px solid #FF5C00",
              paddingLeft: 24, margin: "40px 0", letterSpacing: 0.5,
            }}>
              &quot;We weren&apos;t going to out-spend the big players. So we had to <span style={{ color: "#FF5C00" }}>out-smart</span> them.&quot;
            </div>

            <p style={{ marginBottom: 28 }}>That&apos;s when the team started experimenting. Ringless voicemail drops to get in front of the right people without interrupting their day. AI agents on WhatsApp to qualify leads at scale — around the clock, without a salesperson on the phone. Two tools. One system. Completely done for you.</p>
            <p style={{ marginBottom: 28 }}><strong style={{ color: "#F5F2ED", fontWeight: 500 }}>The results were immediate.</strong> Callback rates jumped. Qualified leads started showing up in calendars without anyone having to chase them. And the cost per appointment? A fraction of what paid ads were delivering.</p>
            <p style={{ marginBottom: 28 }}>Hey More Leads was built to take that system — the one that worked for us — and give it to small and mid-sized businesses who are tired of fighting on the wrong battlefield.</p>
            <p><strong style={{ color: "#F5F2ED", fontWeight: 500 }}>You don&apos;t need a bigger budget. You need a smarter system.</strong> That&apos;s what we built. That&apos;s what we run for you.</p>
          </div>
        </div>
      </section>

      {/* WHAT WE BELIEVE */}
      <section style={{ background: "#0A0A0A", padding: "100px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="reveal">
            <div className="section-label">What We Stand For</div>
            <h2 className="section-headline">THREE THINGS WE&apos;LL<br />NEVER COMPROMISE ON.</h2>
          </div>
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, background: "#222222", marginTop: 60 }}>
            {beliefs.map((b, i) => (
              <div key={i} style={{
                background: "#181818", padding: "48px 36px",
                position: "relative", overflow: "hidden",
                transition: "background 0.3s",
              }}
                onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.background = "#111111"; }}
                onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = "#181818"; }}
              >
                <div style={{ fontSize: 36, marginBottom: 20 }}>{b.icon}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#F5F2ED", marginBottom: 14 }}>{b.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#888880", fontWeight: 300 }}>{b.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO BANNER */}
      <div className="reveal" style={{
        background: "#FF5C00", padding: "80px 48px",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "clamp(100px,16vw,220px)", color: "rgba(0,0,0,0.08)",
          top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          whiteSpace: "nowrap", pointerEvents: "none", letterSpacing: 4,
          userSelect: "none",
        }}>WE BELIEVE</div>
        <div style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "clamp(36px,5vw,68px)",
          lineHeight: 1.05, color: "#0A0A0A",
          maxWidth: 900, margin: "0 auto",
          letterSpacing: 0.5, position: "relative",
        }}>
          Small businesses deserve the same <span style={{ borderBottom: "4px solid rgba(0,0,0,0.25)" }}>firepower</span> as the big ones — without the bloated agency fees and the empty promises.
        </div>
      </div>

      {/* HOW WE WORK */}
      <section id="process" style={{ background: "#111111", padding: "100px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="reveal">
            <div className="section-label">How We Work</div>
            <h2 className="section-headline">WHAT WORKING WITH US<br />ACTUALLY LOOKS LIKE.</h2>
          </div>
          <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: 2, background: "#222222", marginTop: 60 }}>
            {processRows.map((row) => (
              <div key={row.num} style={{
                background: "#181818", display: "grid",
                gridTemplateColumns: "80px 1fr 1fr", alignItems: "stretch",
                transition: "background 0.2s",
              }}
                onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.background = "#111111"; }}
                onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = "#181818"; }}
              >
                <div style={{
                  fontFamily: "'Bebas Neue',sans-serif", fontSize: 52,
                  color: "rgba(255,92,0,0.2)", padding: "32px 24px",
                  borderRight: "1px solid #222222", display: "flex",
                  alignItems: "center", justifyContent: "center", lineHeight: 1,
                }}>{row.num}</div>
                <div style={{ padding: "36px 40px", borderRight: "1px solid #222222" }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 26, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#F5F2ED", marginBottom: 8 }}>{row.title}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "#FF5C00" }}>{row.tag}</div>
                </div>
                <div style={{ padding: "36px 40px", fontSize: 15, lineHeight: 1.7, color: "#888880", fontWeight: 300, display: "flex", alignItems: "center" }}>{row.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section style={{ background: "#0A0A0A", padding: "100px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="reveal">
            <div className="section-label">The Team</div>
            <h2 className="section-headline">SMALL TEAM.<br />SERIOUS OPERATORS.</h2>
            <p style={{ fontSize: 17, color: "#888880", fontWeight: 300, lineHeight: 1.7, maxWidth: 600, marginTop: 16 }}>
              We&apos;re not a bloated agency with account managers who&apos;ve never run a campaign. We&apos;re a lean team of specialists who&apos;ve built and run these systems ourselves — and we treat your pipeline like it&apos;s our own.
            </p>
          </div>
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, background: "#222222", marginTop: 60 }}>
            {team.map((member) => (
              <div key={member.name} style={{
                background: "#181818", padding: "40px 36px",
                transition: "background 0.3s",
              }}
                onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.background = "#111111"; }}
                onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = "#181818"; }}
              >
                <div style={{
                  width: 72, height: 72, borderRadius: 2,
                  background: "#222222", marginBottom: 24,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: "#FF5C00",
                  border: "1px solid rgba(255,92,0,0.2)", position: "relative",
                }}>
                  {member.initials}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "#FF5C00" }} />
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#F5F2ED", marginBottom: 4 }}>{member.name}</div>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "#FF5C00", marginBottom: 20 }}>{member.role}</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#888880", fontWeight: 300 }}>{member.bio}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{
        background: "#111111", padding: "120px 48px",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, rgba(255,92,0,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div className="reveal" style={{ position: "relative", zIndex: 1 }}>
          <div className="section-label" style={{ justifyContent: "center" }}>Work With Us</div>
          <h2 style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "clamp(48px,7vw,100px)",
            lineHeight: 0.92, color: "#F5F2ED",
            marginBottom: 24, letterSpacing: 1,
          }}>
            NOW YOU KNOW US.<br />LET&apos;S TALK ABOUT <span style={{ color: "#FF5C00" }}>YOU.</span>
          </h2>
          <p style={{ fontSize: 17, color: "#888880", maxWidth: 520, margin: "0 auto 48px", lineHeight: 1.7, fontWeight: 300 }}>
            Book a free strategy call. We&apos;ll tell you exactly what we&apos;d build for your business, what results you can expect, and what it takes to get started. No pressure. Just a straight conversation.
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
