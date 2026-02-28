"use client";

const TapeLeft = () => (
  <svg style={{ position: "absolute", top: -18, left: -24, width: 70, height: 60, opacity: 0.9 }} viewBox="0 0 95 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 45L70.282 5L88.282 36.1769L19 76.1769L1 45Z" fill="#1A1A1A"/>
    <path d="M1 45L70.282 5L88.282 36.1769L19 76.1769L1 45Z" fill="none" stroke="#FF5C00" strokeWidth="0.5" strokeOpacity="0.4"/>
  </svg>
);

const TapeRight = () => (
  <svg style={{ position: "absolute", top: -18, right: -24, width: 70, height: 60, opacity: 0.9, transform: "rotate(90deg)" }} viewBox="0 0 95 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 45L70.282 5L88.282 36.1769L19 76.1769L1 45Z" fill="#1A1A1A"/>
    <path d="M1 45L70.282 5L88.282 36.1769L19 76.1769L1 45Z" fill="none" stroke="#FF5C00" strokeWidth="0.5" strokeOpacity="0.4"/>
  </svg>
);

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
    <footer className="footer-outer" style={{ background: "#060606", fontFamily: "'DM Sans',sans-serif", padding: "48px 48px 32px" }}>
      {/* Card with tape */}
      <div style={{ maxWidth: 1160, margin: "0 auto", position: "relative" }}>
        <TapeLeft />
        <TapeRight />

        <div className="footer-card" style={{
          background: "#111111",
          border: "1px solid #1E1E1E",
          borderRadius: 16,
          padding: "48px 52px 40px",
        }}>
          {/* Main grid */}
          <div className="footer-grid" style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
            gap: 48,
            alignItems: "start",
            marginBottom: 40,
          }}>
            {/* Brand column */}
            <div>
              <a href="/" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, letterSpacing: 2, color: "#F5F2ED", textDecoration: "none", display: "block", marginBottom: 14 }}>
                HEY<span style={{ color: "#FF5C00" }}>.</span>MORE LEADS
              </a>
              <p style={{ fontSize: 13, color: "#3A3A38", lineHeight: 1.75, fontWeight: 300, maxWidth: 240, marginBottom: 24, margin: "0 0 24px" }}>
                Done-for-you lead generation using Ringless Voicemail and AI-powered WhatsApp — focus on closing, not chasing.
              </p>
              {/* Social icons */}
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { label: "LinkedIn", href: "#", icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
                    </svg>
                  )},
                  { label: "Twitter / X", href: "#", icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
                    </svg>
                  )},
                ].map(s => (
                  <a key={s.label} href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, border: "1px solid #222", borderRadius: 8, color: "#444440", textDecoration: "none", transition: "color 0.2s, border-color 0.2s, background 0.2s" }}
                    onMouseOver={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = "#FF5C00"; el.style.borderColor = "rgba(255,92,0,0.35)"; el.style.background = "rgba(255,92,0,0.06)"; }}
                    onMouseOut={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = "#444440"; el.style.borderColor = "#222"; el.style.background = "transparent"; }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Nav columns */}
            {NAV_COLS.map(col => (
              <div key={col.heading}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "#FF5C00", marginBottom: 18 }}>
                  {col.heading}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {col.links.map(l => <LinkItem key={l.label} {...l} />)}
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #1A1A1A", marginBottom: 20 }} />

          {/* Bottom strip inside card */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 12, color: "#2A2A28", margin: 0 }}>
              © {year} Hey More Leads. All rights reserved.
            </p>
            <p style={{ fontSize: 11, color: "#222220", margin: 0, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
              More Conversations. More Closings. More Revenue.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
