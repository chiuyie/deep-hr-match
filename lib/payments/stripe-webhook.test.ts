import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleVerifiedStripeEvent } from "@/lib/payments/stripe-webhook";

const fulfillUnlockPayment = vi.fn();
const revalidatePath = vi.fn();
const captureException = vi.fn();
const captureMessage = vi.fn();

vi.mock("@/lib/payments/fulfill-unlock", () => ({
  fulfillUnlockPayment: (...args: unknown[]) => fulfillUnlockPayment(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/observability/sentry", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
  captureMessage: (...args: unknown[]) => captureMessage(...args),
}));

vi.mock("@/lib/observability/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("handleVerifiedStripeEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ignores non-checkout events", async () => {
    const result = await handleVerifiedStripeEvent(
      { id: "evt_1", type: "payment_intent.succeeded", data: { object: {} } } as never,
      {} as never
    );
    expect(result).toEqual({ ok: true, ignored: true });
    expect(fulfillUnlockPayment).not.toHaveBeenCalled();
  });

  it("rejects checkout.session.completed without unlock metadata", async () => {
    const result = await handleVerifiedStripeEvent(
      {
        id: "evt_2",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test",
            metadata: {},
          },
        },
      } as never,
      {} as never
    );

    expect(result).toEqual({
      ok: false,
      status: 400,
      error: "checkout.session.completed missing unlock metadata",
    });
    expect(captureMessage).toHaveBeenCalled();
    expect(fulfillUnlockPayment).not.toHaveBeenCalled();
  });

  it("fulfills unlocks and revalidates paths on success", async () => {
    fulfillUnlockPayment.mockResolvedValue({});
    const supabase = { from: vi.fn() } as never;

    const result = await handleVerifiedStripeEvent(
      {
        id: "evt_3",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_ok",
            metadata: {
              payment_id: "pay-1",
              employer_id: "emp-1",
              job_id: "job-1",
              candidate_ids: "cand-1,cand-2",
            },
          },
        },
      } as never,
      supabase
    );

    expect(result).toEqual({ ok: true });
    expect(fulfillUnlockPayment).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        paymentId: "pay-1",
        employerId: "emp-1",
        jobId: "job-1",
        candidateIds: ["cand-1", "cand-2"],
        sessionId: "cs_ok",
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/employer/jobs/job-1/matching");
    expect(revalidatePath).toHaveBeenCalledWith("/employer/jobs/job-1/unlocked");
    expect(revalidatePath).toHaveBeenCalledWith("/employer/unlocked");
  });

  it("returns 500 when fulfill fails", async () => {
    fulfillUnlockPayment.mockResolvedValue({ error: "Payment not found" });

    const result = await handleVerifiedStripeEvent(
      {
        id: "evt_4",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_bad",
            metadata: {
              payment_id: "pay-x",
              employer_id: "emp-1",
              job_id: "job-1",
              candidate_ids: "cand-1",
            },
          },
        },
      } as never,
      {} as never
    );

    expect(result).toEqual({
      ok: false,
      status: 500,
      error: "Payment not found",
    });
    expect(captureException).toHaveBeenCalled();
  });
});
