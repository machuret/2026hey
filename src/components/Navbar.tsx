"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <a href="#" className="text-xl font-black text-white tracking-tight">
          Hey<span className="text-orange-500">More</span>Leads
        </a>
        <div className="hidden md:flex items-center gap-8">
          {["Services", "How It Works", "Pricing", "FAQ"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm text-gray-300 hover:text-orange-400 transition-colors font-medium">
              {item}
            </a>
          ))}
        </div>
        <a href="#contact"
          className="hidden md:inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-5 py-2.5 rounded-full transition-colors">
          Book Free Call →
        </a>
        <button onClick={() => setOpen(!open)} className="md:hidden text-white">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-black border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          {["Services", "How It Works", "Pricing", "FAQ"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setOpen(false)}
              className="text-sm text-gray-300 hover:text-orange-400 font-medium">
              {item}
            </a>
          ))}
          <a href="#contact" onClick={() => setOpen(false)}
            className="bg-orange-500 text-white font-bold text-sm px-5 py-2.5 rounded-full text-center">
            Book Free Call →
          </a>
        </div>
      )}
    </nav>
  );
}
