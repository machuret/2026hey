const testimonials = [
  {
    quote: "I was skeptical at first. But within the first week, I had 6 callbacks and booked 3 appointments. The system runs itself.",
    name: "James R.",
    role: "Financial Advisor",
  },
  {
    quote: "The WhatsApp agent is insane. It qualifies leads better than half my sales team. And it never sleeps.",
    name: "Sarah M.",
    role: "Real Estate Agent",
  },
  {
    quote: "We've tried Facebook ads, Google ads, cold email. Nothing came close to this for cost per lead.",
    name: "Daniel T.",
    role: "Insurance Broker",
  },
  {
    quote: "We went from 3 leads a week to 27 in the first month. I wish I'd found this two years ago.",
    name: "Marcus L.",
    role: "Business Coach",
  },
  {
    quote: "Our WhatsApp agent booked 14 appointments while we slept. ROI was positive in week one.",
    name: "Priya K.",
    role: "Mortgage Consultant",
  },
  {
    quote: "Best ROI we've had from any marketing service. Period. We're doubling our spend next quarter.",
    name: "Tom W.",
    role: "Home Services Owner",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-black py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-4 text-center">Real Businesses. Real Results.</p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-16 text-center leading-tight">
          Don&apos;t Take Our Word For It.{" "}
          <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Take Theirs.
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-200">
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="text-orange-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div className="border-t border-white/10 pt-4">
                <p className="text-white font-bold text-sm">{t.name}</p>
                <p className="text-gray-500 text-xs">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
