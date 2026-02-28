const plans = [
  {
    name: "The Drop",
    tag: "Voicemail Only",
    tagline: "Get your voice heard at scale.",
    color: "orange",
    featured: false,
    cta: "Start With The Drop →",
    features: [
      "Full RVM campaign setup and management",
      "Script writing and voice production",
      "Targeted contact list strategy",
      "Campaign scheduling and delivery",
      "Monthly performance reporting",
    ],
  },
  {
    name: "The Full Stack",
    tag: "★ Most Popular",
    tagline: "Outreach + qualification. End-to-end. Done for you.",
    color: "gradient",
    featured: true,
    cta: "Get The Full Stack →",
    features: [
      "Everything in The Drop",
      "Everything in The Agent",
      "Priority setup and onboarding",
      "Unified strategy across both channels",
      "Dedicated account management",
      "Monthly strategy review calls",
    ],
  },
  {
    name: "The Agent",
    tag: "WhatsApp Only",
    tagline: "Never miss a lead. Never lose a conversation.",
    color: "green",
    featured: false,
    cta: "Deploy My Agent →",
    features: [
      "Custom AI WhatsApp agent build",
      "Qualification flow design",
      "Ongoing monitoring and management",
      "CRM / calendar integration",
      "Monthly reporting and optimization",
    ],
  },
];

export default function Pricing() {
  return (
    <section id="packages" style={{ background: "#0A0A0A", padding: "100px 48px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="reveal">
          <div className="section-label">Packages</div>
          <h2 className="section-headline">CHOOSE WHAT WORKS<br />FOR YOUR BUSINESS.</h2>
        </div>
        <div className="reveal" style={{
          display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr",
          gap: 2, background: "#222222", marginTop: 60,
          alignItems: "start",
        }}>
          {plans.map((plan) => (
            <div key={plan.name} style={{
              background: plan.featured ? "#181818" : "#111111",
              padding: "48px 36px",
              position: "relative",
              border: plan.featured ? "1px solid #FF5C00" : "none",
              borderTop: plan.featured ? "3px solid #FF5C00" : undefined,
              transform: plan.featured ? "scale(1.02)" : undefined,
              zIndex: plan.featured ? 2 : undefined,
            }}>
              {plan.featured && (
                <div style={{
                  display: "inline-block", background: "#FF5C00", color: "#0A0A0A",
                  fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
                  padding: "5px 12px", marginBottom: 24,
                }}>★ Most Popular</div>
              )}
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 40, letterSpacing: 1, color: "#F5F2ED", marginBottom: 8 }}>{plan.name}</div>
              <div style={{ fontSize: 14, color: "#888880", marginBottom: 32, fontWeight: 300, lineHeight: 1.5 }}>{plan.tagline}</div>
              <div style={{ height: 1, background: "#222222", marginBottom: 28 }} />
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 14, marginBottom: 40 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ fontSize: 14, color: "#F5F2ED", fontWeight: 300, display: "flex", gap: 10, alignItems: "flex-start", lineHeight: 1.4 }}>
                    <span style={{ color: "#FF5C00", fontWeight: 600, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <a href="#contact" className={plan.featured ? "btn-primary" : "btn-secondary"}
                style={{ width: "100%", textAlign: "center", display: "block", fontSize: 15, padding: 14 }}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
