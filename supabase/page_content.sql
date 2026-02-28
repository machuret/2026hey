-- ══════════════════════════════════════════════════════
-- PAGE CONTENT TABLE — CMS for all editable page copy
-- Run this in your Supabase SQL editor
-- ══════════════════════════════════════════════════════

create table if not exists page_content (
  id uuid default gen_random_uuid() primary key,
  page text not null,
  section text not null,
  field text not null,
  value text not null,
  updated_at timestamptz default now(),
  unique(page, section, field)
);

create or replace function update_page_content_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger page_content_updated
  before update on page_content
  for each row execute function update_page_content_updated_at();

alter table page_content enable row level security;

create policy "public read page_content" on page_content for select using (true);
create policy "service role all page_content" on page_content using (auth.role() = 'service_role');

-- ══════════════════════════════════════════════════════
-- SEED: HOME PAGE
-- ══════════════════════════════════════════════════════
insert into page_content (page, section, field, value) values
('home','hero','eyebrow','Done-For-You Lead Generation'),
('home','hero','headline','MORE LEADS.\nMORE CALLS.\nMORE CLIENTS.'),
('home','hero','subheadline','We build and run AI-powered outreach systems for small and mid-sized businesses. Ringless voicemail campaigns and WhatsApp AI agents — fully managed, consistently delivering appointment-ready leads.'),
('home','hero','cta_primary','Get More Leads →'),
('home','hero','cta_secondary','See How It Works'),
('home','final_cta','headline','READY TO STOP\nCHASING AND\nSTART CLOSING?'),
('home','final_cta','subheadline','Book a free strategy call. We''ll map out exactly what a done-for-you lead system would look like for your business — and what results you can realistically expect.')

on conflict (page, section, field) do update set value = excluded.value;

-- ══════════════════════════════════════════════════════
-- SEED: ABOUT PAGE
-- ══════════════════════════════════════════════════════
insert into page_content (page, section, field, value) values
('about','hero','eyebrow','Who We Are'),
('about','hero','headline','WE BUILT THIS BECAUSE\nTHE OLD WAY\nSTOPPED WORKING.'),
('about','hero','subheadline','Hey More Leads is a done-for-you lead generation system built by a small team who got tired of watching great businesses lose to inferior ones — simply because their outreach was broken.'),
('about','story','eyebrow','Why We Built This'),
('about','story','headline','THE STORY BEHIND THE SYSTEM.'),
('about','story','body_1','A few years ago, our founder was running a small B2B consulting firm. The offer was solid. The results for clients were real. But the pipeline? A mess of cold calls that went to voicemail, Facebook ads that burned cash, and email campaigns that disappeared into spam folders.'),
('about','story','body_2','The leads weren''t the problem. The channels were. Every "proven" outreach method had become so overcrowded, so overused, that it stopped performing. And the agencies promising to fix it were charging enterprise rates for amateur results.'),
('about','story','pull_quote','We weren''t going to out-spend the big players. So we had to out-smart them.'),
('about','story','body_3','That''s when the team started experimenting. Ringless voicemail drops to get in front of the right people without interrupting their day. AI agents on WhatsApp to qualify leads at scale — around the clock, without a salesperson on the phone. Two tools. One system. Completely done for you.'),
('about','story','body_4','The results were immediate. Callback rates jumped. Qualified leads started showing up in calendars without anyone having to chase them. And the cost per appointment? A fraction of what paid ads were delivering.'),
('about','story','body_5','Hey More Leads was built to take that system — the one that worked for us — and give it to small and mid-sized businesses who are tired of fighting on the wrong battlefield.'),
('about','story','body_6','You don''t need a bigger budget. You need a smarter system. That''s what we built. That''s what we run for you.'),
('about','manifesto','text','Small businesses deserve the same firepower as the big ones — without the bloated agency fees and the empty promises.'),
('about','beliefs','eyebrow','What We Stand For'),
('about','beliefs','headline','THREE THINGS WE''LL\nNEVER COMPROMISE ON.'),
('about','beliefs','item_1_icon','🎯'),
('about','beliefs','item_1_title','Outcomes Over Activity'),
('about','beliefs','item_1_body','We don''t measure success by the number of emails sent or calls made. We measure it by appointments booked and deals closed. If it doesn''t move your pipeline, we don''t do it.'),
('about','beliefs','item_2_icon','⚙️'),
('about','beliefs','item_2_title','Systems Beat Hustle'),
('about','beliefs','item_2_body','Grinding harder on broken channels doesn''t work. Building the right system — and letting it run — does. We believe in automation done with precision, not shortcuts.'),
('about','beliefs','item_3_icon','🤝'),
('about','beliefs','item_3_title','No Guesswork. No BS.'),
('about','beliefs','item_3_body','We tell you what to expect, we show you what''s happening, and we take responsibility when something isn''t working. Transparency isn''t a feature. It''s how we operate.'),
('about','process','eyebrow','How We Work'),
('about','process','headline','WHAT WORKING WITH US\nACTUALLY LOOKS LIKE.'),
('about','team','eyebrow','The Team'),
('about','team','headline','SMALL TEAM.\nSERIOUS OPERATORS.'),
('about','team','subheadline','We''re not a bloated agency with account managers who''ve never run a campaign. We''re a lean team of specialists who''ve built and run these systems ourselves — and we treat your pipeline like it''s our own.'),
('about','final_cta','eyebrow','Work With Us'),
('about','final_cta','headline','NOW YOU KNOW US.\nLET''S TALK ABOUT YOU.'),
('about','final_cta','subheadline','Book a free strategy call. We''ll tell you exactly what we''d build for your business, what results you can expect, and what it takes to get started. No pressure. Just a straight conversation.')

