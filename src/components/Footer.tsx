"use client";

const NAV_COLS = [
  {
    heading: "Services",
    links: [
      { label: "Ringless Voicemail", href: "/ringless-voicemail" },
      { label: "WhatsApp AI Agent", href: "/whatsapp-agent" },
      { label: "Packages",          href: "/packages" },
      { label: "Case Studies",      href: "/case-studies" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us",   href: "/about" },
      { label: "Contact",    href: "/contact" },
      { label: "Get Started",href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service",href: "#" },
    ],
  },
];

function LinkItem({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      style={{ fontSize: 13, color: "#555550", textDecoration: "none", fontWeight: 400, lineHeight: 1, transition: "color 0.2s", display: "block" }}
      onMouseOver={e => (e.currentTarget.style.color = "#FF5C00")}
      onMouseOut={e => (e.currentTarget.style.color = "#555550")}
    >
      {label}
    </a>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: "#0A0A0A", borderTop: "1px solid #1A1A1A", fontFamily: "'DM Sans',sans-serif" }}>
      {/* Main grid */}
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: "64px 48px 48px",
        display: "grid",
        gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
        gap: 48,
        alignItems: "start",
      }}>
        {/* Brand column */}
        <div>
          <a href="/" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, letterSpacing: 2, color: "#F5F2ED", textDecoration: "none", display: "block", marginBottom: 16 }}>
            HEY<span style={{ color: "#FF5C00" }}>.</span>MORE LEADS
          </a>
          <p style={{ fontSize: 14, color: "#444440", lineHeight: 1.7, fontWeight: 300, maxWidth: 260, marginBottom: 28 }}>
            Done-for-you lead generation using Ringless Voicemail and AI-powered WhatsApp — so you can focus on closing, not chasing.
          </p>
          {/* Social icons */}
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { label: "LinkedIn", href: "#", icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
                </svg>
              )},
              { label: "Twitter / X", href: "#", icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
                </svg>
              )},
            ].map(s => (
              <a key={s.label} href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, border: "1px solid #222", borderRadius: 2, color: "#555550", textDecoration: "none", transition: "color 0.2s, border-color 0.2s" }}
                onMouseOver={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#FF5C00"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,92,0,0.4)"; }}
                onMouseOut={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#555550"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "#222"; }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Nav columns */}
        {NAV_COLS.map(col => (
          <div key={col.heading}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "#FF5C00", marginBottom: 20 }}>
              {col.heading}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {col.links.map(l => <LinkItem key={l.label} {...l} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px" }}>
        <div style={{ borderTop: "1px solid #1A1A1A" }} />
      </div>

      {/* Bottom strip */}
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: "20px 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <p style={{ fontSize: 12, color: "#333330", margin: 0 }}>
          © {year} Hey More Leads. All rights reserved.
        </p>
        <p style={{ fontSize: 12, color: "#2A2A28", margin: 0, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>
          More Conversations. More Closings. More Revenue.
        </p>
      </div>
    </footer>
  );
}
