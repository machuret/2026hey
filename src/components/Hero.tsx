"use client";
import { PhoneCall, MessageCircle, ArrowRight, ChevronDown } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-black flex flex-col items-center justify-center text-center px-6 pt-20 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-orange-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          Done-For-You Lead Generation. No Cold Calls. No Ad Spend.
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight mb-6">
          Your Next 10 Clients Are{" "}
          <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Already In Someone&apos;s Voicemail.
          </span>{" "}
          We Put You There.
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          We combine Ringless Voicemail Drops and AI-powered WhatsApp Agents to fill your pipeline with qualified, appointment-ready prospects — without lifting a finger.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a href="#contact"
            className="group flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg px-8 py-4 rounded-full transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50">
            Get More Leads Now
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a href="#services"
            className="flex items-center gap-2 border border-white/20 hover:border-orange-500/50 text-white hover:text-orange-400 font-semibold text-lg px-8 py-4 rounded-full transition-all">
            See How It Works
          </a>
        </div>

        {/* Two service pills */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 text-gray-300 text-sm font-medium px-5 py-2.5 rounded-full">
            <PhoneCall className="h-4 w-4 text-orange-400" />
            Ringless Voicemail Drops
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 text-gray-300 text-sm font-medium px-5 py-2.5 rounded-full">
            <MessageCircle className="h-4 w-4 text-green-400" />
            AI WhatsApp Agent
          </div>
        </div>

        {/* Social proof quotes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            "We went from 3 leads a week to 27 in the first month.",
            "Our WhatsApp agent booked 14 appointments while we slept.",
            "Best ROI we've had from any marketing service. Period.",
          ].map((quote, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-gray-400 italic text-left">
              &ldquo;{quote}&rdquo;
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600 animate-bounce">
        <ChevronDown className="h-6 w-6" />
      </div>
    </section>
  );
}
