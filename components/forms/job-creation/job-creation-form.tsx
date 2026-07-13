"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  Briefcase,
  Car,
  ClipboardList,
  Clock,
  FileText,
  Gift,
  Heart,
  HelpCircle,
  Loader2,
  MapPin,
  Plane,
  Shield,
  Sparkles,
  Star,
  User,
  Users,
} from "lucide-react";
import { JobCreationSectionNav } from "./job-creation-section-nav";
import { JobCreationStepNav } from "./job-creation-step-nav";
import {
  JobFormSection,
  JobSearchSelectField,
  JobSelectField,
  JobTextField,
  JobTextareaField,
  JobYesNoField,
} from "./job-form-fields";
import {
  groupPreferredFields,
  JOB_BACKGROUND_QUESTIONS,
  JOB_BENEFIT_OPTIONS,
  JOB_ELIMINATION_FIELDS,
} from "@/lib/constants/job-form";
import jobFormDomains from "@/lib/constants/job-form-data/domains.json";
import jobFormFunctions from "@/lib/constants/job-form-data/functions.json";
import jobFormRoles from "@/lib/constants/job-form-data/roles.json";
import jobFormStructuralSkills from "@/lib/constants/job-form-data/structural-skills.json";
import { flattenMultilevelOptions, type JobFormState } from "@/lib/utils/job-form";
import { cn } from "@/lib/utils";

const multilevelOptions = {
  roles: flattenMultilevelOptions(jobFormRoles),
  domains: flattenMultilevelOptions(jobFormDomains),
  functions: flattenMultilevelOptions(jobFormFunctions),
  structuralSkills: flattenMultilevelOptions(jobFormStructuralSkills),
};

interface JobCreationFormProps {
  initialValues?: JobFormState;
  submitLabel?: string;
  action: (formData: FormData) => Promise<void>;
}

