import {
  JOB_FORM_SECTIONS,
} from "@/lib/constants/job-form";
import {
  CANDIDATE_ADDITIONAL_SECTION,
  CANDIDATE_PROFILE_SECTIONS,
  EMPLOYER_ADDITIONAL_SECTION,
  EMPLOYER_PROFILE_SECTIONS,
} from "@/lib/form-fields/profile-sections";
import type { FormFieldAudience, FormFieldGroup } from "@/lib/form-fields/types";

export type FormSectionRecord = {
  id: string;
  audience: FormFieldAudience;
  form_group: FormFieldGroup;
  title: string;
  sort_order: number;
};

export function defaultSectionTitles(
  audience: FormFieldAudience,
  formGroup: FormFieldGroup
): string[] {
  if (audience === "candidate" && formGroup === "profile") {
    return [
      ...CANDIDATE_PROFILE_SECTIONS.map((s) => s.title),
      CANDIDATE_ADDITIONAL_SECTION.title,
    ];
  }
  if (audience === "employer" && formGroup === "profile") {
    return [
      ...EMPLOYER_PROFILE_SECTIONS.map((s) => s.title),
      EMPLOYER_ADDITIONAL_SECTION.title,
    ];
  }
  if (audience === "employer" && formGroup === "job") {
    return JOB_FORM_SECTIONS.map((s) => s.title);
  }
  return [];
}

export function defaultFallbackSection(
  audience: FormFieldAudience,
  formGroup: FormFieldGroup
): string {
  if (audience === "candidate" && formGroup === "profile") {
    return CANDIDATE_ADDITIONAL_SECTION.title;
  }
  if (audience === "employer" && formGroup === "profile") {
    return EMPLOYER_ADDITIONAL_SECTION.title;
  }
  if (audience === "employer" && formGroup === "job") {
    return JOB_FORM_SECTIONS[JOB_FORM_SECTIONS.length - 1]?.title ?? "Additional fields";
  }
  return "Additional information";
}

export function normalizeSectionTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ");
}

export function isProtectedJobSectionTitle(title: string): boolean {
  return JOB_FORM_SECTIONS.some((section) => section.title === title);
}
