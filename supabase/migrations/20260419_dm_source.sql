-- ═══════════════════════════════════════════════════════════════════════════
-- DM source tracking — distinguishes Apollo-discovered DMs from DMs
-- synthesized from the Seek listing's own contact fields (recruiter_name,
-- emails[], phone_numbers[]). A "seek_listing" DM is a weaker signal —
-- the contact may be an HR assistant or a generic reception line rather
-- than a true decision maker — so downstream tooling (SmartLead campaign
-- routing, CRM pipelines) may want to treat them differently.
--
-- Values:
--   'apollo'       — discovered via Apollo people/enrichment actors
--   'seek_listing' — synthesized from emails/phone/recruiter fields on the
--                    original Seek (or other source) job listing
--   NULL           — no DM yet OR legacy rows pre-dating this column
--
-- Future extensibility: 'linkedin', 'manual', 'zoominfo', etc.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE job_leads
  ADD COLUMN IF NOT EXISTS dm_source TEXT;

-- Backfill: any row that already has a dm_name was Apollo-sourced
-- (that was the only DM path until this migration).
UPDATE job_leads
   SET dm_source = 'apollo'
 WHERE dm_name IS NOT NULL
   AND dm_source IS NULL;

-- Lightweight index for filtering "show me only Apollo-sourced leads"
-- in the UI or SmartLead campaigns. Partial index keeps it tiny.
CREATE INDEX IF NOT EXISTS idx_job_leads_dm_source
  ON job_leads (dm_source)
  WHERE dm_source IS NOT NULL;

COMMENT ON COLUMN job_leads.dm_source IS
  'How the DM was found: apollo | seek_listing | (future: linkedin, manual). NULL = no DM yet.';
