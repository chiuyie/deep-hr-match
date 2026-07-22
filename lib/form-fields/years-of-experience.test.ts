import { describe, expect, it } from "vitest";
import {
  sanitizeYearsOfExperienceInput,
  validateYearsOfExperienceValue,
} from "@/lib/form-fields/years-of-experience";
import { validateCandidateField } from "@/lib/form-fields/candidate-field-validation";
import { makeFormField } from "@/lib/form-fields/test-fixtures";

const field = makeFormField({
  audience: "candidate",
  field_key: "years_of_experience",
  label: "Years of Experience",
  field_type: "number",
  is_required: true,
});

describe("sanitizeYearsOfExperienceInput", () => {
  it("trims whitespace", () => {
    expect(sanitizeYearsOfExperienceInput("  5  ")).toBe("5");
    expect(sanitizeYearsOfExperienceInput("\t1.5\n")).toBe("1.5");
  });
});

describe("validateYearsOfExperienceValue — valid", () => {
  it.each([0, 0.5, 1, 5, 10, 25.5, 60])("accepts %s", (value) => {
    expect(validateYearsOfExperienceValue(value)).toEqual({ ok: true, value });
    expect(validateYearsOfExperienceValue(String(value))).toEqual({ ok: true, value });
  });

  it("treats empty as null when optional", () => {
    expect(validateYearsOfExperienceValue("", { required: false })).toEqual({
      ok: true,
      value: null,
    });
  });
});

describe("validateYearsOfExperienceValue — invalid", () => {
  it.each([
    [-1, /negative|0 to 60|number/i],
    [60.5, /more than 60|0 to 60/i],
    ["abc", /number/i],
    ["1e5", /number/i],
    ["1E3", /number/i],
    ["", /required/i],
    ["   ", /required/i],
    ["@", /number/i],
    ["5!", /number/i],
    ["😀", /number/i],
    ["1; DROP TABLE", /number/i],
    ["<script>alert(1)</script>", /number/i],
    ["1.2", /steps of 0\.5/i],
    ["01", /number/i],
    ["5.", /incomplete|number/i],
    ["+", /number/i],
    [",5", /number/i],
  ])("rejects %j", (value, message) => {
    const result = validateYearsOfExperienceValue(value, {
      required: value === "" || value === "   " ? true : false,
      label: "Years of Experience",
    });
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.message).toMatch(message);
  });
});

describe("validateCandidateField years_of_experience", () => {
  it("returns a numeric string for shared form tracking", () => {
    expect(validateCandidateField(field, "25.5")).toEqual({
      ok: true,
      value: "25.5",
    });
  });

  it("rejects malformed years consistently with the shared helper", () => {
    expect(validateCandidateField(field, "1e5").ok).toBe(false);
    expect(validateCandidateField(field, " ").ok).toBe(false);
  });
});
