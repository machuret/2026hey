import { getSupabaseAdmin } from "@/lib/supabase";

const FALLBACKS: Record<string, { title: string; description: string }> = {
  home: {
    title: "Hey More Leads — More Conversations. More Closings. More Revenue.",
    description: "Done-For-You Lead Generation. No Cold Calls. No Ad Spend. Ringless Voicemail Drops + AI WhatsApp Agents to fill your pipeline with appointment-ready prospects.",
  },
  about: {
    title: "About Hey More Leads — Who We Are & Why We Built This",
    description: "We built Hey More Leads because the old lead generation playbook is broken. Learn who we are, what we believe, and how we work.",
  },
  "whatsapp-agent": {
    title: "AI WhatsApp Agent — 24/7 Lead Qualification on Autopilot | Hey More Leads",
    description: "Our AI-powered WhatsApp Agent engages, qualifies, and books appointments from your leads automatically — 24 hours a day, 7 days a week.",
  },
  "ringless-voicemail": {
    title: "Ringless Voicemail Drops — Reach Prospects Without Calling | Hey More Leads",
    description: "Drop your voice message directly into voicemail inboxes without the phone ever ringing. High listen rates, zero interruptions.",
  },
  packages: {
    title: "Packages & Pricing — Hey More Leads",
    description: "Transparent, results-focused packages for businesses ready to fill their pipeline with appointment-ready prospects.",
  },
  "case-studies": {
    title: "Case Studies — Real Campaigns, Real Results | Hey More Leads",
    description: "See actual campaigns we have run — the situation, what we built, and exactly what happened.",
  },
  contact: {
    title: "Book a Free Strategy Call — Hey More Leads",
    description: "Ready to start getting leads? Book a free strategy call and we will show you exactly how to put our system to work for your business.",
  },
};

export async function getSeoMeta(page: string) {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("seo_meta")
      .select("title, description")
      .eq("page", page)
      .single();
    if (error || !data) return FALLBACKS[page] ?? FALLBACKS.home;
    return { title: data.title, description: data.description };
  } catch {
    return FALLBACKS[page] ?? FALLBACKS.home;
  }
}
