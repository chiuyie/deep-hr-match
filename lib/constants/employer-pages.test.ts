import { describe, expect, it } from "vitest";
import { getEmployerPageMeta } from "@/lib/constants/employer-pages";

describe("getEmployerPageMeta", () => {
  it("maps dashboard and profile routes", () => {
    expect(getEmployerPageMeta("/employer").title).toBe("Employer Dashboard");
    expect(getEmployerPageMeta("/employer/profile").title).toBe("Employer Profile");
  });

  it("maps jobs list and creation routes", () => {
    expect(getEmployerPageMeta("/employer/jobs").title).toBe("Jobs");
    expect(getEmployerPageMeta("/employer/jobs/new").title).toBe("Post a Job");
  });

  it("maps per-job workflow routes", () => {
    const jobId = "abc-123";
    expect(getEmployerPageMeta(`/employer/jobs/${jobId}`).title).toBe("Edit Job");
    expect(getEmployerPageMeta(`/employer/jobs/${jobId}/view`).title).toBe("View Job");
    expect(getEmployerPageMeta(`/employer/jobs/${jobId}/matching`).title).toBe(
      "Matching Results"
    );
    expect(getEmployerPageMeta(`/employer/jobs/${jobId}/jd`).title).toBe("JD Upload");
    expect(getEmployerPageMeta(`/employer/jobs/${jobId}/matrix`).title).toContain("Form");
    expect(getEmployerPageMeta(`/employer/jobs/${jobId}/unlocked`).title).toBe(
      "Unlocked Candidates"
    );
  });

  it("maps global unlocked index", () => {
    expect(getEmployerPageMeta("/employer/unlocked").title).toBe("Unlocked Candidates");
  });

  it("falls back for unknown employer paths", () => {
    expect(getEmployerPageMeta("/employer/unknown")).toEqual({
      title: "Employer",
      contentClassName: expect.any(String),
    });
  });
});
