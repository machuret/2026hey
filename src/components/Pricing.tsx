import { CheckCircle, Star } from "lucide-react";

const plans = [
  {
    name: "The Drop",
    tag: "Voicemail Only",
    tagline: "Get your voice heard at scale.",
    color: "orange",
    featured: false,
    cta: "Start With The Drop →",
    features: [
      "Full RVM campaign setup and management",
      "Script writing and voice production",
      "Targeted contact list strategy",
      "Campaign scheduling and delivery",
      "Monthly performance reporting",
    ],
  },
  {
    name: "The Full Stack",
    tag: "★ Most Popular",
    tagline: "Outreach + qualification. End-to-end. Done for you.",
    color: "gradient",
    featured: true,
    cta: "Get The Full Stack →",
    features: [
      "Everything in The Drop",
      "Everything in The Agent",
      "Priority setup and onboarding",
      "Unified strategy across both channels",
      "Dedicated account management",
      "Monthly strategy review calls",
    ],
  },
  {
    name: "The Agent",
    tag: "WhatsApp Only",
    tagline: "Never miss a lead. Never lose a conversation.",
    color: "green",
    featured: false,
    cta: "Deploy My Agent →",
    features: [
      "Custom AI WhatsApp agent build",
      "Qualification flow design",
      "Ongoing monitoring and management",
      "CRM / calendar integration",
      "Monthly reporting and optimization",
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-black py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-4 text-center">Packages</p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 text-center leading-tight">
          Choose What Works For{" "}
          <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Your Business
          </span>
        </h2>
        <p className="text-gray-400 text-lg text-center max-w-xl mx-auto mb-16">
          Start with one service or go full system. We&apos;ll recommend what makes the most sense after your strategy call.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div key={plan.name}
              className={`relative rounded-3xl p-8 flex flex-col h-full ${
                plan.featured
                  ? "bg-gradient-to-br from-orange-500 to-orange-700 shadow-2xl shadow-orange-500/30 scale-105"
                  : "bg-white/5 border border-white/10"
              }`}>
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 bg-yellow-400 text-yellow-900 font-black text-xs px-4 py-1.5 rounded-full">
                    <Star className="h-3 w-3 fill-yellow-900" /> Most Popular
                  </div>
                </div>
              )}

              <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${plan.featured ? "text-orange-100" : plan.color === "green" ? "text-green-400" : "text-orange-400"}`}>
                {plan.tag}
              </div>
              <h3 className={`text-2xl font-black mb-2 ${plan.featured ? "text-white" : "text-white"}`}>{plan.name}</h3>
              <p className={`text-sm mb-8 ${plan.featured ? "text-orange-100" : "text-gray-400"}`}>{plan.tagline}</p>

              <ul className="space-y-3 mb-10 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle className={`h-4 w-4 mt-0.5 shrink-0 ${plan.featured ? "text-orange-100" : plan.color === "green" ? "text-green-400" : "text-orange-400"}`} />
                    <span className={plan.featured ? "text-orange-50" : "text-gray-300"}>{f}</span>
                  </li>
                ))}
              </ul>

              <a href="#contact"
                className={`block text-center font-black text-sm py-4 px-6 rounded-2xl transition-all ${
                  plan.featured
                    ? "bg-white text-orange-600 hover:bg-orange-50"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
