import { PhoneCall, MessageCircle, Users, Trophy } from "lucide-react";

const steps = [
  {
    icon: <PhoneCall className="h-6 w-6 text-orange-400" />,
    number: "01",
    title: "Drop",
    desc: "We send a ringless voicemail to your targeted list. Your voice lands in their inbox. They listen.",
    color: "orange",
  },
  {
    icon: <MessageCircle className="h-6 w-6 text-green-400" />,
    number: "02",
    title: "Engage",
    desc: "Interested prospects respond or click through to your WhatsApp. Our AI agent picks up instantly.",
    color: "green",
  },
  {
    icon: <Users className="h-6 w-6 text-blue-400" />,
    number: "03",
    title: "Qualify",
    desc: "The agent has a real conversation, asks smart questions, filters based on your criteria, and moves serious buyers forward.",
    color: "blue",
  },
  {
    icon: <Trophy className="h-6 w-6 text-yellow-400" />,
    number: "04",
    title: "Deliver",
    desc: "You receive appointment-ready leads — warm, informed, and ready to talk business.",
    color: "yellow",
  },
];

export default function Combo() {
  return (
    <section className="bg-zinc-950 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-4 text-center">The Full Stack</p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 text-center leading-tight">
          The Real Magic Happens When You{" "}
          <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Run Both Together.
          </span>
        </h2>
        <p className="text-gray-400 text-lg text-center max-w-2xl mx-auto mb-16">
          RVM gets you heard. WhatsApp converts the conversation. Together, they create a non-stop lead generation engine.
        </p>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {steps.map((step, i) => (
            <div key={i} className="relative bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
              <div className="text-5xl font-black text-white/5 absolute top-4 right-5 select-none">{step.number}</div>
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                {step.icon}
              </div>
              <h3 className="text-white font-black text-lg mb-2">Step {step.number} — {step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom callout */}
        <div className="bg-gradient-to-r from-orange-500/10 via-orange-400/5 to-orange-500/10 border border-orange-500/30 rounded-3xl p-8 text-center">
          <p className="text-white font-black text-xl mb-2">No wasted time. No cold conversations. No chasing.</p>
          <p className="text-gray-400">Just a system that runs 24/7 and delivers leads while you focus on closing.</p>
        </div>
      </div>
    </section>
  );
}
