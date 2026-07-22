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

const PROFILE_FIELD_LABELS: Partial<Record<keyof CandidateProfile, string>> = {
  full_name: "Full name",
  email: "Email",
  phone: "Phone",
  country: "Country",
  city: "City",
  current_job_title: "Current job title",
  years_of_experience: "Years of experience",
  highest_education: "Highest education",
  skills: "Skills",
  certifications: "Certifications",
  languages: "Languages",
  current_salary: "Current salary",
  expected_salary: "Expected salary",
  employment_type_preference: "Employment type preference",
  work_arrangement_preference: "Work arrangement",
  availability: "Availability",
};

function isProfileFieldFilled(
  profile: Partial<CandidateProfile>,
  field: keyof CandidateProfile
): boolean {
  const value = profile[field];
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && value !== "";
}

export function getProfileCompletionDetails(profile: Partial<CandidateProfile>): {
  percentage: number;
  filledCount: number;
  totalCount: number;
  missingFields: Array<{ key: keyof CandidateProfile; label: string }>;
} {
  const missingFields: Array<{ key: keyof CandidateProfile; label: string }> = [];
  for (const field of PROFILE_FIELDS) {
    if (!isProfileFieldFilled(profile, field)) {
      missingFields.push({
        key: field,
        label: PROFILE_FIELD_LABELS[field] ?? String(field),
      });
    }
  }
  const filledCount = PROFILE_FIELDS.length - missingFields.length;
  return {
    percentage: calculateProfileCompletion(profile),
    filledCount,
    totalCount: PROFILE_FIELDS.length,
    missingFields,
  };
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

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${kb >= 10 ? Math.round(kb) : Number(kb.toFixed(1))} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb >= 10 ? Math.round(mb) : Number(mb.toFixed(1))} MB`;
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

/** Distinct badge colors per status — draft ≠ closed, etc. */
export function statusBadgeClassName(status: string): string {
  const key = status.toLowerCase();

  const styles: Record<string, string> = {
    // Jobs
    draft: "border-amber-300 bg-amber-50 text-amber-900",
    active: "border-emerald-500 bg-emerald-600 text-white",
    closed: "border-slate-400 bg-slate-200 text-slate-800",
    // Candidates
    incomplete: "border-orange-300 bg-orange-50 text-orange-900",
    ready_for_matching: "border-emerald-400 bg-emerald-50 text-emerald-900",
    // Payments / general
    pending: "border-blue-300 bg-blue-50 text-blue-800",
    paid: "border-emerald-500 bg-emerald-600 text-white",
    completed: "border-emerald-500 bg-emerald-600 text-white",
    succeeded: "border-emerald-500 bg-emerald-600 text-white",
    cancelled: "border-red-300 bg-red-50 text-red-800",
    failed: "border-red-300 bg-red-50 text-red-800",
    inactive: "border-slate-300 bg-slate-50 text-slate-600",
    archived: "border-slate-300 bg-slate-50 text-slate-600",
  };

  return styles[key] ?? "border-border bg-muted text-muted-foreground";
}