on conflict (page, section, field) do update set value = excluded.value;

-- ══════════════════════════════════════════════════════
-- SEED: WHATSAPP AGENT PAGE
-- ══════════════════════════════════════════════════════
insert into page_content (page, section, field, value) values
('whatsapp','hero','eyebrow','AI WhatsApp Agent'),
('whatsapp','hero','headline','WHILE YOU\nSLEEP, IT\nQUALIFIES.\nCONVERTS.'),
('whatsapp','hero','subheadline','Your competitors are losing leads to slow response times and unqualified conversations. Our AI WhatsApp Agent responds in under 30 seconds, qualifies every prospect, and delivers appointment-ready leads directly to your calendar — 24 hours a day, 7 days a week.'),
('whatsapp','hero','cta_primary','Deploy My Agent →'),
('whatsapp','hero','cta_secondary','See How It Works'),
('whatsapp','stats','stat1_num','30s'),
('whatsapp','stats','stat1_label','Average time to engage a new lead — day or night'),
('whatsapp','stats','stat2_num','77%'),
('whatsapp','stats','stat2_label','Reply rate from contacted leads vs under 20% for email'),
('whatsapp','stats','stat3_num','5×'),
('whatsapp','stats','stat3_label','More booked appointments compared to manual follow-up'),
('whatsapp','stats','stat4_num','24/7'),
('whatsapp','stats','stat4_label','Always on — every timezone, every hour, zero breaks'),
('whatsapp','why','eyebrow','The Platform'),
('whatsapp','why','headline','WHY WHATSAPP IS THE\nMOST POWERFUL SALES CHANNEL\nNOBODY IS USING PROPERLY.'),
('whatsapp','why','body_1','Email open rates sit at 20% on a good day. Cold calls go unanswered 80% of the time. But WhatsApp? 98% open rate. 45–60% click-through rate. 2.6 billion active users. It''s not a messaging app anymore — it''s the world''s most effective sales channel.'),
('whatsapp','why','body_2','The problem isn''t the platform. The problem is that most businesses either ignore it entirely, or they try to manage it manually — and manual doesn''t scale. A lead who messages at 10pm on a Friday doesn''t want to hear from you on Monday morning. By then, they''ve already gone with someone else.'),
('whatsapp','why','body_3','Our AI WhatsApp Agent solves this. It engages every lead the moment they reach out — with a natural, human-feeling conversation that qualifies them in real time and books appointments directly into your calendar. You don''t touch a thing until the right person shows up.'),
('whatsapp','comparison','eyebrow','The Honest Comparison'),
('whatsapp','comparison','headline','BY THE TIME YOU TRAIN\nA SALES REP, YOU''VE ALREADY\nLOST 40 LEADS.'),
('whatsapp','comparison','bottom_note','The bottom line: a human setter costs more, takes longer to deploy, works shorter hours, and delivers inconsistent results. Our AI agent is live in days, costs a fixed rate, never takes a day off, and follows your qualification process perfectly — every time.'),
('whatsapp','how_it_works','eyebrow','How It Works'),
('whatsapp','how_it_works','headline','FOUR STEPS FROM\nFIRST MESSAGE TO\nBOOKED APPOINTMENT.'),
('whatsapp','features','eyebrow','What''s Inside'),
('whatsapp','features','headline','EVERYTHING BUILT IN.\nNOTHING LEFT OUT.'),
('whatsapp','features','subheadline','Every AI agent we deploy is custom-built for your business — then backed by a full suite of tools that make the whole system run without you having to touch it.'),
('whatsapp','manifesto','text','A lead who messages you at 10pm on a Friday has already made a decision. The only question is whether you''re the one who answers.'),
('whatsapp','final_cta','eyebrow','Ready to deploy?'),
('whatsapp','final_cta','headline','YOUR AGENT\nCAN BE LIVE\nTHIS WEEK.'),
('whatsapp','final_cta','subheadline','Book a free strategy call. We''ll walk you through exactly how the agent would be built for your business, what qualification criteria we''d use, and what results you can realistically expect in the first 30 days.')

