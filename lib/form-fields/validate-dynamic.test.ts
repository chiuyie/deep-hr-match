import { describe, expect, it } from "vitest";
import { makeFormField } from "@/lib/form-fields/test-fixtures";
import {
  buildDynamicProfileSchema,
  validateJobStateAgainstFormFields,
} from "@/lib/form-fields/validate-dynamic";

describe("buildDynamicProfileSchema", () => {
  it("honours admin required flags", () => {
    const fields = [
      makeFormField({ field_key: "full_name", label: "Full Name", is_required: false }),
      makeFormField({ field_key: "email", label: "Email", field_type: "email", is_required: true }),
    ];
    const schema = buildDynamicProfileSchema(fields);
    expect(schema.safeParse({ full_name: "", email: "bad" }).success).toBe(false);
    expect(schema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });
});

describe("validateJobStateAgainstFormFields", () => {
  it("requires active admin-marked job fields", () => {
    const fields = [
      makeFormField({
        audience: "employer",
        form_group: "job",
        field_key: "working_hours",
        label: "Working hours",
        is_required: true,
      }),
    ];
    const result = validateJobStateAgainstFormFields({}, fields, {});
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.focusField).toBe("working_hours");
    }
  });
});
