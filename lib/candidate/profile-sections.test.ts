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
        field_key: "current_job_title",
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
    expect(profileFieldGroupTitle("skills")).toBe("Experience: Work-Life");
    expect(profileFieldGroupTitle("nationality")).toBe("Matching details");
    expect(profileFieldGroupTitle("age_range")).toBe("Matching details");
    expect(profileFieldGroupTitle("willing_overtime")).toBe("Role requirements");
    expect(profileFieldGroupTitle("driving_licence")).toBe("Role requirements");
  });
});
