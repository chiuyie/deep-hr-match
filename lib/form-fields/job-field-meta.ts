import { JOB_FORM_SECTIONS } from "@/lib/constants/job-form";
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

export function customJobFieldsForSection(
  fields: FormFieldDefinition[],
  sectionId: JobFormSectionId
): FormFieldDefinition[] {
  const sectionTitle = SECTION_TITLE_BY_ID[sectionId];
  return fields.filter(
    (field) => field.is_custom && field.is_active && field.section === sectionTitle
  );
}
