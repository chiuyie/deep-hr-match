import { describe, expect, it } from "vitest";
import {
  isCandidateSectionComplete,
  validateCandidateField,
  validateCandidateSection,
} from "@/lib/form-fields/candidate-field-validation";
import { makeFormField } from "@/lib/form-fields/test-fixtures";

const name = makeFormField({
  audience: "candidate",
  field_key: "full_name",
  label: "Full Name",
  is_required: true,
});
const email = makeFormField({
  audience: "candidate",
  field_key: "email",
  label: "Email",
  field_type: "email",
  is_required: true,
});
const phone = makeFormField({
  audience: "candidate",
  field_key: "phone",
  label: "Phone",
  field_type: "tel",
  is_required: false,
});
const country = makeFormField({
  audience: "candidate",
  field_key: "country",
  label: "Country",
  is_required: false,
});
const city = makeFormField({
  audience: "candidate",
  field_key: "city",
  label: "City",
  is_required: false,
});

describe("validateCandidateField — required / whitespace", () => {
  it("rejects empty and whitespace-only required values", () => {
    expect(validateCandidateField(name, "").ok).toBe(false);
    expect(validateCandidateField(name, "   ").ok).toBe(false);
    expect(validateCandidateField(name, "\t\n").ok).toBe(false);
  });

  it("trims and accepts a valid name", () => {
    const result = validateCandidateField(name, "  Ada Lovelace  ");
    expect(result).toEqual({ ok: true, value: "Ada Lovelace" });
  });

  it("collapses duplicate internal spaces in names", () => {
    const result = validateCandidateField(name, "Ada   Lovelace");
    expect(result).toEqual({ ok: true, value: "Ada Lovelace" });
  });
});

describe("validateCandidateField — format / characters", () => {
  it("rejects emoji and control characters in identity fields", () => {
    expect(validateCandidateField(name, "Ada 😀").ok).toBe(false);
    expect(validateCandidateField(name, "Ada\u0000").ok).toBe(false);
    expect(validateCandidateField(email, "a😀@b.com").ok).toBe(false);
  });

  it("rejects malformed emails", () => {
    expect(validateCandidateField(email, "not-an-email").ok).toBe(false);
    expect(validateCandidateField(email, "a@b").ok).toBe(false);
    expect(validateCandidateField(email, "a @b.com").ok).toBe(false);
  });

  it("accepts a normal email and lowercases it", () => {
    expect(validateCandidateField(email, "Ada@Example.COM")).toEqual({
      ok: true,
      value: "ada@example.com",
    });
  });

  it("rejects extremely long inputs", () => {
    const long = "A".repeat(200);
    expect(validateCandidateField(name, long).ok).toBe(false);
    expect(validateCandidateField(email, `${"a".repeat(250)}@x.com`).ok).toBe(false);
  });

  it("handles XSS / SQL-looking strings as invalid names, not crashes", () => {
    expect(validateCandidateField(name, "<script>alert(1)</script>").ok).toBe(false);
    expect(validateCandidateField(name, "Robert'); DROP TABLE students;--").ok).toBe(false);
  });
});

describe("validateCandidateField — phone", () => {
  it("accepts valid E.164 and national numbers", () => {
    expect(validateCandidateField(phone, "+6591234567")).toEqual({
      ok: true,
      value: "+6591234567",
    });
    expect(validateCandidateField(phone, "").ok).toBe(true);
  });

  it("rejects incomplete / impossible phones", () => {
    expect(validateCandidateField(phone, "+65 12").ok).toBe(false);
    expect(validateCandidateField(phone, "11111111").ok).toBe(false);
  });
});

describe("validateCandidateField — salary / lists", () => {
  const salary = makeFormField({
    audience: "candidate",
    field_key: "expected_salary",
    label: "Expected Salary",
  });
  const skills = makeFormField({
    audience: "candidate",
    field_key: "skills",
    label: "Skills",
  });

  it("normalizes salary and rejects garbage", () => {
    expect(validateCandidateField(salary, "SGD 5,500")).toEqual({
      ok: true,
      value: "SGD 5500",
    });
    expect(validateCandidateField(salary, "SGD abc").ok).toBe(false);
  });

  it("normalizes comma lists and rejects emoji items", () => {
    expect(validateCandidateField(skills, " React,  TypeScript ,Node ")).toEqual({
      ok: true,
      value: JSON.stringify(["React", "TypeScript", "Node"]),
    });
    expect(validateCandidateField(skills, "React, 🔥").ok).toBe(false);
  });
});

describe("validateCandidateSection — step gating", () => {
  it("blocks progression when required fields are missing", () => {
    const result = validateCandidateSection([name, email, phone], {
      full_name: "",
      email: "ada@example.com",
      phone: "",
    });
    expect(result.ok).toBe(false);
    expect(result.errors.full_name).toBeTruthy();
    expect(result.firstInvalidKey).toBe("full_name");
  });

  it("passes when required fields are valid and optionals empty", () => {
    const result = validateCandidateSection([name, email, phone], {
      full_name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "",
    });
    expect(result.ok).toBe(true);
    expect(isCandidateSectionComplete([name, email, phone], {
      full_name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "",
    })).toBe(true);
  });

  it("fails the section when an optional phone is filled but invalid", () => {
    const result = validateCandidateSection([name, email, phone], {
      full_name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+65 12",
    });
    expect(result.ok).toBe(false);
    expect(result.errors.phone).toBeTruthy();
  });

  it("validates country/city together", () => {
    const result = validateCandidateSection([country, city], {
      country: "Singapore",
      city: "Central",
    });
    expect(result.ok).toBe(true);
  });
});

describe("Other free-text that matches a listed option", () => {
  it("canonicalizes Other text that already exists in the dropdown", () => {
    const result = validateCandidateField(country, "  singapore ");
    expect(result).toEqual({ ok: true, value: "Singapore" });
  });

  it("keeps genuine free-text Other values that are not in the list", () => {
    const result = validateCandidateField(country, "Wakanda");
    expect(result).toEqual({ ok: true, value: "Wakanda" });
  });
});

describe("pasted / edge inputs", () => {
  it("accepts pasted names with surrounding spaces", () => {
    expect(validateCandidateField(name, "\u00A0Jane Doe\u00A0").ok).toBe(true);
  });

  it("rejects blank city when provided as spaces", () => {
    expect(validateCandidateField(city, "   ").ok).toBe(true); // optional empty
    const requiredCity = makeFormField({
      audience: "candidate",
      field_key: "city",
      label: "City",
      is_required: true,
    });
    expect(validateCandidateField(requiredCity, "   ").ok).toBe(false);
  });
});
