import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureUnlocksForCheckoutSession } from "@/lib/payments/ensure-checkout-unlocks";

const fulfillUnlockPayment = vi.fn();
const getStripe = vi.fn();

vi.mock("@/lib/payments/fulfill-unlock", () => ({
  fulfillUnlockPayment: (...args: unknown[]) => fulfillUnlockPayment(...args),
}));

vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => getStripe(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(async () => {
    throw new Error("service role unavailable in unit test");
  }),
}));

function createMockSupabase(handlers: Record<string, unknown>) {
  return {
    from: vi.fn((table: string) => handlers[table]),
  } as never;
}

describe("ensureUnlocksForCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not ready for empty session id", async () => {
    const result = await ensureUnlocksForCheckoutSession(createMockSupabase({}), {
      employerId: "emp-1",
      jobId: "job-1",
      sessionId: "   ",
    });
    expect(result).toEqual({ ready: false, unlockCount: 0 });
  });

  it("fulfills mock checkout when payment is still pending, then reports ready", async () => {
    const unlockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(async () => ({ data: [{ candidate_id: "cand-1" }], error: null })),
      })),
    }));

    const supabase = createMockSupabase({
      payments: {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: {
                    id: "pay-1",
                    status: "pending",
                    selected_candidate_ids: ["cand-1"],
                  },
                  error: null,
                })),
              })),
            })),
          })),
        })),
      },
      unlocks: {
        select: unlockSelect,
      },
    });

    fulfillUnlockPayment.mockResolvedValue({ error: null });

    const result = await ensureUnlocksForCheckoutSession(supabase, {
      employerId: "emp-1",
      jobId: "job-1",
      sessionId: "mock_pay-1",
      attempts: 1,
      delayMs: 0,
    });

    expect(fulfillUnlockPayment).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        paymentId: "pay-1",
        candidateIds: ["cand-1"],
        sessionId: "mock_pay-1",
      })
    );
    expect(result).toEqual({ ready: true, unlockCount: 1 });
  });

  it("retrieves Stripe session and fulfills when webhook has not landed", async () => {
    getStripe.mockReturnValue({
      checkout: {
        sessions: {
          retrieve: vi.fn(async () => ({
            payment_status: "paid",
            status: "complete",
            metadata: { candidate_ids: "cand-2" },
          })),
        },
      },
    });

    const unlockQuery = {
      eq: vi.fn(),
    };
    unlockQuery.eq.mockImplementation(() => unlockQuery);
    // Final awaited query result
    (unlockQuery as { then?: unknown }).then = undefined;
    const unlockSelect = vi.fn(() => {
      const chain: Record<string, unknown> = {};
      chain.eq = vi.fn(() => chain);
      Object.assign(chain, {
        then: (onFulfilled: (value: unknown) => unknown) =>
          Promise.resolve({ data: [{ candidate_id: "cand-2" }], error: null }).then(onFulfilled),
      });
      return chain;
    });

    const paymentsSelect = vi.fn(() => {
      const chain: Record<string, unknown> = {};
      chain.eq = vi.fn(() => chain);
      chain.maybeSingle = vi.fn(async () => ({
        data: {
          id: "pay-2",
          status: "pending",
          selected_candidate_ids: ["cand-2"],
          stripe_session_id: "cs_test_1",
        },
        error: null,
      }));
      return chain;
    });

    const supabase = createMockSupabase({
      payments: { select: paymentsSelect },
      unlocks: { select: unlockSelect },
    });

    fulfillUnlockPayment.mockResolvedValue({ error: null });

    const result = await ensureUnlocksForCheckoutSession(supabase, {
      employerId: "emp-1",
      jobId: "job-1",
      sessionId: "cs_test_1",
      candidateId: "cand-2",
      attempts: 1,
      delayMs: 0,
    });

    expect(fulfillUnlockPayment).toHaveBeenCalled();
    expect(result.ready).toBe(true);
    expect(result.unlockCount).toBe(1);
  });
});
