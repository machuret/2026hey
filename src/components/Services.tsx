import { CheckCircle, PhoneCall, MessageCircle, ArrowRight } from "lucide-react";

const rvm = [
  "Voicemail script writing and voice production",
  "Contact list targeting and setup",
  "Campaign scheduling and delivery",
  "Platform management (you never touch the tech)",
  "Performance tracking and reporting",
  "Ongoing optimization to improve response rates",
];

const whatsapp = [
  "AI agent build, setup, and training",
  "Custom qualification criteria based on your ideal client profile",
  "Full conversation flow design",
  "CRM integration and appointment scheduling",
  "Monitoring, management, and ongoing optimization",
];

export default function Services() {
  return (
    <section id="how-it-works" className="bg-black py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Label */}
        <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-4 text-center">Our System</p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 text-center leading-tight">
          One Seamless System.{" "}
          <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Two Powerful Tools.
          </span>{" "}
          Zero Hassle.
        </h2>
        <p className="text-gray-400 text-lg text-center max-w-2xl mx-auto mb-16">
          We handle everything — setup, scripting, targeting, execution, and optimization. Your job: show up for the appointments we send you.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* RVM Card */}
          <div className="relative bg-gradient-to-br from-orange-500/10 to-orange-900/5 border border-orange-500/30 rounded-3xl p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-black uppercase tracking-widest text-orange-400">Tool #1</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-5">
              <PhoneCall className="h-6 w-6 text-orange-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-3 leading-tight">
              We Drop Your Voice Directly Into Their Voicemail — Without Their Phone Ever Ringing.
            </h3>
            <p className="text-orange-300 font-semibold text-sm mb-4">
              Reach hundreds — or thousands — of targeted prospects with a personalized voice message they actually listen to.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Ringless Voicemail Drops bypass the phone call entirely. Your pre-recorded message lands straight in the prospect&apos;s voicemail inbox. They see a notification. They get curious. They listen. No phone ringing means no interruptions — and a far higher chance they actually hear what you have to say.
            </p>
            <ul className="space-y-2.5 mb-8 flex-1">
              {rvm.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 mb-6">
              <p className="text-sm font-bold text-orange-300">The result?</p>
              <p className="text-sm text-gray-300 mt-1">Warm prospects calling YOU back — already familiar with your name, your offer, and your business.</p>
            </div>
            <a href="#contact" className="flex items-center gap-2 text-orange-400 font-bold text-sm hover:text-orange-300 transition-colors">
              Ready to start dropping? Book a Call <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* WhatsApp Card */}
          <div className="relative bg-gradient-to-br from-green-500/10 to-green-900/5 border border-green-500/30 rounded-3xl p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-black uppercase tracking-widest text-green-400">Tool #2</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mb-5">
              <MessageCircle className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-3 leading-tight">
              Our AI Agent Works Your WhatsApp Leads 24/7 — So You Don&apos;t Have To.
            </h3>
            <p className="text-green-300 font-semibold text-sm mb-4">
              Engage, qualify, and convert prospects automatically. By the time a lead reaches you, they&apos;re ready to buy.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              WhatsApp has over 2 billion active users and a 98% message open rate. Our AI WhatsApp Agent engages leads the moment they reach out, asks the right qualifying questions, filters out the tire-kickers, and delivers only the serious, appointment-ready prospects straight to you. It works around the clock. It never has a bad day. And it never lets a hot lead go cold.
            </p>
            <ul className="space-y-2.5 mb-8 flex-1">
              {whatsapp.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6">
              <p className="text-sm font-bold text-green-300">The result?</p>
              <p className="text-sm text-gray-300 mt-1">A fully automated qualification machine that hands you pre-vetted, motivated prospects ready to move forward.</p>
            </div>
            <a href="#contact" className="flex items-center gap-2 text-green-400 font-bold text-sm hover:text-green-300 transition-colors">
              Want an agent working for you tonight? Let&apos;s Talk <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
