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

export async function ensureFormFieldsSeeded() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("form_fields")
    .select("id", { count: "exact", head: true });

  if (count && count > 0) return;

  const defaults = getDefaultFormFields().map((field) => ({
    ...field,
    field_type: field.field_type ?? "text",
    is_required: field.is_required ?? false,
    is_active: true,
    is_custom: false,
    employer_disclosure_mode: "candidate_optional" as const,
    placeholder: field.placeholder ?? null,
  }));

  await supabase.from("form_fields").insert(defaults);
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
  return (data ?? []) as FormFieldDefinition[];
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
