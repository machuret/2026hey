// ═══════════════════════════════════════════════════════════════════════════
// E2E: DELETE /api/engine/jobs
//
// Critical contract: we MUST refuse to delete jobs that are already
// pushed_to_crm / pushed_to_smartlead. This protects the audit trail and
// prevents "oops I deleted my campaign history" disasters.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { MockSupabase } from "./helpers/mockSupabase";

const mockDb = new MockSupabase();

vi.mock("@/lib/engineSupabase", () => ({
  getEngineAdmin: () => mockDb,
}));

// Auth is a no-op when ADMIN_SECRET isn't set (dev mode)
vi.mock("@/lib/engineAuth", () => ({
  requireEngineAuth: () => null,
}));

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/engine/jobs", {
    method: "DELETE",
    body:   JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("DELETE /api/engine/jobs", () => {
  beforeEach(() => {
    // Reset queues between tests by re-creating on the same reference
    (mockDb as unknown as { queues: Record<string, unknown> }).queues = {};
    (mockDb as unknown as { lastBuilders: Record<string, unknown> }).lastBuilders = {};
  });

  it("rejects empty jobIds", async () => {
    const { DELETE } = await import("@/app/api/engine/jobs/route");
    const res  = await DELETE(makeReq({ jobIds: [] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/jobIds/);
  });

  it("rejects batches over 500", async () => {
    const { DELETE } = await import("@/app/api/engine/jobs/route");
    const jobIds = Array.from({ length: 501 }, (_, i) => `job-${i}`);
    const res = await DELETE(makeReq({ jobIds }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/500/);
  });

  it("refuses to delete already-pushed jobs (audit safety)", async () => {
    // Pre-check returns: one job already pushed to CRM
    mockDb.queue("job_leads", {
      data: [{ id: "job-1", status: "pushed_to_crm" }],
      error: null,
    });

    const { DELETE } = await import("@/app/api/engine/jobs/route");
    const res  = await DELETE(makeReq({ jobIds: ["job-1", "job-2"] }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toMatch(/already pushed/i);
    expect(body.blocked_ids).toEqual(["job-1"]);
  });

  it("deletes when all jobs are safe to delete", async () => {
    // 1st query: pre-check for pushed — returns empty (none pushed)
    mockDb.queue("job_leads", { data: [], error: null });
    // 2nd query: the actual delete — returns deleted ids
    mockDb.queue("job_leads", {
      data: [{ id: "job-1" }, { id: "job-2" }],
      error: null,
    });

    const { DELETE } = await import("@/app/api/engine/jobs/route");
    const res  = await DELETE(makeReq({ jobIds: ["job-1", "job-2"] }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.deleted).toBe(2);

    // Verify call chain:
    //   1st .from("job_leads") should have .select("id, status").in("id", ids).in("status", [pushed...])
    const preCheck = mockDb.getCalls("job_leads", 0);
    expect(preCheck.map((c) => c.method)).toEqual(["select", "in", "in"]);
    const statuses = preCheck[2].args[1] as string[];
    expect(statuses).toContain("pushed_to_crm");
    expect(statuses).toContain("pushed_to_smartlead");

    //   2nd .from("job_leads") should have .delete().in("id", ids).select("id")
    const del = mockDb.getCalls("job_leads", 1);
    expect(del.map((c) => c.method)).toEqual(["delete", "in", "select"]);
    expect(del[1].args).toEqual(["id", ["job-1", "job-2"]]);
  });

  it("filters non-string ids out of the batch", async () => {
    mockDb.queue("job_leads", { data: [], error: null });
    mockDb.queue("job_leads", { data: [{ id: "real-id" }], error: null });

    const { DELETE } = await import("@/app/api/engine/jobs/route");
    const res  = await DELETE(makeReq({ jobIds: ["real-id", 123, null, "", undefined] }));
    expect(res.status).toBe(200);

    const preCheck = mockDb.getCalls("job_leads", 0);
    // The .in("id", [...]) should only carry strings
    expect(preCheck[1].args[1]).toEqual(["real-id"]);
  });
});
