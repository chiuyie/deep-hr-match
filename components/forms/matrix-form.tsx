"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EmployerEmptyState, EmployerPageSection } from "@/components/employer/employer-ui";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { getCurrentMatrixQuestion, getMatrixPathQuestions } from "@/lib/matching/matrix-tree";
import { validateMatrixSubmission } from "@/lib/matching/matrix-form";
import { pickPrimaryMatrixCategories } from "@/lib/matching/matrix-queries";
import { sortMatrixOptions } from "@/lib/matching/matrix-option-display";
import { MatrixWordSearchPicker } from "@/components/forms/matrix-word-search-picker";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, CheckCircle2, Grid3X3, Sparkles } from "lucide-react";
import type { MatrixCategory, MatrixQuestion, MatrixOption } from "@/types/database";

interface MatrixFormProps {
  categories: (MatrixCategory & {
    matrix_questions: (MatrixQuestion & { matrix_options: MatrixOption[] })[];
  })[];
  existingAnswers: Record<string, { option_id?: string; answer_text?: string }>;
  onSave: (
    answers: { question_id: string; option_id?: string; answer_text?: string }[],
    submit: boolean
  ) => Promise<{ error?: string; success?: boolean; redirectTo?: string }>;
  targetLabel?: string;
  headerIcon?: React.ReactNode;
  /**
   * Candidate UX: keep the view minimal and show Back/Next controls.
   * Other pages keep the default Submit & continue / Save draft actions.
   */
  wizard?: {
    instructionText?: string;
  };
  hideFooterActions?: boolean;
}

