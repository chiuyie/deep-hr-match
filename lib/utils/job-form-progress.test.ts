import { describe, expect, it } from "vitest";
import {
  getJobFormSectionsProgress,
  getSectionFillStats,
  isSectionComplete,
  validateJobFormForSubmit,
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

  it("requires explicit elimination filter choices", () => {
    expect(validateJobFormSection({}, "basic-information").ok).toBe(false);
    expect(
      validateJobFormSection(
        { required_age: JOB_FORM_NO_FILTER_VALUE },
        "basic-information"
      ).ok
    ).toBe(false);
  });

  it("validates compensation range on submit", () => {
    expect(
      validateJobFormForSubmit({
        job_title: "Role",
        job_description: "Details",
        required_age: JOB_FORM_NO_FILTER_VALUE,
        required_availability: JOB_FORM_NO_FILTER_VALUE,
        required_employment_eligibility_visa: JOB_FORM_NO_FILTER_VALUE,
        required_ethnicity: JOB_FORM_NO_FILTER_VALUE,
        required_gender: JOB_FORM_NO_FILTER_VALUE,
        required_race: JOB_FORM_NO_FILTER_VALUE,
        required_religion: JOB_FORM_NO_FILTER_VALUE,
        required_birth_country: JOB_FORM_NO_FILTER_VALUE,
        required_current_country: JOB_FORM_NO_FILTER_VALUE,
        required_current_city: JOB_FORM_NO_FILTER_VALUE,
        required_months_in_current_country: JOB_FORM_NO_FILTER_VALUE,
        required_dialect: JOB_FORM_NO_FILTER_VALUE,
        required_height: JOB_FORM_NO_FILTER_VALUE,
        required_weight: JOB_FORM_NO_FILTER_VALUE,
        required_fitness_level: JOB_FORM_NO_FILTER_VALUE,
        required_nationality: JOB_FORM_NO_FILTER_VALUE,
        required_work_arrangement: JOB_FORM_NO_FILTER_VALUE,
        faq_work_life_balance: true,
        faq_driving_licence: false,
        faq_car_ownership: false,
        faq_willing_overtime: true,
        faq_need_disability_support: true,
        faq_willing_relocate: false,
        faq_willing_background_check: true,
        desired_minimum_salary: "9000",
        desired_maximum_salary: "5000",
      }).ok
    ).toBe(false);
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
