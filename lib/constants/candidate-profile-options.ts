import {
  WORLD_COUNTRIES,
  WORLD_COUNTRY_BY_NAME,
  WORLD_COUNTRY_NAMES,
} from "@/lib/constants/geo/world-countries.generated";
import {
  dialCodeForIso,
  isSupportedPhoneCountry,
  isValidPhoneNumber,
  normalizePhoneToE164,
  parsePhoneOptionValue,
  parseStoredPhone,
  phoneOptionValue,
  phoneValidationMessage,
  resolvePhoneInput,
  type CountryCode,
} from "@/lib/utils/phone";

export {
  isValidPhoneNumber,
  normalizePhoneToE164,
  parseStoredPhone,
  phoneValidationMessage,
  resolvePhoneInput,
  dialCodeForIso,
  parsePhoneOptionValue,
  phoneOptionValue,
};

/** All ISO countries plus "Other" for free-text fallback. */
export const CANDIDATE_COUNTRIES = WORLD_COUNTRY_NAMES;

export type CandidateCountry = (typeof WORLD_COUNTRIES)[number]["name"] | "Other";

export type PhoneDialCodeRow = {
  code: string;
  country: string;
  isoCode: string;
};

/** One row per libphonenumber-supported country (with dial code). */
export const CANDIDATE_PHONE_DIAL_CODES: PhoneDialCodeRow[] = WORLD_COUNTRIES.filter(
  (c) => c.phoneCode.length > 0 && isSupportedPhoneCountry(c.isoCode)
).map((c) => ({
  code: dialCodeForIso(c.isoCode as CountryCode),
  country: c.name,
  isoCode: c.isoCode,
}));

/** Longest-first unique dial codes for legacy parsing helpers. */
export const SORTED_UNIQUE_DIAL_CODES: string[] = [
  ...new Set(CANDIDATE_PHONE_DIAL_CODES.map((row) => row.code)),
].sort((a, b) => b.length - a.length);

export const HIGHEST_EDUCATION_OPTIONS = [
  "Secondary / High school",
  "Diploma / Polytechnic",
  "Bachelor's degree",
  "Master's degree",
  "Doctorate / PhD",
  "Professional certification",
  "Other",
] as const;

export const EMPLOYMENT_TYPE_OPTIONS = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
  "Temporary",
] as const;

export const WORK_ARRANGEMENT_OPTIONS = [
  "On-site",
  "Hybrid",
  "Fully remote",
  "Flexible",
] as const;

export const AVAILABILITY_OPTIONS = [
  "Immediate",
  "1 week",
  "2 weeks",
  "1 month",
  "2 months",
  "3+ months",
] as const;

export const SALARY_CURRENCY_OPTIONS = [
  "SGD",
  "MYR",
  "USD",
  "IDR",
  "PHP",
  "THB",
  "VND",
  "CNY",
  "HKD",
  "INR",
  "AUD",
  "GBP",
  "EUR",
  "JPY",
  "KRW",
  "TWD",
  "AED",
  "SAR",
  "CAD",
  "NZD",
] as const;

const SELECT_OPTIONS_BY_KEY: Record<string, readonly string[]> = {
  country: CANDIDATE_COUNTRIES,
  highest_education: HIGHEST_EDUCATION_OPTIONS,
  employment_type_preference: EMPLOYMENT_TYPE_OPTIONS,
  work_arrangement_preference: WORK_ARRANGEMENT_OPTIONS,
  availability: AVAILABILITY_OPTIONS,
};

export function getCandidateSelectOptions(fieldKey: string): readonly string[] | null {
  return SELECT_OPTIONS_BY_KEY[fieldKey] ?? null;
}

/** Sync fallback only — use {@link fetchCitiesForCountry} in the UI for the full list. */
export function citiesForCountry(country: string | null | undefined): readonly string[] {
  if (!country?.trim() || country === "Other") return ["Other"];
  if (country.trim() === "Singapore") return ["Singapore"];
  return ["Other"];
}

export async function fetchCitiesForCountry(country: string): Promise<string[]> {
  const trimmed = country.trim();
  if (!trimmed) return ["Other"];
  const res = await fetch(`/api/geo/cities?country=${encodeURIComponent(trimmed)}`);
  if (!res.ok) return ["Other"];
  const data = (await res.json()) as { cities?: string[] };
  return data.cities?.length ? data.cities : ["Other"];
}

export function dialCodeForCountry(country: string | null | undefined): string {
  if (!country?.trim()) return "+65";
  const row = WORLD_COUNTRY_BY_NAME.get(country.trim());
  if (row && isSupportedPhoneCountry(row.isoCode)) {
    return dialCodeForIso(row.isoCode);
  }
  if (row?.phoneCode) return row.phoneCode;
  return "+65";
}

export function formatPhoneValue(dialCode: string, national: string): string {
  const cleaned = national.replace(/[^\d\s-]/g, "").trim();
  if (!cleaned) return "";
  return `${dialCode} ${cleaned}`.trim();
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function parseSalaryValue(value: string | null | undefined): {
  currency: string;
  amount: string;
} {
  const raw = (value ?? "").trim();
  if (!raw) return { currency: "SGD", amount: "" };
  const match = raw.match(/^([A-Z]{3})\s*(.+)$/i);
  if (match) {
    return {
      currency: match[1]!.toUpperCase(),
      amount: match[2]!.replace(/,/g, "").trim(),
    };
  }
  return { currency: "SGD", amount: raw.replace(/,/g, "").trim() };
}

export function formatSalaryValue(currency: string, amount: string): string {
  const cleaned = amount.replace(/[^\d.]/g, "").trim();
  if (!cleaned) return "";
  return `${currency} ${cleaned}`;
}

export function isValidSalaryAmount(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const parsed = parseSalaryValue(trimmed);
  if (!parsed.amount) return true;
  return /^\d+(\.\d{1,2})?$/.test(parsed.amount) && Number(parsed.amount) >= 0;
}

export function countrySelectOptions(): { value: string; label: string }[] {
  return CANDIDATE_COUNTRIES.map((name) => ({ value: name, label: name }));
}

export function phoneDialSelectOptions(): { value: string; label: string; keywords: string }[] {
  return CANDIDATE_PHONE_DIAL_CODES.map((row) => ({
    value: phoneOptionValue(row.isoCode as CountryCode),
    label: `${row.country} ${row.code}`,
    keywords: `${row.isoCode} ${row.country} ${row.code}`,
  }));
}

export function dialCodeFromPhoneOptionValue(value: string): string {
  return parsePhoneOptionValue(value).dialCode;
}

export function phoneOptionValueForDialCode(dialCode: string): string {
  const match =
    CANDIDATE_PHONE_DIAL_CODES.find((row) => row.code === dialCode && row.isoCode === "SG") ??
    CANDIDATE_PHONE_DIAL_CODES.find((row) => row.code === dialCode);
  if (!match || !isSupportedPhoneCountry(match.isoCode)) {
    return phoneOptionValue("SG");
  }
  return phoneOptionValue(match.isoCode);
}

export function phoneOptionValueForIso(iso: string): string {
  if (isSupportedPhoneCountry(iso)) return phoneOptionValue(iso);
  return phoneOptionValue("SG");
}
