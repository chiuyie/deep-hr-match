"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { MATRIX_WORDS_PER_LEVEL } from "@/lib/matching/matrix-constants";
import {
  clearOtherFactorWordPicks,
  columnAnswerKey,
  flattenColumnAnswers,
  getAnsweredColumnPath,
  getMatrixColumnFlowState,
  getWordRootQuestions,
  toColumnAnswersMap,
  type ColumnAnswersMap,
  type MatrixCategoryTree,
} from "@/lib/matching/matrix-column-flow";
import { pickPrimaryMatrixCategory } from "@/lib/matching/matrix-queries";
import { sortMatrixOptions } from "@/lib/matching/matrix-option-display";
import { MatrixWordSearchPicker } from "@/components/forms/matrix-word-search-picker";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, CheckCircle2, Grid3X3, Sparkles } from "lucide-react";
import type { MatrixCategory, MatrixQuestion, MatrixOption } from "@/types/database";

type ExistingAnswerRow = {
  question_id?: string;
  option_id?: string;
  answer_text?: string;
  matrix_column?: number;
};

interface MatrixFormProps {
  categories: (MatrixCategory & {
    matrix_questions: (MatrixQuestion & { matrix_options: MatrixOption[] })[];
  })[];
  /** Prefer full rows with matrix_column. Legacy maps without column still accepted. */
  existingAnswers:
    | ColumnAnswersMap
    | Record<string, { option_id?: string; answer_text?: string }>
    | ExistingAnswerRow[];
  onSave: (
    answers: {
      question_id: string;
      option_id?: string;
      answer_text?: string;
      matrix_column: number;
    }[],
    submit: boolean
  ) => Promise<{ error?: string; success?: boolean; redirectTo?: string }>;
  targetLabel?: string;
  headerIcon?: React.ReactNode;
  wizard?: {
    instructionText?: string;
    /** True when the candidate has already submitted this form. */
    alreadySubmitted?: boolean;
    continueHref?: string;
    continueLabel?: string;
  };
  hideFooterActions?: boolean;
}

function normalizeExistingAnswers(
  existing: MatrixFormProps["existingAnswers"]
): ColumnAnswersMap {
  if (Array.isArray(existing)) {
    return toColumnAnswersMap(
      existing.map((row) => ({
        question_id: row.question_id ?? "",
        option_id: row.option_id,
        answer_text: row.answer_text,
        matrix_column: row.matrix_column,
      }))
    );
  }

  // Already column-keyed?
  const values = Object.values(existing);
  if (
    values.some(
      (value) =>
        value &&
        typeof value === "object" &&
        "matrix_column" in value &&
        typeof (value as { matrix_column?: number }).matrix_column === "number" &&
        ((value as { matrix_column?: number }).matrix_column ?? 0) >= 1
    )
  ) {
    return existing as ColumnAnswersMap;
  }

  // Legacy questionId → answer map (no column): ignore for column flow.
  return {};
}

