"use client";
import { useState } from "react";

const links: [string, string, string][] = [
  ["/#services", "Services", ""],
  ["/#how", "How It Works", ""],
  ["/#packages", "Packages", ""],
  ["/about", "About", "about"],
];

export default function Navbar({ activePage = "" }: { activePage?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "20px 48px", display: "flex", alignItems: "center",
      justifyContent: "space-between",
      background: "rgba(10,10,10,0.85)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(255,92,0,0.1)",
    }}>
      <a href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2, color: "#F5F2ED", textDecoration: "none" }}>
        HEY<span style={{ color: "#FF5C00" }}>.</span>MORE LEADS
      </a>
      <ul style={{ listStyle: "none", display: "flex", gap: 36, margin: 0, padding: 0 }} className="hidden md:flex">
        {links.map(([href, label, page]) => (
          <li key={label}>
            <a href={href} style={{
              color: activePage === page ? "#FF5C00" : "#888880",
              textDecoration: "none", fontSize: 13, fontWeight: 500,
              letterSpacing: "0.5px", textTransform: "uppercase", transition: "color 0.2s",
            }}
              onMouseOver={e => (e.currentTarget.style.color = activePage === page ? "#FF5C00" : "#F5F2ED")}
              onMouseOut={e => (e.currentTarget.style.color = activePage === page ? "#FF5C00" : "#888880")}>
              {label}
            </a>
          </li>
        ))}
        <li>
          <a href="/#contact" style={{
            background: "#FF5C00", color: "#0A0A0A", padding: "10px 24px",
            borderRadius: 2, fontWeight: 600, letterSpacing: "0.5px", textDecoration: "none",
            fontSize: 13, textTransform: "uppercase", transition: "background 0.2s",
          }}
            onMouseOver={e => (e.currentTarget.style.background = "#FF7A25")}
            onMouseOut={e => (e.currentTarget.style.background = "#FF5C00")}>
            Get Started
          </a>
        </li>
      </ul>
      <button onClick={() => setOpen(!open)} className="md:hidden" style={{ background: "none", border: "none", color: "#F5F2ED", fontSize: 24, cursor: "pointer" }}>
        {open ? "✕" : "☰"}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "#111111", borderBottom: "1px solid #222222",
          padding: "20px 48px", display: "flex", flexDirection: "column", gap: 16,
        }}>
          {[...links.map(([href, label]) => [href, label]), ["/#contact", "Get Started"]].map(([href, label]) => (
            <a key={label} href={href} onClick={() => setOpen(false)}
              style={{ color: "#888880", textDecoration: "none", fontSize: 14, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
