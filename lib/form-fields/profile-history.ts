/**
 * Parse / validate candidate timeline fields (work, education, volunteer)
 * and related scalars (address, DOB, desired titles, preferred locations).
 */

import { HIGHEST_EDUCATION_OPTIONS } from "@/lib/constants/candidate-profile-options";
import { isSingaporeCountry, isSingaporePostalCode } from "@/lib/geo/sg-postal";
import { validateSkillsList } from "@/lib/form-fields/profile-tags";
import {
  DATE_OF_BIRTH_MAX_AGE,
  DATE_OF_BIRTH_MIN_AGE,
  DESIRED_JOB_TITLE_MAX_LENGTH,
  DESIRED_JOB_TITLES_MAX_COUNT,
  EDUCATION_HISTORY_MAX_COUNT,
  ENTRY_SKILLS_MAX_COUNT,
  HISTORY_COMPANY_MAX_LENGTH,
  HISTORY_DESCRIPTION_MAX_LENGTH,
  HISTORY_ORG_MAX_LENGTH,
  HISTORY_SCHOOL_MAX_LENGTH,
  HISTORY_TITLE_MAX_LENGTH,
  HOME_ADDRESS_MAX_LENGTH,
  POSTAL_CODE_MAX_LENGTH,
  PREFERRED_LOCATION_MAX_LENGTH,
  PREFERRED_LOCATIONS_MAX_COUNT,
  OTHER_EXPERIENCE_KINDS,
  VOLUNTEER_EXPERIENCE_MAX_COUNT,
  WORK_EXPERIENCE_MAX_COUNT,
  type EducationHistoryEntry,
  type OtherExperienceKind,
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

const EDUCATION_LEVEL_RANK: Record<string, number> = {
  "Secondary / High school": 1,
  "Diploma / Polytechnic": 2,
  "Professional certification": 3,
  "Bachelor's degree": 4,
  "Master's degree": 5,
  "Doctorate / PhD": 6,
};

function parseSkillList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => trimStr(item)).filter(Boolean);
}

function validateEntrySkills(skills: string[], label: string): { ok: true; value: string[] } | { ok: false; message: string } {
  if (skills.length > ENTRY_SKILLS_MAX_COUNT) {
    return {
      ok: false,
      message: `${label} can list at most ${ENTRY_SKILLS_MAX_COUNT} skills.`,
    };
  }
  const result = validateSkillsList(skills, { label });
  if (result.ok === false) return { ok: false, message: result.message };
  return { ok: true, value: result.value };
}

function normalizeDegree(raw: unknown, otherRaw: unknown): { degree: string; degree_other: string } {
  const degree = trimStr(raw);
  const degreeOther = trimStr(otherRaw);
  if (!degree && !degreeOther) return { degree: "", degree_other: "" };
  if ((HIGHEST_EDUCATION_OPTIONS as readonly string[]).includes(degree)) {
    return { degree, degree_other: degree === "Other" ? degreeOther : "" };
  }
  const aliases: Record<string, string> = {
    "bachelor's": "Bachelor's degree",
    bachelors: "Bachelor's degree",
    "master's": "Master's degree",
    masters: "Master's degree",
    phd: "Doctorate / PhD",
    doctorate: "Doctorate / PhD",
    diploma: "Diploma / Polytechnic",
    polytechnic: "Diploma / Polytechnic",
    secondary: "Secondary / High school",
    "high school": "Secondary / High school",
  };
  const mapped = aliases[degree.toLowerCase()];
  if (mapped) return { degree: mapped, degree_other: "" };
  return { degree: "Other", degree_other: degreeOther || degree };
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
      skills: parseSkillList(row.skills),
    };
  });
}

export function parseEducationHistoryInput(raw: unknown): EducationHistoryEntry[] {
  return parseJsonArray(raw).map((item) => {
    const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const degree = normalizeDegree(row.degree, row.degree_other);
    return {
      school: trimStr(row.school),
      degree: degree.degree,
      degree_other: degree.degree_other,
      field_of_study: trimStr(row.field_of_study),
      start_date: trimStr(row.start_date),
      end_date: trimStr(row.end_date),
      is_current: normalizeBool(row.is_current),
      skills: parseSkillList(row.skills),
    };
  });
}

function parseOtherExperienceKind(raw: unknown): OtherExperienceKind {
  const value = trimStr(raw);
  const match = OTHER_EXPERIENCE_KINDS.find((item) => item.value === value);
  return match?.value ?? "volunteer";
}

export function parseVolunteerExperienceInput(raw: unknown): VolunteerExperienceEntry[] {
  return parseJsonArray(raw).map((item) => {
    const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      kind: parseOtherExperienceKind(row.kind),
      organization: trimStr(row.organization),
      role: trimStr(row.role),
      start_date: trimStr(row.start_date),
      end_date: trimStr(row.end_date),
      is_current: normalizeBool(row.is_current),
      description: trimStr(row.description),
      skills: parseSkillList(row.skills),
    };
  });
}

