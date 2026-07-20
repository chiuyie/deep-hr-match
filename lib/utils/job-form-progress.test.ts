import { describe, expect, it } from "vitest";
import {
  getJobFormSectionsProgress,
  getSectionFillStats,
  isSectionComplete,
  validateJobFormSection,
} from "@/lib/utils/job-form-progress";
import { JOB_FORM_NO_FILTER_VALUE } from "@/lib/constants/job-form";

describe("job-form-progress", () => {
  it("tracks section fill stats without counting default no-filter values", () => {
    const values = {
      job_title: "Engineer",
      required_age: JOB_FORM_NO_FILTER_VALUE,
      benefits_package: ["Medical Insurance"],
    };

    expect(getSectionFillStats(values, "job-identification").filled).toBe(1);
    expect(getSectionFillStats(values, "basic-information").filled).toBe(0);
  });

  it("marks role basics complete when title and description exist", () => {
    const values = { job_title: "Role", job_description: "Desc" };
    expect(isSectionComplete(values, "job-identification", 0, 0)).toBe(true);
  });

  it("validates role basics and FAQ sections", () => {
    expect(validateJobFormSection({}, "job-identification").ok).toBe(false);
    expect(
      validateJobFormSection(
        { job_title: "Role", job_description: "Details" },
        "job-identification"
      ).ok
    ).toBe(true);
    expect(validateJobFormSection({}, "background-information-questions").ok).toBe(false);
  });

  it("reports section-based workflow progress", () => {
    const values = {
      job_title: "Engineer",
      job_description: "Build things",
      faq_work_life_balance: true,
    };
    const progress = getJobFormSectionsProgress(values, 2);
    expect(progress.total).toBe(6);
    expect(progress.completed).toBeGreaterThanOrEqual(1);
  });
});
