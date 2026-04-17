// ═══════════════════════════════════════════════════════════════════════════
// E2E: POST /api/engine/smartlead
//
// Critical contracts:
//   1. No DM → job is filtered out by the DB query (defense layer 1)
//   2. No DM → jobToSmartLead returns null (defense layer 2)
//   3. Missing email → partial success, skipped_no_email counter
//   4. SmartLead API call uses the correct batching + campaign_id
//   5. Audit rows (engine_api_usage, engine_stage_transitions) are logged
// ═══════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { MockSupabase } from "./helpers/mockSupabase";

const mockDb = new MockSupabase();

vi.mock("@/lib/engineSupabase", () => ({
  getEngineAdmin: () => mockDb,
  edgeFnUrl: (name: string) => `https://test.supabase.co/functions/v1/${name}`,
  getAuthHeader: () => "Bearer test",
  proxyEdgeFn: vi.fn(),
}));

vi.mock("@/lib/engineAuth", () => ({
  requireEngineAuth: () => null,
}));

// Mock external SmartLead HTTP calls
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

// Provide env for the SmartLead URL builder, if used
vi.stubEnv("SMARTLEAD_API_KEY",           "test-key");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL",    "https://test.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY",   "test-service-key");

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/engine/smartlead", {
    method:  "POST",
    body:    JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const fullyEnrichedJob = (overrides: Record<string, unknown> = {}) => ({
  id: "job-1",
  source: "seek",
  source_id: "s-1",
  status: "dm_enriched",
  job_title: "CTO",
  job_url: "https://job/1",
  company_name: "Acme Inc",
  company_website: "https://acme.com",
  company_industry: "Software",
  company_size: "50-200",
  location: "London",
  country: "UK",
  salary: null,
  work_type: null,
  work_arrangement: null,
  emails: null,
  phone_numbers: null,
  recruiter_name: null,
  recruiter_phone: null,
  dm_name: "Jane Doe",
  dm_title: "Head of Hiring",
  dm_email: "jane@acme.com",
  dm_phone: null,
  dm_mobile: null,
  dm_linkedin_url: null,
  ai_company_summary: null,
  ai_pitch_angle: null,
  ai_email_snippet: null,
  ai_hiring_signal: null,
  ai_relevance_score: 8,
  ai_candidate_persona: null,
  li_company_url: null,
  li_industry: null,
  ...overrides,
});

describe("POST /api/engine/smartlead", () => {
  beforeEach(() => {
    (mockDb as unknown as { queues: Record<string, unknown> }).queues = {};
    (mockDb as unknown as { lastBuilders: Record<string, unknown> }).lastBuilders = {};
    fetchMock.mockReset();
  });

  it("rejects empty jobIds", async () => {
    const { POST } = await import("@/app/api/engine/smartlead/route");
    const res  = await POST(makeReq({ jobIds: [], campaignId: "c1" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/jobIds/);
  });

  it("rejects missing campaignId", async () => {
    const { POST } = await import("@/app/api/engine/smartlead/route");
    const res  = await POST(makeReq({ jobIds: ["job-1"] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/campaignId/);
  });

  it("returns 404 when no jobs pass the DM eligibility filter", async () => {
    // DB query returns empty because none of the jobs have a DM.
    // This is the FIRST line of defense — SQL-level enforcement.
    mockDb.queue("job_leads", { data: [], error: null });

    const { POST } = await import("@/app/api/engine/smartlead/route");
    const res  = await POST(makeReq({ jobIds: ["job-1"], campaignId: "c1" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toMatch(/No eligible jobs/);

    // Verify the query enforces dm_name + (dm_email OR dm_linkedin_url)
    const calls = mockDb.getCalls("job_leads", 0);
    const methods = calls.map((c) => c.method);
    expect(methods).toContain("not");   // .not("dm_name", "is", null)
    expect(methods).toContain("or");    // .or("dm_email.not.is.null,dm_linkedin_url.not.is.null")

    const notCall = calls.find((c) => c.method === "not");
    expect(notCall?.args).toEqual(["dm_name", "is", null]);

    const orCall = calls.find((c) => c.method === "or");
    expect(orCall?.args[0]).toMatch(/dm_email.*dm_linkedin_url|dm_linkedin_url.*dm_email/);
  });

  it("successfully pushes a DM-backed job to SmartLead", async () => {
    // 1st from("job_leads").select() → eligible jobs
    mockDb.queue("job_leads", { data: [fullyEnrichedJob()], error: null });
    // 2nd from("job_leads").update() → mark pushed
    mockDb.queue("job_leads", { data: null, error: null });
    // api_usage insert
    mockDb.queue("engine_api_usage", { data: null, error: null });
    // stage_transitions insert (may be called)
    mockDb.queue("engine_stage_transitions", { data: null, error: null });

    // Mock SmartLead edge-fn: returns { success: true, uploaded: 1, ... }
    fetchMock.mockResolvedValue({
      ok:     true,
      status: 200,
      headers: { get: () => "application/json" },
      text:   async () => JSON.stringify({ success: true, uploaded: 1, duplicates: 0, invalid: 0 }),
      json:   async () => ({ success: true, uploaded: 1, duplicates: 0, invalid: 0 }),
    } as unknown as Response);

    const { POST } = await import("@/app/api/engine/smartlead/route");
    const res  = await POST(makeReq({ jobIds: ["job-1"], campaignId: "c1", campaignName: "Q4" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.uploaded).toBe(1);

    // External SmartLead edge fn was called
    expect(fetchMock).toHaveBeenCalled();
    const callUrl = String(fetchMock.mock.calls[0][0]);
    expect(callUrl).toMatch(/smartleads/i);
    // Verify the outgoing body carries action + campaign_id + leads array
    const initObj = fetchMock.mock.calls[0][1] as { body: string };
    const sentBody = JSON.parse(initObj.body);
    expect(sentBody.action).toBe("add_leads");
    expect(sentBody.campaign_id).toBe("c1");
    expect(sentBody.leads).toHaveLength(1);
    expect(sentBody.leads[0].email).toBe("jane@acme.com");
    expect(sentBody.leads[0].first_name).toBe("Jane");
  });

  it("returns partial-success when SmartLead reports invalid leads", async () => {
    mockDb.queue("job_leads", { data: [fullyEnrichedJob()], error: null });
    mockDb.queue("job_leads", { data: null, error: null });
    mockDb.queue("engine_api_usage", { data: null, error: null });
    mockDb.queue("engine_stage_transitions", { data: null, error: null });

    // SmartLead reports: 0 uploaded, 1 invalid (malformed email, etc.)
    fetchMock.mockResolvedValue({
      ok:     true,
      status: 200,
      headers: { get: () => "application/json" },
      text:   async () => JSON.stringify({ success: true, uploaded: 0, duplicates: 0, invalid: 1 }),
      json:   async () => ({ success: true, uploaded: 0, duplicates: 0, invalid: 1 }),
    } as unknown as Response);

    const { POST } = await import("@/app/api/engine/smartlead/route");
    const res  = await POST(makeReq({ jobIds: ["job-1"], campaignId: "c1" }));
    const body = await res.json();

    // Uploaded=0 but not a hard fail — SmartLead accepted the call
    expect(body.uploaded).toBe(0);
    expect(body.invalid).toBe(1);
  });
});
