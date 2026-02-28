"use client";
import { useState, useEffect } from "react";

type NavItem = {
  id: string;
  label: string;
  href: string;
  sort_order: number;
  visible: boolean;
  is_cta: boolean;
  open_new_tab: boolean;
};

const FALLBACK: NavItem[] = [
  { id: "1", label: "Services",       href: "/#services",          sort_order: 1, visible: true, is_cta: false, open_new_tab: false },
  { id: "2", label: "Voicemail Drops",href: "/ringless-voicemail", sort_order: 2, visible: true, is_cta: false, open_new_tab: false },
  { id: "3", label: "WhatsApp AI",    href: "/whatsapp-agent",     sort_order: 3, visible: true, is_cta: false, open_new_tab: false },
  { id: "4", label: "Packages",       href: "/packages",           sort_order: 4, visible: true, is_cta: false, open_new_tab: false },
  { id: "5", label: "Case Studies",   href: "/case-studies",       sort_order: 5, visible: true, is_cta: false, open_new_tab: false },
  { id: "6", label: "About",          href: "/about",              sort_order: 6, visible: true, is_cta: false, open_new_tab: false },
  { id: "7", label: "Get Started",    href: "/contact",            sort_order: 7, visible: true, is_cta: true,  open_new_tab: false },
];

function pageFromHref(href: string) {
  const m = href.match(/\/([^/#?]+)/);
  return m ? m[1] : "";
}

export default function Navbar({ activePage = "" }: { activePage?: string }) {
  const [open, setOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>(FALLBACK);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/admin/nav")
      .then(r => r.json())
      .then(j => { if (j.data?.length) setNavItems(j.data); })
      .catch(() => {});
  }, []);

  const visible = navItems.filter(i => i.visible).sort((a, b) => a.sort_order - b.sort_order);
  const regular = visible.filter(i => !i.is_cta);
  const cta = visible.filter(i => i.is_cta);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "20px 48px", display: "flex", alignItems: "center",
      justifyContent: "space-between",
      background: scrolled ? "rgba(10,10,10,0.97)" : "rgba(10,10,10,0.85)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(255,92,0,0.1)",
      boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.6)" : "none",
      transition: "background 0.3s ease, box-shadow 0.3s ease",
    }}>
      <a href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2, color: "#F5F2ED", textDecoration: "none" }}>
        HEY<span style={{ color: "#FF5C00" }}>.</span>MORE LEADS
      </a>
      <ul className="nav-desktop" style={{ listStyle: "none", display: "flex", gap: 36, margin: 0, padding: 0, alignItems: "center" }}>
        {regular.map(item => {
          const page = pageFromHref(item.href);
          const isActive = activePage === page;
          return (
            <li key={item.id}>
              <a
                href={item.href}
                target={item.open_new_tab ? "_blank" : undefined}
                rel={item.open_new_tab ? "noopener noreferrer" : undefined}
                style={{ color: isActive ? "#FF5C00" : "#888880", textDecoration: "none", fontSize: 13, fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase", transition: "color 0.2s" }}
                onMouseOver={e => (e.currentTarget.style.color = isActive ? "#FF5C00" : "#F5F2ED")}
                onMouseOut={e => (e.currentTarget.style.color = isActive ? "#FF5C00" : "#888880")}>
                {item.label}
              </a>
            </li>
          );
        })}
        {cta.map(item => {
          const page = pageFromHref(item.href);
          const isActive = activePage === page;
          return (
            <li key={item.id}>
              <a
                href={item.href}
                target={item.open_new_tab ? "_blank" : undefined}
                rel={item.open_new_tab ? "noopener noreferrer" : undefined}
                style={{ background: isActive ? "#FF7A25" : "#FF5C00", color: "#0A0A0A", padding: "10px 24px", borderRadius: 2, fontWeight: 600, letterSpacing: "0.5px", textDecoration: "none", fontSize: 13, textTransform: "uppercase", transition: "background 0.2s" }}
                onMouseOver={e => (e.currentTarget.style.background = "#FF7A25")}
                onMouseOut={e => (e.currentTarget.style.background = isActive ? "#FF7A25" : "#FF5C00")}>
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
      <button onClick={() => setOpen(!open)} className="nav-mobile-btn" style={{ background: "none", border: "none", color: "#F5F2ED", fontSize: 24, cursor: "pointer", display: "none" }}>
        {open ? "✕" : "☰"}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "#111111", borderBottom: "1px solid #222222",
          padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20,
          zIndex: 99,
        }}>
          {visible.map(item => (
            <a key={item.id} href={item.href}
              target={item.open_new_tab ? "_blank" : undefined}
              rel={item.open_new_tab ? "noopener noreferrer" : undefined}
              onClick={() => setOpen(false)}
              style={{
                color: item.is_cta ? "#FF5C00" : "#F5F2ED",
                textDecoration: "none", fontSize: 15, fontWeight: item.is_cta ? 600 : 400,
                textTransform: "uppercase", letterSpacing: "0.5px",
                paddingBottom: 20, borderBottom: "1px solid #1A1A1A",
              }}>
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
