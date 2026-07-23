import type { FormFieldDefinition } from "@/lib/form-fields/types";

export type ProfileSectionDef = {
  id: string;
  title: string;
  description: string;
  /** Built-in field keys that belong in this section by default. */
  fieldKeys: string[];
};

/** Candidate profile sections — must match the candidate profile UI. */
export const CANDIDATE_PROFILE_SECTIONS: ProfileSectionDef[] = [
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

export const CANDIDATE_ADDITIONAL_SECTION: ProfileSectionDef = {
  id: "additional",
  title: "Additional information",
  description: "Extra details requested for your profile.",
  fieldKeys: [],
};

/** Employer company profile sections — must match the employer company UI. */
export const EMPLOYER_PROFILE_SECTIONS: ProfileSectionDef[] = [
  {
    id: "company",
    title: "Company details",
    description: "Core company information shown across your jobs.",
    fieldKeys: [
      "company_name",
      "registration_number",
      "industry",
      "company_size",
      "website",
      "company_description",
    ],
  },
  {
    id: "contact",
    title: "Contact person",
    description: "Who candidates and Deep HR Match should reach for this account.",
    fieldKeys: ["contact_person_name", "contact_person_email", "contact_person_phone"],
  },
];

export const EMPLOYER_ADDITIONAL_SECTION: ProfileSectionDef = {
  id: "additional",
  title: "Additional information",
  description: "Extra company fields for your employer profile.",
  fieldKeys: [],
};

const CANDIDATE_SECTION_BY_KEY = new Map(
  CANDIDATE_PROFILE_SECTIONS.flatMap((section) =>
    section.fieldKeys.map((key) => [key, section.title] as const)
  )
);

const EMPLOYER_SECTION_BY_KEY = new Map(
  EMPLOYER_PROFILE_SECTIONS.flatMap((section) =>
    section.fieldKeys.map((key) => [key, section.title] as const)
  )
);

export function candidateProfileSectionTitles(): string[] {
  return [
    ...CANDIDATE_PROFILE_SECTIONS.map((s) => s.title),
    CANDIDATE_ADDITIONAL_SECTION.title,
  ];
}

export function employerProfileSectionTitles(): string[] {
  return [
    ...EMPLOYER_PROFILE_SECTIONS.map((s) => s.title),
    EMPLOYER_ADDITIONAL_SECTION.title,
  ];
}

export function defaultCandidateSectionForKey(fieldKey: string): string {
  return CANDIDATE_SECTION_BY_KEY.get(fieldKey) ?? CANDIDATE_ADDITIONAL_SECTION.title;
}

export function defaultEmployerSectionForKey(fieldKey: string): string {
  return EMPLOYER_SECTION_BY_KEY.get(fieldKey) ?? EMPLOYER_ADDITIONAL_SECTION.title;
}

const LEGACY_PROFILE_SECTIONS = new Set([
  "Candidate Profile",
  "Company Profile",
  "Employer Information",
]);

function resolveSectionTitle(
  field: FormFieldDefinition,
  defaultForKey: (key: string) => string
): string {
  const section = field.section?.trim();
  if (section && !LEGACY_PROFILE_SECTIONS.has(section)) {
    return section;
  }
  // Legacy single-bucket seeds ("Candidate Profile" / "Company Profile").
  return defaultForKey(field.field_key);
}

export function groupProfileFieldsByUiSections(
  fields: FormFieldDefinition[],
  defs: ProfileSectionDef[],
  additional: ProfileSectionDef,
  defaultForKey: (key: string) => string,
  sectionOrder?: string[]
): Array<ProfileSectionDef & { fields: FormFieldDefinition[] }> {
  const active = fields.filter((f) => f.is_active);
  const buckets = new Map<string, FormFieldDefinition[]>();
  const descriptionByTitle = new Map(
    [...defs, additional].map((def) => [def.title, def.description] as const)
  );

  for (const field of active) {
    const title = resolveSectionTitle(field, defaultForKey);
    const list = buckets.get(title) ?? [];
    list.push(field);
    buckets.set(title, list);
  }

  const preferred =
    sectionOrder && sectionOrder.length > 0
      ? sectionOrder
      : [...defs.map((d) => d.title), additional.title];

  const ordered: Array<ProfileSectionDef & { fields: FormFieldDefinition[] }> = [];
  const seen = new Set<string>();

  for (const title of preferred) {
    seen.add(title);
    const sectionFields = (buckets.get(title) ?? []).sort(
      (a, b) => a.sort_order - b.sort_order
    );
    buckets.delete(title);
    if (sectionFields.length === 0) continue;
    const def = defs.find((d) => d.title === title) ?? (title === additional.title ? additional : null);
    ordered.push({
      id: def?.id ?? slugSectionId(title),
      title,
      description: descriptionByTitle.get(title) ?? def?.description ?? "Extra details for this profile.",
      fieldKeys: def?.fieldKeys ?? [],
      fields: sectionFields,
    });
  }

  for (const [title, sectionFields] of buckets) {
    if (seen.has(title)) continue;
    ordered.push({
      id: slugSectionId(title),
      title,
      description: descriptionByTitle.get(title) ?? "Extra details for this profile.",
      fieldKeys: [],
      fields: sectionFields.sort((a, b) => a.sort_order - b.sort_order),
    });
  }

  return ordered;
}

function slugSectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "section";
}

export function groupCandidateProfileFieldsByUiSections(
  fields: FormFieldDefinition[],
  sectionOrder?: string[]
) {
  return groupProfileFieldsByUiSections(
    fields,
    CANDIDATE_PROFILE_SECTIONS,
    CANDIDATE_ADDITIONAL_SECTION,
    defaultCandidateSectionForKey,
    sectionOrder
  );
}

export function groupEmployerProfileFieldsByUiSections(
  fields: FormFieldDefinition[],
  sectionOrder?: string[]
) {
  return groupProfileFieldsByUiSections(
    fields,
    EMPLOYER_PROFILE_SECTIONS,
    EMPLOYER_ADDITIONAL_SECTION,
    defaultEmployerSectionForKey,
    sectionOrder
  );
}

/** Ordered section groups for admin, including empty sections so admins can add into them. */
export function buildAdminProfileSectionGroups(
  fields: FormFieldDefinition[],
  defs: ProfileSectionDef[],
  additional: ProfileSectionDef,
  defaultForKey: (key: string) => string,
  sectionOrder?: string[]
): Array<{ section: string; fields: FormFieldDefinition[] }> {
  const all = [...fields];
  const buckets = new Map<string, FormFieldDefinition[]>();

  for (const field of all) {
    const title = resolveSectionTitle(field, defaultForKey);
    const list = buckets.get(title) ?? [];
    list.push(field);
    buckets.set(title, list);
  }

  const titles =
    sectionOrder && sectionOrder.length > 0
      ? sectionOrder
      : [...defs.map((d) => d.title), additional.title];

  const ordered: Array<{ section: string; fields: FormFieldDefinition[] }> = [];
  const seen = new Set<string>();

  for (const title of titles) {
    seen.add(title);
    ordered.push({
      section: title,
      fields: (buckets.get(title) ?? []).sort((a, b) => a.sort_order - b.sort_order),
    });
    buckets.delete(title);
  }

  for (const [title, sectionFields] of buckets) {
    if (seen.has(title)) continue;
    ordered.push({
      section: title,
      fields: sectionFields.sort((a, b) => a.sort_order - b.sort_order),
    });
  }

  return ordered;
}
