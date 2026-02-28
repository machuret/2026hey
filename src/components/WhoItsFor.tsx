export default function WhoItsFor() {
  return (
    <section style={{ background: "#111111", padding: "100px 48px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="reveal">
          <div className="section-label">Is This For You?</div>
          <h2 className="section-headline">BUILT FOR OWNERS WHO ARE<br />DONE WAITING FOR LEADS.</h2>
        </div>
        <div className="reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, background: "#222222", marginTop: 60 }}>
          {/* YES */}
          <div style={{ background: "#181818", padding: "48px 40px" }}>
            <div style={{
              fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: 1, marginBottom: 28,
              paddingBottom: 16, borderBottom: "2px solid #FF5C00",
              color: "#F5F2ED", display: "flex", alignItems: "center", gap: 12,
            }}>✓ &nbsp;This is for you if...</div>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                "You’re tired of cold calling and getting ignored",
                "You’re spending on ads with inconsistent results",
                "You have a great offer but not enough people hearing it",
                "You want a system that works even when you’re not working",
                "You’re ready to scale — not dabble",
              ].map((item) => (
                <li key={item} style={{ fontSize: 15, color: "#F5F2ED", fontWeight: 300, display: "flex", gap: 14, alignItems: "flex-start", lineHeight: 1.5 }}>
                  <span style={{ color: "#FF5C00", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>→</span>{item}
                </li>
              ))}
            </ul>
          </div>
          {/* NO */}
          <div style={{ background: "#181818", padding: "48px 40px" }}>
            <div style={{
              fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: 1, marginBottom: 28,
              paddingBottom: 16, borderBottom: "2px solid #222222",
              color: "#F5F2ED", display: "flex", alignItems: "center", gap: 12,
            }}>✕ &nbsp;This is NOT for you if...</div>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                "You’re not serious about growth",
                "You want a magic button with no strategy behind it",
                "You’re not prepared to handle more leads than you currently get",
              ].map((item) => (
                <li key={item} style={{ fontSize: 15, color: "#F5F2ED", fontWeight: 300, display: "flex", gap: 14, alignItems: "flex-start", lineHeight: 1.5 }}>
                  <span style={{ color: "#888880", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>—</span>{item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
