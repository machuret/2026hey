"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const faqs = [
  { q: "Is the strategy call really free?", a: "Yes, completely. No credit card, no commitment, no catch. It's a 30-minute conversation — we learn about your business, you learn about our system, and we both decide if there's a fit. If there isn't, you leave with useful insight regardless." },
  { q: "What should I prepare before the call?", a: "Nothing formal — just a clear sense of who your ideal client is and what your current lead generation situation looks like. If you have data on your current cost per lead or close rate, bring it. Otherwise, your form answers are enough for us to come prepared." },
  { q: "How quickly can we get started after the call?", a: "Fast. If we decide to move forward, we typically send a proposal within 24 hours of the call. Once you're onboard, we begin building your campaign immediately — and most clients are live within 5 to 7 business days." },
  { q: "I'm not sure which package is right — is that okay?", a: "Completely fine. That's exactly what the call is for. We'll ask about your goals, your current pipeline, and your budget — and we'll recommend the right starting point. We'd rather start you somewhere that makes sense than oversell you on a bigger package." },
  { q: "Will I be pressured to sign up on the call?", a: "Never. We don't do high-pressure sales. The call is genuinely about figuring out if we're the right fit for each other — nothing more. If you want time to think it over after, take it. We'll follow up once, and that's it." },
  { q: "What if I prefer to reach out via WhatsApp instead?", a: "Go for it — that's what we're built on. Hit the WhatsApp button on this page and our team will respond within a few hours. We can run the whole conversation there if that's easier for you." },
];

/* ── colours ── */
const BLK = "#0A0A0A";
const DARK = "#111111";
const DARK2 = "#181818";
const DARK3 = "#222222";
const DARK4 = "#2A2A2A";
const WHITE = "#F5F2ED";
const MUTED = "#888880";
const O = "#FF5C00";
const OH = "#FF7A25";
const G = "#25D366";
const INPUT_BG = "#141414";
const INPUT_BORDER = "#2C2C2C";

