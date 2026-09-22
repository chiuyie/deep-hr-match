import { describe, expect, it } from "vitest";
import {
  validateDateOfBirth,
  validateEducationHistoryList,
  validateHomeAddress,
  validatePostalCode,
  validateWorkExperienceList,
} from "@/lib/form-fields/profile-history";

describe("validateWorkExperienceList", () => {
  it("accepts a complete current role", () => {
    const result = validateWorkExperienceList([
      {
        company: "Acme",
        title: "Engineer",
        start_date: "2020-01",
        end_date: "",
        is_current: true,
        description: "Built APIs",
      },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.end_date).toBe("");
    }
  });

  it("rejects end before start", () => {
    const result = validateWorkExperienceList([
      {
        company: "Acme",
        title: "Engineer",
        start_date: "2020-01",
        end_date: "2019-01",
        is_current: false,
        description: "",
      },
    ]);
    expect(result.ok).toBe(false);
  });
});

describe("validateEducationHistoryList", () => {
  it("requires school and degree", () => {
    const result = validateEducationHistoryList([
      {
        school: "",
        degree: "Bachelor's",
        field_of_study: "CS",
        start_date: "2015-01",
        end_date: "2019-01",
        is_current: false,
      },
    ]);
    expect(result.ok).toBe(false);
  });
});

describe("validateDateOfBirth", () => {
  it("rejects under-age candidates", () => {
    const year = new Date().getUTCFullYear() - 10;
    const result = validateDateOfBirth(`${year}-01-01`);
    expect(result.ok).toBe(false);
  });

  it("accepts a plausible adult DOB", () => {
    expect(validateDateOfBirth("1990-05-20").ok).toBe(true);
  });
});

describe("validateHomeAddress / postal", () => {
  it("accepts a normal address and SG postal", () => {
    expect(validateHomeAddress("12 Orchard Road #05-01").ok).toBe(true);
    expect(validatePostalCode("238801").ok).toBe(true);
  });
});
