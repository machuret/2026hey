"use client";

import { Loader2, Sparkles, ArrowRight, User, Mail, Phone, CheckCircle2 } from "lucide-react";
import { ScrapedLead, bestEmail, bestPhone } from "@/app/engine/leads/types";
import { ErrBanner } from "./ErrBanner";

type Props = {
  leads: ScrapedLead[];
  enriching: boolean;
  error: string;
  enrichCount: number;
  onFillGaps: () => void;
  onNext: () => void;
};

function Dot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
      ok ? "bg-emerald-900/40 text-emerald-400" : "bg-gray-800 text-gray-600"
    }`}>
      {ok ? "✓" : "—"}
    </span>
  );
}

export function ContactsTab({ leads, enriching, error, enrichCount, onFillGaps, onNext }: Props) {
  const withEmail   = leads.filter((l) => bestEmail(l));
  const withPhone   = leads.filter((l) => bestPhone(l));
  const withDM      = leads.filter((l) => l.decision_maker);
  const incomplete  = leads.filter((l) => !bestEmail(l) || !bestPhone(l));

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Leads",      value: leads.length,      colour: "text-white" },
          { label: "Have Email",       value: withEmail.length,  colour: "text-indigo-400" },
          { label: "Have Phone/Mobile",value: withPhone.length,  colour: "text-emerald-400" },
          { label: "Decision Maker",   value: withDM.length,     colour: "text-amber-400" },
        ].map(({ label, value, colour }) => (
          <div key={label} className="rounded-2xl bg-gray-900 border border-gray-800 p-4 text-center">
            <p className={`text-2xl font-bold ${colour}`}>{leads.length ? value : "—"}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
            {leads.length > 0 && (
              <p className="text-[10px] text-gray-600 mt-0.5">
                {Math.round((value / leads.length) * 100)}%
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Fill gaps action */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-white mb-1">Fill Contact Gaps</h2>
          <p className="text-xs text-gray-500">
            {incomplete.length > 0
              ? `${incomplete.length} lead${incomplete.length !== 1 ? "s" : ""} missing email or phone — crawl their websites to fill the gaps.`
              : "All leads have email and phone data."}
          </p>
        </div>

        {enrichCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-900/20 border border-emerald-800 px-3 py-2 text-xs text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            {enrichCount} leads updated with new contact data
          </div>
        )}

        <ErrBanner msg={error} />

        <div className="flex flex-wrap gap-3">
          {incomplete.length > 0 && (
            <button
              onClick={onFillGaps}
              disabled={enriching || leads.length === 0}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              {enriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {enriching ? `Crawling websites… (${incomplete.length} leads)` : `Fill ${incomplete.length} gaps`}
            </button>
          )}
          <button
            onClick={onNext}
            disabled={leads.length === 0}
            className="flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:border-gray-600 disabled:opacity-50 transition-colors"
          >
            Continue to Import <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Per-lead completeness table */}
      {leads.length > 0 && (
        <div className="rounded-xl border border-gray-800 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-3 py-2.5 text-left text-gray-400 font-semibold uppercase tracking-wider">Company</th>
                <th className="px-3 py-2.5 text-center text-gray-400 font-semibold uppercase tracking-wider">
                  <Mail className="h-3 w-3 inline mr-1" />Email
                </th>
                <th className="px-3 py-2.5 text-center text-gray-400 font-semibold uppercase tracking-wider">
                  <Phone className="h-3 w-3 inline mr-1" />Phone
                </th>
                <th className="px-3 py-2.5 text-center text-gray-400 font-semibold uppercase tracking-wider">
                  <User className="h-3 w-3 inline mr-1" />DM
                </th>
                <th className="px-3 py-2.5 text-left text-gray-400 font-semibold uppercase tracking-wider">Contact</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => {
                const email = bestEmail(lead);
                const phone = bestPhone(lead);
                const dm    = lead.decision_maker ?? "";
                return (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                    <td className="px-3 py-2.5">
                      <p className="text-white font-medium">{lead.company || lead.name || "—"}</p>
                      {lead.website && (
                        <p className="text-gray-600 text-[10px] truncate max-w-[160px]">
                          {lead.website.replace(/^https?:\/\/(www\.)?/, "")}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <Dot ok={!!email} />
                        {email && <span className="text-[9px] text-gray-500 truncate max-w-[120px]">{email}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <Dot ok={!!phone} />
                        {phone && <span className="text-[9px] text-gray-500">{phone}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <Dot ok={!!dm} />
                        {dm && <span className="text-[9px] text-gray-500 truncate max-w-[80px]">{dm}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {email || phone ? (
                        <div className="space-y-0.5">
                          {email && (
                            <a href={`mailto:${email}`} className="block text-indigo-400 hover:text-indigo-300 truncate max-w-[160px]">
                              {email}
                            </a>
                          )}
                          {phone && (
                            <a href={`tel:${phone}`} className="block text-emerald-400 hover:text-emerald-300">
                              {phone}
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-700 text-[10px]">No contact data</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
