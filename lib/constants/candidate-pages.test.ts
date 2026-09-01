import { describe, expect, it } from "vitest";
import { getCandidatePageMeta } from "@/lib/constants/candidate-pages";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";

describe("getCandidatePageMeta", () => {
  it("maps overview and setup routes", () => {
    expect(getCandidatePageMeta("/candidate").title).toBe("Dashboard");
    expect(getCandidatePageMeta("/candidate/profile").title).toBe("Profile");
    expect(getCandidatePageMeta("/candidate/cv").title).toBe("CV / Résumé");
    expect(getCandidatePageMeta("/candidate/matrix").title).toBe(FRAMEWORK_MATCHING_LANGUAGE);
    expect(getCandidatePageMeta("/candidate/status").title).toBe("Matching status");
  });

  it("falls back for unknown candidate paths", () => {
    expect(getCandidatePageMeta("/candidate/unknown").title).toBe("Candidate");
  });
});
