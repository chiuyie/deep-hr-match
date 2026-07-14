import { describe, expect, it } from "vitest";
import {
  canEditJob,
  canGenerateMatching,
  canOpenMatchingPage,
  canRegenerateMatching,
  canRunMatching,
  canViewMatching,
  editBlockedReason,
  matchingActionLabel,
  matchingRunButtonLabel,
  refreshMatchingWarning,
  runMatchingBlockedReason,
} from "@/lib/employer/job-rules";

describe("job lifecycle rules", () => {
  it("allows editing draft jobs only", () => {
    expect(canEditJob({ status: "draft", hasMatches: false })).toBe(true);
    expect(canEditJob({ status: "active", hasMatches: false })).toBe(false);
    expect(canEditJob({ status: "active", hasMatches: true })).toBe(false);
  });

  it("allows first-time matching on active jobs", () => {
    expect(canGenerateMatching({ status: "active", hasMatches: false })).toBe(true);
    expect(canGenerateMatching({ status: "active", hasMatches: true })).toBe(false);
    expect(canGenerateMatching({ status: "draft", hasMatches: false })).toBe(false);
  });

  it("allows regenerating matching on active jobs with existing results", () => {
    expect(canRegenerateMatching({ status: "active", hasMatches: true })).toBe(true);
    expect(canRegenerateMatching({ status: "active", hasMatches: false })).toBe(false);
    expect(canRegenerateMatching({ status: "closed", hasMatches: true })).toBe(false);
  });

  it("allows run matching when generate or regenerate is possible", () => {
    expect(canRunMatching({ status: "active", hasMatches: false })).toBe(true);
    expect(canRunMatching({ status: "active", hasMatches: true })).toBe(true);
    expect(canRunMatching({ status: "closed", hasMatches: true })).toBe(false);
  });

  it("allows viewing matching when results exist", () => {
    expect(canViewMatching({ status: "active", hasMatches: true })).toBe(true);
    expect(canViewMatching({ status: "closed", hasMatches: true })).toBe(true);
    expect(canViewMatching({ status: "active", hasMatches: false })).toBe(false);
  });

  it("labels list and page actions", () => {
    expect(matchingActionLabel({ status: "active", hasMatches: false })).toBe(
      "Generate Matching"
    );
    expect(matchingActionLabel({ status: "active", hasMatches: true })).toBe("View Matching");
    expect(matchingRunButtonLabel({ status: "active", hasMatches: true })).toBe("Refresh Matches");
  });

  it("explains why edit is blocked for posted jobs", () => {
    expect(editBlockedReason({ status: "draft", hasMatches: false })).toBeNull();
    expect(editBlockedReason({ status: "active", hasMatches: true })).toContain(
      "create a new job"
    );
  });

  it("blocks matching runs on draft and closed jobs", () => {
    expect(runMatchingBlockedReason({ status: "active", hasMatches: false })).toBeNull();
    expect(runMatchingBlockedReason({ status: "draft", hasMatches: false })).toContain("post");
    expect(runMatchingBlockedReason({ status: "closed", hasMatches: true })).toContain("closed");
  });

  it("warns when refreshing with unlocks", () => {
    expect(refreshMatchingWarning({ status: "active", hasMatches: true, hasUnlocks: true })).toContain(
      "unlocked"
    );
  });

  it("opens matching page for active jobs and closed jobs with results", () => {
    expect(canOpenMatchingPage({ status: "draft", hasMatches: false })).toBe(false);
    expect(canOpenMatchingPage({ status: "active", hasMatches: false })).toBe(true);
    expect(canOpenMatchingPage({ status: "active", hasMatches: true })).toBe(true);
    expect(canOpenMatchingPage({ status: "closed", hasMatches: true })).toBe(true);
  });
});
