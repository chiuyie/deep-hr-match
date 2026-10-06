import { beforeEach, describe, expect, it, vi } from "vitest";

const requireRole = vi.fn();
const getEmployerProfile = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn();
const fulfillUnlockPayment = vi.fn();
const getUnlockedCandidateIds = vi.fn(async () => [] as string[]);
const mockFrom = vi.fn();
const mockCreateClient = vi.fn();
const mockCreateServiceClient = vi.fn();
const checkoutSessionsCreate = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
  getEmployerProfile: (...args: unknown[]) => getEmployerProfile(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
  createServiceClient: () => mockCreateServiceClient(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

vi.mock("@/lib/payments/fulfill-unlock", () => ({
  fulfillUnlockPayment: (...args: unknown[]) => fulfillUnlockPayment(...args),
}));

vi.mock("@/lib/payments/mode", () => ({
  isMockPayments: () => false,
}));

vi.mock("@/lib/auth/unlock", () => ({
  getUnlockedCandidateIds: (...args: unknown[]) => getUnlockedCandidateIds(...args),
}));

vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({
    checkout: { sessions: { create: (...args: unknown[]) => checkoutSessionsCreate(...args) } },
  }),
  getAppUrl: () => "http://localhost:3000",
}));

vi.mock("@/lib/observability/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/observability/sentry", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock("@/lib/form-fields/queries", () => ({
  ensureFormFieldsReady: vi.fn(),
  loadFormFields: vi.fn(async () => []),
}));

vi.mock("@/lib/matching/trigger", () => ({
  triggerMatchRun: vi.fn(),
}));

function createAwaitableChain<T>(result: T) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.select = vi.fn(self);
  chain.eq = vi.fn(self);
  chain.in = vi.fn(self);
  chain.maybeSingle = vi.fn(async () => result);
  chain.single = vi.fn(async () => result);
  chain.insert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn(async () => result),
    })),
  }));
  chain.update = vi.fn(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(async () => ({ error: null })),
    })),
  }));
  chain.then = (onFulfilled: (value: T) => unknown, onRejected?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return chain;
}

describe("createUnlockCheckout stripe path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ id: "user-1", role: "employer" });
    getEmployerProfile.mockResolvedValue({ id: "emp-1" });
    mockCreateClient.mockResolvedValue({ from: mockFrom });
    mockCreateServiceClient.mockResolvedValue({ from: mockFrom });
    redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("creates SGD PayNow/card Checkout session and redirects", async () => {
    const { createUnlockCheckout } = await import("@/lib/employer/actions");

    mockFrom.mockImplementation((table: string) => {
      if (table === "jobs") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data: { id: "job-1" }, error: null })),
              })),
            })),
          })),
        };
      }
      if (table === "match_results") {
        return createAwaitableChain({
          data: [{ candidate_id: "cand-1" }],
          error: null,
        });
      }
      if (table === "payments") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => ({ data: { id: "pay-stripe" }, error: null })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(async () => ({ error: null })),
              })),
            })),
          })),
        };
      }
      return createAwaitableChain({ data: null, error: null });
    });

    checkoutSessionsCreate.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/c/pay/cs_test_123",
    });

    await expect(createUnlockCheckout("job-1", ["cand-1"])).rejects.toThrow("NEXT_REDIRECT");

    expect(checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        payment_method_types: ["paynow", "card"],
        metadata: expect.objectContaining({
          payment_id: "pay-stripe",
          employer_id: "emp-1",
          job_id: "job-1",
          candidate_ids: "cand-1",
        }),
      })
    );
    const lineItem = checkoutSessionsCreate.mock.calls[0][0].line_items[0];
    expect(lineItem.price_data.currency).toBe("sgd");
    expect(lineItem.price_data.unit_amount).toBe(4900);
    expect(redirect).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_test_123");
    expect(fulfillUnlockPayment).not.toHaveBeenCalled();
  });
});
