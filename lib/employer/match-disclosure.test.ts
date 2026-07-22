import { describe, expect, it } from "vitest";
import {
  buildAnonymousPreviewFields,
  getAnonymousMatchVisibleFields,
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
});
