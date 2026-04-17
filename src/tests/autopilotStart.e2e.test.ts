// ═══════════════════════════════════════════════════════════════════════════
// E2E: POST /api/engine/autopilot/start
//
// Critical contracts:
//   1. Only ONE run can be active at any time (global lock)
//   2. stages / batch_size / max_ticks / max_cost_usd validated and clamped
//   3. Invalid stages filtered out; empty stages → 400
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

function makeReq(body: unknown = {}): NextRequest {
  return new NextRequest("http://localhost/api/engine/autopilot/start", {
    method:  "POST",
    body:    JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/engine/autopilot/start", () => {
  beforeEach(() => {
    (mockDb as unknown as { queues: Record<string, unknown> }).queues = {};
    (mockDb as unknown as { lastBuilders: Record<string, unknown> }).lastBuilders = {};
  });

  it("creates a new run with defaults when body is empty", async () => {
    // Active-run check → none
    mockDb.queue("engine_autopilot_runs", { data: null, error: null });
    // Insert → returns the new row
    const newRun = { id: "run-1", status: "running", stages: ["analyze", "find-dm"], batch_size: 10 };
    mockDb.queue("engine_autopilot_runs", { data: newRun, error: null });

    const { POST } = await import("@/app/api/engine/autopilot/start/route");
    const res  = await POST(makeReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.run.id).toBe("run-1");
  });

  it("refuses to create a second run when one is already active", async () => {
    // Active-run check returns an existing running row
    mockDb.queue("engine_autopilot_runs", {
      data:  { id: "existing-run", status: "running" },
      error: null,
    });

    const { POST } = await import("@/app/api/engine/autopilot/start/route");
    const res  = await POST(makeReq());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toMatch(/already active/i);
    expect(body.run_id).toBe("existing-run");
    expect(body.status).toBe("running");
  });

  it("refuses to create a second run when an existing one is paused", async () => {
    mockDb.queue("engine_autopilot_runs", {
      data:  { id: "paused-run", status: "paused" },
      error: null,
    });

    const { POST } = await import("@/app/api/engine/autopilot/start/route");
    const res  = await POST(makeReq());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.status).toBe("paused");
  });

  it("clamps batch_size and max_ticks to safe bounds", async () => {
    mockDb.queue("engine_autopilot_runs", { data: null, error: null });
    mockDb.queue("engine_autopilot_runs", {
      data:  { id: "run-1", batch_size: 50, max_ticks: 1000 },
      error: null,
    });

    const { POST } = await import("@/app/api/engine/autopilot/start/route");
    // Pass absurd values — should be clamped to max
    await POST(makeReq({ batch_size: 999, max_ticks: 99999 }));

    // Inspect the insert call
    const insertBuilder = mockDb.lastBuilders["engine_autopilot_runs"][1];
    const insertCall    = insertBuilder._calls.find((c) => c.method === "insert");
    const row           = (insertCall?.args[0] ?? {}) as Record<string, unknown>;
    expect(row.batch_size).toBe(50);   // clamped to max 50
    expect(row.max_ticks).toBe(1000);  // clamped to max 1000
  });

  it("rejects when all supplied stages are invalid", async () => {
    const { POST } = await import("@/app/api/engine/autopilot/start/route");
    const res  = await POST(makeReq({ stages: ["bogus", "nonsense"] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/stage/i);
  });

  it("filters invalid stages but keeps valid ones", async () => {
    mockDb.queue("engine_autopilot_runs", { data: null, error: null });
    mockDb.queue("engine_autopilot_runs", { data: { id: "run-1" }, error: null });

    const { POST } = await import("@/app/api/engine/autopilot/start/route");
    await POST(makeReq({ stages: ["analyze", "bogus", "find-dm"] }));

    const insertCall = mockDb.lastBuilders["engine_autopilot_runs"][1]._calls.find((c) => c.method === "insert");
    const row        = (insertCall?.args[0] ?? {}) as { stages: string[] };
    expect(row.stages).toEqual(["analyze", "find-dm"]); // "bogus" dropped
  });
});
