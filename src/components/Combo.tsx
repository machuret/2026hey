export default function Combo() {
  return (
    <div className="reveal" style={{
      borderTop: "1px solid #222222",
      borderBottom: "1px solid #222222",
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 1,
      background: "#222222",
    }}>
      {[
        { num: "98%", desc: "WhatsApp message open rate vs 20% for email" },
        { num: "5–20×", desc: "Higher response rates vs traditional cold calling" },
        { num: "100%", desc: "Done for you — setup, execution, management" },
      ].map((item) => (
        <div key={item.num} style={{ background: "#0A0A0A", padding: "32px 40px" }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 52, lineHeight: 1, color: "#FF5C00" }}>{item.num}</div>
          <div style={{ fontSize: 14, color: "#888880", fontWeight: 300, lineHeight: 1.5, marginTop: 8 }}>{item.desc}</div>
        </div>
      ))}
    </div>
  );
}
