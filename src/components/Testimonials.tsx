const testimonials = [
  { quote: "I was skeptical at first. But within the first week, I had 6 callbacks and booked 3 appointments. The system runs itself.", name: "James R.", role: "Financial Services" },
  { quote: "The WhatsApp agent is insane. It qualifies leads better than half my sales team. And it never sleeps.", name: "Maria C.", role: "Real Estate Investor" },
  { quote: "We went from 3 leads a week to 27 in the first month. Nothing we’ve tried has come close to the cost-per-lead on this system.", name: "Dave K.", role: "Insurance Agency" },
];

export default function Testimonials() {
  return (
    <section style={{ background: "#111111", padding: "100px 48px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="reveal">
          <div className="section-label">Real Results</div>
          <h2 className="section-headline">REAL BUSINESSES.<br />REAL OUTCOMES.</h2>
        </div>
        <div className="reveal" style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 2, background: "#222222", maxWidth: 1200, marginTop: 60,
        }}>
          {testimonials.map((t, i) => (
            <div key={i} style={{ background: "#181818", padding: "40px 36px", position: "relative" }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 80, color: "rgba(255,92,0,0.15)", lineHeight: 0.8, marginBottom: 12 }}>&quot;</div>
              <div style={{ fontSize: 15, lineHeight: 1.7, color: "#F5F2ED", fontWeight: 300, marginBottom: 24, fontStyle: "italic" }}>{t.quote}</div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "#FF5C00" }}>{t.name}</div>
              <div style={{ fontSize: 12, color: "#888880", marginTop: 4, fontWeight: 300 }}>{t.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
