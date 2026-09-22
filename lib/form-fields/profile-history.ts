/**
 * Parse / validate candidate timeline fields (work, education, volunteer)
 * and related scalars (address, DOB, desired titles, preferred locations).
 */

import {
  DATE_OF_BIRTH_MAX_AGE,
  DATE_OF_BIRTH_MIN_AGE,
  DESIRED_JOB_TITLE_MAX_LENGTH,
  DESIRED_JOB_TITLES_MAX_COUNT,
  EDUCATION_HISTORY_MAX_COUNT,
  HOME_ADDRESS_MAX_LENGTH,
  POSTAL_CODE_MAX_LENGTH,
  PREFERRED_LOCATION_MAX_LENGTH,
  PREFERRED_LOCATIONS_MAX_COUNT,
  VOLUNTEER_EXPERIENCE_MAX_COUNT,
  WORK_EXPERIENCE_MAX_COUNT,
  type EducationHistoryEntry,
  type VolunteerExperienceEntry,
  type WorkExperienceEntry,
} from "@/lib/constants/profile-history";
import {
  canonicalizeTag,
  collapseTagWhitespace,
  parseStringArrayInput,
  type TagListValidationResult,
} from "@/lib/form-fields/profile-tags";

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const POSTAL = /^[A-Za-z0-9][A-Za-z0-9 \-]{0,14}[A-Za-z0-9]?$/;

export type TimelineValidationResult<T> =
  | { ok: true; value: T[] }
  | { ok: false; message: string };

export type ScalarValidationResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

function trimStr(raw: unknown): string {
  if (raw == null) return "";
  return String(raw).replace(/\s+/g, " ").trim();
}

function rejectUnsafe(value: string, label: string): string | null {
  if (CONTROL.test(value)) return `${label} contains invalid characters.`;
  return null;
}

function parseJsonArray(raw: unknown): unknown[] {
  if (raw == null || raw === "") return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
  }
  return [];
}

function validYearMonth(value: string): boolean {
  if (!YEAR_MONTH.test(value)) return false;
  const [y, m] = value.split("-").map(Number);
  if (!y || !m || y < 1950 || y > 2100) return false;
  return true;
}

function monthOrder(a: string, b: string): number {
  return a.localeCompare(b);
}

function normalizeBool(raw: unknown): boolean {
  if (raw === true || raw === "true" || raw === "on" || raw === 1 || raw === "1") return true;
  return false;
}

export function parseWorkExperienceInput(raw: unknown): WorkExperienceEntry[] {
  return parseJsonArray(raw).map((item) => {
    const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      company: trimStr(row.company),
      title: trimStr(row.title),
      start_date: trimStr(row.start_date),
      end_date: trimStr(row.end_date),
      is_current: normalizeBool(row.is_current),
      description: trimStr(row.description),
    };
  });
}

export function parseEducationHistoryInput(raw: unknown): EducationHistoryEntry[] {
  return parseJsonArray(raw).map((item) => {
    const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      school: trimStr(row.school),
      degree: trimStr(row.degree),
      field_of_study: trimStr(row.field_of_study),
      start_date: trimStr(row.start_date),
      end_date: trimStr(row.end_date),
      is_current: normalizeBool(row.is_current),
    };
  });
}

export function parseVolunteerExperienceInput(raw: unknown): VolunteerExperienceEntry[] {
  return parseJsonArray(raw).map((item) => {
    const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      organization: trimStr(row.organization),
      role: trimStr(row.role),
      start_date: trimStr(row.start_date),
      end_date: trimStr(row.end_date),
      is_current: normalizeBool(row.is_current),
      description: trimStr(row.description),
    };
  });
}

function entryIsBlankWork(e: WorkExperienceEntry): boolean {
  return !e.company && !e.title && !e.start_date && !e.end_date && !e.description && !e.is_current;
}

function entryIsBlankEducation(e: EducationHistoryEntry): boolean {
  return (
    !e.school && !e.degree && !e.field_of_study && !e.start_date && !e.end_date && !e.is_current
  );
}

