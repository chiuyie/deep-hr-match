"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  findFactorWordPicks,
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
import { getRootMatrixQuestions } from "@/lib/matching/matrix-tree";
import { MatrixWordSearchPicker } from "@/components/forms/matrix-word-search-picker";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Grid3X3,
  Save,
  Sparkles,
} from "lucide-react";
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
  /** Fires whenever local answers change (flattened rows). */
  onAnswersChange?: (
    answers: {
      question_id: string;
      option_id?: string;
      answer_text?: string;
      matrix_column: number;
    }[]
  ) => void;
  targetLabel?: string;
  headerIcon?: React.ReactNode;
  wizard?: {
    instructionText?: string;
    badgeLabel?: string;
    /** True when the candidate has already submitted this form. */
    alreadySubmitted?: boolean;
    continueHref?: string;
    continueLabel?: string;
    /** Audience-facing helper under the title. */
    subtitle?: string;
  };
  hideFooterActions?: boolean;
  /**
   * Max words on each factor’s first pick (Initiator / Leader / …).
   * Candidates: 3. Employers / default: 1.
   */
  maxFactorWordSelections?: number;
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

function factorLabelsFromCategory(category: MatrixCategoryTree): string[] {
  const questions = (category.matrix_questions ?? []).filter((q) => q.is_active);
  const level1 = getRootMatrixQuestions(questions)[0];
  return Array.from({ length: MATRIX_WORDS_PER_LEVEL }, (_, index) => {
    const column = index + 1;
    const option = (level1?.matrix_options ?? []).find(
      (item) => ((item.sort_order - 1) % MATRIX_WORDS_PER_LEVEL) + 1 === column
    );
    return option?.option_text?.trim() || `Factor ${column}`;
  });
}

