/**
 * Shared candidate profile field validation — used by both the multi-step
 * frontend and server-side Zod / save path. Keep rules here; do not duplicate.
 */

import {
  CANDIDATE_COUNTRIES,
  isValidEmail,
  isValidSalaryAmount,
  parseSalaryValue,
} from "@/lib/constants/candidate-profile-options";
import type { FormFieldDefinition } from "@/lib/form-fields/types";
import { resolveSelectOptions } from "@/lib/form-fields/select-options";
import {
  normalizePhoneToE164,
  validateSubmittedPhone,
  type CountryCode,
} from "@/lib/utils/phone";
import { validateYearsOfExperienceValue } from "@/lib/form-fields/years-of-experience";
import {
  serializeLanguagesForForm,
  serializeTagsForForm,
  validateCertificationsList,
  validateLanguagesList,
  validateSkillsList,
} from "@/lib/form-fields/profile-tags";

export type FieldValidationResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

/** Hard caps — reject absurd / attack payloads gracefully. */
export const FIELD_MAX_LENGTH = {
  full_name: 100,
  email: 254,
  phone: 32,
  country: 80,
  city: 80,
  current_job_title: 120,
  years_of_experience: 8,
  highest_education: 80,
  skills: 2000,
  certifications: 2000,
  languages: 1000,
  current_salary: 40,
  expected_salary: 40,
  employment_type_preference: 60,
  work_arrangement_preference: 60,
  availability: 40,
  custom: 2000,
  default: 500,
} as const;

const CONTROL_OR_NULL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
/** Emoji / pictographs that should not appear in identity / contact fields. */
const EMOJI_OR_SYMBOL =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/u;

export function trimInput(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  return String(raw).trim();
}

/** Collapse runs of whitespace to a single space (after trim). */
export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function maxForKey(fieldKey: string): number {
  return (
    (FIELD_MAX_LENGTH as Record<string, number>)[fieldKey] ?? FIELD_MAX_LENGTH.default
  );
}

function rejectUnsafeChars(value: string, label: string): string | null {
  if (CONTROL_OR_NULL.test(value)) {
    return `${label} contains invalid control characters.`;
  }
  return null;
}

function rejectEmoji(value: string, label: string): string | null {
  if (EMOJI_OR_SYMBOL.test(value)) {
    return `${label} cannot include emoji or special symbols.`;
  }
  return null;
}

function tooLong(value: string, label: string, max: number): string | null {
  if (value.length > max) {
    return `${label} must be at most ${max} characters.`;
  }
  return null;
}

function requiredEmpty(value: string, label: string, required: boolean): string | null {
  if (required && !value) return `${label} is required.`;
  return null;
}

