import { cache } from "react";
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

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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

  await Promise.all(
    audiences.map(async ({ audience, formGroup }) => {
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
        fromFields.set(
          title,
          prev == null ? row.sort_order ?? 0 : Math.min(prev, row.sort_order ?? 0)
        );
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
    })
  );
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

async function probeNeedsFormFieldMigration(supabase: SupabaseServerClient): Promise<boolean> {
  const legacyMatrixTitle = `${FRAMEWORK_MATCHING_LANGUAGE} (optional)`;
  const { data } = await supabase
    .from("form_fields")
    .select("id")
    .in("section", [
      "Candidate Profile",
      "Company Profile",
      "Company details",
      "Employer Information",
      legacyMatrixTitle,
    ])
    .limit(1);
  if ((data?.length ?? 0) > 0) return true;

  const { data: legacyLabels } = await supabase
    .from("form_fields")
    .select("id")
    .eq("audience", "employer")
    .eq("form_group", "profile")
    .in("field_key", ["company_name", "company_size"])
    .in("label", ["Company Name", "Company Size"])
    .limit(1);
  return (legacyLabels?.length ?? 0) > 0;
}

async function runFormFieldMigrations(supabase: SupabaseServerClient) {
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

  // Keep built-in employer job labels / placeholders understandable without
  // overwriting section ordering or custom-field edits.
  const builtInJobFieldDefaults = getDefaultFormFields().filter(
    (field) => field.audience === "employer" && field.form_group === "job"
  );
  const jobFieldUpdates = builtInJobFieldDefaults.map((field) =>
    supabase
      .from("form_fields")
      .update({
        label: field.label,
        placeholder: field.placeholder ?? null,
        field_type: field.field_type ?? "text",
      })
      .eq("audience", field.audience)
      .eq("form_group", field.form_group)
      .eq("field_key", field.field_key)
      .eq("is_custom", false)
  );

  if (jobFieldUpdates.length > 0) {
    await Promise.all(jobFieldUpdates);
  }

  // Keep built-in employer profile labels and section titles current.
  await Promise.all([
    supabase
      .from("form_fields")
      .update({ label: "Employer name" })
      .eq("audience", "employer")
      .eq("form_group", "profile")
      .eq("field_key", "company_name")
      .eq("is_custom", false),
    supabase
      .from("form_fields")
      .update({ label: "Employer size" })
      .eq("audience", "employer")
      .eq("form_group", "profile")
      .eq("field_key", "company_size")
      .eq("is_custom", false),
    supabase
      .from("form_fields")
      .update({ section: "Employer details" })
      .eq("audience", "employer")
      .eq("form_group", "profile")
      .eq("section", "Company details"),
    supabase
      .from("form_sections")
      .update({ title: "Employer details" })
      .eq("audience", "employer")
      .eq("form_group", "profile")
      .eq("title", "Company details"),
  ]);

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
}

/**
 * Ensures defaults exist. Heavy label/type/legacy migrations only run when
 * defaults are missing or a cheap legacy-section probe hits — not on every request.
 * Cached per React request so multiple helpers don't re-run it.
 */
export const ensureFormFieldsReady = cache(async function ensureFormFieldsReady() {
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

  const needsMigration =
    missing.length > 0 || (await probeNeedsFormFieldMigration(supabase));
  if (needsMigration) {
    await runFormFieldMigrations(supabase);
  }

  await ensureFormSectionsReady();
});

const loadFormFieldsCached = cache(async function loadFormFieldsCached(
  audience: string,
  formGroup: string,
  includeInactive: boolean
): Promise<FormFieldDefinition[]> {
  const supabase = await createClient();
  let query = supabase.from("form_fields").select("*").order("sort_order");

  if (audience) query = query.eq("audience", audience);
  if (formGroup) query = query.eq("form_group", formGroup);
  if (!includeInactive) query = query.eq("is_active", true);

  const { data } = await query;
  return ((data ?? []) as FormFieldDefinition[]).map((field) => ({
    ...field,
    options: normalizeSelectOptions(field.options),
    show_on_anonymous_match: Boolean(field.show_on_anonymous_match),
    employer_disclosure_mode: field.employer_disclosure_mode ?? "candidate_optional",
  }));
});

export async function loadFormFields(options?: {
  audience?: FormFieldAudience;
  formGroup?: FormFieldGroup;
  includeInactive?: boolean;
}): Promise<FormFieldDefinition[]> {
  return loadFormFieldsCached(
    options?.audience ?? "",
    options?.formGroup ?? "",
    options?.includeInactive ?? false
  );
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