function entryIsBlankVolunteer(e: VolunteerExperienceEntry): boolean {
  return (
    !e.organization && !e.role && !e.start_date && !e.end_date && !e.description && !e.is_current
  );
}

function validateDateRange(
  start: string,
  end: string,
  isCurrent: boolean,
  label: string
): string | null {
  if (start && !validYearMonth(start)) {
    return `${label}: start month must be YYYY-MM.`;
  }
  if (!isCurrent && end && !validYearMonth(end)) {
    return `${label}: end month must be YYYY-MM.`;
  }
  if (start && !isCurrent && end && monthOrder(end, start) < 0) {
    return `${label}: end date cannot be before start date.`;
  }
  return null;
}

export function validateWorkExperienceList(
  raw: unknown,
  options: { required?: boolean; label?: string } = {}
): TimelineValidationResult<WorkExperienceEntry> {
  const label = options.label ?? "Work experience";
  const required = options.required ?? false;
  let entries = parseWorkExperienceInput(raw).filter((e) => !entryIsBlankWork(e));

  if (required && entries.length === 0) {
    return { ok: false, message: `${label} is required. Add at least one role.` };
  }
  if (entries.length > WORK_EXPERIENCE_MAX_COUNT) {
    return {
      ok: false,
      message: `${label} can have at most ${WORK_EXPERIENCE_MAX_COUNT} entries.`,
    };
  }

  const cleaned: WorkExperienceEntry[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    const n = i + 1;
    if (!e.company) return { ok: false, message: `${label} #${n}: company is required.` };
    if (!e.title) return { ok: false, message: `${label} #${n}: job title is required.` };
    if (e.company.length > 120) {
      return { ok: false, message: `${label} #${n}: company is too long.` };
    }
    if (e.title.length > 120) {
      return { ok: false, message: `${label} #${n}: title is too long.` };
    }
    if (e.description.length > 2000) {
      return { ok: false, message: `${label} #${n}: description is too long.` };
    }
    const unsafe =
      rejectUnsafe(e.company, `${label} #${n} company`) ??
      rejectUnsafe(e.title, `${label} #${n} title`) ??
      rejectUnsafe(e.description, `${label} #${n} description`);
    if (unsafe) return { ok: false, message: unsafe };
    if (!e.start_date) {
      return { ok: false, message: `${label} #${n}: start date is required.` };
    }
    const range = validateDateRange(e.start_date, e.end_date, e.is_current, `${label} #${n}`);
    if (range) return { ok: false, message: range };
    cleaned.push({
      company: e.company,
      title: e.title,
      start_date: e.start_date,
      end_date: e.is_current ? "" : e.end_date,
      is_current: e.is_current,
      description: e.description,
    });
  }
  return { ok: true, value: cleaned };
}

export function validateEducationHistoryList(
  raw: unknown,
  options: { required?: boolean; label?: string } = {}
): TimelineValidationResult<EducationHistoryEntry> {
  const label = options.label ?? "Education history";
  const required = options.required ?? false;
  let entries = parseEducationHistoryInput(raw).filter((e) => !entryIsBlankEducation(e));

  if (required && entries.length === 0) {
    return { ok: false, message: `${label} is required. Add at least one school.` };
  }
  if (entries.length > EDUCATION_HISTORY_MAX_COUNT) {
    return {
      ok: false,
      message: `${label} can have at most ${EDUCATION_HISTORY_MAX_COUNT} entries.`,
    };
  }

  const cleaned: EducationHistoryEntry[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    const n = i + 1;
    if (!e.school) return { ok: false, message: `${label} #${n}: school is required.` };
    if (!e.degree) return { ok: false, message: `${label} #${n}: degree is required.` };
    if (e.school.length > 160 || e.degree.length > 120 || e.field_of_study.length > 120) {
      return { ok: false, message: `${label} #${n}: a field is too long.` };
    }
    const unsafe =
      rejectUnsafe(e.school, `${label} #${n} school`) ??
      rejectUnsafe(e.degree, `${label} #${n} degree`) ??
      rejectUnsafe(e.field_of_study, `${label} #${n} field`);
    if (unsafe) return { ok: false, message: unsafe };
    if (!e.start_date) {
      return { ok: false, message: `${label} #${n}: start date is required.` };
    }
    const range = validateDateRange(e.start_date, e.end_date, e.is_current, `${label} #${n}`);
    if (range) return { ok: false, message: range };
    cleaned.push({
      school: e.school,
      degree: e.degree,
      field_of_study: e.field_of_study,
      start_date: e.start_date,
      end_date: e.is_current ? "" : e.end_date,
      is_current: e.is_current,
    });
  }
  return { ok: true, value: cleaned };
}

