import { describe, expect, it } from "vitest";
import { getDefaultFormFields, slugifyFieldKey } from "@/lib/form-fields/defaults";

describe("slugifyFieldKey", () => {
  it("lowercases and replaces non-alphanumeric characters with underscores", () => {
    expect(slugifyFieldKey("LinkedIn URL")).toBe("linkedin_url");
    expect(slugifyFieldKey("  Years of Experience!  ")).toBe("years_of_experience");
  });

  it("trims leading and trailing underscores", () => {
    expect(slugifyFieldKey("---Hello---")).toBe("hello");
  });

  it("limits key length to 64 characters", () => {
    const long = "a".repeat(80);
    expect(slugifyFieldKey(long)).toHaveLength(64);
  });

  it("returns empty string for labels with no alphanumeric characters", () => {
    expect(slugifyFieldKey("!!!")).toBe("");
  });
});

describe("getDefaultFormFields", () => {
  const defaults = getDefaultFormFields();

  it("seeds expected profile field counts", () => {
    const candidateProfile = defaults.filter(
      (f) => f.audience === "candidate" && f.form_group === "profile"
    );
    const employerProfile = defaults.filter(
      (f) => f.audience === "employer" && f.form_group === "profile"
    );
    const employerJob = defaults.filter(
      (f) => f.audience === "employer" && f.form_group === "job"
    );

    expect(candidateProfile).toHaveLength(16);
    expect(employerProfile).toHaveLength(9);
    expect(employerJob.length).toBeGreaterThan(50);
  });

  it("uses unique field keys per audience and form group", () => {
    const keys = new Set<string>();
    for (const field of defaults) {
      const composite = `${field.audience}:${field.form_group}:${field.field_key}`;
      expect(keys.has(composite)).toBe(false);
      keys.add(composite);
    }
  });

  it("assigns monotonically increasing sort orders within each group", () => {
    const groups = new Map<string, number[]>();
    for (const field of defaults) {
      const key = `${field.audience}:${field.form_group}:${field.section}`;
      const orders = groups.get(key) ?? [];
      orders.push(field.sort_order);
      groups.set(key, orders);
    }

    for (const orders of groups.values()) {
      const sorted = [...orders].sort((a, b) => a - b);
      expect(orders).toEqual(sorted);
      expect(new Set(orders).size).toBe(orders.length);
    }
  });

  it("marks built-in fields as non-custom and active by default in seed payload shape", () => {
    for (const field of defaults) {
      expect(field.field_key.length).toBeGreaterThan(0);
      expect(field.label.length).toBeGreaterThan(0);
      expect(field.section.length).toBeGreaterThan(0);
    }
  });
});
