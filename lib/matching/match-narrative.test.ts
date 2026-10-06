import { describe, expect, it } from "vitest";
import {
  buildCountBasedMatchSummary,
  buildMatchInsightFromComparison,
  fitBandFromScore,
} from "@/lib/matching/match-narrative";

describe("fitBandFromScore", () => {
  it("maps score bands", () => {
    expect(fitBandFromScore(95)).toBe("strong");
    expect(fitBandFromScore(80)).toBe("strong");
    expect(fitBandFromScore(50)).toBe("mixed");
    expect(fitBandFromScore(49)).toBe("weak");
    expect(fitBandFromScore(null)).toBe("unknown");
  });
});

describe("buildMatchInsightFromComparison", () => {
  it("names aligned and differing factors in plain English", () => {
    const insight = buildMatchInsightFromComparison(
      [
        {
          column: 1,
          factorLabel: "Character - Roles",
          jobWord: "Leader",
          candidateWord: "Leader",
          jobWords: ["Leader"],
          candidateWords: ["Leader"],
          aligned: true,
        },
        {
          column: 2,
          factorLabel: "Experience",
          jobWord: "Senior",
          candidateWord: "Junior",
          jobWords: ["Senior"],
          candidateWords: ["Junior"],
          aligned: false,
        },
      ],
      50
    );

    expect(insight).not.toBeNull();
    expect(insight!.fitBand).toBe("mixed");
    expect(insight!.matchedCount).toBe(1);
    expect(insight!.comparableCount).toBe(2);
    expect(insight!.alignedLabels).toEqual(["Character - Roles"]);
    expect(insight!.differLabels).toEqual(["Experience"]);
    expect(insight!.summary).toContain("Aligned on 1 of 2 factors");
    expect(insight!.summary).toContain("Character - Roles");
    expect(insight!.summary).toContain("Differs on Experience");
  });
});

describe("buildCountBasedMatchSummary", () => {
  it("avoids technical equal-weight jargon", () => {
    const summary = buildCountBasedMatchSummary(100, 2, 2, 2);
    expect(summary.match_summary).toContain("Strong fit");
    expect(summary.match_summary).not.toContain("equal column weights");
    expect(summary.strengths[0]).toMatch(/match the job/i);
  });
});
