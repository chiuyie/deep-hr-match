import { describe, expect, it } from "vitest";
import {
  formatPhoneValue,
  formatSalaryValue,
  isValidEmail,
  isValidPhoneNumber,
  isValidSalaryAmount,
  parseStoredPhone,
  citiesForCountry,
} from "@/lib/constants/candidate-profile-options";
import { buildDynamicProfileSchema, normalizeCandidateProfilePayload } from "@/lib/form-fields/validate-dynamic";
import { makeFormField } from "@/lib/form-fields/test-fixtures";

describe("candidate profile options helpers", () => {
  it("parses and formats phone numbers", () => {
    expect(parseStoredPhone("+65 9123 4567")).toMatchObject({
      isoCode: "SG",
      dialCode: "+65",
    });
    expect(formatPhoneValue("+65", "91234567")).toBe("+65 91234567");
    expect(isValidPhoneNumber("+65 91234567")).toBe(true);
    expect(isValidPhoneNumber("+65 12")).toBe(false);
    expect(isValidPhoneNumber("+65")).toBe(false);
    expect(isValidPhoneNumber("")).toBe(true);
  });

  it("validates email and salary", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
    expect(isValidEmail("nope")).toBe(false);
    expect(isValidSalaryAmount("SGD 5500")).toBe(true);
    expect(isValidSalaryAmount("SGD abc")).toBe(false);
    expect(formatSalaryValue("SGD", "5500")).toBe("SGD 5500");
  });

  it("returns cities for a country via geo dataset", async () => {
    const { City, Country } = await import("country-state-city");
    const iso = Country.getAllCountries().find((c) => c.name === "Singapore")?.isoCode;
    expect(iso).toBeTruthy();
    const cities = City.getCitiesOfCountry(iso!).map((c) => c.name);
    expect(cities.length).toBeGreaterThan(0);
    expect(citiesForCountry("Unknown")).toEqual(["Other"]);
  });
});

describe("buildDynamicProfileSchema candidate rules", () => {
  it("rejects invalid phone and accepts structured salary", () => {
    const schema = buildDynamicProfileSchema([
      makeFormField({
        audience: "candidate",
        field_key: "email",
        label: "Email",
        field_type: "email",
        is_required: true,
      }),
      makeFormField({
        audience: "candidate",
        field_key: "phone",
        label: "Phone",
        field_type: "tel",
      }),
      makeFormField({
        audience: "candidate",
        field_key: "expected_salary",
        label: "Expected Salary",
      }),
    ]);

    expect(
      schema.safeParse({
        email: "a@b.com",
        phone: "",
        expected_salary: "SGD 5500",
      }).success
    ).toBe(true);

    expect(
      schema.safeParse({
        email: "a@b.com",
        phone: "+65 91234567",
        expected_salary: "SGD 5500",
      }).success
    ).toBe(true);

    expect(
      schema.safeParse({
        email: "a@b.com",
        phone: "+65 12",
        expected_salary: "SGD 5500",
      }).success
    ).toBe(false);
  });

  it("allows empty required fields on draft saves but still validates filled values", () => {
    const fields = [
      makeFormField({
        audience: "candidate",
        field_key: "full_name",
        label: "Full name",
        is_required: true,
      }),
      makeFormField({
        audience: "candidate",
        field_key: "email",
        label: "Email",
        field_type: "email",
        is_required: true,
      }),
    ];

    const draft = buildDynamicProfileSchema(fields, { enforceRequired: false });
    expect(draft.safeParse({ full_name: "", email: "" }).success).toBe(true);
    expect(draft.safeParse({ full_name: "Ada Lovelace", email: "" }).success).toBe(true);
    expect(draft.safeParse({ full_name: "Ada Lovelace", email: "nope" }).success).toBe(false);

    const submit = buildDynamicProfileSchema(fields, { enforceRequired: true });
    expect(submit.safeParse({ full_name: "", email: "" }).success).toBe(false);
  });

  it("does not block draft saves on legacy free-text languages from later pages", () => {
    const schema = buildDynamicProfileSchema(
      [
        makeFormField({
          audience: "candidate",
          field_key: "full_name",
          label: "Full name",
          is_required: true,
        }),
        makeFormField({
          audience: "candidate",
          field_key: "languages",
          label: "Languages",
        }),
      ],
      { enforceRequired: false }
    );

    expect(
      schema.safeParse({
        full_name: "Ada Lovelace",
        languages: JSON.stringify([{ language: "Mandarin", proficiency: null }]),
      }).success
    ).toBe(true);

    expect(
      schema.safeParse({
        full_name: "Ada Lovelace",
        languages: JSON.stringify([{ language: "Klingon", proficiency: null }]),
      }).success
    ).toBe(true);
  });
});

describe("normalizeCandidateProfilePayload", () => {
  it("normalizes years, salary, and phone to E.164", () => {
    expect(
      normalizeCandidateProfilePayload({
        years_of_experience: "25.5",
        current_salary: "SGD 5,500",
        phone: "+65 9123 4567",
      })
    ).toMatchObject({
      years_of_experience: 25.5,
      current_salary: "SGD 5500",
      phone: "+6591234567",
    });
  });
});
