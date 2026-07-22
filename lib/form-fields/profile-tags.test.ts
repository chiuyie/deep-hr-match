import { describe, expect, it } from "vitest";
import {
  canonicalizeTag,
  parseLanguageEntriesInput,
  parseStringArrayInput,
  validateCertificationsList,
  validateLanguagesList,
  validateSkillsList,
} from "@/lib/form-fields/profile-tags";
import { validateCandidateField } from "@/lib/form-fields/candidate-field-validation";
import { makeFormField } from "@/lib/form-fields/test-fixtures";

describe("parseStringArrayInput", () => {
  it("parses JSON arrays and legacy comma lists", () => {
    expect(parseStringArrayInput('["React","TypeScript"]')).toEqual(["React", "TypeScript"]);
    expect(parseStringArrayInput("React, TypeScript")).toEqual(["React", "TypeScript"]);
    expect(parseStringArrayInput([" React ", ""])).toEqual(["React"]);
  });
});

describe("validateSkillsList", () => {
  it("accepts valid selections and custom tags", () => {
    expect(validateSkillsList(["React", "Custom Skill"])).toEqual({
      ok: true,
      value: ["React", "Custom Skill"],
    });
  });

  it("canonicalizes suggestion casing and rejects duplicates", () => {
    expect(canonicalizeTag("react", ["React"])).toBe("React");
    expect(validateSkillsList(["React", "react"]).ok).toBe(false);
  });

  it("enforces length and count limits", () => {
    expect(validateSkillsList(["a".repeat(51)]).ok).toBe(false);
    expect(validateSkillsList(Array.from({ length: 31 }, (_, i) => `Skill${i}`)).ok).toBe(false);
  });

  it("rejects empty / whitespace / emoji tags", () => {
    expect(validateSkillsList(["  "], { required: true }).ok).toBe(false);
    expect(validateSkillsList(["React🔥"]).ok).toBe(false);
  });
});

describe("validateCertificationsList", () => {
  it("allows custom certs and caps at 20", () => {
    expect(validateCertificationsList(["PMP"]).ok).toBe(true);
    expect(
      validateCertificationsList(Array.from({ length: 21 }, (_, i) => `Cert ${i}`)).ok
    ).toBe(false);
  });
});

describe("validateLanguagesList", () => {
  it("accepts structured language entries with optional proficiency", () => {
    expect(
      validateLanguagesList([
        { language: "English", proficiency: "Fluent" },
        { language: "Mandarin Chinese", proficiency: null },
      ])
    ).toEqual({
      ok: true,
      value: [
        { language: "English", proficiency: "Fluent" },
        { language: "Mandarin Chinese", proficiency: null },
      ],
    });
  });

  it("maps common aliases like Mandarin → Mandarin Chinese", () => {
    expect(
      validateLanguagesList([
        { language: "Mandarin", proficiency: "Fluent" },
        { language: "Chinese", proficiency: null },
      ])
    ).toEqual({
      ok: true,
      value: [{ language: "Mandarin Chinese", proficiency: "Fluent" }],
    });
  });

  it("rejects custom language names; collapses case duplicates", () => {
    expect(validateLanguagesList([{ language: "Klingon", proficiency: null }]).ok).toBe(false);
    expect(
      validateLanguagesList([
        { language: "English", proficiency: "Fluent" },
        { language: "english", proficiency: "Basic" },
      ])
    ).toEqual({
      ok: true,
      value: [{ language: "English", proficiency: "Fluent" }],
    });
  });

  it("soft-drops unknown languages on draft saves", () => {
    expect(
      validateLanguagesList(
        [
          { language: "English", proficiency: "Fluent" },
          { language: "Klingon", proficiency: null },
        ],
        { dropUnknown: true }
      )
    ).toEqual({
      ok: true,
      value: [{ language: "English", proficiency: "Fluent" }],
    });
  });

  it("migrates legacy comma-separated language strings", () => {
    expect(parseLanguageEntriesInput("English, French")).toEqual([
      { language: "English", proficiency: null },
      { language: "French", proficiency: null },
    ]);
  });
});

describe("validateCandidateField integration", () => {
  const skills = makeFormField({
    audience: "candidate",
    field_key: "skills",
    label: "Skills",
  });
  const languages = makeFormField({
    audience: "candidate",
    field_key: "languages",
    label: "Languages",
  });

  it("serializes validated skills/languages as JSON for form state", () => {
    expect(validateCandidateField(skills, '["React"]')).toEqual({
      ok: true,
      value: '["React"]',
    });
    expect(
      validateCandidateField(languages, JSON.stringify([{ language: "English", proficiency: "Fluent" }]))
    ).toEqual({
      ok: true,
      value: JSON.stringify([{ language: "English", proficiency: "Fluent" }]),
    });
  });
});
