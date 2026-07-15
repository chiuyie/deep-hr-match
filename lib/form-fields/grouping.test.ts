import { describe, expect, it } from "vitest";
import {
  buildPairedFieldRows,
  countSectionFields,
  flattenSectionFields,
  groupFormFieldsBySection,
} from "@/lib/form-fields/grouping";
import {
  makeFormField,
  makeSectionGroup,
  sampleCandidateSections,
  sampleEmployerSections,
} from "@/lib/form-fields/test-fixtures";

describe("groupFormFieldsBySection", () => {
  it("groups fields by section and sorts by sort_order", () => {
    const fields = [
      makeFormField({ field_key: "b", label: "B", section: "Alpha", sort_order: 2 }),
      makeFormField({ field_key: "a", label: "A", section: "Alpha", sort_order: 1 }),
      makeFormField({ field_key: "c", label: "C", section: "Beta", sort_order: 1 }),
    ];

    const grouped = groupFormFieldsBySection(fields);
    expect(grouped).toHaveLength(2);
    expect(grouped[0].section).toBe("Alpha");
    expect(grouped[0].fields.map((f) => f.field_key)).toEqual(["a", "b"]);
    expect(grouped[1].section).toBe("Beta");
  });
});

describe("flattenSectionFields", () => {
  it("flattens all sections in order", () => {
    const sections = [
      makeSectionGroup("One", [
        makeFormField({ field_key: "x", label: "X", sort_order: 1 }),
      ]),
      makeSectionGroup("Two", [
        makeFormField({ field_key: "y", label: "Y", sort_order: 1 }),
      ]),
    ];
    expect(flattenSectionFields(sections).map((f) => f.field_key)).toEqual(["x", "y"]);
  });
});

describe("countSectionFields", () => {
  it("counts fields across sections", () => {
    expect(countSectionFields(sampleCandidateSections)).toBe(3);
    expect(countSectionFields(sampleEmployerSections)).toBe(2);
  });
});

describe("buildPairedFieldRows", () => {
  it("pairs fields row by row using the longer side length", () => {
    const rows = buildPairedFieldRows(sampleCandidateSections, sampleEmployerSections);
    expect(rows).toHaveLength(3);
    expect(rows[0].left?.label).toBe("Full Name");
    expect(rows[0].right?.label).toBe("Company Name");
    expect(rows[1].left?.label).toBe("Email");
    expect(rows[1].right?.label).toBe("Industry");
    expect(rows[2].left?.label).toBe("Phone");
    expect(rows[2].right).toBeUndefined();
  });

  it("returns an empty array when both sides have no fields", () => {
    expect(buildPairedFieldRows([], [])).toEqual([]);
  });

  it("handles employer-only fields", () => {
    const rows = buildPairedFieldRows([], sampleEmployerSections);
    expect(rows).toHaveLength(2);
    expect(rows[0].left).toBeUndefined();
    expect(rows[0].right?.label).toBe("Company Name");
  });

  it("flattens multiple sections before pairing", () => {
    const left = [
      makeSectionGroup("Candidate Profile", [
        makeFormField({ field_key: "a", label: "A", sort_order: 1 }),
      ]),
      makeSectionGroup("Extra", [
        makeFormField({ field_key: "b", label: "B", section: "Extra", sort_order: 1 }),
      ]),
    ];
    const right = [
      makeSectionGroup("Company Profile", [
        makeFormField({
          audience: "employer",
          section: "Company Profile",
          field_key: "z",
          label: "Z",
          sort_order: 1,
        }),
      ]),
    ];

    const rows = buildPairedFieldRows(left, right);
    expect(rows).toHaveLength(2);
    expect(rows[0].left?.label).toBe("A");
    expect(rows[0].right?.label).toBe("Z");
    expect(rows[1].left?.label).toBe("B");
    expect(rows[1].right).toBeUndefined();
  });
});