type FormState = "idle" | "submitting" | "success" | "error";

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedPkg, setSelectedPkg] = useState("");
  const [focusField, setFocusField] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.07 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState("submitting");
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          business: data.get("business"),
          industry: data.get("industry"),
          package: data.get("package"),
          message: data.get("message"),
        }),
      });
      if (!res.ok) throw new Error("Server error");
      setFormState("success");
      setTimeout(() => {
        document.getElementById("calendar")?.scrollIntoView({ behavior: "smooth" });
      }, 1200);
    } catch {
      setFormState("error");
      setErrorMsg("Something went wrong. Please try again or reach out via WhatsApp.");
    }
  }

  const inputStyle = (name: string): React.CSSProperties => ({
    background: INPUT_BG, border: `1px solid ${focusField === name ? O : INPUT_BORDER}`,
    color: WHITE, padding: "14px 18px", fontFamily: "'DM Sans',sans-serif",
    fontSize: 15, fontWeight: 300, outline: "none", width: "100%",
    boxShadow: focusField === name ? `0 0 0 3px rgba(255,92,0,0.2)` : "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  });

  return (
    <div style={{ background: BLK, color: WHITE, fontFamily: "'DM Sans',sans-serif" }}>
      <Navbar activePage="contact" />

      {/* ── HERO ── */}
      <section style={{
        minHeight: "55vh", display: "flex", flexDirection: "column", justifyContent: "flex-end",
        padding: "140px 48px 70px", position: "relative", overflow: "hidden",
        background: DARK, borderBottom: `1px solid ${DARK3}`,
      }}>
        <div style={{ position: "absolute", fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(160px,22vw,340px)", color: "rgba(255,92,0,0.04)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", whiteSpace: "nowrap", pointerEvents: "none", letterSpacing: 8, userSelect: "none" }}>TALK</div>
        <div style={{ position: "absolute", right: -120, top: "50%", transform: "translateY(-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(255,92,0,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: O, marginBottom: 24 }}>
          <span style={{ display: "block", width: 32, height: 2, background: O }} />Free Strategy Call
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(56px,8vw,115px)", lineHeight: 0.88, letterSpacing: 1, color: WHITE, maxWidth: 900 }}>
          LET&apos;S TALK ABOUT<br />GETTING YOU <span style={{ color: O }}>MORE LEADS.</span>
        </h1>
        <p style={{ fontSize: 18, color: MUTED, lineHeight: 1.7, fontWeight: 300, maxWidth: 600, marginTop: 28 }}>
          No pitch. No pressure. Just a straight conversation about your business, your goals, and whether our system is the right fit. If it is — we&apos;ll show you exactly what we&apos;d build and what results to expect.
        </p>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: DARK4 }}>
        {[
          { icon: "⚡", title: "Response Within 24 Hours", sub: "We follow up fast — always" },
          { icon: "🎯", title: "No Hard Sell. Ever.", sub: "We only work with the right fit" },
          { icon: "🛡️", title: "100% Confidential", sub: "Your details stay with us" },
          { icon: "📅", title: "30 Minutes. That's It.", sub: "Focused, efficient, no fluff" },
        ].map((t) => (
          <div key={t.title} style={{ background: DARK2, padding: "24px 32px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 22, flexShrink: 0 }}>{t.icon}</div>
            <div>
              <strong style={{ display: "block", fontSize: 13, fontWeight: 600, color: WHITE }}>{t.title}</strong>
              <span style={{ fontSize: 12, color: MUTED, fontWeight: 300 }}>{t.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ padding: "80px 48px 100px", display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 60, maxWidth: 1300, margin: "0 auto", alignItems: "start" }}>

        {/* LEFT PANEL */}
        <div className="reveal" style={{ position: "sticky", top: 100 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" as const, color: O, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            What Happens Next<span style={{ display: "block", height: 1, width: 40, background: O }} />
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(38px,4vw,58px)", lineHeight: 0.95, color: WHITE, marginBottom: 24, letterSpacing: 0.5 }}>
            A 30-MINUTE CALL THAT<br />CHANGES HOW YOU <span style={{ color: O }}>GET LEADS.</span>
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: MUTED, fontWeight: 300, marginBottom: 40 }}>
            Fill in the form, pick a time that works, and we&apos;ll show up ready. We&apos;ll have already reviewed your business and your industry — so the conversation starts where it matters.<br /><br />
            <strong style={{ color: WHITE, fontWeight: 500 }}>No generic decks. No recycled pitches.</strong> Just a focused conversation about what a system built specifically for your business would look like — and what it would realistically deliver.
          </p>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
            {[
              { num: "01", title: "We review your business before the call", sub: "Your form answers tell us everything we need. We arrive prepared — not winging it." },
              { num: "02", title: "We map out what we'd build for you", sub: "RVM campaign strategy, WhatsApp agent design, targeting approach — tailored to your offer and your market." },
              { num: "03", title: "We give you realistic numbers", sub: "Expected callback rates, lead volume, cost per appointment — based on real data from your industry, not generic estimates." },
              { num: "04", title: "You decide if it's a fit", sub: "No pressure. No follow-up badgering. If we're right for each other, we move forward. If not, you leave with a clearer picture of what will work." },
            ].map((s) => (
              <div key={s.num} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "18px 20px", background: DARK2, border: `1px solid ${DARK3}`, borderLeft: `3px solid ${O}` }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: "rgba(255,92,0,0.35)", lineHeight: 1, flexShrink: 0 }}>{s.num}</div>
                <div>
                  <strong style={{ display: "block", fontSize: 14, fontWeight: 500, color: WHITE, marginBottom: 3 }}>{s.title}</strong>
                  <span style={{ fontSize: 13, color: MUTED, fontWeight: 300, lineHeight: 1.4 }}>{s.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Contact methods */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <a href="mailto:hello@heymoreleads.com" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: DARK2, border: `1px solid ${DARK3}`, textDecoration: "none", transition: "background 0.2s" }}
              onMouseOver={e => { (e.currentTarget as HTMLAnchorElement).style.background = DARK3; }}
              onMouseOut={e => { (e.currentTarget as HTMLAnchorElement).style.background = DARK2; }}>
              <div style={{ width: 40, height: 40, background: "rgba(255,92,0,0.1)", border: "1px solid rgba(255,92,0,0.25)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>✉️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" as const, color: MUTED }}>Email Us Directly</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: WHITE, marginTop: 2 }}>hello@heymoreleads.com</div>
              </div>
              <div style={{ color: O, fontSize: 16 }}>→</div>
            </a>
            <a href="https://wa.me/1234567890" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: DARK2, border: `1px solid ${DARK3}`, textDecoration: "none", transition: "background 0.2s" }}
              onMouseOver={e => { (e.currentTarget as HTMLAnchorElement).style.background = DARK3; }}
              onMouseOut={e => { (e.currentTarget as HTMLAnchorElement).style.background = DARK2; }}>
              <div style={{ width: 40, height: 40, background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>💬</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" as const, color: MUTED }}>WhatsApp</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: WHITE, marginTop: 2 }}>Chat With Us Now</div>
              </div>
              <div style={{ color: G, fontSize: 16 }}>→</div>
            </a>
          </div>
        </div>

        {/* FORM PANEL */}
        <div className="reveal" style={{ transitionDelay: "0.1s" }}>
          <div style={{ background: DARK2, border: `1px solid ${DARK3}`, borderTop: `3px solid ${O}`, padding: "48px 44px" }}>

            {formState === "success" ? (
              <div style={{ textAlign: "center", padding: "60px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                <div style={{ fontSize: 56 }}>🎯</div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 42, color: WHITE, letterSpacing: 1 }}>
                  YOU&apos;RE <span style={{ color: O }}>IN.</span>
                </div>
                <div style={{ fontSize: 15, color: MUTED, fontWeight: 300, lineHeight: 1.7, maxWidth: 380 }}>Thanks for reaching out. We&apos;ve received your details and we&apos;re already reviewing your business. Check below to pick a time for your strategy call.</div>
                <div style={{ fontSize: 13, color: O, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const }}>↓ Scroll down to book your time slot</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 36 }}>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, letterSpacing: 1, color: WHITE, marginBottom: 8 }}>Tell Us About Your Business</div>
                  <div style={{ fontSize: 14, color: MUTED, fontWeight: 300, lineHeight: 1.5 }}>Takes less than 2 minutes. The more you share, the more useful our call will be.</div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Row 1 */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {[
                      { label: "Your Name", name: "name", type: "text", placeholder: "John Smith" },
                      { label: "Business Name", name: "business", type: "text", placeholder: "Acme Corp" },
                    ].map((f) => (
                      <div key={f.name} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" as const, color: MUTED }}>
                          {f.label} <span style={{ color: O }}>*</span>
                        </label>
                        <input type={f.type} name={f.name} placeholder={f.placeholder} required style={inputStyle(f.name)}
                          onFocus={() => setFocusField(f.name)} onBlur={() => setFocusField("")} />
                      </div>
                    ))}
                  </div>

                  {/* Row 2 */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {[
                      { label: "Email Address", name: "email", type: "email", placeholder: "john@acmecorp.com" },
                      { label: "Phone / WhatsApp", name: "phone", type: "tel", placeholder: "+1 555 000 0000" },
                    ].map((f) => (
                      <div key={f.name} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" as const, color: MUTED }}>
                          {f.label} <span style={{ color: O }}>*</span>
                        </label>
                        <input type={f.type} name={f.name} placeholder={f.placeholder} required style={inputStyle(f.name)}
                          onFocus={() => setFocusField(f.name)} onBlur={() => setFocusField("")} />
                      </div>
                    ))}
                  </div>

                  {/* Industry */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" as const, color: MUTED }}>Industry <span style={{ color: O }}>*</span></label>
                    <select name="industry" required style={{ ...inputStyle("industry"), backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888880' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center", paddingRight: 44, cursor: "pointer", appearance: "none" as const }}
                      onFocus={() => setFocusField("industry")} onBlur={() => setFocusField("")}>
                      <option value="" disabled>Select your industry</option>
                      {["Real Estate", "Home Services (Roofing, HVAC, Solar, etc.)", "Insurance", "Financial Services", "Legal / Law Firm", "Coaching / Consulting", "Web Design / Digital Agency", "B2B Professional Services", "eCommerce / Retail", "Healthcare / Wellness", "Other"].map((opt) => (
                        <option key={opt} value={opt.toLowerCase().replace(/\W+/g, "-")} style={{ background: DARK2, color: WHITE }}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Package selector */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" as const, color: MUTED }}>Which Package Are You Interested In? <span style={{ color: O }}>*</span></label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                      {[
                        { id: "pkg-drop", value: "the-drop", icon: "📞", name: "The Drop", price: "$1,200/mo" },
                        { id: "pkg-stack", value: "the-full-stack", icon: "⚡", name: "Full Stack", price: "$1,800/mo" },
                        { id: "pkg-agent", value: "the-agent", icon: "🤖", name: "The Agent", price: "$1,200/mo" },
                      ].map((p) => (
                        <div key={p.id}
                          onClick={() => setSelectedPkg(p.value)}
                          style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                            padding: "16px 12px", cursor: "pointer", textAlign: "center",
                            background: selectedPkg === p.value ? "rgba(255,92,0,0.1)" : INPUT_BG,
                            border: selectedPkg === p.value ? `1px solid ${O}` : `1px solid ${INPUT_BORDER}`,
                            boxShadow: selectedPkg === p.value ? `0 0 0 1px ${O}` : "none",
                            transition: "all 0.2s",
                          }}>
                          <span style={{ fontSize: 20 }}>{p.icon}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" as const, color: WHITE }}>{p.name}</span>
                          <span style={{ fontSize: 11, color: MUTED, fontWeight: 300 }}>{p.price}</span>
                        </div>
                      ))}
                    </div>
                    <input type="hidden" name="package" value={selectedPkg} />
                  </div>

                  {/* Message */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" as const, color: MUTED }}>Anything Else We Should Know?</label>
                    <textarea name="message" placeholder="Tell us about your current lead generation setup, your target market, or anything specific you'd like us to prepare for the call..." rows={4}
                      style={{ ...inputStyle("message"), resize: "vertical", lineHeight: 1.6 }}
                      onFocus={() => setFocusField("message")} onBlur={() => setFocusField("")} />
                  </div>

                  {/* Privacy */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, color: MUTED, fontWeight: 300, lineHeight: 1.5, padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: `1px solid ${DARK3}` }}>
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>🔒</span>
                    Your information is 100% confidential and will never be shared with third parties. We use it only to prepare for your strategy call and to follow up with you directly.
                  </div>

                  {errorMsg && (
                    <div style={{ padding: "14px 18px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 14, color: "#EF4444" }}>{errorMsg}</div>
                  )}

                  {/* Submit */}
                  <button type="submit" disabled={formState === "submitting"} style={{
                    background: formState === "submitting" ? DARK3 : O,
                    color: formState === "submitting" ? MUTED : BLK,
                    padding: "18px 36px", width: "100%",
                    fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700,
                    letterSpacing: 1, textTransform: "uppercase" as const, border: "none", cursor: formState === "submitting" ? "not-allowed" : "pointer",
                    clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
                    transition: "background 0.2s",
                  }}>
                    {formState === "submitting" ? "Sending..." : "Book My Free Strategy Call →"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── CALENDAR SECTION ── */}
      <section id="calendar" style={{ background: DARK, padding: "80px 48px" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <div className="reveal" style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" as const, color: O, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              Pick Your Time<span style={{ display: "block", height: 1, width: 40, background: O }} />
            </div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(38px,4.5vw,62px)", lineHeight: 0.95, color: WHITE, letterSpacing: 0.5 }}>
              CHOOSE A TIME THAT<br />WORKS FOR <span style={{ color: O }}>YOU.</span>
            </h2>
            <p style={{ fontSize: 16, color: MUTED, fontWeight: 300, lineHeight: 1.6, maxWidth: 560, marginTop: 16 }}>All calls are 30 minutes via Zoom or Google Meet. Pick a slot below and you&apos;ll receive an instant confirmation with the meeting link.</p>
          </div>

          {/* Calendar embed placeholder */}
          <div className="reveal" style={{ background: DARK2, border: `1px solid ${DARK3}`, borderTop: `3px solid ${O}`, minHeight: 650, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* REPLACE THIS BLOCK WITH YOUR CALENDLY / TIDYCAL EMBED */}
            {/* Example: <iframe src="https://calendly.com/YOUR-USERNAME/strategy-call" width="100%" height="700" frameBorder="0" style={{border:"none"}} /> */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 56, opacity: 0.4 }}>📅</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: WHITE, letterSpacing: 1, opacity: 0.5 }}>Calendar Goes Here</div>
              <div style={{ fontSize: 14, color: MUTED, fontWeight: 300, maxWidth: 340, lineHeight: 1.6 }}>Replace this block with your Calendly, Tidycal, or other booking embed. The iframe will fill this entire container automatically.</div>
              <div style={{ fontSize: 12, color: O, fontFamily: "monospace", background: DARK3, padding: "10px 20px", border: "1px solid rgba(255,92,0,0.25)" }}>{`<!-- Paste your calendar embed code here -->`}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: BLK, padding: "80px 48px 100px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div className="reveal">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase" as const, color: O, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              Before You Book<span style={{ display: "block", height: 1, width: 40, background: O }} />
            </div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(36px,4vw,58px)", lineHeight: 0.95, color: WHITE, marginBottom: 48, letterSpacing: 0.5 }}>
              A FEW THINGS<br />PEOPLE USUALLY ASK.
            </h2>
          </div>
          <div className="reveal">
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: `1px solid ${DARK3}`, padding: "26px 0", cursor: "pointer" }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.5, color: openFaq === i ? O : WHITE, display: "flex", justifyContent: "space-between", alignItems: "center", userSelect: "none" }}>
                  {faq.q}
                  <span style={{ color: O, fontSize: 24, fontWeight: 300, transition: "transform 0.3s", transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)", flexShrink: 0, marginLeft: 16 }}>+</span>
                </div>
                <div style={{ fontSize: 15, color: MUTED, lineHeight: 1.75, fontWeight: 300, maxHeight: openFaq === i ? 240 : 0, overflow: "hidden", transition: "max-height 0.4s ease, padding 0.3s", paddingTop: openFaq === i ? 14 : 0 }}>
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        select option { background: ${DARK2}; color: ${WHITE}; }
      `}</style>
    </div>
  );
}