on conflict (page, section, field) do update set value = excluded.value;

-- ══════════════════════════════════════════════════════
-- SEED: RINGLESS VOICEMAIL PAGE
-- ══════════════════════════════════════════════════════
insert into page_content (page, section, field, value) values
('rvm','hero','eyebrow','Ringless Voicemail Drops'),
('rvm','hero','headline_1','STOP CHASING.'),
('rvm','hero','headline_2','START'),
('rvm','hero','headline_3','RECEIVING.'),
('rvm','hero','subheadline','We send thousands of ringless voicemails directly to your prospects'' inboxes — without their phone ever ringing. Your voice lands. They listen. They call back. We handle every single step from script to delivery. You just pick up the phone.'),
('rvm','hero','cta_primary','Start Getting Callbacks →'),
('rvm','hero','cta_secondary','See How It Works'),
('rvm','stats','stat1_num','13%'),
('rvm','stats','stat1_label','Average callback rate — vs under 4% for cold calling'),
('rvm','stats','stat2_num','3,000+'),
('rvm','stats','stat2_label','Voicemail drops delivered per month per client'),
('rvm','stats','stat3_num','75%'),
('rvm','stats','stat3_label','Average reduction in cost per qualified lead'),
('rvm','stats','stat4_num','100%'),
('rvm','stats','stat4_label','Done for you — we handle everything, start to finish'),
('rvm','what_is','eyebrow','What It Is'),
('rvm','what_is','headline','YOUR VOICE IN THEIR\nINBOX — WITHOUT THEIR\nPHONE EVER RINGING.'),
('rvm','what_is','body_1','Ringless Voicemail Drops (RVMs) use server-to-server technology to deliver a pre-recorded voice message directly into a prospect''s voicemail inbox — bypassing the phone call entirely. Their phone never rings. They simply receive a notification that a new voicemail is waiting.'),
('rvm','what_is','body_2','No interruption. No friction. No hang-up. The prospect listens on their own terms, already hearing your voice and your offer before any conversation has taken place. When they call back, they''re warm — not cold.'),
('rvm','what_is','pull_quote','Cold calling interrupts. Ringless voicemail intrigues.'),
('rvm','what_is','body_3','And unlike cold calls — where 80% of dials go unanswered — every voicemail drop is delivered directly. The prospect receives it. They choose when to listen. And when they do, you''ve already made the introduction.'),
('rvm','what_is','body_4','We handle the entire process. You never touch a platform, upload a list, or record a message unless you want to. We do all of it for you — and report back with exactly what''s working.'),
('rvm','process','eyebrow','Our Process'),
('rvm','process','headline','FOUR STEPS.\nZERO EFFORT\nON YOUR END.'),
('rvm','what_we_handle','eyebrow','What We Handle For You'),
('rvm','what_we_handle','headline','EVERYTHING. WE MEAN\nEVERYTHING.'),
('rvm','what_we_handle','subheadline','This is a fully managed service. You have no platform to learn, no list to build, no script to write, no campaign to run. We do all of it. Here''s exactly what that looks like.'),
('rvm','who_its_for','eyebrow','Industries We Serve'),
('rvm','who_its_for','headline','WORKS FOR ANY\nBUSINESS THAT\nSELLS TO PEOPLE.'),
('rvm','who_its_for','subheadline','Ringless voicemail works best for businesses with a clear offer, a defined target audience, and a sales process that benefits from warm inbound calls. Here are the industries we see the strongest results in.'),
('rvm','results','eyebrow','What To Expect'),
('rvm','results','headline','REAL NUMBERS FROM\nREAL CAMPAIGNS.'),
('rvm','results','subheadline','Results vary by industry, offer, and list quality — but here''s what our managed campaigns consistently deliver for clients running The Drop package.'),
('rvm','testimonials','eyebrow','From Our Clients'),
('rvm','testimonials','headline','WHAT HAPPENS WHEN\nYOUR PHONE STARTS RINGING.'),
('rvm','compliance','body','We handle all compliance, so you don''t have to. Every campaign we run includes DNC scrubbing, spam report checks, and delivery timing that keeps you on the right side of applicable regulations. We keep up with the rules — you focus on the callbacks.'),
('rvm','final_cta','eyebrow','Ready to start?'),
('rvm','final_cta','headline','YOUR FIRST\nCAMPAIGN CAN\nBE LIVE\nTHIS WEEK.'),
('rvm','final_cta','subheadline','Book a free strategy call. We''ll review your business, your target market, and your offer — and tell you honestly what kind of results to expect. No obligation. No pressure. Just the information you need to make a smart decision.')

