import {
  JOB_ELIMINATION_FIELDS,
  JOB_FORM_NO_FILTER_VALUE,
} from "@/lib/constants/job-form";
import type { JobFormState } from "@/lib/utils/job-form";

export function generateJobReferenceId(): string {
  const year = new Date().getFullYear();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `JOB-${year}-${suffix}`;
}

export function buildDefaultEliminationValues(): JobFormState {
  const defaults: JobFormState = {};
  for (const field of JOB_ELIMINATION_FIELDS) {
    if (field.name === "not_required_nationality") {
      defaults[field.name] = "";
      continue;
    }
    defaults[field.name] = JOB_FORM_NO_FILTER_VALUE;
  }
  return defaults;
}

export function mergeJobFormInitialValues(initialValues: JobFormState = {}): JobFormState {
  const editing = isEditingExistingJob(initialValues);
  const merged: JobFormState = {
    ...buildDefaultEliminationValues(),
    ...initialValues,
  };

  if (!editing && !String(merged.job_id ?? "").trim()) {
    merged.job_id = generateJobReferenceId();
  }

  for (const field of JOB_ELIMINATION_FIELDS) {
    if (field.name === "not_required_nationality") {
      if (merged[field.name] === undefined) merged[field.name] = "";
      continue;
    }
    if (!String(initialValues[field.name] ?? "").trim()) {
      merged[field.name] = JOB_FORM_NO_FILTER_VALUE;
    }
  }

  return merged;
}

export const JOB_CREATION_DRAFT_STORAGE_KEY = "deep-hr-match:employer-job-draft";
export const JOB_CREATION_MATRIX_DRAFT_STORAGE_KEY =
  "deep-hr-match:employer-job-matrix-draft";

export function readJobCreationDraft(): JobFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(JOB_CREATION_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as JobFormState;
  } catch {
    return null;
  }
}

export function writeJobCreationDraft(values: JobFormState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(JOB_CREATION_DRAFT_STORAGE_KEY, JSON.stringify(values));
  } catch {
    // ignore quota errors
  }
}

export type JobMatrixDraftAnswer = {
  question_id: string;
  option_id?: string;
  answer_text?: string;
  matrix_column: number;
};

export function readJobCreationMatrixDraft(): JobMatrixDraftAnswer[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(JOB_CREATION_MATRIX_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as JobMatrixDraftAnswer[]) : null;
  } catch {
    return null;
  }
}

export function writeJobCreationMatrixDraft(answers: JobMatrixDraftAnswer[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      JOB_CREATION_MATRIX_DRAFT_STORAGE_KEY,
      JSON.stringify(answers)
    );
  } catch {
    // ignore quota errors
  }
}

export function clearJobCreationDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(JOB_CREATION_DRAFT_STORAGE_KEY);
  window.localStorage.removeItem(JOB_CREATION_MATRIX_DRAFT_STORAGE_KEY);
}

export function isEditingExistingJob(initialValues: JobFormState): boolean {
  return Boolean(initialValues.job_title?.toString().trim());
}
