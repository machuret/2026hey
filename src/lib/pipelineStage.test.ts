// ═══════════════════════════════════════════════════════════════════════════
// Tests for computeStage — the single source of truth for pipeline stage.
// Every pipeline decision (routing, worker claim, UI stage label) relies on
// this function, so these tests are load-bearing.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { computeStage, VALID_TRANSITIONS, type PipelineStage } from "./pipelineStage";

// Minimal job fixture; override fields per test.
type JobInput = Parameters<typeof computeStage>[0];
const job = (overrides: Partial<JobInput> = {}): JobInput => ({
  status: "new",
  ai_enriched_at: null,
  ai_relevance_score: null,
  ai_poster_type: null,
  dm_name: null,
  dm_email: null,
  dm_linkedin_url: null,
  ...overrides,
});

describe("computeStage — terminal states take precedence", () => {
  it("pushed_to_crm → pushed (regardless of other fields)", () => {
    expect(computeStage(job({ status: "pushed_to_crm", dm_name: "X", dm_email: "x@y.com" }))).toBe("pushed");
  });

  it("pushed_to_smartlead → smartleaded (regardless of other fields)", () => {
    expect(computeStage(job({ status: "pushed_to_smartlead", dm_name: "X", dm_email: "x@y.com" }))).toBe("smartleaded");
  });

  it("dismissed → dismissed", () => {
    expect(computeStage(job({ status: "dismissed" }))).toBe("dismissed");
  });

  it("recruiter_dismissed → dismissed (agency posts)", () => {
    expect(computeStage(job({ status: "recruiter_dismissed" }))).toBe("dismissed");
  });
});

describe("computeStage — pre-AI states", () => {
  it("new & no AI → pending", () => {
    expect(computeStage(job())).toBe("pending");
  });

  it("pending AI, no DM yet → pending", () => {
    expect(computeStage(job({ status: "new", ai_enriched_at: null }))).toBe("pending");
  });
});

describe("computeStage — post-AI states", () => {
  it("AI done, score ≥ 6, internal → qualified", () => {
    expect(computeStage(job({
      ai_enriched_at: "2026-01-01",
      ai_relevance_score: 7,
      ai_poster_type: "internal",
    }))).toBe("qualified");
  });

  it("AI done, score < 6 → dead_end", () => {
    expect(computeStage(job({
      ai_enriched_at: "2026-01-01",
      ai_relevance_score: 4,
      ai_poster_type: "internal",
    }))).toBe("dead_end");
  });

  it("AI done, score 6 but agency poster → dead_end", () => {
    expect(computeStage(job({
      ai_enriched_at: "2026-01-01",
      ai_relevance_score: 8,
      ai_poster_type: "agency_recruiter",
    }))).toBe("dead_end");
  });

  it("AI done, score at threshold (6) → qualified (boundary)", () => {
    expect(computeStage(job({
      ai_enriched_at: "2026-01-01",
      ai_relevance_score: 6,
      ai_poster_type: "internal",
    }))).toBe("qualified");
  });

  it("qualified but dm_attempts >= 3 → stuck_no_dm", () => {
    expect(computeStage(job({
      ai_enriched_at: "2026-01-01",
      ai_relevance_score: 7,
      ai_poster_type: "internal",
      dm_attempts: 3,
    }))).toBe("stuck_no_dm");
  });

  it("qualified, dm_attempts=2 → still qualified (not yet stuck)", () => {
    expect(computeStage(job({
      ai_enriched_at: "2026-01-01",
      ai_relevance_score: 7,
      ai_poster_type: "internal",
      dm_attempts: 2,
    }))).toBe("qualified");
  });
});

describe("computeStage — enriched states", () => {
  it("has dm_name + dm_email → enriched", () => {
    expect(computeStage(job({
      ai_enriched_at: "2026-01-01",
      dm_name: "Jane Doe",
      dm_email: "jane@acme.com",
    }))).toBe("enriched");
  });

  it("has dm_name + dm_linkedin_url (no email) → enriched", () => {
    expect(computeStage(job({
      ai_enriched_at: "2026-01-01",
      dm_name: "Jane Doe",
      dm_linkedin_url: "https://linkedin.com/in/jane",
    }))).toBe("enriched");
  });

  it("has dm_name ONLY (no contact) → not enriched, falls back to qualified", () => {
    expect(computeStage(job({
      ai_enriched_at: "2026-01-01",
      ai_relevance_score: 7,
      ai_poster_type: "internal",
      dm_name: "Jane Doe",
      dm_email: null,
      dm_linkedin_url: null,
    }))).toBe("qualified");
  });

  it("enriched overrides 'qualified' regardless of AI score fields", () => {
    // Even without AI scoring, if we have a DM, it's enriched. Not realistic
    // but confirms the DM-present check wins over the AI-done check.
    expect(computeStage(job({
      ai_enriched_at: null,
      dm_name: "Jane Doe",
      dm_email: "jane@acme.com",
    }))).toBe("enriched");
  });
});

describe("computeStage — defensive behavior", () => {
  it("missing dm_attempts defaults to 0 (not stuck)", () => {
    expect(computeStage(job({
      ai_enriched_at: "2026-01-01",
      ai_relevance_score: 7,
      ai_poster_type: "internal",
      // dm_attempts intentionally omitted
    }))).toBe("qualified");
  });

  it("null ai_relevance_score treats as 0 → dead_end", () => {
    expect(computeStage(job({
      ai_enriched_at: "2026-01-01",
      ai_relevance_score: null,
      ai_poster_type: "internal",
    }))).toBe("dead_end");
  });
});

describe("VALID_TRANSITIONS — graph shape", () => {
  it("pushed can still go to smartleaded (different channel)", () => {
    expect(VALID_TRANSITIONS.pushed).toContain("smartleaded");
  });

  it("smartleaded is terminal (no outgoing edges)", () => {
    expect(VALID_TRANSITIONS.smartleaded).toEqual([]);
  });

  it("enriched can go to smartleaded directly", () => {
    expect(VALID_TRANSITIONS.enriched).toContain("smartleaded");
  });

  it("dismissed is terminal", () => {
    expect(VALID_TRANSITIONS.dismissed).toEqual([]);
  });

  it("pending can only progress to qualified/dead_end/dismissed (not straight to enriched)", () => {
    expect(VALID_TRANSITIONS.pending).toContain("qualified");
    expect(VALID_TRANSITIONS.pending).toContain("dead_end");
    expect(VALID_TRANSITIONS.pending).not.toContain("enriched");
    expect(VALID_TRANSITIONS.pending).not.toContain("pushed");
  });

  it("stuck_no_dm can recover to enriched (on retry success)", () => {
    expect(VALID_TRANSITIONS.stuck_no_dm).toContain("enriched");
  });

  it("every stage exists as a key (no dangling values)", () => {
    const stages = new Set<PipelineStage>(Object.keys(VALID_TRANSITIONS) as PipelineStage[]);
    for (const destinations of Object.values(VALID_TRANSITIONS)) {
      for (const dest of destinations) {
        expect(stages.has(dest)).toBe(true);
      }
    }
  });
});
