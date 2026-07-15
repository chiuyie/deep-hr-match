import type { FormFieldDefinition, FormFieldSectionGroup } from "@/lib/form-fields/types";

export function groupFormFieldsBySection(
  fields: FormFieldDefinition[]
): FormFieldSectionGroup[] {
  const map = new Map<string, FormFieldDefinition[]>();
  for (const field of fields) {
    const list = map.get(field.section) ?? [];
    list.push(field);
    map.set(field.section, list);
  }
  return [...map.entries()].map(([section, sectionFields]) => ({
    section,
    fields: sectionFields.sort((a, b) => a.sort_order - b.sort_order),
  }));
}

export function flattenSectionFields(
  sections: FormFieldSectionGroup[]
): FormFieldDefinition[] {
  return sections.flatMap((section) => section.fields);
}

export function countSectionFields(sections: FormFieldSectionGroup[]): number {
  return flattenSectionFields(sections).length;
}

export function buildPairedFieldRows(
  leftSections: FormFieldSectionGroup[],
  rightSections: FormFieldSectionGroup[]
): { left?: FormFieldDefinition; right?: FormFieldDefinition }[] {
  const leftFields = flattenSectionFields(leftSections);
  const rightFields = flattenSectionFields(rightSections);
  const rowCount = Math.max(leftFields.length, rightFields.length);

  return Array.from({ length: rowCount }, (_, index) => ({
    left: leftFields[index],
    right: rightFields[index],
  }));
}