export function validateVolunteerExperienceList(
  raw: unknown,
  options: { required?: boolean; label?: string } = {}
): TimelineValidationResult<VolunteerExperienceEntry> {
  const label = options.label ?? "Volunteer experience";
  const required = options.required ?? false;
  let entries = parseVolunteerExperienceInput(raw).filter((e) => !entryIsBlankVolunteer(e));

  if (required && entries.length === 0) {
    return { ok: false, message: `${label} is required.` };
  }
  if (entries.length > VOLUNTEER_EXPERIENCE_MAX_COUNT) {
    return {
      ok: false,
      message: `${label} can have at most ${VOLUNTEER_EXPERIENCE_MAX_COUNT} entries.`,
    };
  }

  const cleaned: VolunteerExperienceEntry[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    const n = i + 1;
    if (!e.organization) {
      return { ok: false, message: `${label} #${n}: organization is required.` };
    }
    if (!e.role) return { ok: false, message: `${label} #${n}: role is required.` };
    if (e.organization.length > 160 || e.role.length > 120 || e.description.length > 2000) {
      return { ok: false, message: `${label} #${n}: a field is too long.` };
    }
    const unsafe =
      rejectUnsafe(e.organization, `${label} #${n} organization`) ??
      rejectUnsafe(e.role, `${label} #${n} role`) ??
      rejectUnsafe(e.description, `${label} #${n} description`);
    if (unsafe) return { ok: false, message: unsafe };
    if (!e.start_date) {
      return { ok: false, message: `${label} #${n}: start date is required.` };
    }
    const range = validateDateRange(e.start_date, e.end_date, e.is_current, `${label} #${n}`);
    if (range) return { ok: false, message: range };
    cleaned.push({
      organization: e.organization,
      role: e.role,
      start_date: e.start_date,
      end_date: e.is_current ? "" : e.end_date,
      is_current: e.is_current,
      description: e.description,
    });
  }
  return { ok: true, value: cleaned };
}

export function serializeTimelineForForm(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value ?? []);
}

export function validateHomeAddress(
  raw: unknown,
  options: { required?: boolean; label?: string } = {}
): ScalarValidationResult {
  const label = options.label ?? "Home address";
  const value = collapseTagWhitespace(String(raw ?? ""));
  if (!value) {
    if (options.required) return { ok: false, message: `${label} is required.` };
    return { ok: true, value: "" };
  }
  const unsafe = rejectUnsafe(value, label);
  if (unsafe) return { ok: false, message: unsafe };
  if (value.length > HOME_ADDRESS_MAX_LENGTH) {
    return { ok: false, message: `${label} must be at most ${HOME_ADDRESS_MAX_LENGTH} characters.` };
  }
  if (value.length < 5) {
    return { ok: false, message: `${label} looks too short.` };
  }
  return { ok: true, value };
}

export function validatePostalCode(
  raw: unknown,
  options: { required?: boolean; label?: string } = {}
): ScalarValidationResult {
  const label = options.label ?? "Postal code";
  const value = trimStr(raw);
  if (!value) {
    if (options.required) return { ok: false, message: `${label} is required.` };
    return { ok: true, value: "" };
  }
  if (value.length > POSTAL_CODE_MAX_LENGTH || !POSTAL.test(value)) {
    return {
      ok: false,
      message: `${label} may only include letters, numbers, spaces, and hyphens.`,
    };
  }
  return { ok: true, value: value.toUpperCase() };
}