on conflict (page, section, field) do update set value = excluded.value;

-- ══════════════════════════════════════════════════════
-- SEED: CONTACT PAGE
-- ══════════════════════════════════════════════════════
insert into page_content (page, section, field, value) values
('contact','hero','eyebrow','Free Strategy Call'),
('contact','hero','headline','LET''S TALK ABOUT\nGETTING YOU MORE LEADS.'),
('contact','hero','subheadline','No pitch. No pressure. Just a straight conversation about your business, your goals, and whether our system is the right fit. If it is — we''ll show you exactly what we''d build and what results to expect.'),
('contact','left_panel','eyebrow','What Happens Next'),
('contact','left_panel','headline','A 30-MINUTE CALL THAT\nCHANGES HOW YOU GET LEADS.'),
('contact','left_panel','body_1','Fill in the form, pick a time that works, and we''ll show up ready. We''ll have already reviewed your business and your industry — so the conversation starts where it matters.'),
('contact','left_panel','body_2','No generic decks. No recycled pitches. Just a focused conversation about what a system built specifically for your business would look like — and what it would realistically deliver.'),
('contact','calendar','eyebrow','Pick Your Time'),
('contact','calendar','headline','CHOOSE A TIME THAT\nWORKS FOR YOU.'),
('contact','calendar','subheadline','All calls are 30 minutes via Zoom or Google Meet. Pick a slot below and you''ll receive an instant confirmation with the meeting link.'),
('contact','faq','eyebrow','Before You Book'),
('contact','faq','headline','A FEW THINGS\nPEOPLE USUALLY ASK.')

on conflict (page, section, field) do update set value = excluded.value;

-- ══════════════════════════════════════════════════════
-- SEED: PACKAGES PAGE
-- ══════════════════════════════════════════════════════
insert into page_content (page, section, field, value) values
('packages','hero','eyebrow','Pricing & Packages'),
('packages','hero','headline','TWO SYSTEMS.\nONE GOAL.\nMORE CLIENTS.'),
('packages','hero','subheadline','Both packages are fully managed. No platforms to learn, no campaigns to run, no hiring. We build it, we run it, we report back. You just close the leads.'),
('packages','comparison','eyebrow','How It Compares'),
('packages','comparison','headline','WHAT YOU GET\nVS WHAT IT COSTS\nTO DO IT YOURSELF.'),
('packages','final_cta','eyebrow','Not Sure Where To Start?'),
('packages','final_cta','headline','BOOK A FREE CALL.\nWE''LL TELL YOU WHICH\nPACKAGE MAKES SENSE.'),
('packages','final_cta','subheadline','No hard sell. No commission-hungry sales reps. Just a straight conversation about your business and what the right starting point looks like for you.')

