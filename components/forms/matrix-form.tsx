"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EmployerEmptyState, EmployerPageSection } from "@/components/employer/employer-ui";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { getApplicableMatrixQuestions } from "@/lib/matching/matrix-tree";
import { validateMatrixSubmission } from "@/lib/matching/matrix-form";
import { pickPrimaryMatrixCategories } from "@/lib/matching/matrix-queries";
import { cn } from "@/lib/utils";
import { Grid3X3 } from "lucide-react";
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
}

function WordChoiceGrid({
  options,
  value,
  onChange,
}: {
  options: MatrixOption[];
  value?: string;
  onChange: (optionId: string) => void;
}) {
  const active = options.filter((o) => o.is_active);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {active.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "cursor-pointer rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors",
              selected
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:bg-slate-50"
            )}
          >
            <span className="block">{option.option_text}</span>
            {option.description?.trim() ? (
              <span className="mt-1 block text-xs font-normal text-slate-500">
                {option.description}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function MatrixForm({
  categories,
  existingAnswers,
  onSave,
  targetLabel = FRAMEWORK_MATCHING_LANGUAGE,
  headerIcon = <Grid3X3 className="h-6 w-6" />,
}: MatrixFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState(existingAnswers);
  const [saving, setSaving] = useState(false);

  const activeCategories = useMemo(
    () => pickPrimaryMatrixCategories(categories.filter((c) => c.is_active)),
    [categories]
  );
  const current = activeCategories[0];

  function setAnswer(
    questionId: string,
    value: { option_id?: string; answer_text?: string }
  ) {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      if (value.option_id && current) {
        const allQuestions = current.matrix_questions ?? [];
        const toClear = new Set<string>();
        const collectStale = (parentOptionId: string) => {
          for (const q of allQuestions) {
            if (q.parent_option_id === parentOptionId) {
              toClear.add(q.id);
              const childOption = prev[q.id]?.option_id;
              if (childOption) collectStale(childOption);
            }
          }
        };
        const previousOption = prev[questionId]?.option_id;
        if (previousOption && previousOption !== value.option_id) {
          collectStale(previousOption);
        }
        for (const id of toClear) {
          delete next[id];
        }
      }
      return next;
    });
  }

  const visibleQuestions = current
    ? getApplicableMatrixQuestions(
        current.matrix_questions ?? [],
        answers
      ) as (MatrixQuestion & { matrix_options?: MatrixOption[] })[]
    : [];

  async function handleSave(submit: boolean) {
    if (submit) {
      const validationError = validateMatrixSubmission(activeCategories, answers);
      if (validationError) {
        toast.error(validationError);
        return;
      }
    }

    setSaving(true);
    const payload = Object.entries(answers).map(([question_id, val]) => ({
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

      toast.success(submit ? "Form submitted" : "Draft saved");
    } finally {
      setSaving(false);
    }
  }

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

  return (
    <div className="space-y-6">
      <EmployerPageSection
        title={targetLabel}
        description={current.description ?? undefined}
        icon={headerIcon}
        gradient="from-purple-500 to-purple-600"
      >
        <div className="space-y-8">
          {visibleQuestions.map((question) => {
              const activeOptions = (question.matrix_options ?? []).filter((o) => o.is_active);
              const depth = question.parent_option_id ? "ml-4 border-l-2 border-primary/20 pl-4" : "";

              return (
                <div key={question.id} className={cn("space-y-3", depth)}>
                  <Label className="text-base text-slate-800">
                    {question.question_text}
                    {question.is_required && <span className="text-destructive"> *</span>}
                  </Label>
                  {question.question_type === "text" ? (
                    <Textarea
                      value={answers[question.id]?.answer_text ?? ""}
                      onChange={(e) =>
                        setAnswer(question.id, { answer_text: e.target.value })
                      }
                      placeholder="Your answer..."
                      className="min-h-24 rounded-xl"
                    />
                  ) : question.question_type === "scale" ? (
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={answers[question.id]?.answer_text ?? ""}
                      onChange={(e) =>
                        setAnswer(question.id, { answer_text: e.target.value })
                      }
                      className="rounded-xl"
                    />
                  ) : (
                    <WordChoiceGrid
                      options={activeOptions}
                      value={answers[question.id]?.option_id}
                      onChange={(optionId) => setAnswer(question.id, { option_id: optionId })}
                    />
                  )}
                </div>
              );
            })}
        </div>
      </EmployerPageSection>

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
    </div>
  );
}
