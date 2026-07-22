import type { FormFieldDefinition } from "@/lib/form-fields/types";

export const PROFILE_COMPLETION_THRESHOLD = 60;

export type CandidateProfileSectionDef = {
  id: string;
  title: string;
  description: string;
  /** Built-in field keys; custom fields are appended to the last section. */
  fieldKeys: string[];
};

export const CANDIDATE_PROFILE_SECTION_DEFS: CandidateProfileSectionDef[] = [
  {
    id: "about",
    title: "About you",
    description: "Contact details employers may see after they unlock your profile.",
    fieldKeys: ["full_name", "email", "phone", "country", "city"],
  },
  {
    id: "experience",
    title: "Experience & skills",
    description: "Your background helps us rank you against the right roles.",
    fieldKeys: [
      "current_job_title",
      "years_of_experience",
      "highest_education",
      "skills",
      "certifications",
      "languages",
    ],
  },
  {
    id: "compensation",
    title: "Compensation",
    description: "Optional — improves salary fit. You can leave blanks if you prefer.",
    fieldKeys: ["current_salary", "expected_salary"],
  },
  {
    id: "preferences",
    title: "Job preferences",
    description: "Tell us how and when you’d like to work.",
    fieldKeys: [
      "employment_type_preference",
      "work_arrangement_preference",
      "availability",
    ],
  },
];

const LABEL_BY_KEY = new Map(
  CANDIDATE_PROFILE_SECTION_DEFS.flatMap((section) =>
    section.fieldKeys.map((key) => [key, section.title] as const)
  )
);

export function groupCandidateProfileFields(
  fields: FormFieldDefinition[]
): Array<CandidateProfileSectionDef & { fields: FormFieldDefinition[] }> {
  const active = fields.filter((f) => f.is_active);
  const byKey = new Map(active.map((f) => [f.field_key, f]));
  const used = new Set<string>();

  const sections: Array<CandidateProfileSectionDef & { fields: FormFieldDefinition[] }> = [];

  for (const def of CANDIDATE_PROFILE_SECTION_DEFS) {
    const sectionFields: FormFieldDefinition[] = [];
    for (const key of def.fieldKeys) {
      const field = byKey.get(key);
      if (field) {
        sectionFields.push(field);
        used.add(key);
      }
    }
    if (sectionFields.length > 0) {
      sections.push({ ...def, fields: sectionFields });
    }
  }

  const customFields = active.filter((f) => f.is_custom);
  const uncategorized = active.filter((f) => !f.is_custom && !used.has(f.field_key));

  if (uncategorized.length > 0 || customFields.length > 0) {
    sections.push({
      id: "additional",
      title: "Additional information",
      description: "Extra details requested for your profile.",
      fieldKeys: [],
      fields: [...uncategorized, ...customFields].sort(
        (a, b) => a.sort_order - b.sort_order
      ),
    });
  }

  return sections;
}

export function profileFieldGroupTitle(fieldKey: string): string | undefined {
  return LABEL_BY_KEY.get(fieldKey);
}
