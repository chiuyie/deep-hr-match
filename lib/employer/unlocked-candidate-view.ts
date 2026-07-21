import { loadFormFields } from "@/lib/form-fields/queries";
import { getUnlockedCandidateDetails } from "@/lib/auth/unlock";
import type { FormFieldDefinition } from "@/lib/form-fields/types";

function formatFieldValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    const filtered = value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
    return filtered.length ? filtered.join(", ") : null;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const text = String(value).trim();
  return text ? text : null;
}

function getCandidateFieldValue(
  field: FormFieldDefinition,
  profile: Record<string, unknown> | null | undefined
) {
  if (!profile) return null;

  if (field.is_custom) {
    const customFields =
      (profile.custom_fields as Record<string, unknown> | null | undefined) ?? undefined;
    return formatFieldValue(customFields?.[field.field_key]);
  }

  return formatFieldValue(profile[field.field_key]);
}

export interface EmployerVisibleCandidateField {
  id: string;
  section: string;
  label: string;
  field_key: string;
  employer_disclosure_mode: FormFieldDefinition["employer_disclosure_mode"];
  value: string | null;
}

export async function getEmployerUnlockedCandidateView(
  employerId: string,
  jobId: string,
  candidateId: string
) {
  const [details, candidateFields] = await Promise.all([
    getUnlockedCandidateDetails(employerId, jobId, candidateId),
    loadFormFields({ audience: "candidate", formGroup: "profile", includeInactive: false }),
  ]);

  const profileRecord =
    (details.profile as unknown as Record<string, unknown> | null | undefined) ?? undefined;

  const visibleFields: EmployerVisibleCandidateField[] = candidateFields
    .filter((field) => field.employer_disclosure_mode !== "admin_removed")
    .map((field) => ({
      id: field.id,
      section: field.section,
      label: field.label,
      field_key: field.field_key,
      employer_disclosure_mode: field.employer_disclosure_mode,
      value: getCandidateFieldValue(field, profileRecord),
    }));

  return {
    ...details,
    visibleFields,
  };
}
