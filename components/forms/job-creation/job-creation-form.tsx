"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { JobCreationSectionNav } from "./job-creation-section-nav";
import { JobCreationStepNav } from "./job-creation-step-nav";
import { JobCreationProgressHeader } from "./job-creation-progress-header";
import {
  JobCreationFormSectionBody,
  type JobMatrixAnswerRow,
  type JobMatrixCategoryTree,
} from "./job-creation-form-sections";
import { JOB_FORM_SECTIONS, JOB_MATRIX_ANSWERS_FORM_KEY } from "@/lib/constants/job-form";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { MATRIX_WORDS_PER_LEVEL } from "@/lib/matching/matrix-constants";
import {
  clearJobCreationDraft,
  isEditingExistingJob,
  mergeJobFormInitialValues,
  readJobCreationDraft,
  readJobCreationMatrixDraft,
  writeJobCreationDraft,
  writeJobCreationMatrixDraft,
} from "@/lib/utils/job-form-defaults";
import {
  findSectionIndexForField,
  getJobFormSectionsProgress,
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
  matrixCategories?: JobMatrixCategoryTree[];
  matrixExistingAnswers?: JobMatrixAnswerRow[];
}

function scrollDashboardToTop() {
  const scrollContainer = document.getElementById("dashboard-main");
  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function matrixFillStats(answers: JobMatrixAnswerRow[]) {
  const columns = new Set(
    answers
      .map((answer) => answer.matrix_column)
      .filter((column) => typeof column === "number" && column >= 1)
  );
  const filled = Math.min(columns.size, MATRIX_WORDS_PER_LEVEL);
  const total = MATRIX_WORDS_PER_LEVEL;
  return {
    filled,
    total,
    percent: total ? Math.round((filled / total) * 100) : 0,
  };
}

export function JobCreationForm({
  initialValues = {},
  submitLabel = "Save Job",
  action,
  persistDraft = true,
  jobFields = [],
  matrixCategories = [],
  matrixExistingAnswers = [],
}: JobCreationFormProps) {
  const fieldMeta = useMemo(() => buildJobFieldMetaMap(jobFields), [jobFields]);
  const customFieldKeys = useMemo(
    () => new Set(jobFields.filter((f) => f.is_custom).map((f) => f.field_key)),
    [jobFields]
  );
  const editingExisting = isEditingExistingJob(initialValues);

  const [values, setValues] = useState<JobFormState>(() => {
    const base = mergeJobFormInitialValues(initialValues);
    if (persistDraft && !editingExisting) {
      const draft = readJobCreationDraft();
      if (draft) return mergeJobFormInitialValues({ ...base, ...draft });
    }
    return base;
  });
  const [matrixAnswers, setMatrixAnswers] = useState<JobMatrixAnswerRow[]>(() => {
    if (persistDraft && !editingExisting) {
      return readJobCreationMatrixDraft() ?? matrixExistingAnswers;
    }
    return matrixExistingAnswers;
  });
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [visitedThroughIndex, setVisitedThroughIndex] = useState(0);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const dirtyRef = useRef(false);

  const sectionCount = JOB_FORM_SECTIONS.length;
  const currentSection = JOB_FORM_SECTIONS[currentSectionIndex];
  const isMatrixSection = currentSection.id === "preferred-selection-by-the-employer";
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === sectionCount - 1;

  const sectionsProgress = useMemo(
    () => getJobFormSectionsProgress(values, visitedThroughIndex, fieldMeta),
    [values, visitedThroughIndex, fieldMeta]
  );

  const sectionStats = useMemo(() => {
    if (isMatrixSection) return matrixFillStats(matrixAnswers);
    return getSectionFillStats(values, currentSection.id);
  }, [values, currentSection.id, isMatrixSection, matrixAnswers]);

  const markDirty = () => {
    dirtyRef.current = true;
    setIsDirty(true);
  };

  const goToSection = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(sectionCount - 1, index));
      setCurrentSectionIndex(next);
      setVisitedThroughIndex((prev) => Math.max(prev, next));
      setSectionError(null);
      scrollDashboardToTop();
    },
    [sectionCount]
  );
  useEffect(() => {
    if (!persistDraft || editingExisting) return;
    const timer = window.setTimeout(() => {
      writeJobCreationDraft(values);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [values, persistDraft, editingExisting]);

  useEffect(() => {
    if (!persistDraft || editingExisting) return;
    const timer = window.setTimeout(() => {
      writeJobCreationMatrixDraft(matrixAnswers);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [matrixAnswers, persistDraft, editingExisting]);

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

  const handleMatrixAnswersChange = useCallback((answers: JobMatrixAnswerRow[]) => {
    setMatrixAnswers((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(answers)) return prev;
      dirtyRef.current = true;
      setIsDirty(true);
      return answers;
    });
  }, []);

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
    formData.set(JOB_MATRIX_ANSWERS_FORM_KEY, JSON.stringify(matrixAnswers));
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

    goToSection(currentSectionIndex + 1);
  };

  const handleBack = () => {
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
              onSectionSelect={(index) => goToSection(index)}
              matrixFillPercent={matrixFillStats(matrixAnswers).percent}
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
            preferredPartLabel={
              isMatrixSection
                ? `${FRAMEWORK_MATCHING_LANGUAGE} (${sectionStats.filled}/${sectionStats.total} factors)`
                : undefined
            }
          />

          <form onSubmit={handleSubmit} className="space-y-0">
            <div
              key={currentSection.id}
              className="animate-in fade-in slide-in-from-right-4 duration-300"
            >
              <JobCreationFormSectionBody
                sectionId={currentSection.id}
                values={values}
                fieldMeta={fieldMeta}
                jobFields={jobFields}
                matrixCategories={matrixCategories}
                matrixExistingAnswers={matrixAnswers}
                onMatrixAnswersChange={handleMatrixAnswersChange}
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
                    ? `Review your answers, then save. ${FRAMEWORK_MATCHING_LANGUAGE} is optional.`
                    : isMatrixSection
                      ? `Optional · same ${FRAMEWORK_MATCHING_LANGUAGE} candidates complete.`
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
