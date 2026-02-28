import { XCircle } from "lucide-react";

const problems = [
  { icon: "📞", title: "Cold Calls", desc: "Get ignored 97% of the time. Waste hours for nothing." },
  { icon: "💸", title: "Paid Ads", desc: "Expensive, inconsistent, and getting more competitive every day." },
  { icon: "📧", title: "Email Marketing", desc: "Open rates are dead. Inboxes are flooded. Nobody reads anymore." },
];

export default function Problem() {
  return (
    <section id="services" className="bg-zinc-950 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Label */}
        <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-4">
          Why Most Businesses Are Leaving Money on the Table
        </p>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 leading-tight max-w-3xl">
          Cold Calls Get Ignored. Ads Are Expensive.{" "}
          <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Email Is Dead.
          </span>
        </h2>

        <p className="text-gray-400 text-lg max-w-3xl mb-12 leading-relaxed">
          You&apos;re running a business. You don&apos;t have time to chase prospects who don&apos;t pick up, scroll past your ads, or delete your emails without reading them.
          <br /><br />
          <span className="text-white font-semibold">The old playbook is broken.</span> Your competitors are still using it. That means right now — while you&apos;re reading this — there&apos;s a gap in the market wide open for businesses willing to reach people the right way, at the right time, through the right channels.
          <br /><br />
          That&apos;s exactly what we built <span className="text-orange-400 font-bold">Hey More Leads</span> to do.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((p) => (
            <div key={p.title} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="text-3xl">{p.icon}</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <h3 className="text-white font-bold">{p.title}</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
