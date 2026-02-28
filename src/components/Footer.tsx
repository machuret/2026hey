export default function Footer() {
  return (
    <footer style={{
      background: "#0A0A0A",
      borderTop: "1px solid #222222",
      padding: "40px 48px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 20,
    }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 2, color: "#888880" }}>
        HEY<span style={{ color: "#FF5C00" }}>.</span>MORE LEADS
      </div>
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
        {[["#", "Home"], ["#services", "Services"], ["#how", "How It Works"], ["#packages", "Packages"], ["#contact", "Contact"], ["#", "Privacy Policy"], ["#", "Terms"]].map(([href, label]) => (
          <a key={label} href={href} style={{ fontSize: 12, color: "#888880", textDecoration: "none", letterSpacing: 0.5, transition: "color 0.2s" }}
            onMouseOver={e => (e.currentTarget.style.color = "#F5F2ED")}
            onMouseOut={e => (e.currentTarget.style.color = "#888880")}>
            {label}
          </a>
        ))}
      </div>
      <div style={{ fontSize: 12, color: "#222222", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
        More Conversations. More Closings. More Revenue.
      </div>
    </footer>
  );
}