export function validateDateOfBirth(
  raw: unknown,
  options: { required?: boolean; label?: string } = {}
): ScalarValidationResult {
  const label = options.label ?? "Date of birth";
  const value = trimStr(raw);
  if (!value) {
    if (options.required) return { ok: false, message: `${label} is required.` };
    return { ok: true, value: "" };
  }
  if (!ISO_DATE.test(value)) {
    return { ok: false, message: `${label} must be a valid date.` };
  }
  const dob = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) {
    return { ok: false, message: `${label} must be a valid date.` };
  }
  const today = new Date();
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const m = today.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < dob.getUTCDate())) age -= 1;
  if (age < DATE_OF_BIRTH_MIN_AGE) {
    return {
      ok: false,
      message: `You must be at least ${DATE_OF_BIRTH_MIN_AGE} years old.`,
    };
  }
  if (age > DATE_OF_BIRTH_MAX_AGE) {
    return { ok: false, message: `${label} looks invalid.` };
  }
  return { ok: true, value };
}

export function validateDesiredJobTitlesList(
  raw: unknown,
  options: { required?: boolean; label?: string } = {}
): TagListValidationResult {
  const label = options.label ?? "Desired job titles";
  const required = options.required ?? false;
  const tags = parseStringArrayInput(raw).map((t) =>
    canonicalizeTag(t, []).slice(0, DESIRED_JOB_TITLE_MAX_LENGTH)
  );
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    unique.push(tag);
  }
  if (required && unique.length === 0) {
    return { ok: false, message: `${label} is required.` };
  }
  if (unique.length > DESIRED_JOB_TITLES_MAX_COUNT) {
    return {
      ok: false,
      message: `${label} can have at most ${DESIRED_JOB_TITLES_MAX_COUNT} titles.`,
    };
  }
  for (const tag of unique) {
    const unsafe = rejectUnsafe(tag, label);
    if (unsafe) return { ok: false, message: unsafe };
  }
  return { ok: true, value: unique };
}

export function validatePreferredLocationsList(
  raw: unknown,
  options: { required?: boolean; label?: string } = {}
): TagListValidationResult {
  const label = options.label ?? "Preferred locations";
  const required = options.required ?? false;
  const tags = parseStringArrayInput(raw).map((t) =>
    canonicalizeTag(t, []).slice(0, PREFERRED_LOCATION_MAX_LENGTH)
  );
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    unique.push(tag);
  }
  if (required && unique.length === 0) {
    return { ok: false, message: `${label} is required.` };
  }
  if (unique.length > PREFERRED_LOCATIONS_MAX_COUNT) {
    return {
      ok: false,
      message: `${label} can have at most ${PREFERRED_LOCATIONS_MAX_COUNT} locations.`,
    };
  }
  for (const tag of unique) {
    const unsafe = rejectUnsafe(tag, label);
    if (unsafe) return { ok: false, message: unsafe };
  }
  return { ok: true, value: unique };
}

/** True when a timeline / tag list field has at least one meaningful entry. */
export function isHistoryFieldFilled(fieldKey: string, value: unknown): boolean {
  switch (fieldKey) {
    case "work_experience":
      return parseWorkExperienceInput(value).some((e) => !entryIsBlankWork(e));
    case "education_history":
      return parseEducationHistoryInput(value).some((e) => !entryIsBlankEducation(e));
    case "volunteer_experience":
      return parseVolunteerExperienceInput(value).some((e) => !entryIsBlankVolunteer(e));
    case "desired_job_titles":
    case "preferred_locations":
      return parseStringArrayInput(value).length > 0;
    default:
      return value !== null && value !== undefined && value !== "";
  }
}
