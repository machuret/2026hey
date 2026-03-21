"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, PhoneCall, BookOpen, ChevronLeft, FileText } from "lucide-react";

const NAV = [
  { href: "/engine/admin/call-flow",  label: "Call Flows",  icon: PhoneCall  },
  { href: "/engine/admin/training",   label: "Training",    icon: BookOpen   },
  { href: "/engine/admin/transcribe", label: "Transcribe",  icon: FileText   },
];

export default function EngineAdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <aside className="w-56 shrink-0 border-r border-gray-800 bg-gray-900 flex flex-col">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-800">
          <Settings className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-bold tracking-widest uppercase text-orange-300">Engine Admin</span>
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
                    ? "bg-orange-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-800">
          <Link
            href="/engine"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Engine
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