function entryIsBlankWork(e: WorkExperienceEntry): boolean {
  return (
    !e.company &&
    !e.title &&
    !e.start_date &&
    !e.end_date &&
    !e.description &&
    !e.is_current &&
    e.skills.length === 0
  );
}

function entryIsBlankEducation(e: EducationHistoryEntry): boolean {
  return (
    !e.school &&
    !e.degree &&
    !e.degree_other &&
    !e.field_of_study &&
    !e.start_date &&
    !e.end_date &&
    !e.is_current &&
    e.skills.length === 0
  );
}

function entryIsBlankVolunteer(e: VolunteerExperienceEntry): boolean {
  return (
    !e.organization &&
    !e.role &&
    !e.start_date &&
    !e.end_date &&
    !e.description &&
    !e.is_current &&
    e.skills.length === 0
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
  if (start && !isCurrent && !end) {
    return `${label}: add an end date, or mark it as current.`;
  }
  if (start && !isCurrent && end && monthOrder(end, start) < 0) {
    return `${label}: end date cannot be before the start date.`;
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
    if (e.company.length > HISTORY_COMPANY_MAX_LENGTH) {
      return { ok: false, message: `${label} #${n}: company is too long.` };
    }
    if (e.title.length > HISTORY_TITLE_MAX_LENGTH) {
      return { ok: false, message: `${label} #${n}: title is too long.` };
    }
    if (e.description.length > HISTORY_DESCRIPTION_MAX_LENGTH) {
      return { ok: false, message: `${label} #${n}: description is too long.` };
    }
    const skills = validateEntrySkills(e.skills, `${label} #${n} skills`);
    if (skills.ok === false) return { ok: false, message: skills.message };
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
      skills: skills.value,
    });
  }
  return { ok: true, value: cleaned };
}

export function validateEducationHistoryList(
  raw: unknown,
  options: { required?: boolean; label?: string } = {}
): TimelineValidationResult<EducationHistoryEntry> {
  const label = options.label ?? "Education experience";
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
    if (!(HIGHEST_EDUCATION_OPTIONS as readonly string[]).includes(e.degree)) {
      return { ok: false, message: `${label} #${n}: choose a qualification.` };
    }
    if (e.degree === "Other" && e.degree_other.trim().length < 2) {
      return { ok: false, message: `${label} #${n}: say what the qualification is.` };
    }
    if (
      e.school.length > HISTORY_SCHOOL_MAX_LENGTH ||
      e.degree_other.length > HISTORY_TITLE_MAX_LENGTH ||
      e.field_of_study.length > HISTORY_TITLE_MAX_LENGTH
    ) {
      return { ok: false, message: `${label} #${n}: a field is too long.` };
    }
    const skills = validateEntrySkills(e.skills, `${label} #${n} skills`);
    if (skills.ok === false) return { ok: false, message: skills.message };
    const unsafe =
      rejectUnsafe(e.school, `${label} #${n} school`) ??
      rejectUnsafe(e.degree_other, `${label} #${n} qualification`) ??
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
      degree_other: e.degree === "Other" ? e.degree_other : "",
      field_of_study: e.field_of_study,
      start_date: e.start_date,
      end_date: e.is_current ? "" : e.end_date,
      is_current: e.is_current,
      skills: skills.value,
    });
  }
  return { ok: true, value: cleaned };
}

export function validateVolunteerExperienceList(
  raw: unknown,
  options: { required?: boolean; label?: string } = {}
): TimelineValidationResult<VolunteerExperienceEntry> {
  const label = options.label ?? "Volunteering, projects & other experience";
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
    if (!OTHER_EXPERIENCE_KINDS.some((item) => item.value === e.kind)) {
      return { ok: false, message: `${label} #${n}: choose a type.` };
    }
    if (!e.organization) {
      return { ok: false, message: `${label} #${n}: name is required.` };
    }
    if (!e.role) return { ok: false, message: `${label} #${n}: role is required.` };
    if (
      e.organization.length > HISTORY_ORG_MAX_LENGTH ||
      e.role.length > HISTORY_TITLE_MAX_LENGTH ||
      e.description.length > HISTORY_DESCRIPTION_MAX_LENGTH
    ) {
      return { ok: false, message: `${label} #${n}: a field is too long.` };
    }
    const skills = validateEntrySkills(e.skills, `${label} #${n} skills`);
    if (skills.ok === false) return { ok: false, message: skills.message };
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
      kind: e.kind,
      organization: e.organization,
      role: e.role,
      start_date: e.start_date,
      end_date: e.is_current ? "" : e.end_date,
      is_current: e.is_current,
      description: e.description,
      skills: skills.value,
    });
  }
  return { ok: true, value: cleaned };
}

