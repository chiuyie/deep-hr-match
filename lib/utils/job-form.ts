import type { Job, JobStatus } from "@/types/database";
import { parseCommaList } from "@/lib/utils/profile";
import { buildSalaryRangeLabel } from "@/lib/utils/job-form-input";

export function flattenMultilevelOptions(data: unknown): string[] {
  const results: string[] = [];

  const walk = (node: unknown, path: string[] = []) => {
    if (Array.isArray(node)) {
      for (const item of node) {
        results.push([...path, String(item)].join(" | "));
      }
      return;
    }

    if (node && typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        walk(value, [...path, key]);
      }
    }
  };

  walk(data);
  return results;
}

export type JobFormState = Record<string, string | boolean | string[] | undefined>;

const LEGACY_STRING_FIELDS = [
  "department",
  "location",
  "employment_type",
  "salary_range",
  "education_required",
] as const;

const LEGACY_SKILL_FIELDS = ["required_skills", "preferred_skills"] as const;

export type JobRecordInput = Pick<
  Job,
  | "title"
  | "description"
  | "form_data"
  | "department"
  | "location"
  | "employment_type"
  | "salary_range"
  | "years_experience_required"
  | "education_required"
  | "required_skills"
  | "preferred_skills"
  | "status"
>;

function hasFormValue(value: JobFormState[string]) {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function legacySkillsToFormValue(skills: string[] | null | undefined) {
  return skills?.length ? skills.join(", ") : undefined;
}

function formValueToLegacySkills(value: JobFormState[string]) {
  if (typeof value !== "string") return [];
  return parseCommaList(value);
}

export function parseJobFormState(formData: FormData): JobFormState {
  const state: JobFormState = {};
  const benefits: string[] = [];

  for (const [key, value] of formData.entries()) {
    if (key === "benefits_package") {
      benefits.push(String(value));
      continue;
    }

    if (typeof value !== "string") continue;

    if (key.startsWith("custom_")) {
      state[key.slice("custom_".length)] = value;
      continue;
    }

    if (key.startsWith("faq_")) {
      if (value === "true") state[key] = true;
      else if (value === "false") state[key] = false;
      continue;
    }

    state[key] = value;
  }

  if (benefits.length) {
    state.benefits_package = benefits;
  }

  return state;
}

export function jobRecordToFormState(job: JobRecordInput): JobFormState {
  const formData = { ...(job.form_data ?? {}) } as JobFormState;

  for (const field of LEGACY_STRING_FIELDS) {
    if (!hasFormValue(formData[field]) && job[field]) {
      formData[field] = job[field] ?? undefined;
    }
  }

  if (!hasFormValue(formData.years_experience_required) && job.years_experience_required != null) {
    formData.years_experience_required = String(job.years_experience_required);
  }

  for (const field of LEGACY_SKILL_FIELDS) {
    if (!hasFormValue(formData[field])) {
      const skills = legacySkillsToFormValue(job[field]);
      if (skills) formData[field] = skills;
    }
  }

  if (!hasFormValue(formData.status) && job.status) {
    formData.status = job.status;
  }

  return {
    ...formData,
    job_title: job.title,
    job_description: job.description ?? "",
  };
}

export function formStateToJobPayload(state: JobFormState) {
  const { job_title, job_description, ...rest } = state;
  const form_data: JobFormState = { ...rest };

  const legacyColumns: {
    department: string | null;
    location: string | null;
    employment_type: string | null;
    salary_range: string | null;
    years_experience_required: number | null;
    education_required: string | null;
    required_skills: string[];
    preferred_skills: string[];
    status: JobStatus;
  } = {
    department: null,
    location: null,
    employment_type: null,
    salary_range: null,
    years_experience_required: null,
    education_required: null,
    required_skills: [],
    preferred_skills: [],
    status: "active",
  };

  for (const field of LEGACY_STRING_FIELDS) {
    const value = rest[field];
    legacyColumns[field] = typeof value === "string" && value.trim() ? value.trim() : null;
    delete form_data[field];
  }

  const yearsValue = rest.years_experience_required;
  if (typeof yearsValue === "string" && yearsValue.trim()) {
    const parsed = Number.parseInt(yearsValue, 10);
    legacyColumns.years_experience_required = Number.isNaN(parsed) ? null : parsed;
  }
  delete form_data.years_experience_required;

  for (const field of LEGACY_SKILL_FIELDS) {
    legacyColumns[field] = formValueToLegacySkills(rest[field]);
    delete form_data[field];
  }

  const statusValue = rest.status;
  legacyColumns.status =
    statusValue === "draft" || statusValue === "active" || statusValue === "closed"
      ? statusValue
      : "active";
  delete form_data.status;

  const salaryRange = buildSalaryRangeLabel(rest);
  if (salaryRange) {
    legacyColumns.salary_range = salaryRange;
  }

  return {
    title: String(job_title ?? "").trim(),
    description: String(job_description ?? "").trim() || null,
    form_data,
    ...legacyColumns,
  };
}
