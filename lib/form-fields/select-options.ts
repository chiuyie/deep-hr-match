import {
  AVAILABILITY_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  HIGHEST_EDUCATION_OPTIONS,
  WORK_ARRANGEMENT_OPTIONS,
} from "@/lib/constants/candidate-profile-options";
import type { FormFieldDefinition } from "@/lib/form-fields/types";

/** Built-in profile select defaults used when DB options are empty. */
export const DEFAULT_SELECT_OPTIONS_BY_KEY: Record<string, readonly string[]> = {
  highest_education: HIGHEST_EDUCATION_OPTIONS,
  employment_type_preference: EMPLOYMENT_TYPE_OPTIONS,
  work_arrangement_preference: WORK_ARRANGEMENT_OPTIONS,
  availability: AVAILABILITY_OPTIONS,
};

export function normalizeSelectOptions(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const cleaned = raw
    .map((item) => (typeof item === "string" ? item.trim() : String(item ?? "").trim()))
    .filter(Boolean);
  // Dedupe while preserving order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const item of cleaned) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique.length > 0 ? unique : null;
}

export function parseOptionsText(text: string): string[] {
  return normalizeSelectOptions(text.split(/\r?\n/)) ?? [];
}

export function optionsToText(options: string[] | null | undefined): string {
  return (options ?? []).join("\n");
}

export function parseOptionsFromFormValue(raw: FormDataEntryValue | null | undefined): string[] | null {
  if (raw == null || raw === "") return null;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("[")) {
    try {
      return normalizeSelectOptions(JSON.parse(trimmed));
    } catch {
      return parseOptionsText(trimmed);
    }
  }
  return normalizeSelectOptions(trimmed.split(/\r?\n/));
}

export function resolveSelectOptions(
  field: Pick<FormFieldDefinition, "field_key" | "options" | "field_type">
): string[] {
  if (field.options && field.options.length > 0) return field.options;
  return [...(DEFAULT_SELECT_OPTIONS_BY_KEY[field.field_key] ?? [])];
}