function currentYearMonth(today = new Date()): string {
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${today.getFullYear()}-${month}`;
}

function inclusiveMonths(start: string, end: string): number {
  const [startYear, startMonth] = start.split("-").map(Number);
  const [endYear, endMonth] = end.split("-").map(Number);
  if (!startYear || !startMonth || !endYear || !endMonth) return 0;
  return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
}

/** Title, whole years, highest qualification, and skills taken from the timelines. */
export function deriveProfileFactsFromHistories(input: {
  work: WorkExperienceEntry[];
  education: EducationHistoryEntry[];
  volunteer: VolunteerExperienceEntry[];
  today?: Date;
}): {
  current_job_title: string | null;
  years_of_experience: number | null;
  highest_education: string | null;
  skills: string[];
} {
  const today = currentYearMonth(input.today ?? new Date());
  const dated = input.work.filter((entry) => validYearMonth(entry.start_date));
  const current = dated
    .filter((entry) => entry.is_current)
    .sort((a, b) => b.start_date.localeCompare(a.start_date));
  const latest = [...dated].sort((a, b) => {
    const aEnd = a.is_current ? today : a.end_date || a.start_date;
    const bEnd = b.is_current ? today : b.end_date || b.start_date;
    return bEnd.localeCompare(aEnd);
  });
  const titleSource = current[0] ?? latest[0];

  let totalMonths = 0;
  for (const entry of dated) {
    const end = entry.is_current ? today : entry.end_date;
    if (!validYearMonth(end) || end < entry.start_date) continue;
    totalMonths += inclusiveMonths(entry.start_date, end);
  }
  const years =
    dated.length === 0 ? null : Math.min(60, Math.max(0, Math.round(totalMonths / 12)));

  let bestRank = 0;
  let highest: string | null = null;
  for (const entry of input.education) {
    const rank = EDUCATION_LEVEL_RANK[entry.degree] ?? 0;
    const label = entry.degree === "Other" ? entry.degree_other || "Other" : entry.degree;
    if (!label) continue;
    if (rank > bestRank || (rank === 0 && !highest)) {
      bestRank = rank;
      highest = label;
    }
  }

  const seen = new Set<string>();
  const skills: string[] = [];
  for (const skill of [
    ...input.work.flatMap((entry) => entry.skills),
    ...input.education.flatMap((entry) => entry.skills),
    ...input.volunteer.flatMap((entry) => entry.skills),
  ]) {
    const key = skill.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    skills.push(skill);
    if (skills.length >= 30) break;
  }

  return {
    current_job_title: titleSource?.title?.trim() || null,
    years_of_experience: years,
    highest_education: highest,
    skills,
  };
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
  if (value.length < 5 || !/[A-Za-z0-9]/.test(value)) {
    return { ok: false, message: `${label} needs a street or building name.` };
  }
  return { ok: true, value };
}

export function validatePostalCode(
  raw: unknown,
  options: { required?: boolean; label?: string; country?: string } = {}
): ScalarValidationResult {
  const label = options.label ?? "Postal code";
  const value = trimStr(raw);
  if (!value) {
    if (options.required) return { ok: false, message: `${label} is required.` };
    return { ok: true, value: "" };
  }

  if (isSingaporeCountry(options.country)) {
    if (!isSingaporePostalCode(value)) {
      return { ok: false, message: "Enter a 6-digit postal code." };
    }
    return { ok: true, value };
  }

  const compact = value.replace(/[\s-]/g, "");
  if (value.length > POSTAL_CODE_MAX_LENGTH || !POSTAL.test(value) || compact.length < 3) {
    return {
      ok: false,
      message: `${label} should be the postal or ZIP code for your country (letters, numbers, spaces, and hyphens only).`,
    };
  }
  return { ok: true, value: value.toUpperCase() };
}

/** `min` / `max` for a date input: ages DATE_OF_BIRTH_MIN_AGE through DATE_OF_BIRTH_MAX_AGE. */
export function dateOfBirthInputBounds(today = new Date()): { min: string; max: string } {
  function iso(yearOffset: number): string {
    const date = new Date(today.getFullYear() - yearOffset, today.getMonth(), today.getDate());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return {
    min: iso(DATE_OF_BIRTH_MAX_AGE),
    max: iso(DATE_OF_BIRTH_MIN_AGE),
  };
}

/** Keep `YYYY-MM-DD` from a date input, ISO timestamp, or Date. */
export function normalizeDateOfBirthInput(raw: unknown): string {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }
  const text = String(raw ?? "").trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
}

export function formatDateOfBirthDisplay(raw: unknown): string {
  const iso = normalizeDateOfBirthInput(raw);
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day));
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
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
