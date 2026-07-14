"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight, Grid3X3, Layers, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FRAMEWORK, FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { MATRIX_WORDS_PER_LEVEL } from "@/lib/matching/matrix-constants";
import {
  createMatrixFactor,
  createMatrixSubLevel,
  createMatrixWord,
  deleteMatrixCategory,
  deleteMatrixOption,
  deleteMatrixQuestion,
  saveMatrixCategory,
  saveMatrixOption,
  saveMatrixQuestion,
  toggleMatrixItem,
} from "@/lib/admin/actions";

export type MatrixAdminOption = {
  id: string;
  option_text: string;
  option_value: string;
  sort_order: number;
  is_active: boolean;
};

export type MatrixAdminQuestion = {
  id: string;
  question_text: string;
  question_type: string;
  target_role: string;
  sort_order: number;
  is_required: boolean;
  is_active: boolean;
  matrix_options: MatrixAdminOption[];
};

export type MatrixAdminCategory = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  matrix_questions: MatrixAdminQuestion[];
};

interface MatrixAdminEditorProps {
  categories: MatrixAdminCategory[];
}

function sortByOrder<T extends { sort_order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

export function MatrixAdminEditor({ categories }: MatrixAdminEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expandedFactors, setExpandedFactors] = useState<Set<string>>(
    () => new Set(categories.map((c) => c.id))
  );
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [newWordByQuestion, setNewWordByQuestion] = useState<Record<string, string>>({});

  function refresh() {
    startTransition(() => router.refresh());
  }

  function runAction(action: () => Promise<{ error?: string; success?: boolean }>, successMsg: string) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(successMsg);
      refresh();
    });
  }

  function toggleFactor(id: string) {
    setExpandedFactors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleLevel(id: string) {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const sortedCategories = sortByOrder(categories);

  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Grid3X3 className="h-5 w-5 text-primary" />
              {FRAMEWORK_MATCHING_LANGUAGE}
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage matching factors (level 1), sub-levels, and the {MATRIX_WORDS_PER_LEVEL} words
              at each sub-level. Employer and candidate forms use{" "}
              <code className="rounded bg-slate-100 px-1">target_role = both</code> questions only.
            </p>
          </div>
          <Button
            disabled={pending}
            onClick={() =>
              runAction(() => createMatrixFactor(), "Matching factor created with first sub-level")
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add factor
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Factors" value={sortedCategories.length} />
            <Stat
              label="Sub-levels"
              value={sortedCategories.reduce(
                (n, c) => n + (c.matrix_questions?.length ?? 0),
                0
              )}
            />
            <Stat label="Target depth" value={`${FRAMEWORK} (7×7 words)`} />
          </div>
        </CardContent>
      </Card>

      {sortedCategories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No matching factors yet. Run <code>npm run seed-matrix-77</code> or click Add factor.
          </CardContent>
        </Card>
      ) : (
        sortedCategories.map((category, factorIndex) => {
          const questions = sortByOrder(category.matrix_questions ?? []);
          const isOpen = expandedFactors.has(category.id);

          return (
            <Card key={category.id} className="border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleFactor(category.id)}
                    className="flex items-center gap-2 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-5 w-5 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-500" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="mt-1 text-sm font-normal text-muted-foreground">
                        Factor {factorIndex + 1} · {questions.length} sub-level
                        {questions.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        runAction(
                          () =>
                            toggleMatrixItem(
                              "matrix_categories",
                              category.id,
                              !category.is_active
                            ),
                          category.is_active ? "Factor deactivated" : "Factor activated"
                        )
                      }
                    >
                      {category.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isOpen && (
                <CardContent className="space-y-6 border-t pt-6">
                  <form
                    className="grid gap-4 md:grid-cols-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      runAction(
                        () => saveMatrixCategory(formData, category.id),
                        "Factor updated"
                      );
                    }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor={`cat-name-${category.id}`}>Factor name</Label>
                      <Input
                        id={`cat-name-${category.id}`}
                        name="name"
                        defaultValue={category.name}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`cat-order-${category.id}`}>Sort order</Label>
                      <Input
                        id={`cat-order-${category.id}`}
                        name="sort_order"
                        type="number"
                        defaultValue={category.sort_order}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`cat-desc-${category.id}`}>Description</Label>
                      <Input
                        id={`cat-desc-${category.id}`}
                        name="description"
                        defaultValue={category.description ?? ""}
                      />
                    </div>
                    <input type="hidden" name="is_active" value={String(category.is_active)} />
                    <div className="flex flex-wrap gap-2 md:col-span-2">
                      <Button type="submit" size="sm" disabled={pending}>
                        Save factor
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Delete "${category.name}" and all sub-levels? This cannot be undone.`
                            )
                          ) {
                            return;
                          }
                          runAction(() => deleteMatrixCategory(category.id), "Factor deleted");
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete factor
                      </Button>
                    </div>
                  </form>

                  <div className="flex items-center justify-between gap-4">
                    <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                      <Layers className="h-4 w-4" />
                      Sub-levels
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        runAction(
                          () => createMatrixSubLevel(category.id),
                          "Sub-level added with word1–word7"
                        )
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add sub-level
                    </Button>
                  </div>

                  {questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No sub-levels yet. Add one to define word choices for this factor.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {questions.map((question, levelIndex) => {
                        const options = sortByOrder(question.matrix_options ?? []);
                        const levelOpen = expandedLevels.has(question.id);
                        const wordCountOk = options.length === MATRIX_WORDS_PER_LEVEL;

                        return (
                          <div
                            key={question.id}
                            className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => toggleLevel(question.id)}
                                className="flex items-start gap-2 text-left"
                              >
                                {levelOpen ? (
                                  <ChevronDown className="mt-0.5 h-4 w-4 text-slate-500" />
                                ) : (
                                  <ChevronRight className="mt-0.5 h-4 w-4 text-slate-500" />
                                )}
                                <div>
                                  <p className="font-medium text-slate-800">
                                    Sub-level {levelIndex + 1}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {question.question_text}
                                  </p>
                                </div>
                              </button>
                              <div className="flex items-center gap-2">
                                <Badge variant={wordCountOk ? "outline" : "secondary"}>
                                  {options.length}/{MATRIX_WORDS_PER_LEVEL} words
                                </Badge>
                                <Badge variant={question.is_active ? "default" : "secondary"}>
                                  {question.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>

                            {levelOpen && (
                              <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
                                <form
                                  className="grid gap-3 md:grid-cols-2"
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    runAction(
                                      () => saveMatrixQuestion(formData, question.id),
                                      "Sub-level updated"
                                    );
                                  }}
                                >
                                  <input type="hidden" name="category_id" value={category.id} />
                                  <input type="hidden" name="question_type" value="single_select" />
                                  <input type="hidden" name="target_role" value="both" />
                                  <input
                                    type="hidden"
                                    name="is_required"
                                    value={String(question.is_required)}
                                  />
                                  <input
                                    type="hidden"
                                    name="is_active"
                                    value={String(question.is_active)}
                                  />
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>Prompt text</Label>
                                    <Input
                                      name="question_text"
                                      defaultValue={question.question_text}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Sort order</Label>
                                    <Input
                                      name="sort_order"
                                      type="number"
                                      defaultValue={question.sort_order}
                                    />
                                  </div>
                                  <div className="flex flex-wrap items-end gap-2 md:col-span-2">
                                    <Button type="submit" size="sm" disabled={pending}>
                                      Save sub-level
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={pending}
                                      onClick={() =>
                                        runAction(
                                          () =>
                                            toggleMatrixItem(
                                              "matrix_questions",
                                              question.id,
                                              !question.is_active
                                            ),
                                          question.is_active
                                            ? "Sub-level deactivated"
                                            : "Sub-level activated"
                                        )
                                      }
                                    >
                                      {question.is_active ? "Deactivate" : "Activate"}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      disabled={pending}
                                      onClick={() => {
                                        if (
                                          !window.confirm(
                                            "Delete this sub-level and all its words?"
                                          )
                                        ) {
                                          return;
                                        }
                                        runAction(
                                          () => deleteMatrixQuestion(question.id),
                                          "Sub-level deleted"
                                        );
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete sub-level
                                    </Button>
                                  </div>
                                </form>

                                <div>
                                  <p className="mb-3 text-sm font-medium text-slate-700">Words</p>
                                  <div className="space-y-3">
                                    {options.map((option) => (
                                      <form
                                        key={option.id}
                                        className="grid gap-2 rounded-lg border bg-white p-3 md:grid-cols-[1fr_1fr_auto_auto]"
                                        onSubmit={(e) => {
                                          e.preventDefault();
                                          const formData = new FormData(e.currentTarget);
                                          runAction(
                                            () => saveMatrixOption(formData, option.id),
                                            "Word updated"
                                          );
                                        }}
                                      >
                                        <input type="hidden" name="question_id" value={question.id} />
                                        <input
                                          type="hidden"
                                          name="is_active"
                                          value={String(option.is_active)}
                                        />
                                        <div className="space-y-1">
                                          <Label className="text-xs">Display label</Label>
                                          <Input
                                            name="option_text"
                                            defaultValue={option.option_text}
                                            required
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Value (for matching)</Label>
                                          <Input
                                            name="option_value"
                                            defaultValue={option.option_value}
                                            required
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Order</Label>
                                          <Input
                                            name="sort_order"
                                            type="number"
                                            defaultValue={option.sort_order}
                                            className="w-20"
                                          />
                                        </div>
                                        <div className="flex items-end gap-1">
                                          <Button type="submit" size="sm" variant="secondary" disabled={pending}>
                                            Save
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            disabled={pending}
                                            onClick={() => {
                                              if (!window.confirm(`Delete "${option.option_text}"?`)) {
                                                return;
                                              }
                                              runAction(
                                                () => deleteMatrixOption(option.id),
                                                "Word deleted"
                                              );
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </div>
                                      </form>
                                    ))}
                                  </div>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <Input
                                      placeholder="New word label"
                                      value={newWordByQuestion[question.id] ?? ""}
                                      onChange={(e) =>
                                        setNewWordByQuestion((prev) => ({
                                          ...prev,
                                          [question.id]: e.target.value,
                                        }))
                                      }
                                      className="max-w-xs"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={pending}
                                      onClick={() => {
                                        const text = newWordByQuestion[question.id] ?? "";
                                        runAction(
                                          () => createMatrixWord(question.id, text),
                                          "Word added"
                                        );
                                        setNewWordByQuestion((prev) => ({
                                          ...prev,
                                          [question.id]: "",
                                        }));
                                      }}
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      Add word
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-800">{value}</p>
    </div>
  );
}
