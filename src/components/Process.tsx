const steps = [
  { num: "01", title: "Strategy Call", desc: "We learn your business, ideal client, and goals. We map the system to your offer.", last: false },
  { num: "02", title: "Build & Setup", desc: "We handle everything — scripts, tech, AI agent, integrations. You review and approve.", last: false },
  { num: "03", title: "Launch", desc: "Campaigns go live. Your AI agent activates. Leads start flowing.", last: false },
  { num: "04", title: "Manage & Optimize", desc: "We monitor results, refine messaging, and improve performance every week.", last: false },
  { num: "05", title: "You Close Deals", desc: "That's your only job. We send the leads. You close them.", last: true },
];

export default function Process() {
  return (
    <section id="how" style={{ background: "#111111", padding: "100px 48px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="reveal">
          <div className="section-label">Simple Process</div>
          <h2 className="section-headline">WE&apos;RE UP AND RUNNING<br />IN DAYS — NOT MONTHS.</h2>
        </div>
        <div className="reveal" style={{
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
          gap: 2, background: "#222222", marginTop: 60,
        }}>
          {steps.map((step) => (
            <div key={step.num} style={{ background: "#181818", padding: "36px 28px", position: "relative" }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 64, color: "rgba(255,92,0,0.15)", lineHeight: 1, marginBottom: 16 }}>{step.num}</div>
              <div style={{
                fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: 0.5,
                color: step.last ? "#FF5C00" : "#F5F2ED", marginBottom: 12,
              }}>{step.title}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: "#888880", fontWeight: 300 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
