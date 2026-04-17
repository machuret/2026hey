// ═══════════════════════════════════════════════════════════════════════════
// E2E: dispatchOneTick (src/lib/autopilotDispatch.ts)
//
// Critical contracts:
//   1. Returns { kind: "cost_cap" } when spend has hit the per-run cap
//   2. Returns { kind: "circuit_open" } when the API circuit is tripped
//   3. Returns { kind: "budget" } when the daily budget is exhausted
//   4. Returns { kind: "done" } when no eligible jobs for any stage
// ═══════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { MockSupabase } from "./helpers/mockSupabase";
import type { AutopilotRun } from "@/lib/autopilot";

const mockDb = new MockSupabase();

vi.mock("@/lib/engineSupabase", () => ({
  getEngineAdmin: () => mockDb,
  edgeFnUrl: (name: string) => `https://test.supabase.co/functions/v1/${name}`,
  getAuthHeader: () => "Bearer test",
  proxyEdgeFn: vi.fn(),
}));

// API guard mocks — each test configures behavior
const checkBudgetMock       = vi.fn();
const logApiCallMock        = vi.fn().mockResolvedValue(undefined);
const circuitBreakerMock    = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/engineApiGuard", async () => {
  const actual = await vi.importActual<typeof import("@/lib/engineApiGuard")>("@/lib/engineApiGuard");
  return {
    ...actual,
    checkBudget:         checkBudgetMock,
    logApiCall:          logApiCallMock,
    circuitBreakerCheck: circuitBreakerMock,
  };
});

// Minimal run fixture
const baseRun: AutopilotRun = {
  id:             "run-1",
  status:         "running",
  stages:         ["analyze", "find-dm"],
  batch_size:     10,
  max_ticks:      100,
  max_cost_usd:   null,
  ticks_completed: 0,
  processed:      0,
  analyzed:       0,
  dms_found:      0,
  failures:       0,
  cost_usd:       "0" as unknown as number, // Postgres numeric comes back as string sometimes
  last_error:     null,
  finish_reason:  null,
  triggered_by:   "manual",
  paused_at:      null,
  finished_at:    null,
  created_at:     new Date().toISOString(),
  updated_at:     new Date().toISOString(),
};

function makeReq(): NextRequest {
  return new NextRequest("http://localhost/api/engine/autopilot/tick", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ run_id: "run-1" }),
  });
}

describe("dispatchOneTick", () => {
  beforeEach(() => {
    (mockDb as unknown as { queues: Record<string, unknown> }).queues = {};
    (mockDb as unknown as { lastBuilders: Record<string, unknown> }).lastBuilders = {};
    checkBudgetMock.mockReset();
    logApiCallMock.mockClear();
    circuitBreakerMock.mockClear();
  });

  it("returns { kind: 'cost_cap' } when cost_usd ≥ max_cost_usd", async () => {
    const run = { ...baseRun, max_cost_usd: 1.0, cost_usd: 1.5 as unknown as number };

    const { dispatchOneTick } = await import("@/lib/autopilotDispatch");
    const outcome = await dispatchOneTick({ run, req: makeReq(), db: mockDb as never });

    expect(outcome.kind).toBe("cost_cap");
    if (outcome.kind === "cost_cap") {
      expect(outcome.spent).toBe(1.5);
      expect(outcome.cap).toBe(1.0);
    }
  });

  it("returns { kind: 'circuit_open' } when OpenAI circuit is tripped", async () => {
    // isCircuitOpen is called via db.rpc("engine_is_circuit_open", ...) in the dispatcher.
    // Mock the rpc to return true (circuit is open) for the analyze stage's API check.
    mockDb.queueRpc("engine_is_circuit_open", { data: true, error: null });

    const { dispatchOneTick } = await import("@/lib/autopilotDispatch");
    const outcome = await dispatchOneTick({ run: baseRun, req: makeReq(), db: mockDb as never });

    expect(outcome.kind).toBe("circuit_open");
    if (outcome.kind === "circuit_open") {
      expect(outcome.api).toBe("openai");
    }
  });

  it("returns { kind: 'budget' } when checkBudget says we've hit the cap", async () => {
    // Circuit closed
    mockDb.queueRpc("engine_is_circuit_open", { data: false, error: null });
    // Budget exceeded
    checkBudgetMock.mockResolvedValue({ ok: false, reason: "daily $25 limit reached" });

    const { dispatchOneTick } = await import("@/lib/autopilotDispatch");
    const outcome = await dispatchOneTick({ run: baseRun, req: makeReq(), db: mockDb as never });

    expect(outcome.kind).toBe("budget");
    if (outcome.kind === "budget") {
      expect(outcome.api).toBe("openai");
      expect(outcome.reason).toMatch(/25/);
    }
    expect(checkBudgetMock).toHaveBeenCalledWith("openai");
  });

  it("returns { kind: 'done' } when no jobs can be claimed for any stage", async () => {
    // Both stages' circuits closed
    mockDb.queueRpc("engine_is_circuit_open", { data: false, error: null });
    // Budget OK for both APIs
    checkBudgetMock.mockResolvedValue({ ok: true });
    // Claim rpc returns empty for analyze + find-dm
    mockDb.queueRpc("engine_claim_jobs_for_analyze", { data: [], error: null });
    mockDb.queueRpc("engine_claim_jobs_for_dm",      { data: [], error: null });

    const { dispatchOneTick } = await import("@/lib/autopilotDispatch");
    const outcome = await dispatchOneTick({ run: baseRun, req: makeReq(), db: mockDb as never });

    expect(outcome.kind).toBe("done");
  });

  it("respects single-stage runs (find-dm only)", async () => {
    const run = { ...baseRun, stages: ["find-dm"] as ("analyze" | "find-dm")[] };
    mockDb.queueRpc("engine_is_circuit_open", { data: false, error: null });
    checkBudgetMock.mockResolvedValue({ ok: true });
    mockDb.queueRpc("engine_claim_jobs_for_dm", { data: [], error: null });

    const { dispatchOneTick } = await import("@/lib/autopilotDispatch");
    const outcome = await dispatchOneTick({ run, req: makeReq(), db: mockDb as never });

    expect(outcome.kind).toBe("done");
    // checkBudget should only have been called for apollo, not openai
    expect(checkBudgetMock).toHaveBeenCalledTimes(1);
    expect(checkBudgetMock).toHaveBeenCalledWith("apollo");
  });
});
