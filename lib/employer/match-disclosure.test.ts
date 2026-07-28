import { describe, expect, it } from "vitest";
import {
  buildAnonymousPreviewFields,
  defaultShowOnAnonymousMatch,
  formatCandidateFieldValue,
  getAnonymousMatchVisibleFields,
  getCandidateFieldDisplayValue,
  getUnlockedVisibleFields,
  isUnlockedContactFieldVisible,
} from "@/lib/employer/match-disclosure";
import { makeFormField } from "@/lib/form-fields/test-fixtures";

describe("match disclosure helpers", () => {
  const fields = [
    makeFormField({
      field_key: "years_of_experience",
      label: "Years of Experience",
      show_on_anonymous_match: true,
      employer_disclosure_mode: "always_visible",
    }),
    makeFormField({
      field_key: "email",
      label: "Email",
      show_on_anonymous_match: false,
      employer_disclosure_mode: "admin_removed",
    }),
    makeFormField({
      field_key: "skills",
      label: "Skills",
      show_on_anonymous_match: true,
      employer_disclosure_mode: "candidate_optional",
    }),
  ];

  it("limits anonymous ranking fields to show_on_anonymous_match", () => {
    expect(getAnonymousMatchVisibleFields(fields).map((field) => field.field_key)).toEqual([
      "years_of_experience",
      "skills",
    ]);
  });

  it("hides admin_removed fields from unlocked reports", () => {
    expect(getUnlockedVisibleFields(fields).map((field) => field.field_key)).toEqual([
      "years_of_experience",
      "skills",
    ]);
    expect(isUnlockedContactFieldVisible(fields, "email")).toBe(false);
  });

  it("builds anonymous preview values from the profile", () => {
    expect(
      buildAnonymousPreviewFields(fields, {
        years_of_experience: 4,
        skills: ["React", "SQL"],
        email: "hidden@example.com",
      })
    ).toEqual([
      { key: "years_of_experience", label: "Years of Experience", value: "4" },
      { key: "skills", label: "Skills", value: "React, SQL" },
    ]);
  });

  it("formats arrays, booleans, and language entries", () => {
    expect(formatCandidateFieldValue(["React", "SQL"])).toBe("React, SQL");
    expect(formatCandidateFieldValue(true)).toBe("Yes");
    expect(formatCandidateFieldValue(false)).toBe("No");
    expect(
      formatCandidateFieldValue([{ language: "English", proficiency: "Fluent" }])
    ).toBe("English (Fluent)");
    expect(formatCandidateFieldValue("")).toBeNull();
  });

  it("reads built-in and custom profile values for display", () => {
    const customField = makeFormField({
      field_key: "portfolio",
      label: "Portfolio",
      is_custom: true,
      show_on_anonymous_match: true,
    });
    expect(
      getCandidateFieldDisplayValue(customField, {
        custom_fields: { portfolio: "https://example.com" },
      })
    ).toBe("https://example.com");
  });

  it("defaults anonymous visibility for common candidate fields", () => {
    expect(defaultShowOnAnonymousMatch("skills")).toBe(true);
    expect(defaultShowOnAnonymousMatch("full_name")).toBe(false);
  });
});
