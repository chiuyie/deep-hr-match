import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createUnlockCheckout,
  generateMatchingResults,
  saveJob,
} from "@/lib/employer/actions";

const requireRole = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn();
const triggerMatchRun = vi.fn();
const fulfillUnlockPayment = vi.fn();
const ensureFormFieldsReady = vi.fn();
const loadFormFields = vi.fn();
const mockFrom = vi.fn();
const mockStorageFrom = vi.fn();
const mockCreateClient = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireRole: (...args: unknown[]) => requireRole(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

vi.mock("@/lib/matching/trigger", () => ({
  triggerMatchRun: (...args: unknown[]) => triggerMatchRun(...args),
}));

vi.mock("@/lib/payments/fulfill-unlock", () => ({
  fulfillUnlockPayment: (...args: unknown[]) => fulfillUnlockPayment(...args),
}));

vi.mock("@/lib/payments/mode", () => ({
  isMockPayments: () => true,
}));

vi.mock("@/lib/form-fields/queries", () => ({
  ensureFormFieldsReady: () => ensureFormFieldsReady(),
  loadFormFields: (...args: unknown[]) => loadFormFields(...args),
}));

function createAwaitableChain<T>(result: T) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.select = vi.fn(self);
  chain.eq = vi.fn(self);
  chain.gte = vi.fn(self);
  chain.not = vi.fn(self);
  chain.single = vi.fn(async () => result);
  chain.insert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn(async () => result),
    })),
  }));
  chain.update = vi.fn(() => ({
    eq: vi.fn(async () => result),
  }));
  chain.upsert = vi.fn(async () => result);
  chain.then = (onFulfilled: (value: T) => unknown, onRejected?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return chain;
}

describe("employer actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ id: "user-1", role: "employer" });
    ensureFormFieldsReady.mockResolvedValue(undefined);
    loadFormFields.mockResolvedValue([
      {
        field_key: "job_title",
        label: "Job Title",
        section: "Role basics",
        field_type: "text",
        is_required: true,
        is_active: true,
        is_custom: false,
        audience: "employer",
        form_group: "job",
        sort_order: 1,
      },
    ]);
    mockCreateClient.mockResolvedValue({
      from: mockFrom,
      storage: { from: mockStorageFrom },
    });
    redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  describe("createUnlockCheckout", () => {
    it("requires at least one candidate", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "employer_profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({ data: { id: "emp-1" }, error: null })),
              })),
            })),
          };
        }
        return createAwaitableChain({ data: null, error: null });
      });

      const result = await createUnlockCheckout("job-1", []);
      expect(result).toEqual({ error: "Select at least one candidate" });
    });

    it("fulfills mock payments and redirects to unlocked profile", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "employer_profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({ data: { id: "emp-1" }, error: null })),
              })),
            })),
          };
        }
        if (table === "payments") {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => ({ data: { id: "pay-1" }, error: null })),
              })),
            })),
          };
        }
        return createAwaitableChain({ data: null, error: null });
      });
      fulfillUnlockPayment.mockResolvedValue({ error: null });

      await expect(createUnlockCheckout("job-1", ["cand-1"])).rejects.toThrow("NEXT_REDIRECT");
      expect(fulfillUnlockPayment).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith(
        "/employer/jobs/job-1/unlocked/cand-1?session_id=mock_pay-1&mock=1"
      );
    });
  });

  describe("saveJob", () => {
    it("blocks editing a published job", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "employer_profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({ data: { id: "emp-1" }, error: null })),
              })),
            })),
          };
        }
        if (table === "jobs") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(async () => ({ data: { status: "active" }, error: null })),
                })),
              })),
            })),
          };
        }
        if (table === "matrix_categories") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(async () => ({ data: [], error: null })),
              })),
            })),
          };
        }
        return createAwaitableChain({ data: null, error: null });
      });

      const formData = new FormData();
      formData.set("job_title", "Updated title");
      formData.set("status", "draft");

      await expect(saveJob(formData, "job-1")).rejects.toThrow(
        "Published jobs cannot be edited"
      );
    });
  });

  describe("generateMatchingResults", () => {
    it("requires matrix answers before matching", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "employer_profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({ data: { id: "emp-1" }, error: null })),
              })),
            })),
          };
        }
        if (table === "jobs") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(async () => ({ data: { status: "active" }, error: null })),
                })),
              })),
            })),
          };
        }
        if (table === "job_matrix_answers") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  not: vi.fn(async () => ({ count: 0, data: null, error: null })),
                })),
              })),
            })),
          };
        }
        if (table === "match_results") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(async () => ({ count: 0, data: null, error: null })),
            })),
          };
        }
        return createAwaitableChain({ data: null, error: null });
      });

      await expect(generateMatchingResults("job-1")).rejects.toThrow(
        "Complete the"
      );
    });

    it("blocks matching on draft jobs", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "employer_profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({ data: { id: "emp-1" }, error: null })),
              })),
            })),
          };
        }
        if (table === "jobs") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(async () => ({ data: { status: "draft" }, error: null })),
                })),
              })),
            })),
          };
        }
        if (table === "job_matrix_answers") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  not: vi.fn(async () => ({ count: 3, data: null, error: null })),
                })),
              })),
            })),
          };
        }
        if (table === "match_results") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(async () => ({ count: 0, data: null, error: null })),
            })),
          };
        }
        return createAwaitableChain({ data: null, error: null });
      });

      await expect(generateMatchingResults("job-1")).rejects.toThrow("post");
    });
  });
});
