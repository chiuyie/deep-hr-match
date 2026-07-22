/**
 * Shared years-of-experience rules for frontend + backend.
 * Allowed: 0–60 inclusive, in 0.5 increments. Stored as a number.
 */

export const YEARS_OF_EXPERIENCE_MIN = 0;
export const YEARS_OF_EXPERIENCE_MAX = 60;
export const YEARS_OF_EXPERIENCE_STEP = 0.5;

export type YearsValidationResult =
  | { ok: true; value: number | null }
  | { ok: false; message: string };

/** Strict numeric text: optional digits, optional single ".5" or ".0". No exp/signs. */
const YEARS_PATTERN = /^(?:0|[1-9]\d*)(?:\.[05])?$/;

export function sanitizeYearsOfExperienceInput(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  return String(raw).trim();
}

/**
 * Validate years of experience. Empty is allowed only when not required
 * (returns null). On success, value is a finite number suitable for DB storage.
 */
export function validateYearsOfExperienceValue(
  raw: unknown,
  options: { required?: boolean; label?: string } = {}
): YearsValidationResult {
  const label = options.label ?? "Years of experience";
  const required = options.required ?? false;
  const text = sanitizeYearsOfExperienceInput(raw);

  if (!text) {
    if (required) return { ok: false, message: `${label} is required.` };
    return { ok: true, value: null };
  }

  // Reject scientific notation, signs, commas, letters, emoji, etc. before Number().
  if (/[eE+\-,_\s]/.test(text) || /[^\d.]/.test(text)) {
    return {
      ok: false,
      message: `${label} must be a number from ${YEARS_OF_EXPERIENCE_MIN} to ${YEARS_OF_EXPERIENCE_MAX} (in steps of ${YEARS_OF_EXPERIENCE_STEP}).`,
    };
  }

  if ((text.match(/\./g) ?? []).length > 1) {
    return { ok: false, message: `${label} has an invalid format.` };
  }

  if (!YEARS_PATTERN.test(text)) {
    // Covers leading zeros like 01, trailing dots, .5 alone, 1.2, 1.50, etc.
    if (text.endsWith(".")) {
      return { ok: false, message: `${label} is incomplete.` };
    }
    if (/^\d+\.\d$/.test(text) && !text.endsWith(".0") && !text.endsWith(".5")) {
      return {
        ok: false,
        message: `${label} must be in steps of ${YEARS_OF_EXPERIENCE_STEP} (e.g. 1 or 1.5).`,
      };
    }
    return {
      ok: false,
      message: `${label} must be a number from ${YEARS_OF_EXPERIENCE_MIN} to ${YEARS_OF_EXPERIENCE_MAX} (in steps of ${YEARS_OF_EXPERIENCE_STEP}).`,
    };
  }

  const n = Number(text);
  if (!Number.isFinite(n)) {
    return { ok: false, message: `${label} must be a valid number.` };
  }
  if (n < YEARS_OF_EXPERIENCE_MIN) {
    return { ok: false, message: `${label} cannot be negative.` };
  }
  if (n > YEARS_OF_EXPERIENCE_MAX) {
    return {
      ok: false,
      message: `${label} cannot be more than ${YEARS_OF_EXPERIENCE_MAX}.`,
    };
  }
  // Guard half-step even if pattern drifts.
  if (!Number.isInteger(n * 2)) {
    return {
      ok: false,
      message: `${label} must be in steps of ${YEARS_OF_EXPERIENCE_STEP} (e.g. 1 or 1.5).`,
    };
  }

  return { ok: true, value: n };
}

/** Parse a known-valid or empty years value for form display. */
export function formatYearsOfExperienceForInput(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const result = validateYearsOfExperienceValue(value, { required: false });
  if (result.ok === true && result.value !== null) {
    return Number.isInteger(result.value) ? String(result.value) : String(result.value);
  }
  // Show raw trimmed for editing when previously invalid/legacy.
  return sanitizeYearsOfExperienceInput(value);
}
