/** Sanitize and validate job form text inputs at the UI layer. */

const MONEY_FIELD_KEYS = new Set(["desired_minimum_salary", "desired_maximum_salary"]);
const INTEGER_FIELD_KEYS = new Set(["team_size"]);

export function isJobMoneyField(name: string): boolean {
  return MONEY_FIELD_KEYS.has(name);
}

export function isJobIntegerField(name: string): boolean {
  return INTEGER_FIELD_KEYS.has(name);
}

/** Digits only — for monthly budget in SGD. */
export function sanitizeMoneyInput(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

/** Digits only — whole numbers. */
export function sanitizeIntegerInput(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

/** Job reference: letters, numbers, hyphen. */
export function sanitizeJobReferenceInput(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 32);
}

export function parseMoneyAmount(value: JobFormStateValue): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

type JobFormStateValue = string | boolean | string[] | undefined;

export function validateCompensationRange(values: {
  desired_minimum_salary?: JobFormStateValue;
  desired_maximum_salary?: JobFormStateValue;
}): { ok: true } | { ok: false; message: string; focusField: string } {
  const min = parseMoneyAmount(values.desired_minimum_salary);
  const max = parseMoneyAmount(values.desired_maximum_salary);
  if (min !== null && max !== null && min > max) {
    return {
      ok: false,
      message: "Minimum budget cannot be higher than maximum budget.",
      focusField: "desired_minimum_salary",
    };
  }
  return { ok: true };
}

export function buildSalaryRangeLabel(values: {
  desired_minimum_salary?: JobFormStateValue;
  desired_maximum_salary?: JobFormStateValue;
}): string | null {
  const min = parseMoneyAmount(values.desired_minimum_salary);
  const max = parseMoneyAmount(values.desired_maximum_salary);
  if (min !== null && max !== null) {
    return `SGD ${min.toLocaleString()} – ${max.toLocaleString()} / month`;
  }
  if (min !== null) return `From SGD ${min.toLocaleString()} / month`;
  if (max !== null) return `Up to SGD ${max.toLocaleString()} / month`;
  return null;
}
