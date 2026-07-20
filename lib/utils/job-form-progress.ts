import {
  JOB_BACKGROUND_QUESTIONS,
  JOB_ELIMINATION_FIELDS,
  JOB_FORM_NO_FILTER_VALUE,
  JOB_FORM_SECTIONS,
  JOB_PREFERRED_FIELDS,
} from "@/lib/constants/job-form";
import type { JobFormState } from "@/lib/utils/job-form";
import {
  buildSalaryRangeLabel,
  validateCompensationRange,
} from "@/lib/utils/job-form-input";

export type JobFormSectionId = (typeof JOB_FORM_SECTIONS)[number]["id"];

export function isJobFormValueFilled(value: JobFormState[string]): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "boolean") return true;
  return false;
}

const OPTIONAL_SECTION_IDS = new Set<JobFormSectionId>([
  "compensation",
  "preferred-selection-by-the-employer",
]);

const SECTION_FIELD_KEYS: Record<JobFormSectionId, readonly string[]> = {
  "job-identification": ["job_title", "job_id", "created_by_representative", "job_description"],
  "job-details": [
    "working_hours",
    "team_size",
    "importance_level",
    "travel_needs",
    "reporting_to",
    "additional_notes",
  ],
  compensation: ["desired_minimum_salary", "desired_maximum_salary", "benefits_package"],
  "basic-information": [
    ...JOB_ELIMINATION_FIELDS.map((field) => field.name),
    "language_needs",
  ],
  "background-information-questions": JOB_BACKGROUND_QUESTIONS.map((question) => question.name),
  "preferred-selection-by-the-employer": JOB_PREFERRED_FIELDS.map((field) => field.name),
};

export function getJobFormSectionFieldKeys(sectionId: JobFormSectionId): readonly string[] {
  return SECTION_FIELD_KEYS[sectionId];
}

export function getPreferredCategoryFieldKeys(category: string): string[] {
  return JOB_PREFERRED_FIELDS.filter((field) => field.category === category).map((field) => field.name);
}

/** Fields counted toward optional section progress (excludes default “no filter” values). */
export function isMeaningfulJobFormValue(key: string, value: JobFormState[string]): boolean {
  if (!isJobFormValueFilled(value)) return false;
  if (typeof value === "string" && value === JOB_FORM_NO_FILTER_VALUE) return false;
  return true;
}

export function getSectionFillStats(
  values: JobFormState,
  sectionId: JobFormSectionId,
  fieldKeys?: readonly string[]
) {
  const keys = fieldKeys ?? getJobFormSectionFieldKeys(sectionId);
  const filled = keys.filter((key) => isMeaningfulJobFormValue(key, values[key])).length;
  const total = keys.length;
  return { filled, total, percent: total ? Math.round((filled / total) * 100) : 0 };
}

export function isSectionComplete(
  values: JobFormState,
  sectionId: JobFormSectionId,
  sectionIndex: number,
  visitedThroughIndex: number
): boolean {
  if (sectionId === "job-identification") {
    return (
      isJobFormValueFilled(values.job_title) && isJobFormValueFilled(values.job_description)
    );
  }

  if (sectionId === "background-information-questions") {
    return JOB_BACKGROUND_QUESTIONS.every((question) => typeof values[question.name] === "boolean");
  }

  if (sectionId === "basic-information") {
    return JOB_ELIMINATION_FIELDS.every((field) =>
      isJobFormValueFilled(values[field.name])
    );
  }

  if (OPTIONAL_SECTION_IDS.has(sectionId)) {
    if (sectionIndex > visitedThroughIndex) {
      const { percent } = getSectionFillStats(values, sectionId);
      return percent > 0;
    }
    return true;
  }

  if (sectionIndex <= visitedThroughIndex) {
    return true;
  }

  const { percent } = getSectionFillStats(values, sectionId);
  return percent >= 40;
}

export function getJobFormSectionsProgress(
  values: JobFormState,
  visitedThroughIndex: number
) {
  const total = JOB_FORM_SECTIONS.length;
  const completed = JOB_FORM_SECTIONS.filter((section, index) =>
    isSectionComplete(values, section.id, index, visitedThroughIndex)
  ).length;
  return {
    completed,
    total,
    percent: total ? Math.round((completed / total) * 100) : 0,
  };
}

/** @deprecated Use getJobFormSectionsProgress for UI; kept for coarse field counts. */
export function getJobFormFillStats(values: JobFormState) {
  let filled = 0;
  let total = 0;
  for (const section of JOB_FORM_SECTIONS) {
    const stats = getSectionFillStats(values, section.id);
    filled += stats.filled;
    total += stats.total;
  }
  return {
    filled,
    total,
    percent: total ? Math.round((filled / total) * 100) : 0,
  };
}

export function isSectionMarkedComplete(
  values: JobFormState,
  sectionId: JobFormSectionId,
  visitedThroughIndex: number,
  sectionIndex: number
): boolean {
  return isSectionComplete(values, sectionId, sectionIndex, visitedThroughIndex);
}

export type SectionValidationResult =
  | { ok: true }
  | { ok: false; message: string; focusField?: string };

export function validateJobFormSection(
  values: JobFormState,
  sectionId: JobFormSectionId
): SectionValidationResult {
  if (sectionId === "job-identification") {
    if (!isJobFormValueFilled(values.job_title)) {
      return {
        ok: false,
        message: "Job title is required before you continue.",
        focusField: "job_title",
      };
    }
    if (!isJobFormValueFilled(values.job_description)) {
      return {
        ok: false,
        message: "Please add a job description before you continue.",
        focusField: "job_description",
      };
    }
  }

  if (sectionId === "background-information-questions") {
    const missing = JOB_BACKGROUND_QUESTIONS.find(
      (question) => typeof values[question.name] !== "boolean"
    );
    if (missing) {
      return {
        ok: false,
        message: "Please answer every requirement question (Yes, No, or Not specified).",
        focusField: missing.name,
      };
    }
  }

  if (sectionId === "compensation") {
    const range = validateCompensationRange(values);
    if (range.ok === false) {
      return range;
    }
  }

  return { ok: true };
}

export function validateJobFormForSubmit(values: JobFormState): SectionValidationResult {
  for (const section of JOB_FORM_SECTIONS) {
    if (
      section.id === "compensation" ||
      section.id === "preferred-selection-by-the-employer" ||
      section.id === "job-details"
    ) {
      continue;
    }
    const result = validateJobFormSection(values, section.id);
    if (result.ok === false) return result;
  }
  return { ok: true };
}

export function findSectionIndexForField(fieldName?: string): number {
  if (!fieldName) return 0;
  if (fieldName === "job_description" || fieldName === "job_title") {
    return JOB_FORM_SECTIONS.findIndex((section) => section.id === "job-identification");
  }
  if (fieldName.startsWith("faq_")) {
    return JOB_FORM_SECTIONS.findIndex(
      (section) => section.id === "background-information-questions"
    );
  }
  return 0;
}
