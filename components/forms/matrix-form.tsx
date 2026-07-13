"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import type { MatrixCategory, MatrixQuestion, MatrixOption } from "@/types/database";

interface MatrixFormProps {
  categories: (MatrixCategory & {
    matrix_questions: (MatrixQuestion & { matrix_options: MatrixOption[] })[];
  })[];
  existingAnswers: Record<string, { option_id?: string; answer_text?: string }>;
  onSave: (
    answers: { question_id: string; option_id?: string; answer_text?: string }[],
    submit: boolean
  ) => Promise<{ error?: string; success?: boolean }>;
  targetLabel?: string;
}

export function MatrixForm({
  categories,
  existingAnswers,
  onSave,
  targetLabel = FRAMEWORK_MATCHING_LANGUAGE,
}: MatrixFormProps) {
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
    setSaving(true);
    const payload = Object.entries(answers).map(([question_id, val]) => ({
      question_id,
      ...val,
    }));
    const result = await onSave(payload, submit);
    setSaving(false);
    if (result.error) toast.error(result.error);
    else toast.success(submit ? "Form submitted" : "Draft saved");
  }

  if (!activeCategories.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No active form categories configured. Contact admin.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{targetLabel}</h2>
          <span className="text-sm text-muted-foreground">
            Step {step + 1} of {activeCategories.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{current.name}</CardTitle>
          {current.description && (
            <p className="text-sm text-muted-foreground">{current.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {current.matrix_questions
            ?.filter((q) => q.is_active)
            .map((question) => (
              <div key={question.id} className="space-y-2">
                <Label>
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
                  />
                ) : (
                  <Select
                    value={answers[question.id]?.option_id ?? ""}
                    onValueChange={(val) =>
                      setAnswer(question.id, { option_id: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {question.matrix_options
                        ?.filter((o) => o.is_active)
                        .map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.option_text}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          Previous
        </Button>
        {step < activeCategories.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>
            Next
          </Button>
        ) : (
          <Button
            disabled={saving}
            onClick={() => handleSave(true)}
          >
            Submit Form
          </Button>
        )}
        <Button variant="secondary" disabled={saving} onClick={() => handleSave(false)}>
          Save Draft
        </Button>
      </div>
    </div>
  );
}