export function JobCreationForm({
  initialValues = {},
  submitLabel = "Save Job",
  action,
}: JobCreationFormProps) {
  const [values, setValues] = useState<JobFormState>(initialValues);
  const [pending, startTransition] = useTransition();
  const preferredGroups = useMemo(() => groupPreferredFields(), []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "radio" ? value === "true" : value,
    }));
  };

  const handleSearchChange = (event: { target: { name: string; value: string } }) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const toggleBenefit = (benefit: string) => {
    setValues((current) => {
      const selected = Array.isArray(current.benefits_package) ? current.benefits_package : [];
      const next = selected.includes(benefit)
        ? selected.filter((item) => item !== benefit)
        : [...selected, benefit];
      return { ...current, benefits_package: next };
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    for (const [key, value] of Object.entries(values)) {
      if (key === "benefits_package" && Array.isArray(value)) {
        value.forEach((benefit) => formData.append("benefits_package", benefit));
        continue;
      }

      if (typeof value === "boolean") {
        formData.set(key, String(value));
      } else if (typeof value === "string") {
        formData.set(key, value);
      }
    }

    startTransition(async () => {
      await action(formData);
    });
  };

  const selectedBenefits = Array.isArray(values.benefits_package) ? values.benefits_package : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <JobCreationStepNav currentStep="job" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-start">
          <Link
            href="/employer/company"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Employer profile
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row lg:gap-x-8">
          <aside className="mb-8 lg:mb-0 lg:w-80 lg:shrink-0">
            <div className="sticky top-24">
              <JobCreationSectionNav />
            </div>
          </aside>

          <main className="flex-1 lg:pl-4">
            <form onSubmit={handleSubmit} className="space-y-0">
              <JobFormSection
                id="job-identification"
                title="Job Identification"
                description="Basic reference and setup details for this specific role"
                gradient="from-cyan-500 to-cyan-600"
                icon={<Briefcase className="h-6 w-6 text-white" />}
              >
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <JobTextField
                      label="Job Title"
                      name="job_title"
                      placeholder="Enter job title"
                      value={String(values.job_title ?? "")}
                      required
                      icon={<Briefcase className="h-5 w-5 text-slate-400" />}
                      onChange={handleChange}
                    />
                  </div>
                  <JobTextField
                    label="Job ID (Reference Number)"
                    name="job_id"
                    placeholder="e.g. JOB-101"
                    value={String(values.job_id ?? "")}
                    icon={<FileText className="h-5 w-5 text-slate-400" />}
                    onChange={handleChange}
                  />
                  <JobTextField
                    label="Representative Name"
                    name="created_by_representative"
                    placeholder="Who created this posting?"
                    value={String(values.created_by_representative ?? "")}
                    icon={<User className="h-5 w-5 text-slate-400" />}
                    onChange={handleChange}
                  />
                </div>
              </JobFormSection>

              <JobFormSection
                id="job-description"
                title="Job Description Overview"
                description="Provide the job description details."
                gradient="from-blue-500 to-blue-600"
                icon={<FileText className="h-6 w-6 text-white" />}
              >
                <JobTextareaField
                  label="What does the job description entail?"
                  name="job_description"
                  placeholder="Enter job description"
                  value={String(values.job_description ?? "")}
                  required
                  onChange={handleChange}
                />
              </JobFormSection>

              <JobFormSection
                id="job-details"
                title="Job Details"
                description="Core details about the specific job position"
                gradient="from-indigo-500 to-indigo-600"
                icon={<Briefcase className="h-6 w-6 text-white" />}
              >
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                  <JobTextField
                    label="How long are the working hours?"
                    name="working_hours"
                    placeholder="e.g., 9am - 5pm"
                    value={String(values.working_hours ?? "")}
                    icon={<Clock className="h-5 w-5 text-slate-400" />}
                    onChange={handleChange}
                  />
                  <JobTextField
                    label="What is the team size?"
                    name="team_size"
                    placeholder="Enter team size"
                    value={String(values.team_size ?? "")}
                    icon={<Users className="h-5 w-5 text-slate-400" />}
                    onChange={handleChange}
                  />
                  <JobTextField
                    label="What is the importance level of this role?"
                    name="importance_level"
                    placeholder="e.g., High, Medium, Low"
                    value={String(values.importance_level ?? "")}
                    icon={<Star className="h-5 w-5 text-slate-400" />}
                    onChange={handleChange}
                  />
                  <JobTextField
                    label="Is there travel required? If so, how often?"
                    name="travel_needs"
                    placeholder="e.g., Occasional, Frequent, None"
                    value={String(values.travel_needs ?? "")}
                    icon={<Plane className="h-5 w-5 text-slate-400" />}
                    onChange={handleChange}
                  />
                  <div className="md:col-span-2">
                    <JobTextField
                      label="Title of the person you report to"
                      name="reporting_to"
                      placeholder="Enter reporting manager"
                      value={String(values.reporting_to ?? "")}
                      icon={<User className="h-5 w-5 text-slate-400" />}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <JobTextareaField
                      label="Information"
                      name="additional_notes"
                      placeholder="Enter any additional information or notes"
                      value={String(values.additional_notes ?? "")}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </JobFormSection>

              <JobFormSection
                id="benefits-package"
                title="Benefits Package"
                description="Select the benefits included with this role"
                gradient="from-emerald-500 to-emerald-600"
                icon={<Gift className="h-6 w-6 text-white" />}
              >
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {JOB_BENEFIT_OPTIONS.map((benefit) => {
                    const selected = selectedBenefits.includes(benefit);
                    return (
                      <label
                        key={benefit}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200",
                          selected
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-slate-200 bg-white hover:border-emerald-200"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleBenefit(benefit)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span
                          className={cn(
                            "text-sm font-medium",
                            selected ? "text-emerald-700" : "text-slate-600"
                          )}
                        >
                          {benefit}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </JobFormSection>

              <JobFormSection
                id="basic-information"
                title="Basic Information"
                description="Elimination fields will eliminate candidates - if a candidate doesn't have the criteria, the candidate will not be shown to the employer"
                gradient="from-purple-500 to-purple-600"
                icon={<ClipboardList className="h-6 w-6 text-white" />}
              >
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                  {JOB_ELIMINATION_FIELDS.map((field) => (
                    <JobSelectField
                      key={field.name}
                      label={field.label}
                      name={field.name}
                      placeholder={field.placeholder}
                      options={field.options}
                      value={String(values[field.name] ?? "")}
                      onChange={handleChange}
                    />
                  ))}
                  <div className="md:col-span-2">
                    <JobTextareaField
                      label="What are the language needs?"
                      name="language_needs"
                      placeholder="Enter language needs (e.g., English, Mandarin, Malay)"
                      value={String(values.language_needs ?? "")}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </JobFormSection>

              <JobFormSection
                id="background-information-questions"
                title="Background Information Questions"
                description="Common yes/no questions about work preferences"
                gradient="from-green-500 to-green-600"
                icon={<HelpCircle className="h-6 w-6 text-white" />}
              >
                <div className="grid grid-cols-1 gap-4">
                  {JOB_BACKGROUND_QUESTIONS.map((question) => (
                    <JobYesNoField
                      key={question.name}
                      label={question.label}
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
                      onChange={handleChange}
                    />
                  ))}
                </div>
              </JobFormSection>

              <JobFormSection
                id="preferred-selection-by-the-employer"
                title="Preferred Selection by the Employer"
                description="Historical experience and current background information that will be used to score candidates, 3 points for each match with employer's preference."
                gradient="from-amber-500 to-amber-600"
                icon={<Sparkles className="h-6 w-6 text-white" />}
                className="mb-0"
              >
                <div className="space-y-8">
                  {preferredGroups.map(([category, fields]) => (
                    <div key={category}>
                      <h3 className="mb-4 border-b-2 border-slate-200 pb-3 text-lg font-semibold text-slate-700">
                        {category}
                      </h3>
                      <div className="space-y-4">
                        {fields.map((field) =>
                          field.type === "multilevel" && field.multilevelKey ? (
                            <JobSearchSelectField
                              key={field.name}
                              label={field.label}
                              name={field.name}
                              value={String(values[field.name] ?? "")}
                              options={multilevelOptions[field.multilevelKey]}
                              onChange={handleSearchChange}
                            />
                          ) : (
                            <JobTextField
                              key={field.name}
                              label={field.label}
                              name={field.name}
                              value={String(values[field.name] ?? "")}
                              placeholder="Enter your answer"
                              onChange={handleChange}
                            />
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </JobFormSection>

              <div className="relative bottom-8 mt-8 flex justify-end pb-4">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl bg-gradient-to-r from-primary to-primary/80 px-8 py-3 font-bold text-primary-foreground shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {pending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    submitLabel
                  )}
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
