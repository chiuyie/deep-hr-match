/**
 * Integration-style coverage of the mock unlock happy path:
 * pending payment → fulfill → unlocks visible to ensure/checkout wait.
 */
import { describe, expect, it, vi } from "vitest";
import { fulfillUnlockPayment } from "@/lib/payments/fulfill-unlock";
import { ensureUnlocksForCheckoutSession } from "@/lib/payments/ensure-checkout-unlocks";

vi.mock("@/lib/observability/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/observability/sentry", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(async () => {
    throw new Error("use fallback client");
  }),
}));

describe("mock unlock flow integration", () => {
  it("fulfills a pending payment and ensure reports ready", async () => {
    const payment = {
      id: "pay-1",
      employer_id: "emp-1",
      job_id: "job-1",
      selected_candidate_ids: ["cand-1"],
      status: "pending",
    };

    let unlockRows: Array<{ candidate_id: string }> = [];
    let paymentStatus = "pending";

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "payments") {
          return {
            select: vi.fn(() => {
              const chain: Record<string, unknown> = {};
              chain.eq = vi.fn(() => chain);
              chain.maybeSingle = vi.fn(async () => ({
                data: { ...payment, status: paymentStatus },
                error: null,
              }));
              return chain;
            }),
            update: vi.fn(() => {
              const chain: Record<string, unknown> = {};
              chain.eq = vi.fn(() => chain);
              Object.assign(chain, {
                then: (onFulfilled: (value: unknown) => unknown) => {
                  paymentStatus = "paid";
                  return Promise.resolve({ error: null }).then(onFulfilled);
                },
              });
              return chain;
            }),
          };
        }
        if (table === "unlocks") {
          return {
            upsert: vi.fn(async () => {
              unlockRows = [{ candidate_id: "cand-1" }];
              return { error: null };
            }),
            select: vi.fn(() => {
              const chain: Record<string, unknown> = {};
              chain.eq = vi.fn(() => chain);
              Object.assign(chain, {
                then: (onFulfilled: (value: unknown) => unknown) =>
                  Promise.resolve({ data: unlockRows, error: null }).then(onFulfilled),
              });
              return chain;
            }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    };

    const fulfilled = await fulfillUnlockPayment(supabase as never, {
      paymentId: "pay-1",
      employerId: "emp-1",
      jobId: "job-1",
      candidateIds: ["cand-1"],
      sessionId: "mock_pay-1",
    });
    expect(fulfilled).toEqual({});
    expect(paymentStatus).toBe("paid");
    expect(unlockRows).toEqual([{ candidate_id: "cand-1" }]);

    const ensured = await ensureUnlocksForCheckoutSession(supabase as never, {
      employerId: "emp-1",
      jobId: "job-1",
      sessionId: "mock_pay-1",
      candidateId: "cand-1",
      attempts: 1,
      delayMs: 0,
    });

    expect(ensured).toEqual({ ready: true, unlockCount: 1 });
  });
});
