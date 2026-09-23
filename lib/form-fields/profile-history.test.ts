import { describe, expect, it } from "vitest";
import {
  deriveProfileFactsFromHistories,
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

describe("deriveProfileFactsFromHistories", () => {
  it("reads the current title, years, qualification, and skills from the timelines", () => {
    const facts = deriveProfileFactsFromHistories({
      today: new Date(2024, 0, 15),
      work: [
        {
          company: "Acme",
          title: "Engineer",
          start_date: "2022-01",
          end_date: "",
          is_current: true,
          description: "",
          skills: ["TypeScript", "SQL"],
        },
      ],
      education: [
        {
          school: "NUS",
          degree: "Bachelor's degree",
          degree_other: "",
          field_of_study: "CS",
          start_date: "2018-08",
          end_date: "2022-05",
          is_current: false,
          skills: ["SQL"],
        },
      ],
      volunteer: [],
    });
    expect(facts.current_job_title).toBe("Engineer");
    expect(facts.years_of_experience).toBe(2);
    expect(facts.highest_education).toBe("Bachelor's degree");
    expect(facts.skills).toEqual(["TypeScript", "SQL"]);
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

  it("stores a listed qualification", () => {
    const result = validateEducationHistoryList([
      {
        school: "NUS",
        degree: "Bachelor's",
        field_of_study: "CS",
        start_date: "2015-01",
        end_date: "2019-01",
        is_current: false,
      },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value[0]?.degree).toBe("Bachelor's degree");
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
    expect(validatePostalCode("238801", { country: "Singapore" }).ok).toBe(true);
  });

  it("requires 6 digits only when the country is Singapore", () => {
    const sg = validatePostalCode("SW1A 1AA", { country: "Singapore" });
    expect(sg.ok).toBe(false);
    const uk = validatePostalCode("SW1A 1AA", { country: "United Kingdom" });
    expect(uk.ok).toBe(true);
    if (uk.ok) expect(uk.value).toBe("SW1A 1AA");
  });

  it("rejects a postal code that is too short outside Singapore", () => {
    expect(validatePostalCode("12", { country: "Malaysia" }).ok).toBe(false);
  });
});
