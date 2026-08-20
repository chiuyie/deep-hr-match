import { describe, expect, it } from "vitest";
import { JOB_FORM_NO_FILTER_VALUE } from "@/lib/constants/job-form";
import {
  candidateFailsJobFilter,
  candidatePassesJobFilters,
  filterCandidatesForJob,
  isInactiveJobFilter,
} from "@/lib/matching/job-filters";

describe("job matching filters", () => {
  it("treats empty and No preference as inactive", () => {
    expect(isInactiveJobFilter(null)).toBe(true);
    expect(isInactiveJobFilter("")).toBe(true);
    expect(isInactiveJobFilter(JOB_FORM_NO_FILTER_VALUE)).toBe(true);
    expect(isInactiveJobFilter("Singapore")).toBe(false);
  });

  it("passes everyone when no filters are set", () => {
    expect(
      candidatePassesJobFilters(
        { form_data: { required_nationality: JOB_FORM_NO_FILTER_VALUE } },
        { id: "c1" }
      )
    ).toBe(true);
  });

  it("filters on matching-filter exact attributes", () => {
    const job = {
      form_data: {
        required_nationality: "Singaporean",
        required_work_arrangement: "Hybrid",
      },
    };

    expect(
      candidatePassesJobFilters(job, {
        custom_fields: { nationality: "Singaporean" },
        work_arrangement_preference: "Hybrid",
      })
    ).toBe(true);

    expect(
      candidateFailsJobFilter(job, {
        custom_fields: { nationality: "Malaysian" },
        work_arrangement_preference: "Hybrid",
      })
    ).toBe("required_nationality");
  });

  it("excludes nationalities listed in not_required_nationality", () => {
    const job = { form_data: { not_required_nationality: "Malaysian" } };
    expect(
      candidatePassesJobFilters(job, { custom_fields: { nationality: "Singaporean" } })
    ).toBe(true);
    expect(
      candidateFailsJobFilter(job, { custom_fields: { nationality: "Malaysian" } })
    ).toBe("not_required_nationality");
  });

  it("requires candidate availability to be as soon as or sooner than the job", () => {
    const job = { form_data: { required_availability: "2 weeks" } };
    expect(candidatePassesJobFilters(job, { availability: "Immediate" })).toBe(true);
    expect(candidatePassesJobFilters(job, { availability: "2 weeks" })).toBe(true);
    expect(candidateFailsJobFilter(job, { availability: "1 month" })).toBe(
      "required_availability"
    );
  });

  it("requires all selected job languages", () => {
    const job = { form_data: { language_needs: ["English", "Mandarin"] } };
    expect(
      candidatePassesJobFilters(job, {
        languages: [
          { language: "English", proficiency: "Fluent" },
          { language: "Mandarin", proficiency: "Conversational" },
        ],
      })
    ).toBe(true);
    expect(
      candidateFailsJobFilter(job, {
        languages: [{ language: "English", proficiency: "Fluent" }],
      })
    ).toBe("language_needs");
  });

  it("filters matching attributes from candidate custom_fields", () => {
    const job = {
      form_data: {
        required_nationality: "Singaporean",
        required_age: "26-30",
        required_employment_eligibility_visa: "Employment Pass",
      },
    };

    expect(
      candidatePassesJobFilters(job, {
        custom_fields: {
          nationality: "Singaporean",
          age_range: "26-30",
          employment_eligibility_visa: "Employment Pass",
        },
      })
    ).toBe(true);

    expect(
      candidateFailsJobFilter(job, {
        custom_fields: {
          nationality: "Malaysian",
          age_range: "26-30",
          employment_eligibility_visa: "Employment Pass",
        },
      })
    ).toBe("required_nationality");

    expect(
      candidateFailsJobFilter(job, {
        custom_fields: {
          nationality: "Singaporean",
          employment_eligibility_visa: "Employment Pass",
        },
      })
    ).toBe("required_age");
  });

  it("applies Yes role-requirement FAQs and ignores job-description FAQs", () => {
    const job = {
      form_data: {
        faq_driving_licence: true,
        faq_work_outside_standard_hours: true,
        faq_accessibility_arrangements_required: true,
        faq_willing_overtime: false,
      },
    };

    expect(
      candidatePassesJobFilters(job, {
        custom_fields: {
          driving_licence: true,
          work_outside_standard_hours: true,
          accessibility_arrangements_required: true,
        },
      })
    ).toBe(true);

    expect(
      candidateFailsJobFilter(job, {
        custom_fields: {
          driving_licence: false,
          work_outside_standard_hours: true,
          accessibility_arrangements_required: true,
        },
      })
    ).toBe("faq_driving_licence");
  });

  it("drops candidates who miss any active filter before scoring", () => {
    const kept = filterCandidatesForJob(
      { form_data: { required_current_country: "Singapore" } },
      [
        { id: "keep", country: "Singapore" },
        { id: "drop", country: "Malaysia" },
      ]
    );
    expect(kept.map((row) => row.id)).toEqual(["keep"]);
  });
});
