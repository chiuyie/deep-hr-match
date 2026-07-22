"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  CircleAlert,
  Coins,
  Loader2,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DynamicProfileFields,
  type ProfileFieldSection,
} from "@/components/forms/dynamic-profile-fields";
import {
  ProfileFormValidationProvider,
  useProfileFormValidation,
} from "@/components/forms/profile-form-validation-context";
import { PROFILE_COMPLETION_THRESHOLD } from "@/lib/candidate/profile-sections";
import {
  profileFormAction,
  saveProfileStepDraft,
  type ProfileFormState,
} from "@/app/candidate/profile/actions";
import type { FormFieldDefinition } from "@/lib/form-fields/types";
import { cn } from "@/lib/utils";

const SECTION_ICONS = [UserRound, Briefcase, Coins, MapPin, Sparkles] as const;

type CandidateProfileFormProps = {
  values: Record<string, unknown>;
  sections: ProfileFieldSection[];
  completionPercentage: number;
  missingFieldLabels: string[];
  isOnboardingProfileStep: boolean;
  continueHref?: string;
  continueLabel?: string;
  initialError?: string;
  showSavedDraft?: boolean;
  showIncompleteError?: boolean;
};

function focusField(fieldKey: string) {
  const el =
    document.querySelector<HTMLElement>(`[data-field-key="${fieldKey}"] input, [data-field-key="${fieldKey}"] textarea, [data-field-key="${fieldKey}"] select, #${CSS.escape(fieldKey)}`);
  el?.focus?.();
  el?.scrollIntoView?.({ behavior: "smooth", block: "center" });
}

