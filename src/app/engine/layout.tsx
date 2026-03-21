"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, PhoneCall, BookOpen, Network, Zap } from "lucide-react";

const NAV = [
  { href: "/engine/crm",        label: "CRM",           icon: Users },
  { href: "/engine/leads",      label: "Lead Scraper",  icon: Zap },
  { href: "/engine/call-flow",  label: "Call Flow",     icon: PhoneCall },
  { href: "/engine/training",   label: "Training",      icon: BookOpen },
];

export default function EngineLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-gray-800 bg-gray-900 flex flex-col">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-800">
          <Network className="h-5 w-5 text-indigo-400" />
          <span className="text-sm font-bold tracking-widest uppercase text-indigo-300">Engine</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-600">Engine v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
