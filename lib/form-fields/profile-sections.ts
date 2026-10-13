import type { FormFieldDefinition } from "@/lib/form-fields/types";

export type ProfileSectionDef = {
  id: string;
  title: string;
  description: string;
  /** Built-in field keys that belong in this section by default. */
  fieldKeys: string[];
  /** Start closed. The candidate can open it when a role needs these answers. */
  collapsed?: boolean;
};

/** Candidate profile sections — must match the candidate profile UI. */
export const CANDIDATE_PROFILE_SECTIONS: ProfileSectionDef[] = [
  {
    id: "about",
    title: "About you",
    description:
      "Who you are, how to reach you, and the languages you use. Contact details stay hidden until an employer unlocks your profile.",
    fieldKeys: [
      "full_name",
      "email",
      "phone",
      "date_of_birth",
      "gender",
      "country",
      "city",
      "postal_code",
      "home_address",
      "languages",
    ],
  },
  {
    id: "experience",
    title: "Experience: Work-Life",
    description:
      "Education first, then jobs, then volunteering, projects, and other experience. Add certificates after that.",
    fieldKeys: [
      "education_history",
      "work_experience",
      "volunteer_experience",
      "certifications",
    ],
  },
  {
    id: "compensation",
    title: "Compensation",
    description:
      "Shown after an employer unlocks your profile. Not used in the match score.",
    fieldKeys: ["current_salary", "expected_salary"],
  },
  {
    id: "preferences",
    title: "Job preferences",
    description:
      "Work arrangement and availability are used when an employer filters on them. Leave one blank and you will not match jobs that filter on it.",
    fieldKeys: ["work_arrangement_preference", "availability"],
  },
  {
    id: "nice-to-have",
    title: "Nice to have",
    description:
      "Shown on your profile after an employer unlocks you. These do not decide whether you appear in match results, and they do not change your match score.",
    fieldKeys: ["desired_job_titles", "preferred_locations", "employment_type_preference"],
  },
  {
    id: "matching-details",
    title: "Matching details",
    description:
      "Employers can require these before you are scored. Leave a field blank and you will not match jobs that filter on it.",
    fieldKeys: [
      "employment_eligibility_visa",
      "nationality",
      "ethnicity",
      "birth_country",
      "current_country_since",
      "dialect",
    ],
  },
  {
    id: "role-specific",
    title: "Only if the role needs it",
    description:
      "Religion, height, weight, and fitness. Employers rarely filter on these. If they do and you leave one blank, you will not match that job.",
    collapsed: true,
    fieldKeys: ["religion", "height", "weight", "fitness_level"],
  },
  {
    id: "role-requirements",
    title: "Role requirements",
    description:
      "Quick Yes / No answers help employers match you to roles with the right expectations.",
    fieldKeys: [
      "willing_overtime",
      "work_outside_standard_hours",
      "weekend_public_holiday_work",
      "driving_licence",
      "car_ownership",
      "work_related_travel",
      "willing_relocate",
      "willing_background_check",
      "accessibility_arrangements_required",
    ],
  },
];

export const CANDIDATE_ADDITIONAL_SECTION: ProfileSectionDef = {
  id: "additional",
  title: "Additional information",
  description: "Extra details requested for your profile.",
  fieldKeys: [],
};

/** Employer profile sections — must match the employer profile UI. */
export const EMPLOYER_PROFILE_SECTIONS: ProfileSectionDef[] = [
  {
    id: "company",
    title: "Employer details",
    description: "Core employer information shown across your jobs.",
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
  description: "Extra employer fields for your employer profile.",
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
  "Company details",
  "Employer Information",
]);

/** Rename stored section titles without requiring a DB reseed. */
const RENAMED_PROFILE_SECTIONS: Record<string, string> = {
  "Experience & skills": "Experience: Work-Life",
  "Experience & Skills": "Experience: Work-Life",
};

function resolveSectionTitle(
  field: FormFieldDefinition,
  defaultForKey: (key: string) => string
): string {
  const section = field.section?.trim();
  if (section && RENAMED_PROFILE_SECTIONS[section]) {
    return RENAMED_PROFILE_SECTIONS[section];
  }
  if (section && !LEGACY_PROFILE_SECTIONS.has(section)) {
    return section;
  }
  // Legacy single-bucket seeds ("Candidate Profile" / "Company Profile" / "Company details").
  return defaultForKey(field.field_key);
}

/** Built-in keys follow the section list so education, jobs, and other experience stay in order. */
function sectionTitleForField(
  field: FormFieldDefinition,
  defs: ProfileSectionDef[],
  defaultForKey: (key: string) => string
): string {
  for (const def of defs) {
    if (def.fieldKeys.includes(field.field_key)) return def.title;
  }
  return resolveSectionTitle(field, defaultForKey);
}

function sortSectionFields(
  fields: FormFieldDefinition[],
  fieldKeys: string[]
): FormFieldDefinition[] {
  const order = new Map(fieldKeys.map((key, index) => [key, index]));
  return [...fields].sort((a, b) => {
    const ai = order.get(a.field_key);
    const bi = order.get(b.field_key);
    if (ai != null && bi != null) return ai - bi;
    if (ai != null) return -1;
    if (bi != null) return 1;
    return a.sort_order - b.sort_order;
  });
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
    const title = sectionTitleForField(field, defs, defaultForKey);
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
    const def = defs.find((d) => d.title === title) ?? (title === additional.title ? additional : null);
    const sectionFields = sortSectionFields(buckets.get(title) ?? [], def?.fieldKeys ?? []);
    buckets.delete(title);
    if (sectionFields.length === 0) continue;
    ordered.push({
      id: def?.id ?? slugSectionId(title),
      title,
      description: descriptionByTitle.get(title) ?? def?.description ?? "Extra details for this profile.",
      fieldKeys: def?.fieldKeys ?? [],
      collapsed: def?.collapsed,
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

/** Inputs removed because the timelines already capture them. */
export const RETIRED_CANDIDATE_INPUT_KEYS = new Set([
  "current_job_title",
  "years_of_experience",
  "highest_education",
  "skills",
  "age_range",
  "race",
  "months_in_current_country",
]);

export function groupCandidateProfileFieldsByUiSections(
  fields: FormFieldDefinition[],
  sectionOrder?: string[]
) {
  return groupProfileFieldsByUiSections(
    fields.filter((field) => !RETIRED_CANDIDATE_INPUT_KEYS.has(field.field_key)),
    CANDIDATE_PROFILE_SECTIONS,
    CANDIDATE_ADDITIONAL_SECTION,
    defaultCandidateSectionForKey,
    sectionOrder
  ).map((section) => ({
    ...section,
    fields: section.fields.map((field) =>
      field.field_key === "date_of_birth" ? { ...field, is_required: true } : field
    ),
  }));
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
    const title = sectionTitleForField(field, defs, defaultForKey);
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
      fields: sortSectionFields(
        buckets.get(title) ?? [],
        defs.find((d) => d.title === title)?.fieldKeys ?? []
      ),
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
