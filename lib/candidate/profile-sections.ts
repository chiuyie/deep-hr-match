import type { FormFieldDefinition } from "@/lib/form-fields/types";
import {
  CANDIDATE_ADDITIONAL_SECTION,
  CANDIDATE_PROFILE_SECTIONS,
  defaultCandidateSectionForKey,
  groupCandidateProfileFieldsByUiSections,
  type ProfileSectionDef,
} from "@/lib/form-fields/profile-sections";

export const PROFILE_COMPLETION_THRESHOLD = 60;

export type CandidateProfileSectionDef = ProfileSectionDef;

export const CANDIDATE_PROFILE_SECTION_DEFS = CANDIDATE_PROFILE_SECTIONS;

export function groupCandidateProfileFields(
  fields: FormFieldDefinition[],
  sectionOrder?: string[]
): Array<CandidateProfileSectionDef & { fields: FormFieldDefinition[] }> {
  return groupCandidateProfileFieldsByUiSections(fields, sectionOrder);
}

export function profileFieldGroupTitle(fieldKey: string): string | undefined {
  const title = defaultCandidateSectionForKey(fieldKey);
  return title === CANDIDATE_ADDITIONAL_SECTION.title ? undefined : title;
}
