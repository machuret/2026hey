"use client";
import { useState } from "react";

const faqs = [
  { q: "Is ringless voicemail legal?", a: "Yes. Ringless Voicemail is regulated similarly to phone and SMS marketing. We ensure all campaigns are compliant with applicable regulations and best practices, including proper opt-out mechanisms." },
  { q: "What industries does this work for?", a: "Any business that sells to other businesses or directly to consumers — professional services, real estate, finance, insurance, home services, coaching, consulting, healthcare, and more." },
  { q: "How fast will I see results?", a: "Most clients see initial responses within the first 48–72 hours of a campaign launch. Full momentum typically builds over the first 2–4 weeks." },
  { q: "Do I need any tech skills?", a: "Zero. We handle all the technical setup, integration, and management. You simply review, approve, and receive leads." },
  { q: "Can I use just one service?", a: "Absolutely. You can start with Ringless Voicemail Drops, the AI WhatsApp Agent, or go full system with both. We’ll recommend what makes the most sense for your business." },
  { q: "What do I need to get started?", a: "A quick strategy call with our team. From there, we handle everything — scripts, setup, launch, management. You show up for the appointments." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" style={{ background: "#0A0A0A", padding: "100px 48px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="reveal">
          <div className="section-label">FAQ</div>
          <h2 className="section-headline">GOOD QUESTIONS.<br />REAL ANSWERS.</h2>
        </div>
      </div>
      <div className="reveal" style={{ maxWidth: 800, margin: "60px auto 0" }}>
        {faqs.map((faq, i) => (
          <div key={i}
            className={open === i ? "faq-item-open" : ""}
            style={{ borderBottom: "1px solid #222222", padding: "28px 0", cursor: "pointer" }}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div style={{
              fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: 0.5,
              color: "#F5F2ED", display: "flex", justifyContent: "space-between",
              alignItems: "center", userSelect: "none",
            }}>
              {faq.q}
              <span className="faq-toggle" style={{ color: "#FF5C00", fontSize: 24, fontWeight: 300 }}>+</span>
            </div>
            <div className="faq-answer">{faq.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
