"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { JobCreationSectionNav } from "./job-creation-section-nav";
import { JobCreationStepNav } from "./job-creation-step-nav";
import { JobCreationProgressHeader } from "./job-creation-progress-header";
import { JobCreationFormSectionBody } from "./job-creation-form-sections";
import { groupPreferredFields, getPreferredCategoryGuidance, JOB_FORM_SECTIONS } from "@/lib/constants/job-form";
import {
  clearJobCreationDraft,
  isEditingExistingJob,
  mergeJobFormInitialValues,
  readJobCreationDraft,
  writeJobCreationDraft,
} from "@/lib/utils/job-form-defaults";
import {
  findSectionIndexForField,
  getJobFormSectionsProgress,
  getPreferredCategoryFieldKeys,
  getSectionFillStats,
  validateJobFormForSubmit,
  validateJobFormSection,
} from "@/lib/utils/job-form-progress";
import {
  isJobIntegerField,
  isJobMoneyField,
  sanitizeIntegerInput,
  sanitizeJobReferenceInput,
  sanitizeMoneyInput,
} from "@/lib/utils/job-form-input";
import type { JobFormState } from "@/lib/utils/job-form";
import { buildJobFieldMetaMap } from "@/lib/form-fields/job-field-meta";
import type { FormFieldDefinition } from "@/lib/form-fields/types";
import { cn } from "@/lib/utils";

interface JobCreationFormProps {
  initialValues?: JobFormState;
  submitLabel?: string;
  action: (formData: FormData) => Promise<void>;
  persistDraft?: boolean;
  jobFields?: FormFieldDefinition[];
}

