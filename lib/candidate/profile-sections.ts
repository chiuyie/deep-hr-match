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
  return groupCandidateProfileFieldsByUiSections(fields, builtinCandidateSectionOrder(sectionOrder));
}

/** Keep built-in sections in product order even when an older saved order omits new ones. */
function builtinCandidateSectionOrder(sectionOrder?: string[]): string[] | undefined {
  if (!sectionOrder?.length) return undefined;
  const builtin = [
    ...CANDIDATE_PROFILE_SECTIONS.map((section) => section.title),
    CANDIDATE_ADDITIONAL_SECTION.title,
  ];
  const extras = sectionOrder.filter((title) => !builtin.includes(title));
  const additionalAt = builtin.indexOf(CANDIDATE_ADDITIONAL_SECTION.title);
  builtin.splice(additionalAt, 0, ...extras);
  return builtin;
}

export function profileFieldGroupTitle(fieldKey: string): string | undefined {
  const title = defaultCandidateSectionForKey(fieldKey);
  return title === CANDIDATE_ADDITIONAL_SECTION.title ? undefined : title;
}