on conflict (page, section, field) do update set value = excluded.value;

-- ══════════════════════════════════════════════════════
-- SEED: CASE STUDIES PAGE
-- ══════════════════════════════════════════════════════
insert into page_content (page, section, field, value) values
('case-studies','hero','eyebrow','Proof It Works'),
('case-studies','hero','headline','REAL CAMPAIGNS.\nREAL RESULTS.\nREAL CLIENTS.'),
('case-studies','hero','subheadline','We don''t do vague claims or cherry-picked metrics. Here are actual campaigns we''ve run — the situation, what we built, and exactly what happened.'),
('case-studies','final_cta','eyebrow','Your Business Next'),
('case-studies','final_cta','headline','READY TO BE\nOUR NEXT CASE STUDY?'),
('case-studies','final_cta','subheadline','Book a strategy call and we''ll show you what we''d build for your specific business and what results to realistically expect.')

on conflict (page, section, field) do update set value = excluded.value;

-- ══════════════════════════════════════════════════════
-- SEED: HOME PAGE COMPONENTS
-- ══════════════════════════════════════════════════════
insert into page_content (page, section, field, value) values
('home','hero','eyebrow','Done-For-You Lead Generation'),
('home','hero','headline','YOUR NEXT\n10 CLIENTS\nARE IN A\nVOICEMAIL.'),
('home','hero','subheadline','We combine Ringless Voicemail Drops and AI-powered WhatsApp Agents to fill your pipeline with appointment-ready prospects — without you lifting a finger.'),
('home','hero','cta_primary','Get More Leads Now →'),
('home','hero','cta_secondary','See How It Works'),
('home','problem','eyebrow','The Problem'),
('home','problem','headline','COLD CALLS GET IGNORED.\nADS ARE EXPENSIVE.\nEMAIL IS DEAD.'),
('home','problem','body_1','You''re running a business. You don''t have time to chase prospects who don''t pick up, scroll past your ads, or delete your emails without reading them.'),
('home','problem','body_2','The old playbook is broken. Your competitors are still using it. That means right now — while you''re reading this — there''s a gap wide open for businesses willing to reach people the right way.'),
('home','problem','body_3','That''s exactly what we built Hey More Leads to do.'),
('home','services','eyebrow','Our System'),
('home','services','headline','ONE SYSTEM.\nTWO POWERFUL TOOLS.'),
('home','services','subheadline','We handle everything — setup, scripting, targeting, execution, optimization. Your only job is showing up for the appointments we send you.'),
('home','services','rvm_title','WE DROP YOUR VOICE STRAIGHT INTO THEIR INBOX.'),
('home','services','rvm_body','Your message lands directly in their voicemail — without their phone ever ringing. No interruption. No friction. They listen when they''re ready, already hearing your voice, your offer, your business.'),
('home','services','rvm_result','THE RESULT: Warm prospects calling YOU back — already familiar with your name and offer.'),
('home','services','wa_title','YOUR AI AGENT WORKS LEADS 24/7 SO YOU DON''T HAVE TO.'),
('home','services','wa_body','WhatsApp has a 98% message open rate. Our AI agent engages leads the moment they respond, asks the right qualifying questions, filters out the tire-kickers, and delivers only serious, appointment-ready prospects to you.'),
('home','services','wa_result','THE RESULT: A qualification machine that hands you pre-vetted, motivated prospects ready to buy.'),
('home','process','eyebrow','Simple Process'),
('home','process','headline','WE''RE UP AND RUNNING\nIN DAYS — NOT MONTHS.'),
('home','final_cta','eyebrow','Ready?'),
('home','final_cta','headline','STOP WAITING\nFOR LEADS.\nSTART GETTING THEM.'),
('home','final_cta','subheadline','Book a free strategy call and we''ll show you exactly how to put this system to work — in days, not months. No pressure. No hard sell.')

on conflict (page, section, field) do update set value = excluded.value;
