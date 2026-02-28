"use client";
import { useState } from "react";
import { ArrowRight, MessageCircle, Loader2, CheckCircle } from "lucide-react";

export default function FinalCTA() {
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", business: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <section id="contact" className="bg-zinc-950 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left — Copy */}
          <div>
            <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-4">Ready to Start?</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              Stop Waiting For Leads.{" "}
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Start Getting Them.
              </span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Book a free strategy call and we&apos;ll show you exactly how to put this system to work for your business — in days, not months.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              No pressure. No hard sell. Just a straight conversation about whether we&apos;re the right fit and what results you can realistically expect.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="https://calendly.com" target="_blank" rel="noopener noreferrer"
                className="group flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-base px-7 py-4 rounded-full transition-all shadow-lg shadow-orange-500/30">
                Book My Free Strategy Call
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-green-500/40 text-green-400 hover:bg-green-500/10 font-semibold text-base px-7 py-4 rounded-full transition-all">
                <MessageCircle className="h-5 w-5" />
                Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Right — Lead form */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-white font-black text-xl">You&apos;re in the queue!</h3>
                <p className="text-gray-400 text-sm max-w-xs">We&apos;ll be in touch within 24 hours to schedule your free strategy call.</p>
              </div>
            ) : (
              <>
                <h3 className="text-white font-black text-xl mb-2">Get a Free Strategy Session</h3>
                <p className="text-gray-400 text-sm mb-6">Fill in your details and we&apos;ll reach out to book your call.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Full Name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="John Smith"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/60 focus:bg-white/15 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email Address *</label>
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="john@company.com"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/60 focus:bg-white/15 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">WhatsApp Number</label>
                    <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                      placeholder="+1 555 000 0000"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/60 focus:bg-white/15 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Business Type *</label>
                    <select required value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })}
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/60 focus:bg-white/15 transition-all">
                      <option value="" className="bg-zinc-900">Select your industry…</option>
                      {["Real Estate", "Finance / Insurance", "Professional Services", "Home Services", "Coaching / Consulting", "Healthcare", "Other"].map((o) => (
                        <option key={o} value={o} className="bg-zinc-900">{o}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-black text-sm py-4 rounded-xl transition-all mt-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {loading ? "Sending…" : "Book My Free Strategy Call →"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
