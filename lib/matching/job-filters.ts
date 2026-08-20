import {
  JOB_BACKGROUND_QUESTIONS,
  JOB_ELIMINATION_FIELDS,
  JOB_FORM_NO_FILTER_VALUE,
} from "@/lib/constants/job-form";
import type { CandidateLanguageEntry } from "@/lib/constants/profile-tags";

export type JobFilterSource = {
  form_data?: Record<string, unknown> | null;
};

export type CandidateFilterSource = {
  id?: string;
  years_of_experience?: number | null;
  highest_education?: string | null;
  skills?: string[] | null;
  languages?: CandidateLanguageEntry[] | string[] | null;
  country?: string | null;
  city?: string | null;
  availability?: string | null;
  work_arrangement_preference?: string | null;
  custom_fields?: Record<string, unknown> | null;
};

const INACTIVE_FILTER_VALUES = new Set(
  ["", JOB_FORM_NO_FILTER_VALUE, "other", "n/a", "na", "none"].map((value) =>
    value.toLowerCase()
  )
);

/** Role FAQs that describe the job, not a candidate hard requirement. */
const JOB_DESCRIPTION_FAQS = new Set<string>();

const FILTER_FIELD_ALIASES: Record<string, string[]> = {
  required_availability: ["availability"],
  required_age: ["age", "age_range"],
  required_employment_eligibility_visa: [
    "employment_eligibility_visa",
    "visa_status",
    "work_pass",
  ],
  required_ethnicity: ["ethnicity"],
  required_gender: ["gender"],
  required_race: ["race"],
  required_religion: ["religion"],
  required_birth_country: ["birth_country"],
  required_current_country: ["country", "current_country"],
  required_current_city: ["city", "current_city"],
  required_months_in_current_country: [
    "months_in_current_country",
    "time_in_current_country",
  ],
  required_dialect: ["dialect"],
  required_height: ["height"],
  required_weight: ["weight"],
  required_fitness_level: ["fitness_level"],
  required_nationality: ["nationality"],
  not_required_nationality: ["nationality"],
  required_work_arrangement: ["work_arrangement_preference", "work_arrangement"],
  faq_driving_licence: ["driving_licence", "has_driving_licence"],
  faq_car_ownership: ["car_ownership", "owns_car"],
  faq_willing_overtime: ["willing_overtime"],
  faq_work_outside_standard_hours: ["work_outside_standard_hours"],
  faq_weekend_public_holiday_work: ["weekend_public_holiday_work"],
  faq_work_related_travel: ["work_related_travel", "travel_required"],
  faq_willing_relocate: ["willing_relocate"],
  faq_willing_background_check: ["willing_background_check"],
  faq_accessibility_arrangements_required: [
    "accessibility_arrangements_required",
    "needs_accessibility_arrangements",
  ],
};

const AVAILABILITY_DAYS: Record<string, number> = {
  immediate: 0,
  "1 week": 7,
  "2 weeks": 14,
  "1 month": 30,
  "2 months": 60,
  "3+ months": 90,
  "3 months": 90,
};

const DURATION_DAYS: Record<string, number> = {
  "0-6 months": 0,
  "6-12 months": 180,
  "1-2 years": 365,
  "2-3 years": 730,
  "3-5 years": 1095,
  "5-10 years": 1825,
  "10+ years": 3650,
};

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function isInactiveJobFilter(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "boolean") return false;
  if (Array.isArray(value)) return value.every((item) => isInactiveJobFilter(item));
  const text = normalize(value);
  return !text || INACTIVE_FILTER_VALUES.has(text);
}

function valuesEqual(jobValue: unknown, candidateValue: unknown): boolean {
  return normalize(jobValue) === normalize(candidateValue);
}

function readProfileColumn(
  candidate: CandidateFilterSource,
  key: string
): unknown {
  return (candidate as Record<string, unknown>)[key];
}

function readCustomField(candidate: CandidateFilterSource, key: string): unknown {
  return candidate.custom_fields?.[key];
}

