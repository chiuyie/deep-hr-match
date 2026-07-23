import { JOB_FORM_SECTIONS } from "@/lib/constants/job-form";
import { getDefaultFormFields } from "@/lib/form-fields/defaults";
import type { FormFieldDefinition } from "@/lib/form-fields/types";
import type { JobFormSectionId } from "@/lib/utils/job-form-progress";

export type JobFieldMetaMap = Map<string, FormFieldDefinition>;

export function buildJobFieldMetaMap(fields: FormFieldDefinition[]): JobFieldMetaMap {
  return new Map(fields.map((field) => [field.field_key, field]));
}

export function isJobFieldVisible(meta: JobFieldMetaMap | undefined, fieldKey: string): boolean {
  const field = meta?.get(fieldKey);
  if (!field) return true;
  return field.is_active;
}

export function jobFieldLabel(
  meta: JobFieldMetaMap | undefined,
  fieldKey: string,
  fallback: string
): string {
  return meta?.get(fieldKey)?.label ?? fallback;
}

export function jobFieldRequired(
  meta: JobFieldMetaMap | undefined,
  fieldKey: string,
  fallback = false
): boolean {
  const field = meta?.get(fieldKey);
  if (!field) return fallback;
  if (!field.is_active) return false;
  return field.is_required || fallback;
}

const SECTION_TITLE_BY_ID = Object.fromEntries(
  JOB_FORM_SECTIONS.map((section) => [section.id, section.title])
) as Record<JobFormSectionId, string>;

const DEFAULT_KEYS_BY_SECTION_TITLE = (() => {
  const map = new Map<string, string[]>();
  for (const field of getDefaultFormFields()) {
    if (field.audience !== "employer" || field.form_group !== "job") continue;
    const list = map.get(field.section) ?? [];
    list.push(field.field_key);
    map.set(field.section, list);
  }
  return map;
})();

function resolveJobSectionTitle(
  fields: FormFieldDefinition[],
  sectionId: JobFormSectionId
): string {
  const defaultTitle = SECTION_TITLE_BY_ID[sectionId];
  const defaultKeys = DEFAULT_KEYS_BY_SECTION_TITLE.get(defaultTitle) ?? [];
  const builtIn = fields.find(
    (field) => !field.is_custom && defaultKeys.includes(field.field_key)
  );
  return builtIn?.section ?? defaultTitle;
}

export function customJobFieldsForSection(
  fields: FormFieldDefinition[],
  sectionId: JobFormSectionId
): FormFieldDefinition[] {
  const sectionTitle = resolveJobSectionTitle(fields, sectionId);
  const knownTitles = new Set(
    JOB_FORM_SECTIONS.map((section) => resolveJobSectionTitle(fields, section.id))
  );

  return fields.filter(
    (field) =>
      field.is_custom &&
      field.is_active &&
      (field.section === sectionTitle ||
        // Orphan custom sections only surface on the last wizard step.
        (sectionId === JOB_FORM_SECTIONS[JOB_FORM_SECTIONS.length - 1]?.id &&
          !knownTitles.has(field.section)))
  );
}