function scrollDashboardToTop() {
  const scrollContainer = document.getElementById("dashboard-main");
  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export function JobCreationForm({
  initialValues = {},
  submitLabel = "Save Job",
  action,
  persistDraft = true,
  jobFields = [],
}: JobCreationFormProps) {
  const fieldMeta = useMemo(() => buildJobFieldMetaMap(jobFields), [jobFields]);
  const customFieldKeys = useMemo(
    () => new Set(jobFields.filter((f) => f.is_custom).map((f) => f.field_key)),
    [jobFields]
  );
  const editingExisting = isEditingExistingJob(initialValues);
  const preferredGroups = useMemo(() => groupPreferredFields(), []);
  const preferredCategoryCount = preferredGroups.length;

  const [values, setValues] = useState<JobFormState>(() => {
    const base = mergeJobFormInitialValues(initialValues);
    if (persistDraft && !editingExisting) {
      const draft = readJobCreationDraft();
      if (draft) return mergeJobFormInitialValues({ ...base, ...draft });
    }
    return base;
  });
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [preferredCategoryIndex, setPreferredCategoryIndex] = useState(0);
  const [visitedThroughIndex, setVisitedThroughIndex] = useState(0);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const dirtyRef = useRef(false);

  const sectionCount = JOB_FORM_SECTIONS.length;
  const currentSection = JOB_FORM_SECTIONS[currentSectionIndex];
  const isPreferredSection = currentSection.id === "preferred-selection-by-the-employer";
  const isFirstSection = currentSectionIndex === 0 && preferredCategoryIndex === 0;
  const isLastPreferredCategory =
    isPreferredSection && preferredCategoryIndex >= preferredCategoryCount - 1;
  const isLastSection = currentSectionIndex === sectionCount - 1 && isLastPreferredCategory;

  const sectionsProgress = useMemo(
    () => getJobFormSectionsProgress(values, visitedThroughIndex, fieldMeta),
    [values, visitedThroughIndex, fieldMeta]
  );

  const sectionFieldKeys = useMemo(() => {
    if (isPreferredSection && preferredGroups[preferredCategoryIndex]) {
      return getPreferredCategoryFieldKeys(preferredGroups[preferredCategoryIndex][0]);
    }
    return undefined;
  }, [isPreferredSection, preferredCategoryIndex, preferredGroups]);

  const sectionStats = useMemo(
    () => getSectionFillStats(values, currentSection.id, sectionFieldKeys),
    [values, currentSection.id, sectionFieldKeys]
  );

  const markDirty = () => {
    dirtyRef.current = true;
    setIsDirty(true);
  };

  const goToSection = useCallback(
    (index: number, preferredIndex = 0) => {
      const next = Math.max(0, Math.min(sectionCount - 1, index));
      setCurrentSectionIndex(next);
      setPreferredCategoryIndex(
        JOB_FORM_SECTIONS[next].id === "preferred-selection-by-the-employer"
          ? Math.max(0, Math.min(preferredCategoryCount - 1, preferredIndex))
          : 0
      );
      setSectionError(null);
      scrollDashboardToTop();
    },
    [preferredCategoryCount, sectionCount]
  );

  useEffect(() => {
    setVisitedThroughIndex((prev) => Math.max(prev, currentSectionIndex));
  }, [currentSectionIndex]);

  useEffect(() => {
    if (!persistDraft || editingExisting) return;
    const timer = window.setTimeout(() => {
      writeJobCreationDraft(values);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [values, persistDraft, editingExisting]);

  useEffect(() => {
    if (!persistDraft || editingExisting) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [persistDraft, editingExisting]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    markDirty();
    const { name, value, type } = event.target;
    setSectionError(null);

    if (name.startsWith("faq_") && type === "radio") {
      setValues((current) => {
        const next = { ...current };
        if (value === "unspecified") {
          delete next[name];
        } else {
          next[name] = value === "true";
        }
        return next;
      });
      return;
    }

    setValues((current) => {
      const storageKey = name.startsWith("custom_") ? name.slice("custom_".length) : name;
      return {
        ...current,
        [storageKey]:
          type === "radio"
            ? value === "true"
            : storageKey === "job_id"
              ? sanitizeJobReferenceInput(value)
              : isJobMoneyField(storageKey)
                ? sanitizeMoneyInput(value)
                : isJobIntegerField(storageKey)
                  ? sanitizeIntegerInput(value)
                  : value,
      };
    });
  };

  const handleSearchChange = (event: { target: { name: string; value: string } }) => {
    markDirty();
    const { name, value } = event.target;
    setSectionError(null);
    setValues((current) => ({ ...current, [name]: value }));
  };

  const toggleBenefit = (benefit: string) => {
    markDirty();
    setSectionError(null);
    setValues((current) => {
      const selected = Array.isArray(current.benefits_package) ? current.benefits_package : [];
      const next = selected.includes(benefit)
        ? selected.filter((item) => item !== benefit)
        : [...selected, benefit];
      return { ...current, benefits_package: next };
    });
  };

  const buildFormData = (form: HTMLFormElement) => {
    const formData = new FormData(form);
    for (const [key, value] of Object.entries(values)) {
      if (key === "benefits_package" && Array.isArray(value)) {
        formData.delete("benefits_package");
        value.forEach((benefit) => formData.append("benefits_package", benefit));
        continue;
      }
      if (typeof value === "boolean") {
        formData.set(key, String(value));
      } else if (typeof value === "string") {
        const formKey = customFieldKeys.has(key) ? `custom_${key}` : key;
        formData.set(formKey, value);
      }
    }
    return formData;
  };

  const focusField = (fieldName?: string) => {
    if (!fieldName) return;
    const element =
      document.getElementById(fieldName) ??
      document.querySelector<HTMLElement>(`[name="${fieldName}"]`);
    element?.focus();
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleNext = () => {
    const validation = validateJobFormSection(values, currentSection.id, fieldMeta);
    if (validation.ok === false) {
      setSectionError(validation.message);
      focusField(validation.focusField);
      return;
    }

    if (isPreferredSection && !isLastPreferredCategory) {
      setPreferredCategoryIndex((index) => index + 1);
      setSectionError(null);
      scrollDashboardToTop();
      return;
    }

    goToSection(currentSectionIndex + 1);
  };

  const handleBack = () => {
    if (isPreferredSection && preferredCategoryIndex > 0) {
      setPreferredCategoryIndex((index) => index - 1);
      setSectionError(null);
      scrollDashboardToTop();
      return;
    }
    goToSection(currentSectionIndex - 1);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateJobFormForSubmit(values, fieldMeta);
    if (validation.ok === false) {
      setSectionError(validation.message);
      goToSection(findSectionIndexForField(validation.focusField));
      queueMicrotask(() => focusField(validation.focusField));
      return;
    }

    const formData = buildFormData(event.currentTarget);
    startTransition(async () => {
      await action(formData);
      if (persistDraft && !editingExisting) {
        clearJobCreationDraft();
      }
      dirtyRef.current = false;
      setIsDirty(false);
    });
  };

  const preferredPartLabel =
    isPreferredSection && preferredGroups[preferredCategoryIndex]
      ? (() => {
          const category = preferredGroups[preferredCategoryIndex][0];
          const guidance = getPreferredCategoryGuidance(category);
          return `${guidance?.shortTitle ?? category} (${preferredCategoryIndex + 1}/${preferredCategoryCount})`;
        })()
      : undefined;

  return (
    <>
      <JobCreationStepNav
        currentStep="job"
        jobFormProgress={sectionsProgress.percent}
        warnBeforeLeave={isDirty && persistDraft && !editingExisting}
      />

      {persistDraft && !editingExisting && (
        <p className="mb-4 text-xs text-slate-500">
          Your answers are saved automatically on this device while you work.
        </p>
      )}

      <div className="flex flex-col lg:flex-row lg:gap-x-8">
        <aside className="mb-6 lg:mb-0 lg:w-80 lg:shrink-0">
          <div className="lg:sticky lg:top-24">
            <JobCreationSectionNav
              currentSectionIndex={currentSectionIndex}
              visitedThroughIndex={visitedThroughIndex}
              values={values}
              onSectionSelect={(index) => goToSection(index, 0)}
            />
          </div>
        </aside>

        <main className="min-w-0 flex-1 lg:pl-2">
          <JobCreationProgressHeader
            sectionIndex={currentSectionIndex}
            sectionFillPercent={sectionStats.percent}
            sectionFilled={sectionStats.filled}
            sectionTotal={sectionStats.total}
            sectionsCompleted={sectionsProgress.completed}
            sectionCount={sectionsProgress.total}
            preferredPartLabel={preferredPartLabel}
          />

          <form onSubmit={handleSubmit} className="space-y-0">
            <div
              key={`${currentSection.id}-${preferredCategoryIndex}`}
              className="animate-in fade-in slide-in-from-right-4 duration-300"
            >
              <JobCreationFormSectionBody
                sectionId={currentSection.id}
                values={values}
                preferredCategoryIndex={preferredCategoryIndex}
                fieldMeta={fieldMeta}
                jobFields={jobFields}
                onChange={handleChange}
                onSearchChange={handleSearchChange}
                onToggleBenefit={toggleBenefit}
              />
            </div>

            {sectionError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{sectionError}</span>
              </div>
            )}

            <div className="sticky bottom-0 z-10 -mx-2 mt-6 border-t border-slate-200 bg-gradient-to-b from-slate-50/95 to-white/95 px-2 py-4 backdrop-blur-sm sm:-mx-0 sm:px-0">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-center text-xs text-slate-500 sm:text-left">
                  {isLastSection
                    ? "Review your answers, then save. You can still jump to earlier steps."
                    : isPreferredSection && !isLastPreferredCategory
                      ? "Continue through each preference group, or skip empty fields."
                      : "Required fields are marked with * · Other steps are optional."}
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isFirstSection || pending}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>

                  {!isLastSection ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      Continue
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={pending}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-8 py-2.5 text-sm font-bold text-primary-foreground shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {pending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        submitLabel
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}
