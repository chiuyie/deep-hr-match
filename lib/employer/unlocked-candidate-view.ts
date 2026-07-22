import { loadFormFields } from "@/lib/form-fields/queries";
import { getUnlockedCandidateDetails } from "@/lib/auth/unlock";
import {
  getCandidateFieldDisplayValue,
  getUnlockedVisibleFields,
  isUnlockedContactFieldVisible,
} from "@/lib/employer/match-disclosure";
import type { FormFieldDefinition } from "@/lib/form-fields/types";

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

  const visibleFields: EmployerVisibleCandidateField[] = getUnlockedVisibleFields(candidateFields).map(
    (field) => ({
      id: field.id,
      section: field.section,
      label: field.label,
      field_key: field.field_key,
      employer_disclosure_mode: field.employer_disclosure_mode,
      value: getCandidateFieldDisplayValue(field, profileRecord),
    })
  );

  const showName = isUnlockedContactFieldVisible(candidateFields, "full_name");
  const showEmail = isUnlockedContactFieldVisible(candidateFields, "email");
  const showPhone = isUnlockedContactFieldVisible(candidateFields, "phone");

  return {
    ...details,
    displayName: showName ? details.profile?.full_name ?? "Candidate" : "Candidate",
    displayEmail: showEmail ? details.profile?.email ?? null : null,
    displayPhone: showPhone ? details.profile?.phone ?? null : null,
    visibleFields,
  };
}
