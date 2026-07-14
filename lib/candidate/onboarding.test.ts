import { describe, expect, it } from "vitest";
import {
  getAllowedOnboardingPaths,
  getOnboardingPath,
  getOnboardingStep,
  isOnboardingChecklistComplete,
  isOnboardingPathAllowed,
  type CandidateOnboardingState,
} from "@/lib/candidate/onboarding";

describe("getOnboardingStep", () => {
  it("requires profile when completion is below 60%", () => {
    expect(
      getOnboardingStep({ completionPercentage: 0, hasCv: false, hasMatrix: false })
    ).toBe("profile");
    expect(
      getOnboardingStep({ completionPercentage: 59, hasCv: true, hasMatrix: true })
    ).toBe("profile");
  });

  it("requires CV after profile threshold", () => {
    expect(
      getOnboardingStep({ completionPercentage: 60, hasCv: false, hasMatrix: false })
    ).toBe("cv");
  });

  it("requires matrix after CV", () => {
    expect(
      getOnboardingStep({ completionPercentage: 80, hasCv: true, hasMatrix: false })
    ).toBe("matrix");
  });

  it("marks done when all steps complete", () => {
    expect(
      getOnboardingStep({ completionPercentage: 100, hasCv: true, hasMatrix: true })
    ).toBe("done");
  });
});

describe("getOnboardingPath", () => {
  it("maps each step to the correct route", () => {
    expect(getOnboardingPath("profile")).toBe("/candidate/profile");
    expect(getOnboardingPath("cv")).toBe("/candidate/cv");
    expect(getOnboardingPath("matrix")).toBe("/candidate/matrix");
    expect(getOnboardingPath("done")).toBe("/candidate");
  });
});

describe("isOnboardingPathAllowed", () => {
  it("restricts profile step to profile page only", () => {
    expect(isOnboardingPathAllowed("/candidate/profile", "profile")).toBe(true);
    expect(isOnboardingPathAllowed("/candidate/cv", "profile")).toBe(false);
  });

  it("allows cumulative paths as onboarding progresses", () => {
    expect(isOnboardingPathAllowed("/candidate/cv", "cv")).toBe(true);
    expect(isOnboardingPathAllowed("/candidate/profile", "cv")).toBe(true);
    expect(isOnboardingPathAllowed("/candidate/matrix", "cv")).toBe(false);
  });

  it("allows any path when onboarding is done", () => {
    expect(isOnboardingPathAllowed("/candidate/status", "done")).toBe(true);
    expect(isOnboardingPathAllowed("/any/path", "done")).toBe(true);
  });
});

describe("getAllowedOnboardingPaths", () => {
  it("expands allowed routes at each step", () => {
    expect(getAllowedOnboardingPaths("profile")).toEqual(["/candidate/profile"]);
    expect(getAllowedOnboardingPaths("matrix")).toContain("/candidate/matrix");
    expect(getAllowedOnboardingPaths("done")).toContain("/candidate/status");
  });
});

describe("isOnboardingChecklistComplete", () => {
  it("is false until all requirements met", () => {
    const incomplete: CandidateOnboardingState = {
      completionPercentage: 100,
      hasCv: true,
      hasMatrix: false,
    };
    expect(isOnboardingChecklistComplete(incomplete)).toBe(false);
  });

  it("is true when step is done", () => {
    expect(
      isOnboardingChecklistComplete({
        completionPercentage: 100,
        hasCv: true,
        hasMatrix: true,
      })
    ).toBe(true);
  });
});
