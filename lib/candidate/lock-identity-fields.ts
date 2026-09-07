import type { CandidateLockableIdentityFieldKey } from "@/lib/constants/job-form";

function hasStoredValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return true;
  return String(value).trim().length > 0;
}

function readCustomField(
  customFields: Record<string, unknown> | null | undefined,
  key: string
): unknown {
  if (!customFields || typeof customFields !== "object") return undefined;
  return customFields[key];
}

/**
 * Full name and email lock once set (usually at signup).
 * Gender locks once the candidate has saved a non-empty value.
 */
export function isCandidateIdentityFieldLocked(
  fieldKey: CandidateLockableIdentityFieldKey | string,
  profile: {
    full_name?: unknown;
    email?: unknown;
    custom_fields?: Record<string, unknown> | null;
  } | null | undefined
): boolean {
  if (!profile) {
    return fieldKey === "full_name" || fieldKey === "email";
  }

  if (fieldKey === "full_name") {
    return hasStoredValue(profile.full_name);
  }
  if (fieldKey === "email") {
    return hasStoredValue(profile.email);
  }
  if (fieldKey === "gender") {
    return hasStoredValue(readCustomField(profile.custom_fields, "gender"));
  }
  return false;
}

/**
 * Prevents client-side tampering: keep existing full name / email / gender when locked.
 * Also merges prior custom_fields so a save does not wipe sibling keys.
 */
export function preserveLockedCandidateIdentityFields(
  payload: Record<string, unknown>,
  existing: {
    full_name?: unknown;
    email?: unknown;
    custom_fields?: Record<string, unknown> | null;
  } | null | undefined
): Record<string, unknown> {
  if (!existing) return payload;

  const next = { ...payload };
  const existingCustom =
    existing.custom_fields &&
    typeof existing.custom_fields === "object" &&
    !Array.isArray(existing.custom_fields)
      ? { ...existing.custom_fields }
      : {};

  const incomingCustom =
    next.custom_fields &&
    typeof next.custom_fields === "object" &&
    !Array.isArray(next.custom_fields)
      ? { ...(next.custom_fields as Record<string, unknown>) }
      : {};

  const mergedCustom = { ...existingCustom, ...incomingCustom };

  if (hasStoredValue(existing.full_name)) {
    next.full_name = existing.full_name;
  }
  if (hasStoredValue(existing.email)) {
    next.email = existing.email;
  }
  if (hasStoredValue(existingCustom.gender)) {
    mergedCustom.gender = existingCustom.gender;
  }

  next.custom_fields = mergedCustom;
  return next;
}