export function MatrixForm({
  categories,
  existingAnswers,
  onSave,
  onAnswersChange,
  targetLabel = FRAMEWORK_MATCHING_LANGUAGE,
  headerIcon = <Grid3X3 className="h-6 w-6" />,
  wizard,
  hideFooterActions = false,
  maxFactorWordSelections = 1,
}: MatrixFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<ColumnAnswersMap>(() =>
    normalizeExistingAnswers(existingAnswers)
  );
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(wizard?.alreadySubmitted));
  const [holdingFactorColumn, setHoldingFactorColumn] = useState<number | null>(null);

  const category = useMemo(() => prepareCategory(categories), [categories]);
  const allowMultiFactorWords = maxFactorWordSelections > 1;
  /** Employers stay single-select; candidates use multi-select. */
  const employerFacing = !allowMultiFactorWords;

  useEffect(() => {
    onAnswersChange?.(flattenColumnAnswers(answers));
  }, [answers, onAnswersChange]);

  const flow = useMemo(
    () =>
      category
        ? getMatrixColumnFlowState(category, answers, {
            maxFactorWordSelections,
            holdingFactorColumn: allowMultiFactorWords ? holdingFactorColumn : null,
          })
        : { current: null, formComplete: false, completedColumns: 0 },
    [allowMultiFactorWords, answers, category, holdingFactorColumn, maxFactorWordSelections]
  );

  useEffect(() => {
    if (!allowMultiFactorWords) return;
    if (flow.current?.isFactorWordPick) {
      setHoldingFactorColumn(flow.current.column);
    }
  }, [allowMultiFactorWords, flow.current?.column, flow.current?.isFactorWordPick]);

  const current = flow.current;
  const formComplete = flow.formComplete;
  const factorNumber = formComplete
    ? MATRIX_WORDS_PER_LEVEL
    : current?.column ?? Math.min(flow.completedColumns + 1, MATRIX_WORDS_PER_LEVEL);
  const progressValue = formComplete
    ? 100
    : Math.max(8, Math.round(((factorNumber - 1) / MATRIX_WORDS_PER_LEVEL) * 100));
  const showSubmittedState = formComplete && submitted;

  const factorLabels = useMemo(
    () => (category ? factorLabelsFromCategory(category) : []),
    [category]
  );

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

      if (options?.isFactorWordPick) {
        if (allowMultiFactorWords) {
          if (value.option_id && previousOption && previousOption !== value.option_id) {
            clearDescendants(next, prev, previousOption, column, allQuestions);
          }
        } else {
          for (const root of wordRoots) {
            const rootKey = columnAnswerKey(root.id, column);
            const prior = next[rootKey]?.option_id;
            if (prior) {
              clearDescendants(next, next, prior, column, allQuestions);
            }
          }
          next = clearOtherFactorWordPicks(next, wordRoots, column, questionId);
        }
      }

      next[key] = {
        ...value,
        matrix_column: column,
      };

      if (
        !options?.isFactorWordPick &&
        value.option_id &&
        previousOption &&
        previousOption !== value.option_id
      ) {
        clearDescendants(next, prev, previousOption, column, allQuestions);
      }
      return next;
    });
  }

  function selectOption(optionId: string) {
    if (!current) return;
    const selected = current.options.find((o) => o.id === optionId);
    const questionId = selected?.question_id || current.question.id;

    if (current.isFactorWordPick && allowMultiFactorWords) {
      const key = columnAnswerKey(questionId, current.column);
      const alreadySelected = answers[key]?.option_id === optionId;
      if (alreadySelected) {
        setAnswer(questionId, current.column, {}, { isFactorWordPick: true });
        return;
      }
      const pickCount = current.options.filter((option) => {
        const answer = answers[columnAnswerKey(option.question_id, current.column)];
        return answer?.option_id === option.id;
      }).length;
      if (pickCount >= maxFactorWordSelections) {
        toast.error(`You can choose up to ${maxFactorWordSelections} words for this factor.`);
        return;
      }
      setAnswer(
        questionId,
        current.column,
        { option_id: optionId },
        { isFactorWordPick: true }
      );
      return;
    }

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
      const state = getMatrixColumnFlowState(category, answers, {
        maxFactorWordSelections,
        holdingFactorColumn: null,
      });
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

  const currentSelectedOptionIds = useMemo(() => {
    if (!current) return [] as string[];
    if (current.isFactorWordPick) {
      return current.options
        .filter((option) => {
          const answer = answers[columnAnswerKey(option.question_id, current.column)];
          return answer?.option_id === option.id;
        })
        .map((option) => option.id);
    }
    const optionId = answers[columnAnswerKey(current.question.id, current.column)]?.option_id;
    return optionId ? [optionId] : [];
  }, [answers, current]);

  const currentSelectedOptionId = currentSelectedOptionIds[0];

  function clearPreviousStep() {
    if (!category) return;
    setSubmitted(false);

    const tryClearColumn = (column: number) => {
      const path = getAnsweredColumnPath(category, answers, column);
      const last = path[path.length - 1];
      if (!last) return false;
      setAnswer(last.id, column, {});
      if (allowMultiFactorWords && path.length <= 2) {
        setHoldingFactorColumn(column);
      }
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
    if (!category) return [] as Array<{ column: number; label: string; value: string }>;
    const rows: Array<{ column: number; label: string; value: string }> = [];
    const wordRoots = getWordRootQuestions(category);
    for (let column = 1; column <= MATRIX_WORDS_PER_LEVEL; column += 1) {
      const picks = findFactorWordPicks(wordRoots, column, answers);
      if (!picks.length) continue;
      const labels = picks
        .map((pick) => optionLookup.get(pick.optionId)?.option_text?.trim() ?? "")
        .filter(Boolean);
      if (!labels.length) continue;
      rows.push({
        column,
        label: factorLabels[column - 1] || `Factor ${column}`,
        value: labels.join(", "),
      });
    }
    return rows;
  }, [answers, category, factorLabels, optionLookup]);

  const currentSelectedLabels = useMemo(() => {
    return currentSelectedOptionIds
      .map((id) => optionLookup.get(id)?.option_text)
      .filter((label): label is string => Boolean(label));
  }, [currentSelectedOptionIds, optionLookup]);

  const factorPickHint = allowMultiFactorWords
    ? `Choose up to ${maxFactorWordSelections} words`
    : employerFacing
      ? "Pick the best-fit word for this role"
      : "Choose one best-fit word";

  const factorPickInstruction =
    wizard?.instructionText ||
    (allowMultiFactorWords
      ? `Choose up to ${maxFactorWordSelections} words that describe you best for this factor, then continue.`
      : "Choose the one word that best describes the ideal candidate for this factor.");

  function continueFromFactorWordPick() {
    if (!isCurrentAnswered) {
      toast.error(
        allowMultiFactorWords
          ? `Select at least one word (up to ${maxFactorWordSelections}).`
          : "Select a word to continue."
      );
      return;
    }
    setHoldingFactorColumn(null);
  }

  if (!category) {
    return (
      <EmployerPageSection
        title={targetLabel}
        description="Matching questionnaire for this role"
        icon={headerIcon}
        gradient="from-sky-500 to-blue-600"
      >
        <EmployerEmptyState
          icon={Grid3X3}
          title="No form categories configured"
          description="Run npm run seed-matrix-77 or apply supabase/seed.sql to load the 7^7 placeholder form."
          gradient="from-sky-500 to-blue-600"
        />
      </EmployerPageSection>
    );
  }

  const stepActions = (
    <div className="flex min-w-0 flex-col gap-3 border-t border-slate-200/80 pt-5 dark:border-white/10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <Button
        type="button"
        variant="secondary"
        className="w-full rounded-xl sm:w-auto"
        disabled={saving || !canGoBack}
        onClick={clearPreviousStep}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          className="w-full rounded-xl px-5 sm:w-auto"
          variant="secondary"
          disabled={saving}
          onClick={() => handleSave(false, { silent: allowMultiFactorWords })}
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save progress"}
        </Button>
        {current?.isFactorWordPick && allowMultiFactorWords ? (
          <Button
            type="button"
            className="w-full rounded-xl px-5 sm:w-auto"
            disabled={saving || !isCurrentAnswered}
            onClick={continueFromFactorWordPick}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : !hideFooterActions && !wizard ? (
          <Button
            type="button"
            className="w-full rounded-xl px-5 sm:w-auto"
            disabled={saving || (!formComplete && !isCurrentAnswered)}
            onClick={() => handleSave(Boolean(formComplete))}
          >
            {saving ? "Submitting…" : formComplete ? "Submit & continue" : "Next"}
            {!saving ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
          </Button>
        ) : null}
      </div>
    </div>
  );

  const questionCard = current ? (
    <Card className="min-w-0 overflow-hidden rounded-2xl border-sky-200/60 shadow-[0_24px_48px_-36px_rgba(14,165,233,0.55)] dark:border-sky-500/20 sm:rounded-[1.75rem]">
      <CardContent className="min-w-0 space-y-5 p-4 sm:space-y-6 sm:p-5 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="rounded-full bg-sky-50 px-3 py-1 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200"
              >
                {current.isFactorWordPick || !current.question.parent_option_id
                  ? `Factor ${current.column} of ${MATRIX_WORDS_PER_LEVEL}`
                  : "Refine your choice"}
              </Badge>
              {current.question.parent_option_id ? (
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  Sub-level
                </Badge>
              ) : null}
            </div>
            <div className="space-y-2">
              {current.isFactorWordPick || !current.question.parent_option_id ? (
                <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
                  {current.factorLabel}
                </h3>
              ) : (
                <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  Narrow {current.factorLabel}
                </h3>
              )}
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-[15px]">
                {current.isFactorWordPick
                  ? factorPickInstruction
                  : current.question.parent_option_id
                    ? employerFacing
                      ? "Select the sub-level word that best fits this role."
                      : "Refine your choice by selecting one word from the sub-level below."
                    : factorPickInstruction}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50 to-white px-4 py-3 text-sm text-sky-800 shadow-sm dark:border-sky-500/20 dark:from-sky-950/40 dark:to-slate-950 dark:text-sky-200">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4" />
              {current.isFactorWordPick ? factorPickHint : "Choose one best-fit word"}
            </div>
          </div>
        </div>

        {selectionsSoFar.length > 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-900/40">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Selections so far
            </p>
            <div className="flex flex-wrap gap-2">
              {selectionsSoFar.map((entry) => (
                <div
                  key={entry.column}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm shadow-sm",
                    entry.column === current.column
                      ? "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-500/40 dark:bg-sky-950/50 dark:text-sky-100"
                      : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  )}
                  title={entry.label}
                >
                  <span className="mr-1.5 text-xs font-semibold text-slate-400">
                    {entry.column}.
                  </span>
                  {entry.value}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {currentSelectedLabels.length > 0 ? (
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
            Selected for this step:{" "}
            <span className="font-semibold">{currentSelectedLabels.join(", ")}</span>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300/90 px-4 py-3 text-sm text-muted-foreground dark:border-slate-700">
            {current.isFactorWordPick && allowMultiFactorWords
              ? `Pick up to ${maxFactorWordSelections} options below, then continue.`
              : "Pick one option below to continue."}
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
            value={
              current.isFactorWordPick && allowMultiFactorWords
                ? undefined
                : currentSelectedOptionId
            }
            values={
              current.isFactorWordPick && allowMultiFactorWords
                ? currentSelectedOptionIds
                : undefined
            }
            maxSelections={
              current.isFactorWordPick && allowMultiFactorWords
                ? maxFactorWordSelections
                : undefined
            }
            onChange={selectOption}
            searchPlaceholder="Type to filter words on this level…"
          />
        )}

        {stepActions}
      </CardContent>
    </Card>
  ) : null;

  const completionCard = formComplete ? (
    <Card className="rounded-[1.75rem] border-emerald-200 bg-emerald-50/80 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/30">
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-emerald-950 dark:text-emerald-100">
              {showSubmittedState
                ? employerFacing
                  ? "Role profile submitted"
                  : "Your answers are submitted"
                : "All 7 factors completed"}
            </h3>
            <p className="text-sm text-emerald-900/80 dark:text-emerald-200/90">
              {showSubmittedState
                ? "You can review with Back if you want to change anything, then continue."
                : hideFooterActions
                  ? "Review with Back if needed. Your answers stay with this form until you save."
                  : employerFacing
                    ? "Review with Back if needed, then submit to continue matching."
                    : "Review with Back if needed, or submit your responses to continue."}
            </p>
          </div>
        </div>
        {selectionsSoFar.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectionsSoFar.map((entry) => (
              <div
                key={entry.column}
                className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-sm text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-50"
              >
                <span className="font-medium">{entry.label}:</span> {entry.value}
              </div>
            ))}
          </div>
        ) : null}
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
          {showSubmittedState && wizard?.continueHref ? (
            <Button type="button" className="rounded-xl" asChild>
              <Link href={wizard.continueHref}>
                {wizard.continueLabel || "Continue"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : hideFooterActions ? null : (
            <Button
              type="button"
              className="rounded-xl"
              disabled={saving}
              onClick={() => handleSave(true)}
            >
              {saving ? "Submitting..." : employerFacing ? "Submit & continue" : "Submit answers"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  ) : null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-4 sm:space-y-6">
      <div className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-white via-white to-sky-50/80 p-4 shadow-[0_24px_48px_-36px_rgba(14,165,233,0.45)] dark:border-sky-500/20 dark:from-slate-950 dark:via-slate-950 dark:to-sky-950/30 sm:rounded-[1.75rem] sm:p-5 md:p-6">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <Badge variant="outline" className="rounded-full border-sky-200 px-3 py-1 text-xs text-sky-800 dark:border-sky-500/30 dark:text-sky-200">
              {wizard?.badgeLabel ?? targetLabel}
            </Badge>
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
                {FRAMEWORK_MATCHING_LANGUAGE}
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {wizard?.subtitle ||
                  (employerFacing
                    ? "Build the ideal role profile one factor at a time. Matching compares these words with candidate answers."
                    : "Answer each factor in order. Your choices power matching with open roles.")}
              </p>
            </div>
          </div>
          <div className="w-full shrink-0 rounded-2xl border border-sky-200/70 bg-white/90 px-4 py-3 text-left shadow-sm backdrop-blur sm:w-auto sm:min-w-40 sm:text-right dark:border-sky-500/20 dark:bg-slate-900/70">
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

        <div className="mt-5 space-y-4 sm:mt-6">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-sm">
            <span className="min-w-0 font-medium text-slate-700 dark:text-slate-200">
              {formComplete
                ? "All factors completed"
                : current
                  ? `Now: ${current.factorLabel}`
                  : "Your progress"}
            </span>
            <span className="shrink-0 text-muted-foreground">{progressValue}% complete</span>
          </div>
          <Progress value={progressValue} aria-label="Matrix form progress" className="h-2.5" />

          <ol className="grid grid-cols-7 gap-1 sm:gap-2" aria-label="Seven matching factors">
            {factorLabels.map((label, index) => {
              const column = index + 1;
              const completed =
                formComplete || selectionsSoFar.some((row) => row.column === column);
              const active = !formComplete && current?.column === column;
              return (
                <li key={column} className="min-w-0">
                  <div
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border px-0.5 py-1.5 text-center transition-colors sm:gap-1.5 sm:rounded-2xl sm:px-2 sm:py-2",
                      active
                        ? "border-sky-400 bg-sky-50 shadow-sm dark:border-sky-400/50 dark:bg-sky-950/40"
                        : completed
                          ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/30"
                          : "border-slate-200/80 bg-white/70 dark:border-slate-800 dark:bg-slate-950/40"
                    )}
                    title={label}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold sm:h-7 sm:w-7 sm:text-xs",
                        active
                          ? "bg-sky-500 text-white"
                          : completed
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {completed && !active ? (
                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={3} />
                      ) : (
                        column
                      )}
                    </span>
                    <span className="hidden w-full truncate text-[10px] font-medium leading-tight text-slate-600 md:block dark:text-slate-300">
                      {label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {completionCard}

      {!current && !formComplete ? (
        <Card className="rounded-[1.75rem] shadow-sm">
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
