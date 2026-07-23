import { createClient } from "@/lib/supabase/server";
import { getDefaultFormFields } from "@/lib/form-fields/defaults";
import { groupFormFieldsBySection } from "@/lib/form-fields/grouping";
import {
  CANDIDATE_ADDITIONAL_SECTION,
  CANDIDATE_PROFILE_SECTIONS,
  EMPLOYER_ADDITIONAL_SECTION,
  EMPLOYER_PROFILE_SECTIONS,
  buildAdminProfileSectionGroups,
  defaultCandidateSectionForKey,
  defaultEmployerSectionForKey,
} from "@/lib/form-fields/profile-sections";
import {
  DEFAULT_SELECT_OPTIONS_BY_KEY,
  normalizeSelectOptions,
} from "@/lib/form-fields/select-options";
import { defaultSectionTitles } from "@/lib/form-fields/section-defaults";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
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
  const field_type = field.field_type ?? "text";
  const defaultOptions = DEFAULT_SELECT_OPTIONS_BY_KEY[field.field_key];
  return {
    ...field,
    field_type,
    options:
      field_type === "select"
        ? normalizeSelectOptions(field.options ?? defaultOptions ?? null)
        : null,
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

async function ensureFormSectionsReady() {
  const supabase = await createClient();
  const audiences: Array<{ audience: FormFieldAudience; formGroup: FormFieldGroup }> = [
    { audience: "candidate", formGroup: "profile" },
    { audience: "employer", formGroup: "profile" },
    { audience: "employer", formGroup: "job" },
  ];

  for (const { audience, formGroup } of audiences) {
    const { data: existing, error } = await supabase
      .from("form_sections")
      .select("title")
      .eq("audience", audience)
      .eq("form_group", formGroup);

    if (error) {
      // Migration 016 may not be applied yet — skip quietly.
      if (error.message.toLowerCase().includes("form_sections")) return;
      return;
    }

    const existingTitles = new Set((existing ?? []).map((row) => row.title));

    // Prefer titles already present on fields, then defaults for any missing empties.
    const { data: fieldSections } = await supabase
      .from("form_fields")
      .select("section, sort_order")
      .eq("audience", audience)
      .eq("form_group", formGroup);

    const fromFields = new Map<string, number>();
    for (const row of fieldSections ?? []) {
      const title = String(row.section ?? "").trim();
      if (!title) continue;
      const prev = fromFields.get(title);
      fromFields.set(title, prev == null ? row.sort_order ?? 0 : Math.min(prev, row.sort_order ?? 0));
    }

    const defaults = defaultSectionTitles(audience, formGroup);
    const toInsert: Array<{
      audience: FormFieldAudience;
      form_group: FormFieldGroup;
      title: string;
      sort_order: number;
    }> = [];

    let order = 1;
    for (const title of defaults) {
      if (existingTitles.has(title)) {
        order += 1;
        continue;
      }
      // Only auto-seed default titles when the form has no sections yet.
      if ((existing ?? []).length > 0 && !fromFields.has(title)) {
        order += 1;
        continue;
      }
      toInsert.push({
        audience,
        form_group: formGroup,
        title,
        sort_order: fromFields.get(title) ?? order,
      });
      existingTitles.add(title);
      order += 1;
    }

    for (const [title, sort_order] of fromFields) {
      if (existingTitles.has(title)) continue;
      toInsert.push({ audience, form_group: formGroup, title, sort_order });
      existingTitles.add(title);
    }

    if (toInsert.length > 0) {
      await supabase.from("form_sections").insert(toInsert);
    }
  }
}

export async function loadFormSectionTitles(
  audience: FormFieldAudience,
  formGroup: FormFieldGroup
): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("form_sections")
    .select("title, sort_order")
    .eq("audience", audience)
    .eq("form_group", formGroup)
    .order("sort_order");

  if (error || !data?.length) {
    return defaultSectionTitles(audience, formGroup);
  }

  return data.map((row) => row.title);
}

