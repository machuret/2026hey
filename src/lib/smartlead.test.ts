// ═══════════════════════════════════════════════════════════════════════════
// Tests for smartlead.ts — pure helpers used by the push pipeline.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  isValidEmail, splitName, bestEmail, bestPhone, chunk, jobToSmartLead,
  type SmartLeadJobRow,
} from "./smartlead";

// Minimal job fixture; override fields per test.
const job = (overrides: Partial<SmartLeadJobRow> = {}): SmartLeadJobRow => ({
  id: "job-1",
  source: "seek",
  source_id: "s-1",
  job_title: null,
  job_url: null,
  company_name: null,
  company_website: null,
  company_industry: null,
  company_size: null,
  location: null,
  country: null,
  salary: null,
  work_type: null,
  work_arrangement: null,
  emails: null,
  phone_numbers: null,
  recruiter_name: null,
  recruiter_phone: null,
  dm_name: null,
  dm_title: null,
  dm_email: null,
  dm_phone: null,
  dm_mobile: null,
  dm_linkedin_url: null,
  ai_company_summary: null,
  ai_pitch_angle: null,
  ai_email_snippet: null,
  ai_hiring_signal: null,
  ai_relevance_score: null,
  ai_candidate_persona: null,
  li_company_url: null,
  li_industry: null,
  ...overrides,
});

describe("isValidEmail", () => {
  it("accepts typical addresses", () => {
    expect(isValidEmail("jane@acme.com")).toBe(true);
    expect(isValidEmail("jane.doe+sales@acme.co.uk")).toBe(true);
  });
  it("rejects empty/null/malformed", () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("no-at-sign")).toBe(false);
    expect(isValidEmail("@acme.com")).toBe(false);
    expect(isValidEmail("jane@")).toBe(false);
    expect(isValidEmail("jane@acme")).toBe(false);
    expect(isValidEmail("jane doe@acme.com")).toBe(false);
  });
});

describe("splitName", () => {
  it("two-part name", () => {
    expect(splitName("Jane Doe")).toEqual({ first: "Jane", last: "Doe" });
  });
  it("three-part name keeps middle in last", () => {
    expect(splitName("Mary Jane Smith")).toEqual({ first: "Mary", last: "Jane Smith" });
  });
  it("single name goes to first", () => {
    expect(splitName("Madonna")).toEqual({ first: "Madonna", last: null });
  });
  it("strips salutations", () => {
    expect(splitName("Dr. John Smith")).toEqual({ first: "John", last: "Smith" });
    expect(splitName("Ms Jane Doe")).toEqual({ first: "Jane", last: "Doe" });
    expect(splitName("Prof. Alan Turing")).toEqual({ first: "Alan", last: "Turing" });
  });
  it("handles null/empty", () => {
    expect(splitName(null)).toEqual({ first: null, last: null });
    expect(splitName("")).toEqual({ first: null, last: null });
    expect(splitName("   ")).toEqual({ first: null, last: null });
  });
});

describe("bestEmail", () => {
  it("prefers dm_email when valid", () => {
    expect(bestEmail({ dm_email: "dm@a.com", emails: ["x@y.com"] })).toBe("dm@a.com");
  });
  it("falls back to listing emails", () => {
    expect(bestEmail({ dm_email: null, emails: ["x@y.com"] })).toBe("x@y.com");
  });
  it("skips invalid dm_email", () => {
    expect(bestEmail({ dm_email: "not-an-email", emails: ["x@y.com"] })).toBe("x@y.com");
  });
  it("returns null when none valid", () => {
    expect(bestEmail({ dm_email: null, emails: ["bad", ""] })).toBe(null);
    expect(bestEmail({ dm_email: null, emails: null })).toBe(null);
  });
  it("trims whitespace", () => {
    expect(bestEmail({ dm_email: "  jane@acme.com  ", emails: null })).toBe("jane@acme.com");
  });
});

