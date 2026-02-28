const pills = [
  { icon: "📞", title: "Cold Calling", desc: "80% of calls go straight to voicemail. Nobody picks up unknown numbers anymore." },
  { icon: "💸", title: "Paid Ads", desc: "Rising CPCs, blind audiences, and inconsistent returns are draining budgets fast." },
  { icon: "📧", title: "Email Marketing", desc: "Average open rates are below 22%. Most messages never get seen." },
  { icon: "🎯", title: "Hey More Leads", desc: "Reach real prospects. Qualify them automatically. Receive appointments.", highlight: true },
];

export default function Problem() {
  return (
    <section className="reveal" style={{ background: "#111111", padding: "100px 48px", position: "relative", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", maxWidth: 1200, margin: "0 auto" }}>
        <div>
          <div className="section-label">The Problem</div>
          <h2 className="section-headline">COLD CALLS GET IGNORED.<br />ADS ARE EXPENSIVE.<br />EMAIL IS DEAD.</h2>
          <div style={{ fontSize: 17, lineHeight: 1.8, color: "#888880", fontWeight: 300 }}>
            <p style={{ marginBottom: 20 }}>You&apos;re running a business. You don&apos;t have time to chase prospects who don&apos;t pick up, scroll past your ads, or delete your emails without reading them.</p>
            <p style={{ marginBottom: 20 }}><strong style={{ color: "#F5F2ED", fontWeight: 500 }}>The old playbook is broken.</strong> Your competitors are still using it. That means right now — while you&apos;re reading this — there&apos;s a gap wide open for businesses willing to reach people the right way.</p>
            <p>That&apos;s exactly what we built <strong style={{ color: "#FF5C00", fontWeight: 500 }}>Hey More Leads</strong> to do.</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {pills.map((p) => (
            <div key={p.title} style={{
              display: "flex", alignItems: "center", gap: 20,
              padding: "20px 24px", background: "#181818",
              border: "1px solid #222222",
              borderLeft: `3px solid ${p.highlight ? "#FF7A25" : "#FF5C00"}`,
              borderRadius: 2, transition: "border-color 0.2s",
            }}>
              <div style={{
                width: 44, height: 44, background: "rgba(255,92,0,0.1)",
                borderRadius: 2, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 20, flexShrink: 0,
              }}>{p.icon}</div>
              <div>
                <strong style={{ display: "block", fontSize: 15, color: "#F5F2ED", marginBottom: 4, fontWeight: 500 }}>{p.title}</strong>
                <span style={{ fontSize: 13, color: "#888880", fontWeight: 300 }}>{p.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
