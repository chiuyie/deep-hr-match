import {
  JOB_BACKGROUND_QUESTIONS,
  JOB_ELIMINATION_FIELDS,
  JOB_FORM_NO_FILTER_VALUE,
  JOB_FORM_SECTIONS,
  JOB_PREFERRED_FIELDS,
} from "@/lib/constants/job-form";
import type { JobFieldMetaMap } from "@/lib/form-fields/job-field-meta";
import { jobFieldRequired, isJobFieldVisible } from "@/lib/form-fields/job-field-meta";
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
  "preferred-selection-by-the-employer": [],
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
  visitedThroughIndex: number,
  fieldMeta?: JobFieldMetaMap
): boolean {
  if (sectionId === "job-identification") {
    const titleOk =
      !jobFieldRequired(fieldMeta, "job_title", true) ||
      isJobFormValueFilled(values.job_title);
    const descriptionOk =
      !jobFieldRequired(fieldMeta, "job_description", true) ||
      isJobFormValueFilled(values.job_description);
    return titleOk && descriptionOk;
  }

  if (sectionId === "background-information-questions") {
    const questions = fieldMeta
      ? JOB_BACKGROUND_QUESTIONS.filter((q) => isJobFieldVisible(fieldMeta, q.name))
      : JOB_BACKGROUND_QUESTIONS;
    return questions.every((question) => typeof values[question.name] === "boolean");
  }

  if (sectionId === "basic-information") {
    const fields = fieldMeta
      ? JOB_ELIMINATION_FIELDS.filter((field) => isJobFieldVisible(fieldMeta, field.name))
      : JOB_ELIMINATION_FIELDS;
    return fields.every((field) => isJobFormValueFilled(values[field.name]));
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
  visitedThroughIndex: number,
  fieldMeta?: JobFieldMetaMap
) {
  const total = JOB_FORM_SECTIONS.length;
  const completed = JOB_FORM_SECTIONS.filter((section, index) =>
    isSectionComplete(values, section.id, index, visitedThroughIndex, fieldMeta)
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
  sectionId: JobFormSectionId,
  fieldMeta?: JobFieldMetaMap
): SectionValidationResult {
  if (sectionId === "job-identification") {
    if (
      jobFieldRequired(fieldMeta, "job_title", true) &&
      !isJobFormValueFilled(values.job_title)
    ) {
      return {
        ok: false,
        message: "Job title is required before you continue.",
        focusField: "job_title",
      };
    }
    if (
      jobFieldRequired(fieldMeta, "job_description", true) &&
      !isJobFormValueFilled(values.job_description)
    ) {
      return {
        ok: false,
        message: "Please add a job description before you continue.",
        focusField: "job_description",
      };
    }
  }

  if (sectionId === "background-information-questions") {
    const questions = fieldMeta
      ? JOB_BACKGROUND_QUESTIONS.filter((question) => isJobFieldVisible(fieldMeta, question.name))
      : JOB_BACKGROUND_QUESTIONS;
    const missing = questions.find((question) => typeof values[question.name] !== "boolean");
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

export function validateJobFormForSubmit(
  values: JobFormState,
  fieldMeta?: JobFieldMetaMap
): SectionValidationResult {
  for (const section of JOB_FORM_SECTIONS) {
    if (
      section.id === "compensation" ||
      section.id === "preferred-selection-by-the-employer" ||
      section.id === "job-details"
    ) {
      continue;
    }
    const result = validateJobFormSection(values, section.id, fieldMeta);
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