/** Ensures defaults exist and inserts any new default keys added in code (without overwriting admin edits). */
export async function ensureFormFieldsReady() {
  await ensureFormFieldsSeeded();

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("form_fields")
    .select("id, audience, form_group, field_key, section, is_custom");

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

  // Keep Skills / Certifications / Languages labels clean (no legacy suffix).
  await Promise.all([
    supabase
      .from("form_fields")
      .update({ label: "Skills" })
      .eq("audience", "candidate")
      .eq("form_group", "profile")
      .eq("field_key", "skills"),
    supabase
      .from("form_fields")
      .update({ label: "Certifications" })
      .eq("audience", "candidate")
      .eq("form_group", "profile")
      .eq("field_key", "certifications"),
    supabase
      .from("form_fields")
      .update({ label: "Languages" })
      .eq("audience", "candidate")
      .eq("form_group", "profile")
      .eq("field_key", "languages"),
  ]);

  // Sync field_type for built-ins only — do not overwrite admin section renames.
  const typeUpdates = getDefaultFormFields()
    .filter((field) => field.form_group === "profile")
    .map((field) =>
      supabase
        .from("form_fields")
        .update({ field_type: field.field_type ?? "text" })
        .eq("audience", field.audience)
        .eq("form_group", field.form_group)
        .eq("field_key", field.field_key)
        .eq("is_custom", false)
    );

  if (typeUpdates.length > 0) {
    await Promise.all(typeUpdates);
  }

  // Move legacy custom fields out of the old single profile buckets.
  await Promise.all([
    supabase
      .from("form_fields")
      .update({ section: "Additional information" })
      .eq("audience", "candidate")
      .eq("form_group", "profile")
      .eq("is_custom", true)
      .eq("section", "Candidate Profile"),
    supabase
      .from("form_fields")
      .update({ section: "Additional information" })
      .eq("audience", "employer")
      .eq("form_group", "profile")
      .eq("is_custom", true)
      .in("section", ["Company Profile", "Employer Information"]),
  ]);

  // Migrate built-in fields still stuck in legacy buckets.
  const legacySectionFixes = getDefaultFormFields()
    .filter((field) => field.form_group === "profile")
    .map((field) =>
      supabase
        .from("form_fields")
        .update({ section: field.section })
        .eq("audience", field.audience)
        .eq("form_group", field.form_group)
        .eq("field_key", field.field_key)
        .eq("is_custom", false)
        .in("section", ["Candidate Profile", "Company Profile", "Employer Information"])
    );

  if (legacySectionFixes.length > 0) {
    await Promise.all(legacySectionFixes);
  }

  // Seed default dropdown options for known selects when missing.
  const { data: selectFields } = await supabase
    .from("form_fields")
    .select("id, field_key, field_type, options")
    .eq("field_type", "select");

  const optionSeeds = (selectFields ?? [])
    .filter((field) => !normalizeSelectOptions(field.options)?.length)
    .map((field) => {
      const defaults = DEFAULT_SELECT_OPTIONS_BY_KEY[field.field_key];
      const fromDefaults = getDefaultFormFields().find(
        (row) =>
          row.field_key === field.field_key &&
          row.field_type === "select" &&
          row.options?.length
      )?.options;
      const options = normalizeSelectOptions(defaults ?? fromDefaults ?? null);
      if (!options) return null;
      return supabase.from("form_fields").update({ options }).eq("id", field.id);
    })
    .filter(Boolean);

  if (optionSeeds.length > 0) {
    await Promise.all(optionSeeds);
  }

  // Drop legacy "(optional)" label from the job 7^7 section title.
  const legacyMatrixTitle = `${FRAMEWORK_MATCHING_LANGUAGE} (optional)`;
  await Promise.all([
    supabase
      .from("form_fields")
      .update({ section: FRAMEWORK_MATCHING_LANGUAGE })
      .eq("audience", "employer")
      .eq("form_group", "job")
      .eq("section", legacyMatrixTitle),
    supabase
      .from("form_sections")
      .update({ title: FRAMEWORK_MATCHING_LANGUAGE })
      .eq("audience", "employer")
      .eq("form_group", "job")
      .eq("title", legacyMatrixTitle),
  ]);

  await ensureFormSectionsReady();
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
    options: normalizeSelectOptions(field.options),
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
  if (!formGroup) return groupBySection(fields);

  const sectionOrder = await loadFormSectionTitles(audience, formGroup);
  const buckets = new Map<string, FormFieldDefinition[]>();
  for (const field of fields) {
    const list = buckets.get(field.section) ?? [];
    list.push(field);
    buckets.set(field.section, list);
  }

  const ordered: FormFieldSectionGroup[] = [];
  const seen = new Set<string>();
  for (const title of sectionOrder) {
    seen.add(title);
    ordered.push({
      section: title,
      fields: (buckets.get(title) ?? []).sort((a, b) => a.sort_order - b.sort_order),
    });
    buckets.delete(title);
  }
  for (const [section, sectionFields] of buckets) {
    if (seen.has(section)) continue;
    ordered.push({
      section,
      fields: sectionFields.sort((a, b) => a.sort_order - b.sort_order),
    });
  }
  return ordered;
}

export async function loadComparisonFormFields(includeInactive = true) {
  await ensureFormFieldsReady();

  const [candidateFields, employerProfileFields, employerJob, candidateOrder, employerOrder] =
    await Promise.all([
      loadFormFields({ audience: "candidate", formGroup: "profile", includeInactive }),
      loadFormFields({ audience: "employer", formGroup: "profile", includeInactive }),
      loadFormFieldSections("employer", "job", includeInactive),
      loadFormSectionTitles("candidate", "profile"),
      loadFormSectionTitles("employer", "profile"),
    ]);

  const candidate = buildAdminProfileSectionGroups(
    candidateFields,
    CANDIDATE_PROFILE_SECTIONS,
    CANDIDATE_ADDITIONAL_SECTION,
    defaultCandidateSectionForKey,
    candidateOrder
  );
  const employerProfile = buildAdminProfileSectionGroups(
    employerProfileFields,
    EMPLOYER_PROFILE_SECTIONS,
    EMPLOYER_ADDITIONAL_SECTION,
    defaultEmployerSectionForKey,
    employerOrder
  );

  return { candidate, employerProfile, employerJob };
}

export function getProfileFieldKeys(fields: FormFieldDefinition[]): string[] {
  return fields.filter((f) => f.is_active && !f.is_custom).map((f) => f.field_key);
}
