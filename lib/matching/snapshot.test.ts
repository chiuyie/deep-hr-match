import { describe, expect, it } from "vitest";
import {
  getSnapshotGeneratedAt,
  newCandidatesNotice,
} from "@/lib/matching/snapshot";

describe("match snapshot helpers", () => {
  it("returns null when no results exist", () => {
    expect(getSnapshotGeneratedAt([])).toBeNull();
  });

  it("reads generated_at from the first result row", () => {
    expect(
      getSnapshotGeneratedAt([
        { generated_at: "2026-07-14T06:00:00.000Z" },
        { generated_at: "2026-07-14T06:00:00.000Z" },
      ])
    ).toBe("2026-07-14T06:00:00.000Z");
  });

  it("describes new candidates for refresh prompts", () => {
    expect(newCandidatesNotice(0)).toBeNull();
    expect(newCandidatesNotice(1)).toContain("1 new candidate");
    expect(newCandidatesNotice(3)).toContain("3 new candidates");
  });
});