export function readCandidateFilterValue(
  candidate: CandidateFilterSource,
  jobFieldKey: string
): unknown {
  const aliases = FILTER_FIELD_ALIASES[jobFieldKey] ?? [];
  const keys = [jobFieldKey, ...aliases];

  for (const key of keys) {
    const fromColumn = readProfileColumn(candidate, key);
    if (!isInactiveJobFilter(fromColumn) || fromColumn === false) return fromColumn;
    const fromCustom = readCustomField(candidate, key);
    if (!isInactiveJobFilter(fromCustom) || fromCustom === false) return fromCustom;
  }

  return null;
}

function availabilityDays(value: unknown): number | null {
  return AVAILABILITY_DAYS[normalize(value)] ?? null;
}

function durationDays(value: unknown): number | null {
  const key = normalize(value);
  return DURATION_DAYS[key] ?? null;
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  const text = normalize(value);
  if (["true", "yes", "y", "1"].includes(text)) return true;
  if (["false", "no", "n", "0"].includes(text)) return false;
  return null;
}

function candidateLanguages(candidate: CandidateFilterSource): string[] {
  return (candidate.languages ?? [])
    .map((entry) => {
      if (typeof entry === "string") return normalize(entry);
      return normalize(entry?.language);
    })
    .filter(Boolean);
}

function requiredLanguages(formData: Record<string, unknown>): string[] {
  const raw = formData.language_needs;
  if (Array.isArray(raw)) return raw.map((item) => String(item).trim()).filter(Boolean);
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function candidateHasLanguage(candidate: CandidateFilterSource, required: string): boolean {
  const need = normalize(required);
  return candidateLanguages(candidate).some((language) => language === need);
}

function meetsAvailability(jobValue: unknown, candidateValue: unknown): boolean {
  const jobDays = availabilityDays(jobValue);
  const candidateDays = availabilityDays(candidateValue);
  if (jobDays == null || candidateDays == null) {
    return valuesEqual(jobValue, candidateValue);
  }
  return candidateDays <= jobDays;
}

function meetsMinimumDuration(jobValue: unknown, candidateValue: unknown): boolean {
  const jobDays = durationDays(jobValue);
  const candidateDays = durationDays(candidateValue);
  if (jobDays == null || candidateDays == null) {
    return valuesEqual(jobValue, candidateValue);
  }
  return candidateDays >= jobDays;
}

function candidateHasFaqRequirement(
  candidate: CandidateFilterSource,
  faqKey: string
): boolean {
  const parsed = parseBoolean(readCandidateFilterValue(candidate, faqKey));
  return parsed === true;
}

export function candidateFailsJobFilter(
  job: JobFilterSource,
  candidate: CandidateFilterSource
): string | null {
  const formData = (job.form_data ?? {}) as Record<string, unknown>;

  for (const field of JOB_ELIMINATION_FIELDS) {
    const jobValue = formData[field.name];
    if (isInactiveJobFilter(jobValue)) continue;

    const candidateValue = readCandidateFilterValue(candidate, field.name);

    if (field.name === "not_required_nationality") {
      if (!isInactiveJobFilter(candidateValue) && valuesEqual(jobValue, candidateValue)) {
        return field.name;
      }
      continue;
    }

    if (isInactiveJobFilter(candidateValue) && candidateValue !== false) {
      return field.name;
    }

    if (field.name === "required_availability") {
      if (!meetsAvailability(jobValue, candidateValue)) return field.name;
      continue;
    }

    if (field.name === "required_months_in_current_country") {
      if (!meetsMinimumDuration(jobValue, candidateValue)) return field.name;
      continue;
    }

    if (!valuesEqual(jobValue, candidateValue)) return field.name;
  }

  for (const language of requiredLanguages(formData)) {
    if (!candidateHasLanguage(candidate, language)) return "language_needs";
  }

  for (const question of JOB_BACKGROUND_QUESTIONS) {
    if (JOB_DESCRIPTION_FAQS.has(question.name)) continue;
    const jobValue = parseBoolean(formData[question.name]);
    if (jobValue !== true) continue;
    if (!candidateHasFaqRequirement(candidate, question.name)) return question.name;
  }

  return null;
}

export function candidatePassesJobFilters(
  job: JobFilterSource,
  candidate: CandidateFilterSource
): boolean {
  return candidateFailsJobFilter(job, candidate) == null;
}

export function filterCandidatesForJob<T extends CandidateFilterSource>(
  job: JobFilterSource,
  candidates: T[]
): T[] {
  return candidates.filter((candidate) => candidatePassesJobFilters(job, candidate));
}
