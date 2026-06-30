import type { CandidateProfile } from "@/types/database";

const PROFILE_FIELDS: (keyof CandidateProfile)[] = [
  "full_name",
  "email",
  "phone",
  "country",
  "city",
  "current_job_title",
  "years_of_experience",
  "highest_education",
  "skills",
  "certifications",
  "languages",
  "current_salary",
  "expected_salary",
  "employment_type_preference",
  "work_arrangement_preference",
  "availability",
];

export function calculateProfileCompletion(profile: Partial<CandidateProfile>): number {
  if (!profile) return 0;
  const filled = PROFILE_FIELDS.filter((field) => {
    const value = profile[field];
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== "";
  });
  return Math.round((filled.length / PROFILE_FIELDS.length) * 100);
}

export function parseCommaList(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function statusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
