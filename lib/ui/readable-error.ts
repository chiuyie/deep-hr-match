type IssueLike = {
  message?: string;
  path?: PropertyKey[];
};

const RAW_VALIDATION =
  /invalid input:|expected .+ received|nonoptional|unrecognized[_ ]key|invalid_type|invalid uuid|invalid date|too small|too big|string must contain|invalid email|invalid url|invalid option|invalid_format|expected string|expected number|expected boolean|expected object|expected array/i;

const RAW_SYSTEM =
  /postgres|sqlstate|duplicate key|violates |relation "|column "|syntax error|permission denied|jwt |pgrst|schema cache|null value in column|foreign key|row-level security|\brls\b|server components render|specific message is omitted|stack trace|ECONN|fetch failed/i;

function titleCaseKey(key: string): string {
  const words = key.replaceAll("_", " ").trim();
  if (!words) return "";
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function isRawSystemMessage(message: string): boolean {
  return RAW_VALIDATION.test(message) || RAW_SYSTEM.test(message);
}

/** Turn Zod, database, and provider dumps into a sentence a person can act on. */
export function toUserFacingMessage(
  raw: string | null | undefined,
  options?: { label?: string; fallback?: string }
): string {
  const fallback = options?.fallback ?? "Something went wrong. Try again.";
  const text = (raw ?? "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;

  const label = options?.label?.trim();
  if (!isRawSystemMessage(text) && text.length <= 240) return text;

  if (/email/i.test(text)) return "Enter a valid email address.";
  if (/url|website/i.test(text)) {
    return "Enter a full website address, including https://.";
  }
  if (/uuid/i.test(text)) {
    return "That selection is no longer valid. Refresh the page and try again.";
  }
  if (/password/i.test(text)) return "Check your password and try again.";
  if (label) return `${label} needs a valid answer.`;
  if (/too small|at least 1 character|required/i.test(text)) {
    return "A required field is empty.";
  }
  return fallback;
}

export function readableIssueMessage(
  issue: IssueLike | undefined,
  label?: string
): string {
  const pathKey = issue?.path?.[0] != null ? String(issue.path[0]) : "";
  const name = label?.trim() || titleCaseKey(pathKey);
  const raw = issue?.message?.trim() ?? "";
  const cleaned = toUserFacingMessage(raw, {
    label: name || undefined,
    fallback: name ? `${name} needs a valid answer.` : "Check the form and try again.",
  });
  if (
    name &&
    raw &&
    !isRawSystemMessage(raw) &&
    !cleaned.toLowerCase().includes(name.toLowerCase())
  ) {
    return `${name}: ${cleaned}`;
  }
  return cleaned;
}