describe("bestPhone", () => {
  it("prefers dm_mobile, then dm_phone, then recruiter, then listing", () => {
    expect(bestPhone({ dm_mobile: "1", dm_phone: "2", recruiter_phone: "3", phone_numbers: ["4"] })).toBe("1");
    expect(bestPhone({ dm_mobile: null, dm_phone: "2", recruiter_phone: "3", phone_numbers: ["4"] })).toBe("2");
    expect(bestPhone({ dm_mobile: null, dm_phone: null, recruiter_phone: "3", phone_numbers: ["4"] })).toBe("3");
    expect(bestPhone({ dm_mobile: null, dm_phone: null, recruiter_phone: null, phone_numbers: ["4"] })).toBe("4");
  });
  it("returns null when nothing available", () => {
    expect(bestPhone({ dm_mobile: null, dm_phone: null, recruiter_phone: null, phone_numbers: null })).toBe(null);
    expect(bestPhone({ dm_mobile: null, dm_phone: null, recruiter_phone: null, phone_numbers: [] })).toBe(null);
  });
});

describe("chunk", () => {
  it("splits evenly", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });
  it("handles remainder", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it("empty input → empty output", () => {
    expect(chunk([], 10)).toEqual([]);
  });
  it("size larger than array", () => {
    expect(chunk([1, 2], 10)).toEqual([[1, 2]]);
  });
  it("throws on size <= 0", () => {
    expect(() => chunk([1], 0)).toThrow();
    expect(() => chunk([1], -1)).toThrow();
  });
});

describe("jobToSmartLead", () => {
  it("returns null when no valid email anywhere", () => {
    expect(jobToSmartLead(job())).toBe(null);
    expect(jobToSmartLead(job({ dm_email: "bad", emails: ["also-bad"] }))).toBe(null);
  });

  it("uses dm_email and splits dm_name", () => {
    const out = jobToSmartLead(job({
      dm_name: "Jane Doe",
      dm_email: "jane@acme.com",
      company_name: "Acme",
    }));
    expect(out).not.toBeNull();
    expect(out!.email).toBe("jane@acme.com");
    expect(out!.first_name).toBe("Jane");
    expect(out!.last_name).toBe("Doe");
    expect(out!.company_name).toBe("Acme");
  });

  it("falls back to recruiter name when dm_name missing", () => {
    const out = jobToSmartLead(job({
      recruiter_name: "Bob Recruiter",
      dm_email: "jane@acme.com",
    }));
    expect(out!.first_name).toBe("Bob");
  });

  it("prefers company_website, falls back to li_company_url", () => {
    const a = jobToSmartLead(job({ dm_email: "a@b.com", company_website: "https://a.com", li_company_url: "https://b.com" }));
    expect(a!.website).toBe("https://a.com");
    expect(a!.company_url).toBe("https://a.com");

    const b = jobToSmartLead(job({ dm_email: "a@b.com", company_website: null, li_company_url: "https://b.com" }));
    expect(b!.website).toBe("https://b.com");
  });

  it("omits empty custom fields (keeps SmartLead UI tidy)", () => {
    const out = jobToSmartLead(job({
      dm_email: "a@b.com",
      job_title: "CTO",
      job_url: "", // empty string should NOT appear
      salary: null,
    }));
    expect(out!.custom_fields.job_title).toBe("CTO");
    expect("job_url" in out!.custom_fields).toBe(false);
    expect("salary" in out!.custom_fields).toBe(false);
  });

  it("numeric relevance_score survives (0 is not filtered)", () => {
    const out = jobToSmartLead(job({
      dm_email: "a@b.com",
      ai_relevance_score: 0,
    }));
    expect(out!.custom_fields.relevance_score).toBe(0);
  });

  it("includes country and source in custom_fields", () => {
    const out = jobToSmartLead(job({
      dm_email: "a@b.com",
      source: "seek",
      country: "AU",
    }));
    expect(out!.custom_fields.source).toBe("seek");
    expect(out!.custom_fields.country).toBe("AU");
  });
});
