"use client";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/leads", label: "Leads", icon: "📥" },
  { href: "/admin/pages", label: "Page Content", icon: "✏️" },
  { href: "/admin/navigation", label: "Navigation", icon: "🔗" },
  { href: "/admin/seo", label: "SEO Manager", icon: "🔍" },
  { href: "/admin/case-studies", label: "Case Studies", icon: "📁" },
  { href: "/admin/testimonials", label: "Testimonials", icon: "💬" },
  { href: "/admin/packages", label: "Packages", icon: "💰" },
  { href: "/admin/team", label: "Team", icon: "👥" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return <>{children}</>;

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0A0A", fontFamily: "'DM Sans',sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: "#111111", borderRight: "1px solid #222222",
        display: "flex", flexDirection: "column", position: "fixed",
        top: 0, left: 0, height: "100vh", zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid #222222" }}>
          <a href="/" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 2, color: "#F5F2ED", textDecoration: "none", display: "block" }}>
            HEY<span style={{ color: "#FF5C00" }}>.</span>MORE LEADS
          </a>
          <div style={{ fontSize: 11, color: "#888880", marginTop: 4, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Admin CMS</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <a key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 4, textDecoration: "none",
                background: active ? "rgba(255,92,0,0.1)" : "transparent",
                color: active ? "#FF5C00" : "#888880",
                fontSize: 14, fontWeight: active ? 500 : 400,
                borderLeft: active ? "2px solid #FF5C00" : "2px solid transparent",
                transition: "all 0.15s",
              }}
                onMouseOver={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "#F5F2ED"; }}
                onMouseOut={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "#888880"; }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid #222222", display: "flex", flexDirection: "column", gap: 8 }}>
          <a href="/" target="_blank" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", fontSize: 13, color: "#888880", textDecoration: "none" }}>
            <span>🌐</span> View Website
          </a>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", fontSize: 13, color: "#888880", background: "none", border: "none", cursor: "pointer", textAlign: "left", width: "100%" }}
            onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.color = "#EF4444"; }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.color = "#888880"; }}>
            <span>🚪</span> Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: "100vh", background: "#0A0A0A" }}>
        {children}
      </main>
    </div>
  );
}
