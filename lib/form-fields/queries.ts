import { createClient } from "@/lib/supabase/server";
import { getDefaultFormFields } from "@/lib/form-fields/defaults";
import { groupFormFieldsBySection } from "@/lib/form-fields/grouping";
import type {
  FormFieldAudience,
  FormFieldDefinition,
  FormFieldGroup,
  FormFieldSectionGroup,
} from "@/lib/form-fields/types";

function groupBySection(fields: FormFieldDefinition[]): FormFieldSectionGroup[] {
  return groupFormFieldsBySection(fields);
}

function defaultRow(field: ReturnType<typeof getDefaultFormFields>[number]) {
  return {
    ...field,
    field_type: field.field_type ?? "text",
    is_required: field.is_required ?? false,
    is_active: true,
    is_custom: false,
    employer_disclosure_mode: "candidate_optional" as const,
    show_on_anonymous_match: ["years_of_experience", "highest_education", "skills"].includes(
      field.field_key
    ),
    placeholder: field.placeholder ?? null,
  };
}

export async function ensureFormFieldsSeeded() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("form_fields")
    .select("id", { count: "exact", head: true });

  if (count && count > 0) return;

  const defaults = getDefaultFormFields().map(defaultRow);
  await supabase.from("form_fields").insert(defaults);
}

/** Ensures defaults exist and inserts any new default keys added in code (without overwriting admin edits). */
export async function ensureFormFieldsReady() {
  await ensureFormFieldsSeeded();

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("form_fields")
    .select("audience, form_group, field_key");

  const existingKeys = new Set(
    (existing ?? []).map((row) => `${row.audience}:${row.form_group}:${row.field_key}`)
  );

  const missing = getDefaultFormFields()
    .filter(
      (field) =>
        !existingKeys.has(`${field.audience}:${field.form_group}:${field.field_key}`)
    )
    .map(defaultRow);

  if (missing.length > 0) {
    await supabase.from("form_fields").insert(missing);
  }

  // One-time label cleanup after tag inputs replaced comma-separated fields.
  await Promise.all([
    supabase
      .from("form_fields")
      .update({ label: "Skills" })
      .eq("audience", "candidate")
      .eq("form_group", "profile")
      .eq("field_key", "skills")
      .eq("label", "Skills (comma-separated)"),
    supabase
      .from("form_fields")
      .update({ label: "Certifications" })
      .eq("audience", "candidate")
      .eq("form_group", "profile")
      .eq("field_key", "certifications")
      .eq("label", "Certifications (comma-separated)"),
    supabase
      .from("form_fields")
      .update({ label: "Languages" })
      .eq("audience", "candidate")
      .eq("form_group", "profile")
      .eq("field_key", "languages")
      .eq("label", "Languages (comma-separated)"),
  ]);
}

export async function loadFormFields(options?: {
  audience?: FormFieldAudience;
  formGroup?: FormFieldGroup;
  includeInactive?: boolean;
}): Promise<FormFieldDefinition[]> {
  const supabase = await createClient();
  let query = supabase.from("form_fields").select("*").order("sort_order");

  if (options?.audience) query = query.eq("audience", options.audience);
  if (options?.formGroup) query = query.eq("form_group", options.formGroup);
  if (!options?.includeInactive) query = query.eq("is_active", true);

  const { data } = await query;
  return ((data ?? []) as FormFieldDefinition[]).map((field) => ({
    ...field,
    show_on_anonymous_match: Boolean(field.show_on_anonymous_match),
    employer_disclosure_mode: field.employer_disclosure_mode ?? "candidate_optional",
  }));
}

export async function loadFormFieldSections(
  audience: FormFieldAudience,
  formGroup?: FormFieldGroup,
  includeInactive = false
): Promise<FormFieldSectionGroup[]> {
  const fields = await loadFormFields({ audience, formGroup, includeInactive });
  return groupBySection(fields);
}

export async function loadComparisonFormFields(includeInactive = true) {
  await ensureFormFieldsSeeded();

  const [candidate, employerProfile, employerJob] = await Promise.all([
    loadFormFieldSections("candidate", "profile", includeInactive),
    loadFormFieldSections("employer", "profile", includeInactive),
    loadFormFieldSections("employer", "job", includeInactive),
  ]);

  return { candidate, employerProfile, employerJob };
}

export function getProfileFieldKeys(fields: FormFieldDefinition[]): string[] {
  return fields.filter((f) => f.is_active && !f.is_custom).map((f) => f.field_key);
}
