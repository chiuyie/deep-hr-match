import { describe, expect, it } from "vitest";
import { makeFormField } from "@/lib/form-fields/test-fixtures";
import {
  PROFILE_COMPLETION_THRESHOLD,
  groupCandidateProfileFields,
  profileFieldGroupTitle,
} from "@/lib/candidate/profile-sections";

describe("candidate profile sections", () => {
  it("exposes the onboarding completion threshold", () => {
    expect(PROFILE_COMPLETION_THRESHOLD).toBe(60);
  });

  it("groups fields into UI sections", () => {
    const fields = [
      makeFormField({ field_key: "full_name", section: "About you", sort_order: 1 }),
      makeFormField({
        field_key: "work_experience",
        section: "Experience: Work-Life",
        sort_order: 2,
      }),
    ];

    const grouped = groupCandidateProfileFields(fields);
    expect(grouped.some((section) => section.title === "About you")).toBe(true);
    expect(grouped.some((section) => section.title === "Experience: Work-Life")).toBe(true);
  });

  it("maps built-in field keys to section titles", () => {
    expect(profileFieldGroupTitle("full_name")).toBe("About you");
    expect(profileFieldGroupTitle("date_of_birth")).toBe("About you");
    expect(profileFieldGroupTitle("home_address")).toBe("About you");
    expect(profileFieldGroupTitle("languages")).toBe("About you");
    expect(profileFieldGroupTitle("certifications")).toBe("Experience: Work-Life");
    expect(profileFieldGroupTitle("work_experience")).toBe("Experience: Work-Life");
    expect(profileFieldGroupTitle("education_history")).toBe("Experience: Work-Life");
    expect(profileFieldGroupTitle("desired_job_titles")).toBe("Job preferences");
    expect(profileFieldGroupTitle("preferred_locations")).toBe("Job preferences");
    expect(profileFieldGroupTitle("volunteer_experience")).toBe("Experience: Work-Life");
    expect(profileFieldGroupTitle("nationality")).toBe("Matching details");
    expect(profileFieldGroupTitle("age_range")).toBe("Matching details");
    expect(profileFieldGroupTitle("willing_overtime")).toBe("Role requirements");
    expect(profileFieldGroupTitle("driving_licence")).toBe("Role requirements");
  });

  it("orders education, then jobs, then other experience inside Experience: Work-Life", () => {
    const fields = [
      makeFormField({
        field_key: "work_experience",
        section: "Experience: Work-Life",
        sort_order: 1,
      }),
      makeFormField({
        field_key: "skills",
        section: "Experience: Work-Life",
        sort_order: 9,
      }),
      makeFormField({
        field_key: "volunteer_experience",
        section: "Volunteer & extracurricular",
        sort_order: 40,
      }),
      makeFormField({
        field_key: "education_history",
        section: "Experience: Work-Life",
        sort_order: 8,
      }),
    ];

    const section = groupCandidateProfileFields(fields).find(
      (item) => item.title === "Experience: Work-Life"
    );
    expect(section?.fields.map((field) => field.field_key)).toEqual([
      "education_history",
      "work_experience",
      "volunteer_experience",
    ]);
  });

  it("keeps languages with About you and certificates after the timelines", () => {
    const fields = [
      makeFormField({
        field_key: "languages",
        section: "Experience: Work-Life",
        sort_order: 1,
      }),
      makeFormField({
        field_key: "certifications",
        section: "Experience: Work-Life",
        sort_order: 2,
      }),
      makeFormField({
        field_key: "full_name",
        section: "About you",
        sort_order: 20,
      }),
      makeFormField({
        field_key: "date_of_birth",
        section: "About you",
        is_required: false,
        sort_order: 30,
      }),
      makeFormField({
        field_key: "education_history",
        section: "Experience: Work-Life",
        sort_order: 40,
      }),
      makeFormField({
        field_key: "work_experience",
        section: "Experience: Work-Life",
        sort_order: 41,
      }),
      makeFormField({
        field_key: "volunteer_experience",
        section: "Volunteer & extracurricular",
        sort_order: 42,
      }),
    ];

    const grouped = groupCandidateProfileFields(fields);
    const about = grouped.find((section) => section.title === "About you");
    expect(about?.fields.map((field) => field.field_key)).toEqual([
      "full_name",
      "date_of_birth",
      "languages",
    ]);
    expect(about?.fields.find((field) => field.field_key === "date_of_birth")?.is_required).toBe(
      true
    );
    const experience = grouped.find((section) => section.title === "Experience: Work-Life");
    expect(experience?.fields.map((field) => field.field_key)).toEqual([
      "education_history",
      "work_experience",
      "volunteer_experience",
      "certifications",
    ]);
  });
});