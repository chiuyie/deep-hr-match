import { describe, expect, it } from "vitest";
import { foldCandidateCustomStoredFields } from "@/lib/form-fields/validate-dynamic";

describe("foldCandidateCustomStoredFields", () => {
  it("moves role-requirement and matching-attribute answers into custom_fields", () => {
    const result = foldCandidateCustomStoredFields({
      full_name: "Alex",
      willing_overtime: "Yes",
      driving_licence: "No",
      nationality: "Singaporean",
      age_range: "26-30",
      custom_fields: { portfolio: "https://example.com" },
    });

    expect(result.full_name).toBe("Alex");
    expect(result.willing_overtime).toBeUndefined();
    expect(result.driving_licence).toBeUndefined();
    expect(result.nationality).toBeUndefined();
    expect(result.age_range).toBeUndefined();
    expect(result.custom_fields).toEqual({
      portfolio: "https://example.com",
      willing_overtime: "Yes",
      driving_licence: "No",
      nationality: "Singaporean",
      age_range: "26-30",
    });
  });

  it("skips blank answers", () => {
    const result = foldCandidateCustomStoredFields({
      willing_relocate: "  ",
      nationality: "",
      custom_fields: {},
    });
    expect(result.custom_fields).toEqual({});
    expect(result.willing_relocate).toBeUndefined();
    expect(result.nationality).toBeUndefined();
  });
});
