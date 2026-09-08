import { describe, expect, it, vi } from "vitest";
import { fulfillUnlockPayment } from "@/lib/payments/fulfill-unlock";

describe("fulfillUnlockPayment", () => {
  it("rejects when metadata employer/job do not match the payment row", async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "payments") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: {
                    id: "pay-1",
                    employer_id: "emp-1",
                    job_id: "job-1",
                    selected_candidate_ids: ["c1"],
                    status: "pending",
                  },
                  error: null,
                })),
              })),
            })),
            update: vi.fn(),
          };
        }
        return { upsert };
      }),
    };

    const result = await fulfillUnlockPayment(supabase as never, {
      paymentId: "pay-1",
      employerId: "emp-OTHER",
      jobId: "job-1",
      candidateIds: ["c1"],
      sessionId: "cs_test",
    });

    expect(result.error).toMatch(/does not match/i);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects when candidate list does not match the payment row", async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "payments") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: {
                    id: "pay-1",
                    employer_id: "emp-1",
                    job_id: "job-1",
                    selected_candidate_ids: ["c1", "c2"],
                    status: "pending",
                  },
                  error: null,
                })),
              })),
            })),
            update: vi.fn(),
          };
        }
        return { upsert };
      }),
    };

    const result = await fulfillUnlockPayment(supabase as never, {
      paymentId: "pay-1",
      employerId: "emp-1",
      jobId: "job-1",
      candidateIds: ["c1"],
      sessionId: "cs_test",
    });

    expect(result.error).toMatch(/candidate list/i);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("marks paid and upserts unlocks when metadata matches the payment row", async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    const eqJob = vi.fn(async () => ({ error: null }));
    const eqEmployer = vi.fn(() => ({ eq: eqJob }));
    const eqId = vi.fn(() => ({ eq: eqEmployer }));

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "payments") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: {
                    id: "pay-1",
                    employer_id: "emp-1",
                    job_id: "job-1",
                    selected_candidate_ids: ["c2", "c1"],
                    status: "pending",
                  },
                  error: null,
                })),
              })),
            })),
            update: vi.fn(() => ({ eq: eqId })),
          };
        }
        return { upsert };
      }),
    };

    const result = await fulfillUnlockPayment(supabase as never, {
      paymentId: "pay-1",
      employerId: "emp-1",
      jobId: "job-1",
      candidateIds: ["c1", "c2"],
      sessionId: "cs_test",
    });

    expect(result).toEqual({});
    expect(upsert).toHaveBeenCalledWith(
      [
        {
          employer_id: "emp-1",
          job_id: "job-1",
          candidate_id: "c2",
          payment_id: "pay-1",
        },
        {
          employer_id: "emp-1",
          job_id: "job-1",
          candidate_id: "c1",
          payment_id: "pay-1",
        },
      ],
      expect.objectContaining({ onConflict: "employer_id,job_id,candidate_id" })
    );
  });
});