export function MatrixForm({
  categories,
  existingAnswers,
  onSave,
  targetLabel = FRAMEWORK_MATCHING_LANGUAGE,
  headerIcon = <Grid3X3 className="h-6 w-6" />,
  wizard,
  hideFooterActions = false,
}: MatrixFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState(existingAnswers);
  const [saving, setSaving] = useState(false);

  const activeCategories = useMemo(
    () => pickPrimaryMatrixCategories(categories.filter((c) => c.is_active)),
    [categories]
  );

  const current = useMemo(() => {
    const cat = activeCategories[0];
    if (!cat) return undefined;
    return {
      ...cat,
      matrix_questions: (cat.matrix_questions ?? []).map((q) => ({
        ...q,
        matrix_options: sortMatrixOptions(q.matrix_options ?? []),
      })),
    };
  }, [activeCategories]);

  function clearDescendantAnswers(
    next: Record<string, { option_id?: string; answer_text?: string }>,
    source: Record<string, { option_id?: string; answer_text?: string }>,
    parentOptionId: string,
    allQuestions: MatrixQuestion[]
  ) {
    for (const q of allQuestions) {
      if (q.parent_option_id === parentOptionId) {
        const childOption = source[q.id]?.option_id;
        delete next[q.id];
        if (childOption) {
          clearDescendantAnswers(next, source, childOption, allQuestions);
        }
      }
    }
  }

  function setAnswer(
    questionId: string,
    value: { option_id?: string; answer_text?: string }
  ) {
    setAnswers((prev) => {
      const next = { ...prev };
      const allQuestions = current?.matrix_questions ?? [];
      const previousOption = prev[questionId]?.option_id;

      if (!value.option_id && value.answer_text === undefined) {
        delete next[questionId];
        if (previousOption) {
          clearDescendantAnswers(next, prev, previousOption, allQuestions);
        }
        return next;
      }

      if (value.option_id === "") {
        delete next[questionId];
        if (previousOption) {
          clearDescendantAnswers(next, prev, previousOption, allQuestions);
        }
        return next;
      }

      next[questionId] = value;

      if (value.option_id && current) {
        if (previousOption && previousOption !== value.option_id) {
          clearDescendantAnswers(next, prev, previousOption, allQuestions);
        }
      }
      return next;
    });
  }

  const pathSteps = useMemo(
    () => (current ? getMatrixPathQuestions(current.matrix_questions ?? [], answers) : []),
    [current, answers]
  );

  const currentQuestion = useMemo(
    () =>
      current
        ? (getCurrentMatrixQuestion(current.matrix_questions ?? [], answers) as
            | (MatrixQuestion & { matrix_options?: MatrixOption[] })
            | null)
        : null,
    [current, answers]
  );

  const formComplete = current && !currentQuestion;

  async function handleSave(submit: boolean, options?: { silent?: boolean }) {
    if (submit) {
      if (current && getCurrentMatrixQuestion(current.matrix_questions ?? [], answers)) {
        toast.error("Please complete the current level before submitting.");
        return;
      }
      const validationError = validateMatrixSubmission(activeCategories, answers);
      if (validationError) {
        toast.error(validationError);
        return;
      }
    }

    setSaving(true);
    const payload = Object.entries(answers)
      .filter(([, val]) => val.option_id || val.answer_text?.trim())
      .map(([question_id, val]) => ({
        question_id,
        ...val,
      }));
    try {
      const result = await onSave(payload, submit);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (submit && result.redirectTo) {
        toast.success("Form submitted — continuing to the next step");
        router.push(result.redirectTo);
        return;
      }

      if (!options?.silent) {
        toast.success(submit ? "Form submitted" : "Draft saved");
      }
    } finally {
      setSaving(false);
    }
  }

  const isCurrentAnswered = useMemo(() => {
    if (!currentQuestion) return false;
    const a = answers[currentQuestion.id];
    if (currentQuestion.question_type === "text" || currentQuestion.question_type === "scale") {
      return Boolean(a?.answer_text?.trim());
    }
    return Boolean(a?.option_id);
  }, [answers, currentQuestion]);

  function clearPreviousStep() {
    // Back navigates by clearing the last answered step,
    // which makes that question the new "currentQuestion" for the wizard.
    if (pathSteps.length < 1) return;
    const previousQuestion = pathSteps[pathSteps.length - 1];
    if (!previousQuestion) return;
    setAnswer(previousQuestion.id, {});
  }

  const rootQuestions = useMemo(
    () =>
      (current?.matrix_questions ?? [])
        .filter((question) => !question.parent_option_id && question.is_active)
        .sort((a, b) => a.sort_order - b.sort_order),
    [current]
  );

  const completedRootCount = useMemo(
    () => pathSteps.filter((question) => !question.parent_option_id).length,
    [pathSteps]
  );

  const activeRootQuestion = useMemo(() => {
    if (!currentQuestion) {
      return rootQuestions[Math.max(rootQuestions.length - 1, 0)] ?? null;
    }
    if (!currentQuestion.parent_option_id) {
      return currentQuestion;
    }
    for (let index = pathSteps.length - 1; index >= 0; index -= 1) {
      if (!pathSteps[index].parent_option_id) {
        return pathSteps[index];
      }
    }
    return rootQuestions[0] ?? null;
  }, [currentQuestion, pathSteps, rootQuestions]);

  const activeRootIndex = useMemo(() => {
    if (!activeRootQuestion) return 0;
    const index = rootQuestions.findIndex((question) => question.id === activeRootQuestion.id);
    return index >= 0 ? index : 0;
  }, [activeRootQuestion, rootQuestions]);

  const progressValue = useMemo(() => {
    if (!rootQuestions.length) return 0;
    if (formComplete) return 100;
    return Math.max(8, Math.round((completedRootCount / rootQuestions.length) * 100));
  }, [completedRootCount, formComplete, rootQuestions.length]);

  const currentFactorLabel = useMemo(() => {
    if (!wizard) return null;
    return activeRootQuestion?.question_text?.trim() || current.name?.trim() || "Current factor";
  }, [activeRootQuestion, current, wizard]);

  const optionLookup = useMemo(() => {
    const map = new Map<string, MatrixOption>();
    for (const question of current?.matrix_questions ?? []) {
      for (const option of question.matrix_options ?? []) {
        map.set(option.id, option);
      }
    }
    return map;
  }, [current]);

  const answeredRootSteps = useMemo(
    () =>
      rootQuestions
        .map((question, index) => {
          const answer = answers[question.id];
          if (!answer?.option_id && !answer?.answer_text?.trim()) return null;
          return {
            id: question.id,
            label: question.question_text,
            step: index + 1,
            value:
              optionLookup.get(answer.option_id ?? "")?.option_text ??
              answer.answer_text?.trim() ??
              "",
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    [answers, optionLookup, rootQuestions]
  );

  const currentSelectedLabel = useMemo(() => {
    if (!currentQuestion) return null;
    const answer = answers[currentQuestion.id];
    if (!answer) return null;
    return (
      optionLookup.get(answer.option_id ?? "")?.option_text ??
      answer.answer_text?.trim() ??
      null
    );
  }, [answers, currentQuestion, optionLookup]);

  if (!activeCategories.length || !current) {
    return (
      <EmployerPageSection
        title={targetLabel}
        description="Matching questionnaire for this role"
        icon={headerIcon}
        gradient="from-purple-500 to-purple-600"
      >
        <EmployerEmptyState
          icon={Grid3X3}
          title="No form categories configured"
          description="Run npm run seed-matrix-77 or apply supabase/seed.sql to load the 7^7 placeholder form."
          gradient="from-purple-500 to-purple-600"
        />
      </EmployerPageSection>
    );
  }

  if (wizard) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-primary/15 bg-gradient-to-br from-white via-white to-primary/5 p-6 shadow-sm dark:from-slate-950 dark:via-slate-950 dark:to-primary/10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                Candidate assessment
              </Badge>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  {FRAMEWORK_MATCHING_LANGUAGE}
                </h2>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Move through one factor at a time and choose the single word that fits you
                  best. You can always go back to review your answers before submitting.
                </p>
              </div>
            </div>
            <div className="min-w-44 rounded-2xl border border-primary/15 bg-white/80 px-4 py-3 text-right shadow-sm backdrop-blur dark:bg-slate-900/70">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Progress
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {formComplete ? rootQuestions.length : activeRootIndex + 1}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  / {rootQuestions.length}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {formComplete ? "All factors completed" : `Current factor: ${currentFactorLabel}`}
              </span>
              <span className="text-muted-foreground">{progressValue}% complete</span>
            </div>
            <Progress value={progressValue} aria-label="Candidate matrix progress" />
          </div>

          {rootQuestions.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {rootQuestions.map((question, index) => {
                const answered = Boolean(
                  answers[question.id]?.option_id || answers[question.id]?.answer_text?.trim()
                );
                const active = activeRootQuestion?.id === question.id;
                return (
                  <div
                    key={question.id}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : answered
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                          : "border-border/70 bg-background/70 text-muted-foreground"
                    )}
                  >
                    Factor {index + 1}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {formComplete ? (
          <Card className="rounded-3xl border-emerald-200 bg-emerald-50/80 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/30">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-emerald-950 dark:text-emerald-100">
                    You have completed all factors
                  </h3>
                  <p className="text-sm text-emerald-900/80 dark:text-emerald-200/90">
                    Review your last answer if needed, or submit your responses to continue.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl"
                  disabled={saving || pathSteps.length < 1}
                  onClick={clearPreviousStep}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  className="rounded-xl"
                  disabled={saving}
                  onClick={() => handleSave(true)}
                >
                  {saving ? "Submitting..." : "Submit answers"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {!currentQuestion && !formComplete ? (
          <Card className="rounded-3xl shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                No questions are available yet. Ask an administrator to configure the matrix.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {currentQuestion ? (
          <Card className="overflow-hidden rounded-3xl border-primary/10 shadow-sm">
            <CardContent className="space-y-6 p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-3">
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {currentQuestion.parent_option_id
                      ? "Sub-level choice"
                      : `Factor ${activeRootIndex + 1} of ${rootQuestions.length}`}
                  </Badge>
                  <div className="space-y-2">
                    <Label className="block text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                      {!currentQuestion.parent_option_id
                        ? current.name?.trim() || currentQuestion.question_text
                        : currentQuestion.question_text}
                      {currentQuestion.is_required && (
                        <span className="text-destructive"> *</span>
                      )}
                    </Label>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                      {currentQuestion.parent_option_id
                        ? "Refine your choice by selecting one word from the sub-level below."
                        : wizard.instructionText ||
                          "Choose the one word that describes you best."}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl bg-primary/5 px-4 py-3 text-sm text-primary">
                  <div className="flex items-center gap-2 font-medium">
                    <Sparkles className="h-4 w-4" />
                    Choose one best-fit word
                  </div>
                </div>
              </div>

              {answeredRootSteps.length > 0 ? (
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Your selections so far
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {answeredRootSteps.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-slate-700 shadow-sm dark:text-slate-200"
                      >
                        <span className="font-medium">F{entry.step}:</span> {entry.value}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {currentSelectedLabel ? (
                <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary">
                  Selected for this step: <span className="font-semibold">{currentSelectedLabel}</span>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground">
                  Pick one option below to continue to the next step.
                </div>
              )}

              {currentQuestion.question_type === "text" ? (
                <Textarea
                  value={answers[currentQuestion.id]?.answer_text ?? ""}
                  onChange={(e) => setAnswer(currentQuestion.id, { answer_text: e.target.value })}
                  placeholder="Your answer..."
                  className="min-h-28 rounded-2xl"
                />
              ) : currentQuestion.question_type === "scale" ? (
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={answers[currentQuestion.id]?.answer_text ?? ""}
                  onChange={(e) => setAnswer(currentQuestion.id, { answer_text: e.target.value })}
                  className="rounded-2xl"
                />
              ) : (
                <MatrixWordSearchPicker
                  options={currentQuestion.matrix_options ?? []}
                  value={answers[currentQuestion.id]?.option_id}
                  onChange={(optionId) => setAnswer(currentQuestion.id, { option_id: optionId })}
                />
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl"
                  disabled={saving || pathSteps.length < 1}
                  onClick={clearPreviousStep}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  className="rounded-xl px-5"
                  disabled={saving || !isCurrentAnswered}
                  onClick={() => handleSave(false, { silent: true })}
                >
                  {saving ? "Saving..." : "Next"}
                  {!saving ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EmployerPageSection
        title={wizard ? "" : current.name?.trim() ? current.name : targetLabel}
        description={
          wizard
            ? ""
            : current.description?.trim() ||
              "Questions and fields match what your administrator configured in the matrix editor."
        }
        icon={headerIcon}
        gradient="from-purple-500 to-purple-600"
      >
        <div className="space-y-6">
          {!wizard && currentQuestion ? (
            <p className="text-sm text-muted-foreground">
              Step {pathSteps.length + 1} — answer one level at a time.
              {pathSteps.length > 0
                ? ` (${pathSteps.length} level${pathSteps.length === 1 ? "" : "s"} completed)`
                : null}
            </p>
          ) : null}

          {!wizard && formComplete ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
              You have completed all levels. Submit to continue, or save a draft.
            </div>
          ) : null}
          {wizard && formComplete ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
              You have completed all levels.
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-lg"
                  disabled={saving || pathSteps.length < 1}
                  onClick={clearPreviousStep}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="rounded-lg"
                  disabled={saving}
                  onClick={() => handleSave(true)}
                >
                  {saving ? "Submitting…" : "Submit"}
                </Button>
              </div>
            </div>
          ) : null}

          {!currentQuestion && !formComplete ? (
            <p className="text-sm text-muted-foreground">
              No questions are available yet. Ask an administrator to configure levels in the
              matrix editor.
            </p>
          ) : null}

          {currentQuestion ? (
            <div
              key={currentQuestion.id}
              className={cn(
                "space-y-3",
                currentQuestion.parent_option_id && "ml-4 border-l-2 border-primary/20 pl-4"
              )}
            >
              <Label className="text-base text-slate-800 dark:text-slate-100">
                {!currentQuestion.parent_option_id && wizard
                  ? current.name?.trim() || currentQuestion.question_text
                  : currentQuestion.question_text}
                {currentQuestion.is_required && <span className="text-destructive"> *</span>}
              </Label>
              {wizard?.instructionText && !currentQuestion.parent_option_id ? (
                <p className="text-sm text-muted-foreground">{wizard.instructionText}</p>
              ) : null}
              {currentQuestion.parent_option_id ? (
                <p className="text-xs text-muted-foreground">
                  Sub-level under your previous choice — pick one word below.
                </p>
              ) : null}
              {currentQuestion.question_type === "text" ? (
                <Textarea
                  value={answers[currentQuestion.id]?.answer_text ?? ""}
                  onChange={(e) =>
                    setAnswer(currentQuestion.id, { answer_text: e.target.value })
                  }
                  placeholder="Your answer..."
                  className="min-h-24 rounded-xl"
                />
              ) : currentQuestion.question_type === "scale" ? (
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={answers[currentQuestion.id]?.answer_text ?? ""}
                  onChange={(e) =>
                    setAnswer(currentQuestion.id, { answer_text: e.target.value })
                  }
                  className="rounded-xl"
                />
              ) : (
                <MatrixWordSearchPicker
                  options={currentQuestion.matrix_options ?? []}
                  value={answers[currentQuestion.id]?.option_id}
                  onChange={(optionId) =>
                    setAnswer(currentQuestion.id, { option_id: optionId })
                  }
                />
              )}

              {wizard ? (
                <div className="flex flex-wrap gap-2 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-lg"
                    disabled={saving || pathSteps.length < 1}
                    onClick={clearPreviousStep}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="rounded-lg"
                    disabled={saving || !isCurrentAnswered}
                    onClick={() => handleSave(Boolean(formComplete))}
                  >
                    {saving ? "Saving…" : formComplete ? "Submit" : "Next"}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </EmployerPageSection>

      {!hideFooterActions ? (
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-lg" disabled={saving} onClick={() => handleSave(true)}>
            {saving ? "Submitting…" : "Submit & continue"}
          </Button>
          <Button
            variant="secondary"
            className="rounded-lg"
            disabled={saving}
            onClick={() => handleSave(false)}
          >
            Save draft
          </Button>
        </div>
      ) : null}
    </div>
  );
}
