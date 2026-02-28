import { CheckCircle, XCircle } from "lucide-react";

const forYou = [
  "You're tired of cold calling and getting ignored",
  "You're spending money on ads with inconsistent results",
  "You have a great offer but not enough people hearing about it",
  "You want a system that works even when you're not working",
  "You're ready to scale, not dabble",
];

const notForYou = [
  "You're not serious about growth",
  "You want a magic button with no strategy behind it",
  "You're not prepared to handle more leads than you currently have",
];

export default function WhoItsFor() {
  return (
    <section className="bg-black py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-4 text-center">Is This For You?</p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 text-center leading-tight max-w-4xl mx-auto">
          Hey More Leads Is Built For Business Owners Who Are{" "}
          <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Done Waiting For Leads To Show Up.
          </span>
        </h2>
        <p className="text-gray-400 text-lg text-center max-w-xl mx-auto mb-16">
          Be honest with yourself. This is for the serious ones.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For you */}
          <div className="bg-green-500/5 border border-green-500/20 rounded-3xl p-8">
            <h3 className="text-green-400 font-black text-lg mb-6 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" /> This IS for you if:
            </h3>
            <ul className="space-y-4">
              {forYou.map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Not for you */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8">
            <h3 className="text-red-400 font-black text-lg mb-6 flex items-center gap-2">
              <XCircle className="h-5 w-5" /> This is NOT for you if:
            </h3>
            <ul className="space-y-4">
              {notForYou.map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-300 text-sm">
                  <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