/** Person name: unicode letters, marks, spaces, hyphen, apostrophe, period. */
const FULL_NAME_PATTERN =
  /^[\p{L}\p{M}]([\p{L}\p{M}'’.\- ]*[\p{L}\p{M}.])?$/u;

const JOB_TITLE_PATTERN = /^[\p{L}\p{M}\p{N}]([\p{L}\p{M}\p{N}'’.\-/&() ]*[\p{L}\p{M}\p{N}.)])?$/u;

const CITY_PATTERN = /^[\p{L}\p{M}\p{N}]([\p{L}\p{M}\p{N}'’.\- ]*[\p{L}\p{M}\p{N}.])?$/u;

function validateFullName(raw: string, label: string, required: boolean): FieldValidationResult {
  const value = collapseWhitespace(trimInput(raw));
  const empty = requiredEmpty(value, label, required);
  if (empty) return { ok: false, message: empty };
  if (!value) return { ok: true, value: "" };

  const unsafe = rejectUnsafeChars(value, label) ?? rejectEmoji(value, label);
  if (unsafe) return { ok: false, message: unsafe };
  const long = tooLong(value, label, FIELD_MAX_LENGTH.full_name);
  if (long) return { ok: false, message: long };
  if (value.length < 2) return { ok: false, message: `${label} must be at least 2 characters.` };
  if (!FULL_NAME_PATTERN.test(value)) {
    return {
      ok: false,
      message: `${label} may only include letters, spaces, hyphens, and apostrophes.`,
    };
  }
  return { ok: true, value };
}

function validateEmail(raw: string, label: string, required: boolean): FieldValidationResult {
  const value = trimInput(raw).toLowerCase();
  const empty = requiredEmpty(value, label, required);
  if (empty) return { ok: false, message: empty };
  if (!value) return { ok: true, value: "" };

  const unsafe = rejectUnsafeChars(value, label) ?? rejectEmoji(value, label);
  if (unsafe) return { ok: false, message: unsafe };
  const long = tooLong(value, label, FIELD_MAX_LENGTH.email);
  if (long) return { ok: false, message: long };
  if (/\s/.test(value)) return { ok: false, message: `${label} cannot contain spaces.` };
  if (!isValidEmail(value)) return { ok: false, message: "Enter a valid email address." };
  return { ok: true, value };
}

function validatePhone(
  raw: string,
  label: string,
  required: boolean,
  defaultCountry: CountryCode = "SG"
): FieldValidationResult {
  const value = trimInput(raw);
  const empty = requiredEmpty(value, label, required);
  if (empty) return { ok: false, message: empty };
  if (!value) return { ok: true, value: "" };

  const long = tooLong(value, label, FIELD_MAX_LENGTH.phone);
  if (long) return { ok: false, message: long };

  const result = validateSubmittedPhone(value, { required, defaultCountry });
  if (result.ok === false) return { ok: false, message: result.message };
  return { ok: true, value: result.e164 ?? "" };
}

/**
 * If the typed value matches a listed option (case-insensitive, ignoring
 * surrounding whitespace), return the canonical list value. Skips "Other".
 * Returns null when there is no match.
 */
export function matchListedOption(
  raw: string,
  options: readonly string[]
): string | null {
  const needle = collapseWhitespace(trimInput(raw)).toLowerCase();
  if (!needle || needle === "other") return null;
  for (const option of options) {
    if (option === "Other") continue;
    if (option.toLowerCase() === needle) return option;
  }
  return null;
}

function validateSelect(
  raw: string,
  label: string,
  required: boolean,
  options: readonly string[],
  allowOther: boolean,
  max: number = FIELD_MAX_LENGTH.default
): FieldValidationResult {
  const value = collapseWhitespace(trimInput(raw));
  const empty = requiredEmpty(value, label, required);
  if (empty) return { ok: false, message: empty };
  if (!value) return { ok: true, value: "" };

  const unsafe = rejectUnsafeChars(value, label) ?? rejectEmoji(value, label);
  if (unsafe) return { ok: false, message: unsafe };
  const long = tooLong(value, label, max);
  if (long) return { ok: false, message: long };

  if (options.includes(value)) return { ok: true, value };

  // User picked "Other" but typed a country/option that already exists — canonicalize.
  const listed = matchListedOption(value, options);
  if (listed) return { ok: true, value: listed };

  if (allowOther && value.length >= 2 && value.toLowerCase() !== "other") {
    return { ok: true, value };
  }
  if (value.toLowerCase() === "other") {
    return { ok: false, message: `Enter a specific ${label.toLowerCase()}, or choose one from the list.` };
  }
  return { ok: false, message: `Choose a valid ${label.toLowerCase()} from the list.` };
}

function validateCity(raw: string, label: string, required: boolean): FieldValidationResult {
  const value = collapseWhitespace(trimInput(raw));
  const empty = requiredEmpty(value, label, required);
  if (empty) return { ok: false, message: empty };
  if (!value) return { ok: true, value: "" };

  const unsafe = rejectUnsafeChars(value, label) ?? rejectEmoji(value, label);
  if (unsafe) return { ok: false, message: unsafe };
  const long = tooLong(value, label, FIELD_MAX_LENGTH.city);
  if (long) return { ok: false, message: long };
  if (value.length < 2) return { ok: false, message: `${label} must be at least 2 characters.` };
  if (!CITY_PATTERN.test(value)) {
    return {
      ok: false,
      message: `${label} may only include letters, numbers, spaces, hyphens, and apostrophes.`,
    };
  }
  return { ok: true, value };
}

function validateJobTitle(raw: string, label: string, required: boolean): FieldValidationResult {
  const value = collapseWhitespace(trimInput(raw));
  const empty = requiredEmpty(value, label, required);
  if (empty) return { ok: false, message: empty };
  if (!value) return { ok: true, value: "" };

  const unsafe = rejectUnsafeChars(value, label) ?? rejectEmoji(value, label);
  if (unsafe) return { ok: false, message: unsafe };
  const long = tooLong(value, label, FIELD_MAX_LENGTH.current_job_title);
  if (long) return { ok: false, message: long };
  if (!JOB_TITLE_PATTERN.test(value)) {
    return {
      ok: false,
      message: `${label} contains invalid characters.`,
    };
  }
  return { ok: true, value };
}

function validateYearsOfExperience(
  raw: string,
  label: string,
  required: boolean
): FieldValidationResult {
  const result = validateYearsOfExperienceValue(raw, { required, label });
  if (result.ok === false) return { ok: false, message: result.message };
  if (result.value === null) return { ok: true, value: "" };
  return { ok: true, value: String(result.value) };
}

function validateSalary(raw: string, label: string, required: boolean): FieldValidationResult {
  const value = collapseWhitespace(trimInput(raw));
  const empty = requiredEmpty(value, label, required);
  if (empty) return { ok: false, message: empty };
  if (!value) return { ok: true, value: "" };

  const unsafe = rejectUnsafeChars(value, label);
  if (unsafe) return { ok: false, message: unsafe };
  const long = tooLong(value, label, FIELD_MAX_LENGTH.current_salary);
  if (long) return { ok: false, message: long };
  if (!isValidSalaryAmount(value)) {
    return { ok: false, message: `${label} must be a valid amount like SGD 5500.` };
  }
  const parsed = parseSalaryValue(value);
  return { ok: true, value: parsed.amount ? `${parsed.currency} ${parsed.amount}` : "" };
}

function validateGenericText(
  raw: string,
  label: string,
  required: boolean,
  max: number
): FieldValidationResult {
  const value = collapseWhitespace(trimInput(raw));
  const empty = requiredEmpty(value, label, required);
  if (empty) return { ok: false, message: empty };
  if (!value) return { ok: true, value: "" };

  const unsafe = rejectUnsafeChars(value, label);
  if (unsafe) return { ok: false, message: unsafe };
  const long = tooLong(value, label, max);
  if (long) return { ok: false, message: long };
  return { ok: true, value };
}

export type ValidateFieldContext = {
  /** Other field values for cross-field rules (e.g. country + city). */
  values?: Record<string, unknown>;
  defaultPhoneCountry?: CountryCode;
  /** Draft saves: drop unknown list entries instead of failing. */
  softLists?: boolean;
};

/**
 * Validate a single candidate profile field. Returns a trimmed/normalized
 * value on success — callers may display the original until blur/save.
 */
export function validateCandidateField(
  field: Pick<FormFieldDefinition, "field_key" | "label" | "is_required" | "field_type" | "is_custom">,
  raw: unknown,
  context: ValidateFieldContext = {}
): FieldValidationResult {
  const key = field.field_key;
  const label = field.label;
  const required = field.is_required;
  const asString = raw === null || raw === undefined ? "" : String(raw);

  switch (key) {
    case "full_name":
      return validateFullName(asString, label, required);
    case "email":
      return validateEmail(asString, label, required);
    case "phone":
      return validatePhone(asString, label, required, context.defaultPhoneCountry ?? "SG");
    case "country":
      return validateSelect(
        asString,
        label,
        required,
        CANDIDATE_COUNTRIES,
        true,
        FIELD_MAX_LENGTH.country
      );
    case "city": {
      const city = validateCity(asString, label, required);
      if (!city.ok) return city;
      const country = trimInput(context.values?.country);
      if (country === "Other" && city.value && city.value.length < 2) {
        return { ok: false, message: "Enter your city when country is Other." };
      }
      return city;
    }
    case "current_job_title":
      return validateJobTitle(asString, label, required);
    case "years_of_experience":
      return validateYearsOfExperience(asString, label, required);
    case "highest_education":
      return validateSelect(
        asString,
        label,
        required,
        resolveSelectOptions(field),
        true,
        FIELD_MAX_LENGTH.highest_education
      );
    case "employment_type_preference":
      return validateSelect(
        asString,
        label,
        required,
        resolveSelectOptions(field),
        false,
        FIELD_MAX_LENGTH.employment_type_preference
      );
    case "work_arrangement_preference":
      return validateSelect(
        asString,
        label,
        required,
        resolveSelectOptions(field),
        false,
        FIELD_MAX_LENGTH.work_arrangement_preference
      );
    case "availability":
      return validateSelect(
        asString,
        label,
        required,
        resolveSelectOptions(field),
        false,
        FIELD_MAX_LENGTH.availability
      );
    case "current_salary":
    case "expected_salary":
      return validateSalary(asString, label, required);
    case "skills": {
      const result = validateSkillsList(raw, { required, label });
      if (result.ok === false) return { ok: false, message: result.message };
      return { ok: true, value: serializeTagsForForm(result.value) };
    }
    case "certifications": {
      const result = validateCertificationsList(raw, { required, label });
      if (result.ok === false) return { ok: false, message: result.message };
      return { ok: true, value: serializeTagsForForm(result.value) };
    }
    case "languages": {
      const result = validateLanguagesList(raw, {
        required,
        label,
        dropUnknown: context.softLists === true,
      });
      if (result.ok === false) return { ok: false, message: result.message };
      return { ok: true, value: serializeLanguagesForForm(result.value) };
    }
    default: {
      if (field.field_type === "email") return validateEmail(asString, label, required);
      if (field.field_type === "tel") return validatePhone(asString, label, required);
      if (field.field_type === "select") {
        return validateSelect(asString, label, required, resolveSelectOptions(field), false);
      }
      return validateGenericText(asString, label, required, maxForKey(key));
    }
  }
}

export type SectionValidationResult = {
  ok: boolean;
  errors: Record<string, string>;
  /** First invalid field key, for focus. */
  firstInvalidKey?: string;
};

/** Validate every field in a wizard section (required + filled optional). */
export function validateCandidateSection(
  fields: Array<
    Pick<FormFieldDefinition, "field_key" | "label" | "is_required" | "field_type" | "is_custom" | "is_active">
  >,
  values: Record<string, unknown>
): SectionValidationResult {
  const errors: Record<string, string> = {};
  let firstInvalidKey: string | undefined;

  const active = fields.filter((f) => f.is_active !== false);
  const context: ValidateFieldContext = { values };

  for (const field of active) {
    const raw = values[field.field_key];
    const result = validateCandidateField(field, raw, context);
    if (result.ok === false) {
      errors[field.field_key] = result.message;
      if (!firstInvalidKey) firstInvalidKey = field.field_key;
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    firstInvalidKey,
  };
}

/** True when every required field in the section has a valid value. */
export function isCandidateSectionComplete(
  fields: Array<
    Pick<FormFieldDefinition, "field_key" | "label" | "is_required" | "field_type" | "is_custom" | "is_active">
  >,
  values: Record<string, unknown>
): boolean {
  return validateCandidateSection(fields, values).ok;
}

/**
 * Normalize a whole profile payload using the same field rules.
 * Invalid values are left as trimmed strings for Zod to reject.
 */
export function normalizeCandidateFieldValue(
  field: Pick<FormFieldDefinition, "field_key" | "label" | "is_required" | "field_type" | "is_custom">,
  raw: unknown,
  context: ValidateFieldContext = {}
): string {
  const result = validateCandidateField(field, raw, context);
  if (result.ok) return result.value;
  return trimInput(raw);
}

export function phoneIsValidForSection(value: unknown): boolean {
  return normalizePhoneToE164(trimInput(value)) !== null || trimInput(value) === "";
}
