"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EmployerEmptyState, EmployerPageSection } from "@/components/employer/employer-ui";
import { FRAMEWORK, FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import {
  MATRIX_FACTOR_COUNT,
  MATRIX_WORDS_PER_LEVEL,
} from "@/lib/matching/matrix-constants";
import { validateMatrixSubmission } from "@/lib/matching/matrix-form";
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
            {option.option_text}
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
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(existingAnswers);
  const [saving, setSaving] = useState(false);

  const activeCategories = categories.filter((c) => c.is_active);
  const current = activeCategories[step];
  const progress = activeCategories.length
    ? ((step + 1) / activeCategories.length) * 100
    : 0;

  function setAnswer(
    questionId: string,
    value: { option_id?: string; answer_text?: string }
  ) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

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

  if (!activeCategories.length) {
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
        title={`How ${FRAMEWORK} works`}
        description={`Level 1: ${MATRIX_FACTOR_COUNT} factors · Level 2+: ${MATRIX_WORDS_PER_LEVEL} words per level · same form for employers and candidates`}
        icon={headerIcon}
        gradient="from-indigo-500 to-indigo-600"
        className="!p-5"
      >
        <p className="text-sm text-slate-600">
          <strong>Level 1</strong> is the {MATRIX_FACTOR_COUNT} matching factors — you pick a word
          from every factor. <strong>Level 2</strong> is the first set of {MATRIX_WORDS_PER_LEVEL}{" "}
          words; deeper levels expand from those choices (7^7). When employer and candidate choose
          the{" "}
          <span className="font-medium text-slate-800">same word at the same level</span>, that cell
          scores as a perfect match. All factors are required before submit.
        </p>
      </EmployerPageSection>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-800">{targetLabel}</h2>
          <span className="text-sm text-slate-500">
            Factor {step + 1} of {activeCategories.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <EmployerPageSection
        title={current.name}
        description={current.description ?? undefined}
        icon={headerIcon}
        gradient="from-purple-500 to-purple-600"
      >
        <div className="space-y-8">
          {current.matrix_questions
            ?.filter((q) => q.is_active)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((question) => {
              const activeOptions = (question.matrix_options ?? []).filter((o) => o.is_active);

              return (
                <div key={question.id} className="space-y-3">
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
        <Button
          variant="outline"
          className="rounded-lg"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          Previous factor
        </Button>
        {step < activeCategories.length - 1 ? (
          <Button className="rounded-lg" onClick={() => setStep((s) => s + 1)}>
            Next factor
          </Button>
        ) : (
          <Button className="rounded-lg" disabled={saving} onClick={() => handleSave(true)}>
            {saving ? "Submitting…" : "Submit & continue"}
          </Button>
        )}
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
