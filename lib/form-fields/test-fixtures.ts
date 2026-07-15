import type { FormFieldDefinition, FormFieldSectionGroup } from "@/lib/form-fields/types";

export function makeFormField(
  overrides: Partial<FormFieldDefinition> & Pick<FormFieldDefinition, "field_key" | "label">
): FormFieldDefinition {
  return {
    id: overrides.id ?? `id-${overrides.field_key}`,
    audience: overrides.audience ?? "candidate",
    form_group: overrides.form_group ?? "profile",
    section: overrides.section ?? "Candidate Profile",
    field_key: overrides.field_key,
    label: overrides.label,
    field_type: overrides.field_type ?? "text",
    placeholder: overrides.placeholder ?? null,
    is_required: overrides.is_required ?? false,
    is_active: overrides.is_active ?? true,
    is_custom: overrides.is_custom ?? false,
    sort_order: overrides.sort_order ?? 1,
  };
}

export function makeSectionGroup(
  section: string,
  fields: FormFieldDefinition[]
): FormFieldSectionGroup {
  return { section, fields };
}

export const sampleCandidateSections: FormFieldSectionGroup[] = [
  makeSectionGroup("Candidate Profile", [
    makeFormField({ field_key: "full_name", label: "Full Name", sort_order: 1, is_required: true }),
    makeFormField({ field_key: "email", label: "Email", field_type: "email", sort_order: 2 }),
    makeFormField({ field_key: "phone", label: "Phone", field_type: "tel", sort_order: 3 }),
  ]),
];

export const sampleEmployerSections: FormFieldSectionGroup[] = [
  makeSectionGroup("Company Profile", [
    makeFormField({
      audience: "employer",
      section: "Company Profile",
      field_key: "company_name",
      label: "Company Name",
      sort_order: 1,
      is_required: true,
    }),
    makeFormField({
      audience: "employer",
      section: "Company Profile",
      field_key: "industry",
      label: "Industry",
      sort_order: 2,
    }),
  ]),
];
