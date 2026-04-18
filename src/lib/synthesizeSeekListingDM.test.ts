// ═══════════════════════════════════════════════════════════════════════════
// Unit tests for synthesizeSeekListingDM — the zero-cost DM fallback that
// runs when Apollo finds nothing. Ensures the helper obeys its contract:
//   - Returns null if there's no reachable contact channel
//   - Prefers recruiter_name, falls back to a generic placeholder
//   - Prefers recruiter_phone, then phone_numbers[0]
//   - Always stamps dm_source = "seek_listing"
// ═══════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { synthesizeSeekListingDM } from "./engineEnrichHelpers";

describe("synthesizeSeekListingDM", () => {
  it("returns null when there's no contact channel at all", () => {
    expect(synthesizeSeekListingDM({})).toBeNull();
    expect(
      synthesizeSeekListingDM({
        emails: [],
        phone_numbers: [],
        recruiter_name: "Jane",   // name alone is useless — no channel to reach her
        recruiter_phone: null,
      }),
    ).toBeNull();
  });

  it("returns null when emails array contains only falsy values", () => {
    expect(
      synthesizeSeekListingDM({
        emails: ["", ""] as string[],
        phone_numbers: [],
      }),
    ).toBeNull();
  });

  it("synthesizes a DM from an email alone", () => {
    const dm = synthesizeSeekListingDM({
      emails: ["hr@acme.com.au"],
      recruiter_name: "Sarah Jones",
    });
    expect(dm).not.toBeNull();
    expect(dm!.dm_name).toBe("Sarah Jones");
    expect(dm!.dm_email).toBe("hr@acme.com.au");
    expect(dm!.dm_phone).toBeNull();
    expect(dm!.dm_source).toBe("seek_listing");
    expect(dm!.dm_title).toBe("Listed contact");
    expect(typeof dm!.dm_enriched_at).toBe("string");
  });

  it("synthesizes a DM from recruiter_phone alone (no email)", () => {
    const dm = synthesizeSeekListingDM({
      recruiter_phone: "0400123456",
    });
    expect(dm).not.toBeNull();
    expect(dm!.dm_phone).toBe("0400123456");
    expect(dm!.dm_email).toBeNull();
  });

  it("prefers recruiter_phone over phone_numbers[0]", () => {
    const dm = synthesizeSeekListingDM({
      recruiter_phone: "0400 111 111",
      phone_numbers: ["02 9000 0000"],
      emails: ["contact@acme.com"],
    });
    expect(dm!.dm_phone).toBe("0400 111 111");
  });

  it("falls back to phone_numbers[0] when recruiter_phone is empty string", () => {
    const dm = synthesizeSeekListingDM({
      recruiter_phone: "   ",
      phone_numbers: ["02 9000 0000"],
      emails: ["contact@acme.com"],
    });
    expect(dm!.dm_phone).toBe("02 9000 0000");
  });

  it("uses a generic placeholder name when recruiter_name is missing", () => {
    const dm = synthesizeSeekListingDM({
      emails: ["jobs@example.com"],
      recruiter_name: null,
    });
    expect(dm!.dm_name).toBe("Hiring contact");
  });

  it("trims whitespace from recruiter_name (no silent blank names)", () => {
    const dm = synthesizeSeekListingDM({
      emails: ["x@y.com"],
      recruiter_name: "   ",
    });
    expect(dm!.dm_name).toBe("Hiring contact");
  });

  it("handles null/undefined arrays defensively (no crashes)", () => {
    const dm = synthesizeSeekListingDM({
      emails: null,
      phone_numbers: undefined,
      recruiter_phone: "0400123456",
    });
    expect(dm).not.toBeNull();
    expect(dm!.dm_phone).toBe("0400123456");
  });

  it("ALWAYS stamps dm_source = 'seek_listing' — regression guard", () => {
    // If this ever returns anything else, downstream filters (SmartLead
    // campaign routing) can no longer distinguish Apollo DMs from weak
    // listing contacts. This is a contract test.
    const dm = synthesizeSeekListingDM({ emails: ["a@b.com"] });
    expect(dm!.dm_source).toBe("seek_listing");
  });
});
