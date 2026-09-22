/** Structured timeline / history entries on candidate profiles. */

export type WorkExperienceEntry = {
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
};

export type EducationHistoryEntry = {
  school: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
};

export type VolunteerExperienceEntry = {
  organization: string;
  role: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
};

export const WORK_EXPERIENCE_MAX_COUNT = 15;
export const EDUCATION_HISTORY_MAX_COUNT = 10;
export const VOLUNTEER_EXPERIENCE_MAX_COUNT = 10;

export const DESIRED_JOB_TITLES_MAX_COUNT = 10;
export const DESIRED_JOB_TITLE_MAX_LENGTH = 80;
export const PREFERRED_LOCATIONS_MAX_COUNT = 10;
export const PREFERRED_LOCATION_MAX_LENGTH = 80;

export const HOME_ADDRESS_MAX_LENGTH = 200;
export const POSTAL_CODE_MAX_LENGTH = 16;

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
};

export const EMPTY_EDUCATION: EducationHistoryEntry = {
  school: "",
  degree: "",
  field_of_study: "",
  start_date: "",
  end_date: "",
  is_current: false,
};

export const EMPTY_VOLUNTEER: VolunteerExperienceEntry = {
  organization: "",
  role: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
};