function CandidateProfileFormInner({
  values,
  sections,
  completionPercentage,
  missingFieldLabels,
  isOnboardingProfileStep,
  continueHref,
  continueLabel,
  initialError,
  showSavedDraft,
  showIncompleteError,
}: CandidateProfileFormProps) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    profileFormAction,
    { error: initialError }
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const [stepBlockMessage, setStepBlockMessage] = useState<string | null>(null);
  const [localCompletion, setLocalCompletion] = useState(completionPercentage);
  const [stepSavedFlash, setStepSavedFlash] = useState(false);
  const [stepSaving, setStepSaving] = useState(false);
  const { validateSection, isSectionValid } = useProfileFormValidation();

  const totalSteps = sections.length;
  const isLastStep = step >= totalSteps - 1;
  const current = sections[step];
  const stepProgress = totalSteps > 0 ? Math.round(((step + 1) / totalSteps) * 100) : 0;
  const meetsThreshold = localCompletion >= PROFILE_COMPLETION_THRESHOLD;
  const error = state.error;
  const currentSectionValid = current ? isSectionValid(current.fields) : false;
  const busy = pending || stepSaving;

  useEffect(() => {
    setLocalCompletion(completionPercentage);
  }, [completionPercentage]);

  useEffect(() => {
    if (showIncompleteError) {
      setStep(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showIncompleteError]);

  useEffect(() => {
    setStepBlockMessage(null);
  }, [step, currentSectionValid]);

  useEffect(() => {
    if (!stepSavedFlash) return;
    const timer = window.setTimeout(() => setStepSavedFlash(false), 2500);
    return () => window.clearTimeout(timer);
  }, [stepSavedFlash]);

  const stepMeta = useMemo(
    () =>
      sections.map((section, index) => ({
        ...section,
        Icon: SECTION_ICONS[index % SECTION_ICONS.length]!,
      })),
    [sections]
  );

  function advanceTo(next: number) {
    const clamped = Math.max(0, Math.min(totalSteps - 1, next));
    setStepBlockMessage(null);
    setStep(clamped);
    setVisited((prev) => new Set(prev).add(clamped));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveDraftThenAdvance(next: number) {
    const form = formRef.current;
    if (!form || stepSaving) return;

    setStepSaving(true);
    setStepBlockMessage(null);
    try {
      const formData = new FormData(form);
      const result = await saveProfileStepDraft(formData);
      if (result.error) {
        setStepBlockMessage(result.error);
        return;
      }
      if (typeof result.completionPercentage === "number") {
        setLocalCompletion(result.completionPercentage);
      }
      setStepSavedFlash(true);
      advanceTo(next);
    } catch {
      setStepBlockMessage("Could not save this page. Check your connection and try again.");
    } finally {
      setStepSaving(false);
    }
  }

  function goTo(next: number, options?: { bypassValidation?: boolean }) {
    if (busy) return;

    if (!options?.bypassValidation && next > step && current) {
      const result = validateSection(current.fields);
      if (!result.ok) {
        setStepBlockMessage(
          result.errors[result.firstInvalidKey ?? ""] ??
            "Fix the highlighted fields before continuing."
        );
        if (result.firstInvalidKey) focusField(result.firstInvalidKey);
        return;
      }
      saveDraftThenAdvance(next);
      return;
    }

    advanceTo(next);
  }

  function handleNext() {
    if (!current || busy) return;
    const result = validateSection(current.fields);
    if (!result.ok) {
      setStepBlockMessage(
        result.errors[result.firstInvalidKey ?? ""] ??
          "Fix the highlighted fields before continuing."
      );
      if (result.firstInvalidKey) focusField(result.firstInvalidKey);
      return;
    }
    saveDraftThenAdvance(step + 1);
  }

  function handleSubmitClick(event: React.MouseEvent<HTMLButtonElement>) {
    // Validate every section before allowing a full submit.
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]!;
      const result = validateSection(section.fields);
      if (!result.ok) {
        event.preventDefault();
        setStep(i);
        setVisited((prev) => new Set(prev).add(i));
        setStepBlockMessage(
          result.errors[result.firstInvalidKey ?? ""] ??
            "Fix the highlighted fields before saving."
        );
        requestAnimationFrame(() => {
          if (result.firstInvalidKey) focusField(result.firstInvalidKey);
        });
        return;
      }
    }
  }

  if (!current || totalSteps === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
        No profile fields are configured yet. Ask an admin to enable fields in Form Fields.
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-5" noValidate>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-sky-50 via-white to-emerald-50/60 px-5 py-5 sm:px-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-200/30 blur-2xl" />
          <div className="relative text-sm text-slate-600">
            Page {step + 1} of {totalSteps}
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="font-medium text-slate-800">{current.title}</span>
          </div>
          {showIncompleteError || (!meetsThreshold && missingFieldLabels.length > 0) ? (
            <p className="mt-3 text-sm text-slate-600">
              <span className="font-medium text-slate-800">Still empty:</span>{" "}
              {missingFieldLabels.slice(0, 4).join(", ")}
              {missingFieldLabels.length > 4 ? ` (+${missingFieldLabels.length - 4} more)` : ""}
            </p>
          ) : null}
        </div>

        <div className="border-t border-slate-100 px-3 py-3 sm:px-4">
          <ol className="flex gap-1 overflow-x-auto pb-1">
            {stepMeta.map((section, index) => {
              const active = index === step;
              const done = visited.has(index) && index < step;
              const Icon = section.Icon;
              return (
                <li key={section.title} className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => goTo(index)}
                    disabled={busy}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition",
                      active
                        ? "bg-sky-100/80 text-sky-950 ring-1 ring-sky-200"
                        : done
                          ? "text-emerald-800 hover:bg-emerald-50"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                      busy && "opacity-60"
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        active
                          ? "bg-sky-600 text-white"
                          : done
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                    </span>
                    <span className="hidden min-w-0 sm:block">
                      <span className="block truncate text-xs font-semibold">{section.title}</span>
                      <span className="block truncate text-[11px] opacity-70">
                        {section.fields.length} field{section.fields.length === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="truncate text-xs font-medium sm:hidden">{index + 1}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <Progress
            value={stepProgress}
            className="mt-2 h-1.5 bg-slate-100"
            aria-label="Form page progress"
          />
        </div>
      </div>

      {showSavedDraft || stepSavedFlash ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
          <CheckCircle2 />
          <AlertTitle>{stepSavedFlash && !showSavedDraft ? "Progress saved" : "Profile saved"}</AlertTitle>
          <AlertDescription>
            {stepSavedFlash && !showSavedDraft
              ? "This page is saved. You can leave and come back anytime."
              : "Your changes are saved. You can leave and come back anytime."}
          </AlertDescription>
        </Alert>
      ) : null}

      {showIncompleteError ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Need a bit more detail</AlertTitle>
          <AlertDescription>
            You&apos;re at {localCompletion}% — reach {PROFILE_COMPLETION_THRESHOLD}% before
            continuing to CV. Fill a few more fields, then try again.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {stepBlockMessage ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Check this page</AlertTitle>
          <AlertDescription>{stepBlockMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            {(() => {
              const Icon = stepMeta[step]?.Icon ?? UserRound;
              return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
              );
            })()}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                {current.title}
              </h2>
              {current.description ? (
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{current.description}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          {sections.map((section, index) => (
            <div
              key={section.title}
              className={cn(index === step ? "block" : "hidden")}
              aria-hidden={index !== step}
            >
              <DynamicProfileFields
                values={values}
                variant="candidate"
                sections={[section]}
                className="!space-y-0"
                flat
              />
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={step === 0 || busy}
                onClick={() => goTo(step - 1, { bypassValidation: true })}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Button>
              {!isLastStep ? (
                <Button
                  type="button"
                  className="rounded-xl bg-sky-600 hover:bg-sky-700"
                  disabled={busy || !currentSectionValid}
                  onClick={handleNext}
                  title={
                    currentSectionValid
                      ? "Save this page and continue"
                      : "Complete the required fields on this page to continue"
                  }
                >
                  {stepSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Next
                  {!stepSaving ? <ArrowRight className="ml-1.5 h-4 w-4" /> : null}
                </Button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              {isOnboardingProfileStep ? (
                <>
                  <Button
                    type="submit"
                    name="intent"
                    value="draft"
                    variant="secondary"
                    disabled={busy}
                    className="rounded-xl"
                    onClick={handleSubmitClick}
                  >
                    {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save for later
                  </Button>
                  {isLastStep ? (
                    <Button
                      type="submit"
                      name="intent"
                      value="submit"
                      disabled={busy || !currentSectionValid}
                      className="rounded-xl"
                      onClick={handleSubmitClick}
                    >
                      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save &amp; continue to CV
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  ) : null}
                </>
              ) : (
                <>
                  <Button
                    type="submit"
                    name="intent"
                    value="draft"
                    disabled={busy}
                    className="rounded-xl"
                    onClick={handleSubmitClick}
                  >
                    {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save profile
                  </Button>
                  {isLastStep && continueHref && continueLabel ? (
                    <Button type="button" variant="outline" className="rounded-xl" asChild>
                      <Link href={continueHref}>{continueLabel}</Link>
                    </Button>
                  ) : null}
                </>
              )}
            </div>
          </div>
          {!isLastStep ? (
            <p className="mt-3 text-xs text-slate-500">
              Next validates this page, saves your progress, then moves on. You can also use Save
              for later anytime.
            </p>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              Last page — save when you&apos;re ready
              {isOnboardingProfileStep ? ", or continue to CV once you hit 60%." : "."}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

export function CandidateProfileForm(props: CandidateProfileFormProps) {
  const allFields: FormFieldDefinition[] = props.sections.flatMap((s) => s.fields);

  return (
    <ProfileFormValidationProvider fields={allFields} initialValues={props.values}>
      <CandidateProfileFormInner {...props} />
    </ProfileFormValidationProvider>
  );
}
