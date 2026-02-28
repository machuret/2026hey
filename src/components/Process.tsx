const steps = [
  {
    number: "01",
    title: "Strategy Call",
    desc: "We learn your business, your ideal client, and your goals. We map the system to your offer.",
  },
  {
    number: "02",
    title: "Build & Setup",
    desc: "We handle everything — scripts, tech, AI agent, integrations. You review and approve.",
  },
  {
    number: "03",
    title: "Launch",
    desc: "Campaigns go live. Your AI agent activates. Leads start flowing.",
  },
  {
    number: "04",
    title: "Manage & Optimize",
    desc: "We monitor results, refine messaging, and improve performance every week.",
  },
  {
    number: "05",
    title: "You Close Deals",
    desc: "That's your only job. We send the leads. You close them.",
  },
];

export default function Process() {
  return (
    <section id="how-it-works" className="bg-zinc-950 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-4 text-center">Simple Process. Serious Results.</p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-16 text-center leading-tight">
          We&apos;re Up And Running In{" "}
          <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Days — Not Months.
          </span>
        </h2>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 font-black text-2xl relative z-10 ${
                  i === 4
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                    : "bg-white/10 text-white border border-white/10"
                }`}>
                  {step.number}
                </div>
                <h3 className="text-white font-black text-base mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