function prepareCategory(
  categories: MatrixFormProps["categories"]
): MatrixCategoryTree | undefined {
  const primary = pickPrimaryMatrixCategory(categories.filter((c) => c.is_active));
  if (!primary) return undefined;
  return {
    ...primary,
    matrix_questions: (primary.matrix_questions ?? []).map((q) => ({
      ...q,
      matrix_options: sortMatrixOptions(q.matrix_options ?? []),
    })),
  };
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
  const [answers, setAnswers] = useState<ColumnAnswersMap>(() =>
    normalizeExistingAnswers(existingAnswers)
  );
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(wizard?.alreadySubmitted));

  const category = useMemo(() => prepareCategory(categories), [categories]);

  const flow = useMemo(
    () =>
      category
        ? getMatrixColumnFlowState(category, answers)
        : { current: null, formComplete: false, completedColumns: 0 },
    [answers, category]
  );

  const current = flow.current;
  const formComplete = flow.formComplete;
  const factorNumber = formComplete
    ? MATRIX_WORDS_PER_LEVEL
    : current?.column ?? Math.min(flow.completedColumns + 1, MATRIX_WORDS_PER_LEVEL);
  const progressValue = formComplete
    ? 100
    : Math.max(8, Math.round(((factorNumber - 1) / MATRIX_WORDS_PER_LEVEL) * 100));
  const showSubmittedState = formComplete && submitted;

  function clearDescendants(
    next: ColumnAnswersMap,
    source: ColumnAnswersMap,
    parentOptionId: string,
    column: number,
    allQuestions: Array<MatrixQuestion & { matrix_options?: MatrixOption[] }>
  ) {
    for (const question of allQuestions) {
      if (question.parent_option_id !== parentOptionId) continue;
      const key = columnAnswerKey(question.id, column);
      const childOption = source[key]?.option_id;
      delete next[key];
      if (childOption) {
        clearDescendants(next, source, childOption, column, allQuestions);
      }
    }
  }

  function setAnswer(
    questionId: string,
    column: number,
    value: { option_id?: string; answer_text?: string },
    options?: { isFactorWordPick?: boolean }
  ) {
    if (!category) return;
    setSubmitted(false);
    setAnswers((prev) => {
      let next = { ...prev };
      const key = columnAnswerKey(questionId, column);
      const previousOption = prev[key]?.option_id;
      const allQuestions = category.matrix_questions ?? [];
      const wordRoots = getWordRootQuestions(category);

      if (!value.option_id && value.answer_text === undefined) {
        delete next[key];
        if (previousOption) {
          clearDescendants(next, prev, previousOption, column, allQuestions);
        }
        return next;
      }

      if (value.option_id === "") {
        delete next[key];
        if (previousOption) {
          clearDescendants(next, prev, previousOption, column, allQuestions);
        }
        return next;
      }

      // Factor word pick spans Level 2–7 in this column — keep only the chosen question.
      if (options?.isFactorWordPick) {
        for (const root of wordRoots) {
          const rootKey = columnAnswerKey(root.id, column);
          const prior = next[rootKey]?.option_id;
          if (prior) {
            clearDescendants(next, next, prior, column, allQuestions);
          }
        }
        next = clearOtherFactorWordPicks(next, wordRoots, column, questionId);
      }

      next[key] = {
        ...value,
        matrix_column: column,
      };

      if (value.option_id && previousOption && previousOption !== value.option_id) {
        clearDescendants(next, prev, previousOption, column, allQuestions);
      }
      return next;
    });
  }

  function selectOption(optionId: string) {
    if (!current) return;
    const selected = current.options.find((o) => o.id === optionId);
    const questionId = selected?.question_id || current.question.id;
    setAnswer(
      questionId,
      current.column,
      { option_id: optionId },
      { isFactorWordPick: current.isFactorWordPick }
    );
  }

  async function handleSave(submit: boolean, options?: { silent?: boolean }) {
    if (!category) return;

    if (submit) {
      const state = getMatrixColumnFlowState(category, answers);
      if (!state.formComplete) {
        toast.error("Please complete all 7 factors before submitting.");
        return;
      }
    }

    setSaving(true);
    const payload = flattenColumnAnswers(answers);
    try {
      const result = await onSave(payload, submit);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (submit && result.redirectTo) {
        setSubmitted(true);
        toast.success("Form submitted — continuing to the next step");
        router.push(result.redirectTo);
        return;
      }

      if (submit) {
        setSubmitted(true);
      }

      if (!options?.silent) {
        toast.success(submit ? "Form submitted" : "Draft saved");
      }
    } finally {
      setSaving(false);
    }
  }

  const isCurrentAnswered = useMemo(() => {
    if (!current) return false;
    if (current.isFactorWordPick) {
      return current.options.some((option) => {
        const answer = answers[columnAnswerKey(option.question_id, current.column)];
        return answer?.option_id === option.id;
      });
    }
    const answer = answers[columnAnswerKey(current.question.id, current.column)];
    if (current.question.question_type === "text" || current.question.question_type === "scale") {
      return Boolean(answer?.answer_text?.trim());
    }
    return Boolean(answer?.option_id);
  }, [answers, current]);

  const currentSelectedOptionId = useMemo(() => {
    if (!current) return undefined;
    if (current.isFactorWordPick) {
      for (const option of current.options) {
        const answer = answers[columnAnswerKey(option.question_id, current.column)];
        if (answer?.option_id === option.id) return option.id;
      }
      return undefined;
    }
    return answers[columnAnswerKey(current.question.id, current.column)]?.option_id;
  }, [answers, current]);

  function clearPreviousStep() {
    if (!category) return;
    setSubmitted(false);

    const tryClearColumn = (column: number) => {
      const path = getAnsweredColumnPath(category, answers, column);
      const last = path[path.length - 1];
      if (!last) return false;
      setAnswer(last.id, column, {});
      return true;
    };

    const activeColumn = current?.column ?? flow.completedColumns;
    if (activeColumn >= 1 && tryClearColumn(activeColumn)) return;
    for (let column = activeColumn - 1; column >= 1; column -= 1) {
      if (tryClearColumn(column)) return;
    }
  }

  const canGoBack = useMemo(() => {
    if (!category) return false;
    for (let column = MATRIX_WORDS_PER_LEVEL; column >= 1; column -= 1) {
      if (getAnsweredColumnPath(category, answers, column).length > 0) return true;
    }
    return false;
  }, [answers, category]);

  const optionLookup = useMemo(() => {
    const map = new Map<string, MatrixOption>();
    for (const question of category?.matrix_questions ?? []) {
      for (const option of question.matrix_options ?? []) {
        map.set(option.id, option);
      }
    }
    return map;
  }, [category]);

  const selectionsSoFar = useMemo(() => {
    if (!category) return [] as Array<{ column: number; value: string }>;
    const rows: Array<{ column: number; value: string }> = [];
    for (let column = 1; column <= MATRIX_WORDS_PER_LEVEL; column += 1) {
      const path = getAnsweredColumnPath(category, answers, column);
      const first = path[0];
      if (!first) continue;
      const answer = answers[columnAnswerKey(first.id, column)];
      const label =
        optionLookup.get(answer?.option_id ?? "")?.option_text ??
        answer?.answer_text?.trim() ??
        "";
      if (!label) continue;
      rows.push({ column, value: label });
    }
    return rows;
  }, [answers, category, optionLookup]);

  const currentSelectedLabel = useMemo(() => {
    if (!currentSelectedOptionId) return null;
    return optionLookup.get(currentSelectedOptionId)?.option_text ?? null;
  }, [currentSelectedOptionId, optionLookup]);

  if (!category) {
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

  const questionCard = current ? (
    <Card className="overflow-hidden rounded-3xl border-primary/10 shadow-sm">
      <CardContent className="space-y-6 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-3">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {current.isFactorWordPick || !current.question.parent_option_id
                ? `Factor ${current.column} of ${MATRIX_WORDS_PER_LEVEL}`
                : "Sub-level choice"}
            </Badge>
            <div className="space-y-2">
              {current.isFactorWordPick || !current.question.parent_option_id ? (
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  {current.factorLabel}
                </h3>
              ) : null}
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {current.isFactorWordPick
                  ? wizard?.instructionText ||
                    "Choose the one word that describes you best for this factor."
                  : current.question.parent_option_id
                    ? "Refine your choice by selecting one word from the sub-level below."
                    : wizard?.instructionText ||
                      "Choose the one word that describes you best for this factor."}
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

        {selectionsSoFar.length > 0 ? (
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Your selections so far
            </p>
            <div className="flex flex-wrap gap-2">
              {selectionsSoFar.map((entry) => (
                <div
                  key={entry.column}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-slate-700 shadow-sm dark:text-slate-200"
                >
                  {entry.value}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {currentSelectedLabel ? (
          <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary">
            Selected for this step:{" "}
            <span className="font-semibold">{currentSelectedLabel}</span>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground">
            Pick one option below to continue.
          </div>
        )}

        {current.question.question_type === "text" ? (
          <Textarea
            value={
              answers[columnAnswerKey(current.question.id, current.column)]?.answer_text ?? ""
            }
            onChange={(e) =>
              setAnswer(current.question.id, current.column, {
                answer_text: e.target.value,
              })
            }
            placeholder="Your answer..."
            className="min-h-28 rounded-2xl"
          />
        ) : current.question.question_type === "scale" ? (
          <Input
            type="number"
            min={1}
            max={10}
            value={
              answers[columnAnswerKey(current.question.id, current.column)]?.answer_text ?? ""
            }
            onChange={(e) =>
              setAnswer(current.question.id, current.column, {
                answer_text: e.target.value,
              })
            }
            className="rounded-2xl"
          />
        ) : (
          <MatrixWordSearchPicker
            key={`factor-${current.column}-${current.options.map((o) => o.id).join(",")}`}
            options={current.options}
            value={currentSelectedOptionId}
            onChange={selectOption}
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl"
            disabled={saving || !canGoBack}
            onClick={clearPreviousStep}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            type="button"
            className="rounded-xl px-5"
            disabled={saving}
            onClick={() => handleSave(false, { silent: true })}
          >
            {saving ? "Saving..." : "Save progress"}
          </Button>
        </div>
      </CardContent>
    </Card>
  ) : null;

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
              </div>
            </div>
            <div className="min-w-44 rounded-2xl border border-primary/15 bg-white/80 px-4 py-3 text-right shadow-sm backdrop-blur dark:bg-slate-900/70">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Progress
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {factorNumber}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  / {MATRIX_WORDS_PER_LEVEL}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {formComplete
                  ? "All factors completed"
                  : current
                    ? `Factor ${current.column}: ${current.factorLabel}`
                    : "Your progress"}
              </span>
              <span className="text-muted-foreground">{progressValue}% complete</span>
            </div>
            <Progress value={progressValue} aria-label="Candidate matrix progress" />
          </div>
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
                    {showSubmittedState
                      ? "Your answers are submitted"
                      : "You have completed all 7 factors"}
                  </h3>
                  <p className="text-sm text-emerald-900/80 dark:text-emerald-200/90">
                    {showSubmittedState
                      ? "You can review with Back if you want to change anything, then continue."
                      : "Review with Back if needed, or submit your responses to continue."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl"
                  disabled={saving || !canGoBack}
                  onClick={clearPreviousStep}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {showSubmittedState ? (
                  <Button type="button" className="rounded-xl" asChild>
                    <Link href={wizard?.continueHref || "/candidate/status"}>
                      {wizard?.continueLabel || "Continue"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="rounded-xl"
                    disabled={saving}
                    onClick={() => handleSave(true)}
                  >
                    {saving ? "Submitting..." : "Submit answers"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {!current && !formComplete ? (
          <Card className="rounded-3xl shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                No word choices are available yet for these columns. Ask an administrator to
                add Level 2+ words (or sub-levels under each Level 1 factor) in the matrix
                editor.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {questionCard}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EmployerPageSection
        title={current?.factorLabel || targetLabel}
        description={
          current
            ? `Factor ${current.column} of ${MATRIX_WORDS_PER_LEVEL} — choose one best-fit word.`
            : formComplete
              ? "All factors completed."
              : "Questions match what your administrator configured in the matrix editor."
        }
        icon={headerIcon}
        gradient="from-purple-500 to-purple-600"
      >
        <div className="space-y-6">
          {formComplete ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
              You have completed all 7 factors. Submit to continue, or save a draft.
            </div>
          ) : null}

          {!current && !formComplete ? (
            <p className="text-sm text-muted-foreground">
              No word choices are available yet. Configure Level 2+ words per column in the
              matrix editor.
            </p>
          ) : null}

          {current ? (
            <div
              key={`${current.column}-${current.question.id}`}
              className={cn(
                "space-y-3",
                current.question.parent_option_id && "ml-4 border-l-2 border-primary/20 pl-4"
              )}
            >
              <Label className="text-base text-slate-800 dark:text-slate-100">
                {current.question.parent_option_id
                  ? "Sub-level choice"
                  : current.factorLabel}
                {current.question.is_required && (
                  <span className="text-destructive"> *</span>
                )}
              </Label>
              {current.question.question_type === "text" ? (
                <Textarea
                  value={
                    answers[columnAnswerKey(current.question.id, current.column)]
                      ?.answer_text ?? ""
                  }
                  onChange={(e) =>
                    setAnswer(current.question.id, current.column, {
                      answer_text: e.target.value,
                    })
                  }
                  placeholder="Your answer..."
                  className="min-h-24 rounded-xl"
                />
              ) : current.question.question_type === "scale" ? (
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={
                    answers[columnAnswerKey(current.question.id, current.column)]
                      ?.answer_text ?? ""
                  }
                  onChange={(e) =>
                    setAnswer(current.question.id, current.column, {
                      answer_text: e.target.value,
                    })
                  }
                  className="rounded-xl"
                />
              ) : (
                <MatrixWordSearchPicker
                  options={current.options}
                  value={currentSelectedOptionId}
                  onChange={selectOption}
                />
              )}
            </div>
          ) : null}
        </div>
      </EmployerPageSection>

      {!hideFooterActions ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="rounded-lg"
            disabled={saving || !canGoBack}
            onClick={clearPreviousStep}
          >
            Back
          </Button>
          <Button
            className="rounded-lg"
            disabled={saving || (!formComplete && !isCurrentAnswered)}
            onClick={() => handleSave(Boolean(formComplete))}
          >
            {saving ? "Submitting…" : formComplete ? "Submit & continue" : "Next"}
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
