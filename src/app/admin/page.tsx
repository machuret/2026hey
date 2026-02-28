"use client";
import { useEffect, useState } from "react";

type Stats = { leads: number; new_leads: number; case_studies: number; testimonials: number };

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const [l, cs, t] = await Promise.all([
        fetch("/api/admin/leads?page=1").then(r => r.json()),
        fetch("/api/admin/case-studies").then(r => r.json()),
        fetch("/api/admin/testimonials").then(r => r.json()),
      ]);
      setStats({
        leads: l.count ?? 0,
        new_leads: (l.data ?? []).filter((x: { status: string }) => x.status === "new").length,
        case_studies: (cs.data ?? []).length,
        testimonials: (t.data ?? []).length,
      });
    }
    load();
  }, []);

  const cards = [
    { label: "Total Leads", value: stats?.leads ?? "—", icon: "📥", href: "/admin/leads", color: "#FF5C00" },
    { label: "New (Unread)", value: stats?.new_leads ?? "—", icon: "🔔", href: "/admin/leads?status=new", color: "#EF4444" },
    { label: "Case Studies", value: stats?.case_studies ?? "—", icon: "📁", href: "/admin/case-studies", color: "#888880" },
    { label: "Testimonials", value: stats?.testimonials ?? "—", icon: "💬", href: "/admin/testimonials", color: "#25D366" },
  ];

  const quickLinks = [
    { label: "Manage Leads", href: "/admin/leads", icon: "📥" },
    { label: "Edit Case Studies", href: "/admin/case-studies", icon: "📁" },
    { label: "Edit Testimonials", href: "/admin/testimonials", icon: "💬" },
    { label: "Edit Packages", href: "/admin/packages", icon: "💰" },
    { label: "Edit Team", href: "/admin/team", icon: "👥" },
    { label: "View Website", href: "/", icon: "🌐" },
  ];

  return (
    <div style={{ padding: "40px 48px", color: "#F5F2ED" }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, letterSpacing: 1, color: "#F5F2ED", lineHeight: 1 }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: "#888880", marginTop: 8, fontWeight: 300 }}>Welcome back. Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2, background: "#222222", marginBottom: 40 }}>
        {cards.map((c) => (
          <a key={c.label} href={c.href} style={{ background: "#181818", padding: "28px 24px", textDecoration: "none", display: "block", borderTop: `3px solid ${c.color}`, transition: "background 0.2s" }}
            onMouseOver={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#1e1e1e"; }}
            onMouseOut={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#181818"; }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>{c.icon}</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: c.color, lineHeight: 1, marginBottom: 4 }}>{c.value}</div>
            <div style={{ fontSize: 13, color: "#888880", fontWeight: 300 }}>{c.label}</div>
          </a>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#888880", marginBottom: 16 }}>Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, background: "#222222" }}>
          {quickLinks.map((l) => (
            <a key={l.label} href={l.href} style={{ background: "#181818", padding: "20px 24px", textDecoration: "none", display: "flex", alignItems: "center", gap: 14, transition: "background 0.2s" }}
              onMouseOver={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#1e1e1e"; }}
              onMouseOut={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#181818"; }}>
              <span style={{ fontSize: 20 }}>{l.icon}</span>
              <span style={{ fontSize: 14, color: "#F5F2ED", fontWeight: 400 }}>{l.label}</span>
              <span style={{ marginLeft: "auto", color: "#FF5C00", fontSize: 14 }}>→</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
