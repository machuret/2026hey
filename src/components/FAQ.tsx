"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is ringless voicemail legal?",
    a: "Yes. Ringless Voicemail is regulated similarly to phone and SMS marketing. We ensure all campaigns are compliant with applicable regulations and best practices, including proper opt-out mechanisms.",
  },
  {
    q: "What industries does this work for?",
    a: "Any business that sells to other businesses or directly to consumers — professional services, real estate, finance, insurance, home services, coaching, consulting, healthcare, and more.",
  },
  {
    q: "How fast will I see results?",
    a: "Most clients see initial responses within the first 48–72 hours of a campaign launch. Full momentum typically builds over the first 2–4 weeks.",
  },
  {
    q: "Do I need any tech skills?",
    a: "Zero. We handle all the technical setup, integration, and management. You simply review, approve, and receive leads.",
  },
  {
    q: "Can I use just one service?",
    a: "Absolutely. You can start with Ringless Voicemail Drops, the AI WhatsApp Agent, or go full system with both. We'll recommend what makes the most sense for your business.",
  },
  {
    q: "What do I need to get started?",
    a: "A quick strategy call with our team. From there, we handle everything.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-zinc-950 py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-4 text-center">Good Questions. Real Answers.</p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-16 text-center leading-tight">
          Everything You Need to Know
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                open === i ? "border-orange-500/40 bg-orange-500/5" : "border-white/10 bg-white/5"
              }`}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-white font-semibold text-sm sm:text-base">{faq.q}</span>
                <ChevronDown className={`h-5 w-5 text-orange-400 shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
