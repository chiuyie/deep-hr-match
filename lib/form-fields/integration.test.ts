import { describe, expect, it } from "vitest";
import { getDefaultFormFields } from "@/lib/form-fields/defaults";
import {
  candidateProfileSchema,
  employerProfileSchema,
  formFieldSchema,
} from "@/lib/validations/schemas";

describe("form field defaults vs profile schemas", () => {
  const defaults = getDefaultFormFields();

  it("maps candidate profile defaults to candidateProfileSchema keys", () => {
    const schemaKeys = Object.keys(candidateProfileSchema.shape);
    const candidateKeys = defaults
      .filter((f) => f.audience === "candidate" && f.form_group === "profile")
      .map((f) => f.field_key);

    for (const key of candidateKeys) {
      expect(schemaKeys).toContain(key);
    }
  });

  it("maps employer profile defaults to employerProfileSchema keys", () => {
    const schemaKeys = Object.keys(employerProfileSchema.shape);
    const employerKeys = defaults
      .filter((f) => f.audience === "employer" && f.form_group === "profile")
      .map((f) => f.field_key);

    for (const key of employerKeys) {
      expect(schemaKeys).toContain(key);
    }
  });

  it("validates every default field through formFieldSchema", () => {
    for (const field of defaults) {
      const result = formFieldSchema.safeParse({
        ...field,
        field_type: field.field_type ?? "text",
        placeholder: field.placeholder ?? null,
        is_required: field.is_required ?? false,
        is_active: true,
        is_custom: false,
      });
      expect(result.success, `invalid default field ${field.field_key}`).toBe(true);
    }
  });
});

describe("formFieldSchema", () => {
  it("accepts valid admin form field payloads", () => {
    const result = formFieldSchema.safeParse({
      audience: "candidate",
      form_group: "profile",
      section: "Candidate Profile",
      field_key: "portfolio",
      label: "Portfolio URL",
      field_type: "url",
      is_required: false,
      is_active: true,
      is_custom: true,
      sort_order: 17,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid audience and field type", () => {
    expect(
      formFieldSchema.safeParse({
        audience: "admin",
        form_group: "profile",
        section: "X",
        field_key: "x",
        label: "X",
        field_type: "text",
      }).success
    ).toBe(false);

    expect(
      formFieldSchema.safeParse({
        audience: "candidate",
        form_group: "profile",
        section: "X",
        field_key: "x",
        label: "X",
        field_type: "invalid",
      }).success
    ).toBe(false);
  });

  it("requires non-empty label, section, and field_key", () => {
    expect(
      formFieldSchema.safeParse({
        audience: "employer",
        form_group: "profile",
        section: "",
        field_key: "company_name",
        label: "Company Name",
      }).success
    ).toBe(false);
  });
});
