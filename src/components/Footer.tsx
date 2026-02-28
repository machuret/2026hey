export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <a href="#" className="text-2xl font-black text-white tracking-tight">
            Hey<span className="text-orange-500">More</span>Leads
          </a>
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {["Home", "Services", "How It Works", "Pricing", "Contact"].map((link) => (
              <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
                {link}
              </a>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm text-center md:text-left">
            <span className="text-gray-400 font-semibold">Hey More Leads</span> — More Conversations. More Closings. More Revenue.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Terms</a>
            <p className="text-xs text-gray-700">© {new Date().getFullYear()} Hey More Leads. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
