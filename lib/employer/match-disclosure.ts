import type { FormFieldDefinition } from "@/lib/form-fields/types";

const DEFAULT_ANONYMOUS_FIELD_KEYS = new Set([
  "years_of_experience",
  "highest_education",
  "skills",
]);

export function defaultShowOnAnonymousMatch(fieldKey: string) {
  return DEFAULT_ANONYMOUS_FIELD_KEYS.has(fieldKey);
}

export function formatCandidateFieldValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    const filtered = value
      .map((item) => {
        if (item && typeof item === "object" && "language" in item) {
          const entry = item as { language?: unknown; proficiency?: unknown };
          const language = String(entry.language ?? "").trim();
          if (!language) return "";
          const proficiency = String(entry.proficiency ?? "").trim();
          return proficiency ? `${language} (${proficiency})` : language;
        }
        return String(item ?? "").trim();
      })
      .filter(Boolean);
    return filtered.length ? filtered.join(", ") : null;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const text = String(value).trim();
  return text ? text : null;
}

export function getCandidateFieldRawValue(
  field: FormFieldDefinition,
  profile: Record<string, unknown> | null | undefined
): unknown {
  if (!profile) return null;
  if (field.is_custom) {
    const customFields =
      (profile.custom_fields as Record<string, unknown> | null | undefined) ?? undefined;
    return customFields?.[field.field_key] ?? null;
  }
  return profile[field.field_key] ?? null;
}

export function getCandidateFieldDisplayValue(
  field: FormFieldDefinition,
  profile: Record<string, unknown> | null | undefined
) {
  return formatCandidateFieldValue(getCandidateFieldRawValue(field, profile));
}

/** Fields allowed on anonymized match rankings (before unlock). */
export function getAnonymousMatchVisibleFields(fields: FormFieldDefinition[]) {
  return fields.filter(
    (field) =>
      field.is_active &&
      field.audience === "candidate" &&
      field.form_group === "profile" &&
      field.show_on_anonymous_match
  );
}

/** Fields allowed on unlocked profile / match report surfaces. */
export function getUnlockedVisibleFields(fields: FormFieldDefinition[]) {
  return fields.filter(
    (field) =>
      field.is_active &&
      field.audience === "candidate" &&
      field.form_group === "profile" &&
      field.employer_disclosure_mode !== "admin_removed"
  );
}

export function buildAnonymousPreviewFields(
  fields: FormFieldDefinition[],
  profile: Record<string, unknown> | null | undefined
) {
  return getAnonymousMatchVisibleFields(fields).map((field) => ({
    key: field.field_key,
    label: field.label,
    value: getCandidateFieldDisplayValue(field, profile),
  }));
}

export function isUnlockedContactFieldVisible(
  fields: FormFieldDefinition[],
  fieldKey: "full_name" | "email" | "phone"
) {
  const field = fields.find((item) => item.field_key === fieldKey);
  if (!field) return true;
  return field.employer_disclosure_mode !== "admin_removed";
}
