"use client";

import { useMemo } from "react";
import {
  Briefcase,
  Car,
  ClipboardList,
  Clock,
  FileText,
  Gift,
  Heart,
  HelpCircle,
  MapPin,
  Plane,
  Shield,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import {
  JobFaqField,
  JobFormSection,
  JobMoneyField,
  JobSearchSelectField,
  JobSelectField,
  JobTextField,
  JobTextareaField,
} from "./job-form-fields";
import {
  groupPreferredFields,
  getPreferredCategoryGuidance,
  JOB_BACKGROUND_QUESTIONS,
  JOB_BENEFIT_OPTIONS,
  JOB_ELIMINATION_FIELDS,
  JOB_FORM_NO_FILTER_VALUE,
  JOB_IMPORTANCE_LEVEL_OPTIONS,
} from "@/lib/constants/job-form";
import jobFormDomains from "@/lib/constants/job-form-data/domains.json";
import jobFormFunctions from "@/lib/constants/job-form-data/functions.json";
import jobFormRoles from "@/lib/constants/job-form-data/roles.json";
import jobFormStructuralSkills from "@/lib/constants/job-form-data/structural-skills.json";
import { flattenMultilevelOptions, type JobFormState } from "@/lib/utils/job-form";
import type { JobFormSectionId } from "@/lib/utils/job-form-progress";
import type { FormFieldDefinition } from "@/lib/form-fields/types";
import type { JobFieldMetaMap } from "@/lib/form-fields/job-field-meta";
import {
  customJobFieldsForSection,
  isJobFieldVisible,
  jobFieldLabel,
  jobFieldRequired,
} from "@/lib/form-fields/job-field-meta";
import { JobCustomFieldsBlock } from "./job-custom-fields";

const multilevelOptions = {
  roles: flattenMultilevelOptions(jobFormRoles),
  domains: flattenMultilevelOptions(jobFormDomains),
  functions: flattenMultilevelOptions(jobFormFunctions),
  structuralSkills: flattenMultilevelOptions(jobFormStructuralSkills),
};

export interface JobCreationFormSectionBodyProps {
  sectionId: JobFormSectionId;
  values: JobFormState;
  preferredCategoryIndex?: number;
  fieldMeta?: JobFieldMetaMap;
  jobFields?: FormFieldDefinition[];
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  onSearchChange: (event: { target: { name: string; value: string } }) => void;
  onToggleBenefit: (benefit: string) => void;
}

export function JobCreationFormSectionBody({
  sectionId,
  values,
  preferredCategoryIndex = 0,
  fieldMeta,
  jobFields = [],
  onChange,
  onSearchChange,
  onToggleBenefit,
}: JobCreationFormSectionBodyProps) {
  const preferredGroups = useMemo(() => groupPreferredFields(), []);
  const selectedBenefits = Array.isArray(values.benefits_package) ? values.benefits_package : [];
  const preferredCategory = preferredGroups[preferredCategoryIndex];
  const customForSection = customJobFieldsForSection(jobFields, sectionId);

  switch (sectionId) {
    case "job-identification":
      return (
        <JobFormSection
          id="job-identification"
          title="Role basics"
          description=""
          gradient="from-cyan-500 to-cyan-600"
          icon={<Briefcase className="h-6 w-6 text-white" />}
          className="mb-0 pb-24 shadow-md"
          hideHeader
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            {isJobFieldVisible(fieldMeta, "job_title") && (
              <div className="md:col-span-2">
                <JobTextField
                  label={jobFieldLabel(fieldMeta, "job_title", "Job title")}
                  name="job_title"
                  placeholder="e.g. Senior Software Engineer"
                  value={String(values.job_title ?? "")}
                  required={jobFieldRequired(fieldMeta, "job_title", true)}
                  icon={<Briefcase className="h-5 w-5 text-slate-400" />}
                  onChange={onChange}
                />
              </div>
            )}
            {isJobFieldVisible(fieldMeta, "job_id") && (
              <JobTextField
                label={jobFieldLabel(fieldMeta, "job_id", "Job reference ID")}
                name="job_id"
                placeholder="Auto-generated — edit if needed"
                value={String(values.job_id ?? "")}
                icon={<FileText className="h-5 w-5 text-slate-400" />}
                maxLength={32}
                hint="Letters, numbers, and hyphens only."
                onChange={onChange}
              />
            )}
            {isJobFieldVisible(fieldMeta, "created_by_representative") && (
              <JobTextField
                label={jobFieldLabel(fieldMeta, "created_by_representative", "Representative name")}
                name="created_by_representative"
                placeholder="Who created this posting?"
                value={String(values.created_by_representative ?? "")}
                required={jobFieldRequired(fieldMeta, "created_by_representative")}
                icon={<User className="h-5 w-5 text-slate-400" />}
                onChange={onChange}
              />
            )}
            {isJobFieldVisible(fieldMeta, "job_description") && (
              <div className="md:col-span-2">
                <JobTextareaField
                  label={jobFieldLabel(fieldMeta, "job_description", "Job description")}
                  name="job_description"
                  placeholder="Summarise responsibilities, team, and what success looks like"
                  value={String(values.job_description ?? "")}
                  required={jobFieldRequired(fieldMeta, "job_description", true)}
                  onChange={onChange}
                />
              </div>
            )}
          </div>
          <JobCustomFieldsBlock fields={customForSection} values={values} onChange={onChange} />
        </JobFormSection>
      );

    case "job-details":
      return (
        <JobFormSection
          id="job-details"
          title="Job details"
          description=""
          gradient="from-indigo-500 to-indigo-600"
          icon={<Briefcase className="h-6 w-6 text-white" />}
          className="mb-0 pb-24 shadow-md"
          hideHeader
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            {isJobFieldVisible(fieldMeta, "working_hours") && (
              <JobTextField
                label={jobFieldLabel(fieldMeta, "working_hours", "Working hours")}
                name="working_hours"
                placeholder="e.g. 9am – 5pm"
                value={String(values.working_hours ?? "")}
                required={jobFieldRequired(fieldMeta, "working_hours")}
                icon={<Clock className="h-5 w-5 text-slate-400" />}
                onChange={onChange}
              />
            )}
            {isJobFieldVisible(fieldMeta, "team_size") && (
              <JobTextField
                label={jobFieldLabel(fieldMeta, "team_size", "Team size")}
                name="team_size"
                placeholder="e.g. 8"
                value={String(values.team_size ?? "")}
                required={jobFieldRequired(fieldMeta, "team_size")}
                icon={<Users className="h-5 w-5 text-slate-400" />}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                hint="Whole number only."
                onChange={onChange}
              />
            )}
            {isJobFieldVisible(fieldMeta, "importance_level") && (
              <JobSelectField
                label={jobFieldLabel(fieldMeta, "importance_level", "Importance of this role")}
                name="importance_level"
                placeholder="Select level"
                options={JOB_IMPORTANCE_LEVEL_OPTIONS}
                value={String(values.importance_level ?? "")}
                onChange={onChange}
              />
            )}
            {isJobFieldVisible(fieldMeta, "travel_needs") && (
              <JobTextField
                label={jobFieldLabel(fieldMeta, "travel_needs", "Travel requirements")}
                name="travel_needs"
                placeholder="e.g. None, occasional, frequent"
                value={String(values.travel_needs ?? "")}
                required={jobFieldRequired(fieldMeta, "travel_needs")}
                icon={<Plane className="h-5 w-5 text-slate-400" />}
                onChange={onChange}
              />
            )}
            {isJobFieldVisible(fieldMeta, "reporting_to") && (
              <div className="md:col-span-2">
                <JobTextField
                  label={jobFieldLabel(fieldMeta, "reporting_to", "Reports to (job title)")}
                  name="reporting_to"
                  placeholder="e.g. Engineering Manager"
                  value={String(values.reporting_to ?? "")}
                  required={jobFieldRequired(fieldMeta, "reporting_to")}
                  icon={<User className="h-5 w-5 text-slate-400" />}
                  onChange={onChange}
                />
              </div>
            )}
            {isJobFieldVisible(fieldMeta, "additional_notes") && (
              <div className="md:col-span-2">
                <JobTextareaField
                  label={jobFieldLabel(
                    fieldMeta,
                    "additional_notes",
                    "Additional notes for recruiters (optional)"
                  )}
                  name="additional_notes"
                  placeholder="Anything else candidates should know"
                  value={String(values.additional_notes ?? "")}
                  required={jobFieldRequired(fieldMeta, "additional_notes")}
                  onChange={onChange}
                />
              </div>
            )}
          </div>
          <JobCustomFieldsBlock fields={customForSection} values={values} onChange={onChange} />
        </JobFormSection>
      );

    case "compensation":
      return (
        <JobFormSection
          id="compensation"
          title="Compensation & benefits"
          description=""
          gradient="from-emerald-500 to-emerald-600"
          icon={<Gift className="h-6 w-6 text-white" />}
          className="mb-0 pb-24 shadow-md"
          hideHeader
        >
          <p className="mb-6 text-sm text-slate-600">
            Optional — set the <strong>monthly salary budget</strong> you can offer for this role and
            any benefits. This is used for matching and stored on the job posting; it is separate
            from the ranking step later.
          </p>
          <div className="mb-8 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            {isJobFieldVisible(fieldMeta, "desired_minimum_salary") && (
              <JobMoneyField
                label={jobFieldLabel(
                  fieldMeta,
                  "desired_minimum_salary",
                  "Budget range — minimum (SGD / month)"
                )}
                name="desired_minimum_salary"
                placeholder="e.g. 5000"
                value={String(values.desired_minimum_salary ?? "")}
                onChange={onChange}
              />
            )}
            {isJobFieldVisible(fieldMeta, "desired_maximum_salary") && (
              <JobMoneyField
                label={jobFieldLabel(
                  fieldMeta,
                  "desired_maximum_salary",
                  "Budget range — maximum (SGD / month)"
                )}
                name="desired_maximum_salary"
                placeholder="e.g. 8000"
                value={String(values.desired_maximum_salary ?? "")}
                onChange={onChange}
              />
            )}
          </div>
          {isJobFieldVisible(fieldMeta, "benefits_package") && (
            <>
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                {jobFieldLabel(fieldMeta, "benefits_package", "Benefits included")}
              </h3>
              <p className="mb-4 text-sm text-slate-500">Select all that apply, or leave empty.</p>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {JOB_BENEFIT_OPTIONS.map((benefit) => {
                  const selected = selectedBenefits.includes(benefit);
                  return (
                    <label
                      key={benefit}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                        selected
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 bg-white hover:border-emerald-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleBenefit(benefit)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span
                        className={`text-sm font-medium ${selected ? "text-emerald-700" : "text-slate-600"}`}
                      >
                        {benefit}
                      </span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
          <JobCustomFieldsBlock fields={customForSection} values={values} onChange={onChange} />
        </JobFormSection>
      );

    case "basic-information":
      return (
        <JobFormSection
          id="basic-information"
          title="Matching filters"
          description=""
          gradient="from-purple-500 to-purple-600"
          icon={<ClipboardList className="h-6 w-6 text-white" />}
          className="mb-0 pb-24 shadow-md"
          hideHeader
        >
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">Elimination filters</p>
            <p className="mt-1 text-amber-900/90">
              Candidates who do not match a filter you set will not appear in your results. Use{" "}
              <strong>{JOB_FORM_NO_FILTER_VALUE}</strong> when a criterion should not eliminate anyone. Only
              set sensitive filters (e.g. age, gender) where you have a lawful hiring reason.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            {JOB_ELIMINATION_FIELDS.map((field) =>
              isJobFieldVisible(fieldMeta, field.name) ? (
                <JobSelectField
                  key={field.name}
                  label={jobFieldLabel(fieldMeta, field.name, field.label)}
                  name={field.name}
                  placeholder={field.placeholder}
                  options={field.options}
                  value={String(values[field.name] ?? "")}
                  onChange={onChange}
                />
              ) : null
            )}
            {isJobFieldVisible(fieldMeta, "language_needs") && (
              <div className="md:col-span-2">
                <JobTextareaField
                  label={jobFieldLabel(fieldMeta, "language_needs", "Language requirements (optional)")}
                  name="language_needs"
                  placeholder="e.g. English, Mandarin"
                  value={String(values.language_needs ?? "")}
                  required={jobFieldRequired(fieldMeta, "language_needs")}
                  onChange={onChange}
                />
              </div>
            )}
          </div>
          <JobCustomFieldsBlock fields={customForSection} values={values} onChange={onChange} />
        </JobFormSection>
      );

    case "background-information-questions":
      return (
        <JobFormSection
          id="background-information-questions"
          title="Role requirements"
          description=""
          gradient="from-green-500 to-green-600"
          icon={<HelpCircle className="h-6 w-6 text-white" />}
          className="mb-0 pb-24 shadow-md"
          hideHeader
        >
          <p className="mb-4 text-sm text-slate-500">
            Answer each question so matching can score candidates accurately.
          </p>
          <div className="grid grid-cols-1 gap-4">
            {JOB_BACKGROUND_QUESTIONS.map((question) =>
              isJobFieldVisible(fieldMeta, question.name) ? (
                <JobFaqField
                  key={question.name}
                  label={jobFieldLabel(fieldMeta, question.name, question.label)}
                  name={question.name}
                  value={
                    typeof values[question.name] === "boolean"
                      ? (values[question.name] as boolean)
                      : undefined
                  }
                  icon={
                    question.name === "faq_work_life_balance" ? (
                      <Heart className="h-5 w-5" />
                    ) : question.name.includes("driving") || question.name.includes("car") ? (
                      <Car className="h-5 w-5" />
                    ) : question.name.includes("overtime") ? (
                      <Clock className="h-5 w-5" />
                    ) : question.name.includes("disability") ? (
                      <Heart className="h-5 w-5" />
                    ) : question.name.includes("relocate") ? (
                      <MapPin className="h-5 w-5" />
                    ) : (
                      <Shield className="h-5 w-5" />
                    )
                  }
                  onChange={onChange}
                />
              ) : null
            )}
          </div>
          <JobCustomFieldsBlock fields={customForSection} values={values} onChange={onChange} />
        </JobFormSection>
      );

    case "preferred-selection-by-the-employer":
      if (!preferredCategory) return null;
      {
        const guidance = getPreferredCategoryGuidance(preferredCategory[0]);
        return (
        <JobFormSection
          id="preferred-selection-by-the-employer"
          title="Improve match ranking"
          description=""
          gradient="from-amber-500 to-amber-600"
          icon={<Sparkles className="h-6 w-6 text-white" />}
          className="mb-0 pb-24 shadow-md"
          hideHeader
        >
          <p className="mb-4 text-sm text-slate-600">
            <strong>Optional.</strong> These answers do not block candidates—they only help rank who
            appears higher on your match list (+3 points when a candidate profile aligns with a field
            you fill in). Skip anything that does not matter for this hire.
          </p>
          <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {guidance?.shortTitle ?? preferredCategory[0]} · {preferredCategoryIndex + 1} of{" "}
              {preferredGroups.length}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {guidance?.intro ??
                "Tell us what you would like to see in strong candidates for this role."}
            </p>
          </div>
          <div className="space-y-4">
            {preferredCategory[1].map((field) =>
              isJobFieldVisible(fieldMeta, field.name) ? (
                field.type === "multilevel" && field.multilevelKey ? (
                  <JobSearchSelectField
                    key={field.name}
                    label={jobFieldLabel(fieldMeta, field.name, field.label)}
                    name={field.name}
                    value={String(values[field.name] ?? "")}
                    options={multilevelOptions[field.multilevelKey]}
                    onChange={onSearchChange}
                  />
                ) : (
                  <JobTextField
                    key={field.name}
                    label={jobFieldLabel(fieldMeta, field.name, field.label)}
                    name={field.name}
                    value={String(values[field.name] ?? "")}
                    placeholder={field.placeholder ?? "Optional"}
                    onChange={onChange}
                  />
                )
              ) : null
            )}
          </div>
          <JobCustomFieldsBlock fields={customForSection} values={values} onChange={onChange} />
        </JobFormSection>
        );
      }

    default:
      return null;
  }
}
