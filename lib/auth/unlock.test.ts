import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFrom = vi.fn();
const mockCreateClient = vi.fn();
const mockCreateServiceClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
  createServiceClient: () => mockCreateServiceClient(),
}));

import {
  getUnlockedCandidateIds,
  hasCandidateUnlock,
} from "@/lib/auth/unlock";

function unlockQuery(result: { data: unknown; error: null }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(async () => result);
  chain.then = (onFulfilled: (value: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled);
  return chain;
}

describe("unlock helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue({ from: mockFrom });
    mockCreateServiceClient.mockRejectedValue(new Error("no service"));
  });

  it("hasCandidateUnlock returns true when unlock row exists", async () => {
    mockFrom.mockImplementation(() =>
      unlockQuery({ data: { id: "u1" }, error: null })
    );
    await expect(hasCandidateUnlock("emp-1", "job-1", "cand-1")).resolves.toBe(true);
  });

  it("hasCandidateUnlock returns false when unlock row is missing", async () => {
    mockFrom.mockImplementation(() => unlockQuery({ data: null, error: null }));
    await expect(hasCandidateUnlock("emp-1", "job-1", "cand-1")).resolves.toBe(false);
  });

  it("getUnlockedCandidateIds maps candidate ids for the job", async () => {
    mockFrom.mockImplementation(() =>
      unlockQuery({
        data: [{ candidate_id: "cand-1" }, { candidate_id: "cand-2" }],
        error: null,
      })
    );
    await expect(getUnlockedCandidateIds("emp-1", "job-1")).resolves.toEqual([
      "cand-1",
      "cand-2",
    ]);
  });
});
