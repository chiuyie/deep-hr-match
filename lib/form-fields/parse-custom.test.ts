import { describe, expect, it } from "vitest";
import { extractCustomFields, stripCustomEntries } from "@/lib/form-fields/parse-custom";

describe("extractCustomFields", () => {
  it("extracts custom_* entries and trims values", () => {
    const formData = new FormData();
    formData.set("full_name", "Jane");
    formData.set("custom_portfolio", "  https://example.com  ");
    formData.set("custom_notes", "   ");
    formData.set("custom_department", "Engineering");

    expect(extractCustomFields(formData)).toEqual({
      portfolio: "https://example.com",
      department: "Engineering",
    });
  });

  it("ignores duplicate custom keys by keeping the last value", () => {
    const formData = new FormData();
    formData.set("email", "jane@example.com");
    formData.append("custom_tags", "one");
    formData.append("custom_tags", "two");

    expect(extractCustomFields(formData)).toEqual({ tags: "two" });
  });
});

describe("stripCustomEntries", () => {
  it("removes custom_* keys from raw form entries", () => {
    const raw = {
      company_name: "Acme",
      custom_region: "APAC",
      email: "hr@acme.com",
    };

    expect(stripCustomEntries(raw)).toEqual({
      company_name: "Acme",
      email: "hr@acme.com",
    });
  });
});
