/** Structured timeline / history entries on candidate profiles. */

export type WorkExperienceEntry = {
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
  skills: string[];
};

export type EducationHistoryEntry = {
  school: string;
  degree: string;
  /** Filled when degree is "Other". */
  degree_other: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  skills: string[];
};

export const OTHER_EXPERIENCE_KINDS = [
  { value: "volunteer", label: "Volunteering" },
  { value: "project", label: "Project" },
  { value: "extracurricular", label: "Extracurricular" },
  { value: "other", label: "Other" },
] as const;

export type OtherExperienceKind = (typeof OTHER_EXPERIENCE_KINDS)[number]["value"];

export type VolunteerExperienceEntry = {
  kind: OtherExperienceKind;
  organization: string;
  role: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
  skills: string[];
};

/** Skills attached to one education, job, or other-experience entry. */
export const ENTRY_SKILLS_MAX_COUNT = 10;

export const WORK_EXPERIENCE_MAX_COUNT = 15;
export const EDUCATION_HISTORY_MAX_COUNT = 10;
export const VOLUNTEER_EXPERIENCE_MAX_COUNT = 10;

export const DESIRED_JOB_TITLES_MAX_COUNT = 10;
export const DESIRED_JOB_TITLE_MAX_LENGTH = 80;
export const PREFERRED_LOCATIONS_MAX_COUNT = 10;
export const PREFERRED_LOCATION_MAX_LENGTH = 80;

export const HOME_ADDRESS_MAX_LENGTH = 200;
export const POSTAL_CODE_MAX_LENGTH = 16;
export const HISTORY_COMPANY_MAX_LENGTH = 120;
export const HISTORY_TITLE_MAX_LENGTH = 120;
export const HISTORY_SCHOOL_MAX_LENGTH = 160;
export const HISTORY_ORG_MAX_LENGTH = 160;
export const HISTORY_DESCRIPTION_MAX_LENGTH = 2000;

/** Minimum age for platform accounts (years). */
export const DATE_OF_BIRTH_MIN_AGE = 16;
/** Maximum plausible age for validation. */
export const DATE_OF_BIRTH_MAX_AGE = 100;

export const EMPTY_WORK_EXPERIENCE: WorkExperienceEntry = {
  company: "",
  title: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
  skills: [],
};

export const EMPTY_EDUCATION: EducationHistoryEntry = {
  school: "",
  degree: "",
  degree_other: "",
  field_of_study: "",
  start_date: "",
  end_date: "",
  is_current: false,
  skills: [],
};

export const EMPTY_VOLUNTEER: VolunteerExperienceEntry = {
  kind: "volunteer",
  organization: "",
  role: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
  skills: [],
};

export function otherExperienceKindLabel(kind: OtherExperienceKind): string {
  return OTHER_EXPERIENCE_KINDS.find((item) => item.value === kind)?.label ?? "Other";
}

export function otherExperienceFieldLabels(kind: OtherExperienceKind): {
  name: string;
  role: string;
  namePlaceholder: string;
  current: string;
} {
  if (kind === "project") {
    return {
      name: "Project",
      role: "Your role",
      namePlaceholder: "Project or piece of work",
      current: "I'm currently working on this",
    };
  }
  if (kind === "extracurricular") {
    return {
      name: "Organisation or club",
      role: "Role",
      namePlaceholder: "Club, team, or activity",
      current: "I currently do this",
    };
  }
  if (kind === "other") {
    return {
      name: "Name",
      role: "Role",
      namePlaceholder: "What this was",
      current: "I currently do this",
    };
  }
  return {
    name: "Organisation",
    role: "Role",
    namePlaceholder: "Charity, community group, or cause",
    current: "I currently volunteer here",
  };
}
