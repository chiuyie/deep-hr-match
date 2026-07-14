"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Grid3X3, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import {
  MATRIX_FACTOR_COUNT,
  MATRIX_FACTOR_LEVEL,
  MATRIX_LEVELS_PER_FACTOR,
  MATRIX_MAX_LEVEL,
  MATRIX_WORDS_PER_LEVEL,
  matrixWordLevelLabel,
  matrixWordLevelNumber,
} from "@/lib/matching/matrix-constants";
import {
  createMatrixFactor,
  createMatrixSubLevel,
  createMatrixWord,
  deleteMatrixCategory,
  deleteMatrixOption,
  deleteMatrixQuestion,
  saveMatrixCategory,
  saveMatrixOption,
  toggleMatrixItem,
} from "@/lib/admin/actions";
import { cn } from "@/lib/utils";

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

function buildCategoryFormData(
  category: MatrixAdminCategory,
  overrides: Partial<{ name: string; description: string | null }> = {}
) {
  const formData = new FormData();
  formData.set("name", overrides.name ?? category.name);
  formData.set("description", overrides.description ?? category.description ?? "");
  formData.set("sort_order", String(category.sort_order));
  formData.set("is_active", String(category.is_active));
  return formData;
}

function buildOptionFormData(
  option: MatrixAdminOption,
  questionId: string,
  optionText: string
) {
  const formData = new FormData();
  formData.set("question_id", questionId);
  formData.set("option_text", optionText);
  formData.set("option_value", option.option_value || optionText);
  formData.set("sort_order", String(option.sort_order));
  formData.set("is_active", String(option.is_active));
  return formData;
}

function getQuestions(category: MatrixAdminCategory) {
  return sortByOrder(category.matrix_questions ?? []);
}

function getWord(question: MatrixAdminQuestion | null, wordIndex: number) {
  if (!question) return null;
  return sortByOrder(question.matrix_options ?? [])[wordIndex] ?? null;
}

export function MatrixAdminEditor({ categories }: MatrixAdminEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const sortedCategories = useMemo(() => sortByOrder(categories), [categories]);
  const [activeFactor, setActiveFactor] = useState(sortedCategories[0]?.id ?? "");

  useEffect(() => {
    if (!sortedCategories.some((c) => c.id === activeFactor)) {
      setActiveFactor(sortedCategories[0]?.id ?? "");
    }
  }, [sortedCategories, activeFactor]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  function runAction(
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) {
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

  async function ensureWordLevelForFactor(
    category: MatrixAdminCategory,
    questionIndex: number
  ): Promise<{ error?: string; success?: boolean }> {
    let current = getQuestions(category).length;
    while (current <= questionIndex) {
      const result = await createMatrixSubLevel(category.id);
      if (result.error) return result;
      current += 1;
    }
    return { success: true };
  }

  function addWordLevelToFactor(category: MatrixAdminCategory) {
    const nextIndex = getQuestions(category).length;
    if (nextIndex >= MATRIX_LEVELS_PER_FACTOR) {
      toast.info(`Maximum depth is Level ${MATRIX_MAX_LEVEL}`);
      return;
    }
    runAction(
      () => ensureWordLevelForFactor(category, nextIndex),
      `${matrixWordLevelLabel(nextIndex)} added`
    );
  }

  function removeDeepestLevel(category: MatrixAdminCategory) {
    const questions = getQuestions(category);
    const deepest = questions[questions.length - 1];
    if (!deepest) return;
    const label = matrixWordLevelLabel(questions.length - 1);
    if (!window.confirm(`Remove ${label} from this factor?`)) return;
    runAction(() => deleteMatrixQuestion(deepest.id), `${label} removed`);
  }

  return (
    <div className="space-y-5">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Grid3X3 className="h-5 w-5 text-primary" />
              {FRAMEWORK_MATCHING_LANGUAGE}
            </CardTitle>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              One table per matching factor (Level 1). Each table has{" "}
              <strong>7 columns</strong> (word slots). Words stack downward — sub-levels indent
              under the parent word in the same column. Add rows to go deeper (Level 2 →{" "}
              {MATRIX_MAX_LEVEL}).
            </p>
          </div>
          <Button
            disabled={pending || sortedCategories.length >= MATRIX_FACTOR_COUNT}
            className="shrink-0"
            onClick={() => runAction(() => createMatrixFactor(), "Matching factor added")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add factor
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge variant="outline">Level 1 · {sortedCategories.length} factors</Badge>
            <Badge variant="outline">7 columns × up to {MATRIX_LEVELS_PER_FACTOR} rows per factor</Badge>
            <Badge variant="outline">7 words per row</Badge>
          </div>
        </CardContent>
      </Card>

      {sortedCategories.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="py-14 text-center">
            <p className="text-muted-foreground">No matching factors yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Run <code className="rounded bg-slate-100 px-1">npm run seed-matrix-77</code> or add a
              factor above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeFactor} onValueChange={setActiveFactor} className="gap-4">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-slate-100 p-1">
            {sortedCategories.map((category, index) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="rounded-lg px-3 py-2 text-sm data-active:bg-white data-active:shadow-sm"
              >
                Factor {index + 1}
              </TabsTrigger>
            ))}
          </TabsList>

          {sortedCategories.map((category, index) => (
            <TabsContent key={category.id} value={category.id} className="mt-0">
              <FactorWordTreeTable
                category={category}
                factorNumber={index + 1}
                pending={pending}
                onRunAction={runAction}
                onAddLevel={() => addWordLevelToFactor(category)}
                onRemoveDeepestLevel={() => removeDeepestLevel(category)}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

function FactorWordTreeTable({
  category,
  factorNumber,
  pending,
  onRunAction,
  onAddLevel,
  onRemoveDeepestLevel,
}: {
  category: MatrixAdminCategory;
  factorNumber: number;
  pending: boolean;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
  onAddLevel: () => void;
  onRemoveDeepestLevel: () => void;
}) {
  const questions = getQuestions(category);
  const depth = questions.length;
  const deepestLevel =
    depth > 0 ? matrixWordLevelNumber(depth - 1) : MATRIX_FACTOR_LEVEL;

  return (
    <Card className="border-slate-300 shadow-sm">
      <CardHeader className="gap-3 border-b border-slate-100 bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Badge variant="outline" className="w-fit shrink-0">
            Level 1 · Factor {factorNumber}
          </Badge>
          <FactorNameInput
            category={category}
            factorNumber={factorNumber}
            pending={pending}
            onSave={(name) =>
              onRunAction(
                () => saveMatrixCategory(buildCategoryFormData(category, { name }), category.id),
                "Factor name saved"
              )
            }
          />
          <Badge variant={category.is_active ? "default" : "secondary"}>
            {category.is_active ? "Visible" : "Hidden"}
          </Badge>
          <Badge variant="secondary">Depth → Level {deepestLevel}</Badge>
        </div>
        <FactorActionsMenu
          category={category}
          pending={pending}
          onToggleActive={() =>
            onRunAction(
              () =>
                toggleMatrixItem("matrix_categories", category.id, !category.is_active),
              category.is_active ? "Factor hidden" : "Factor visible"
            )
          }
          onDelete={() => {
            if (
              !window.confirm(
                `Delete "${category.name}" and all word levels? This cannot be undone.`
              )
            ) {
              return;
            }
            onRunAction(() => deleteMatrixCategory(category.id), "Factor deleted");
          }}
        />
      </CardHeader>

      <CardContent className="p-4">
        {depth === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 py-12 text-center">
            <p className="text-sm text-slate-600">No word levels yet for this factor.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start with Level 2 — seven words in seven columns.
            </p>
            <Button className="mt-4" disabled={pending} onClick={onAddLevel}>
              <Plus className="mr-2 h-4 w-4" />
              Add Level 2 row
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <div className="grid min-w-[840px] grid-cols-7 divide-x divide-slate-200 bg-slate-100">
                {Array.from({ length: MATRIX_WORDS_PER_LEVEL }, (_, col) => (
                  <div
                    key={col}
                    className="bg-slate-100 px-2 py-2 text-center text-xs font-semibold text-slate-600"
                  >
                    Col {col + 1} · Word slot
                  </div>
                ))}
              </div>
              <div className="grid min-w-[840px] grid-cols-7 divide-x divide-slate-200">
                {Array.from({ length: MATRIX_WORDS_PER_LEVEL }, (_, wordColIndex) => (
                  <WordBranchColumn
                    key={wordColIndex}
                    wordColIndex={wordColIndex}
                    category={category}
                    questions={questions}
                    pending={pending}
                    onRunAction={onRunAction}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {depth < MATRIX_LEVELS_PER_FACTOR && (
                <Button size="sm" disabled={pending} onClick={onAddLevel}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add sub-level row ({matrixWordLevelLabel(depth)})
                </Button>
              )}
              {depth > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={onRemoveDeepestLevel}
                >
                  Remove {matrixWordLevelLabel(depth - 1)}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function WordBranchColumn({
  wordColIndex,
  category,
  questions,
  pending,
  onRunAction,
}: {
  wordColIndex: number;
  category: MatrixAdminCategory;
  questions: MatrixAdminQuestion[];
  pending: boolean;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  return (
    <div className="min-h-[12rem] bg-white p-2">
      {questions.map((question, levelIndex) => {
        const word = getWord(question, wordColIndex);
        const levelLabel = matrixWordLevelLabel(levelIndex);
        const indentPx = 8 + levelIndex * 14;

        return (
          <div
            key={question.id}
            className="relative mb-3 last:mb-0"
            style={{ paddingLeft: indentPx }}
          >
            {levelIndex > 0 && (
              <span
                className="absolute top-0 bottom-3 w-px bg-slate-300"
                style={{ left: indentPx - 10 }}
                aria-hidden
              />
            )}
            {levelIndex > 0 && (
              <span
                className="absolute top-3 h-px w-2 bg-slate-300"
                style={{ left: indentPx - 10 }}
                aria-hidden
              />
            )}
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
              {levelIndex === 0 ? levelLabel : `↳ ${levelLabel}`}
            </p>
            {word ? (
              <MatrixWordInput
                word={word}
                pending={pending}
                inactive={!word.is_active || !question.is_active || !category.is_active}
                onSave={(text) =>
                  onRunAction(
                    () =>
                      saveMatrixOption(buildOptionFormData(word, question.id, text), word.id),
                    "Word saved"
                  )
                }
                onDelete={() => {
                  if (!window.confirm(`Delete "${word.option_text}"?`)) return;
                  onRunAction(() => deleteMatrixOption(word.id), "Word deleted");
                }}
              />
            ) : (
              <MatrixEmptyWordInput
                pending={pending}
                onAdd={(text) =>
                  onRunAction(
                    () => createMatrixWord(question.id, text),
                    "Word added"
                  )
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FactorNameInput({
  category,
  factorNumber,
  pending,
  onSave,
}: {
  category: MatrixAdminCategory;
  factorNumber: number;
  pending: boolean;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(category.name);

  useEffect(() => {
    setName(category.name);
  }, [category.name]);

  return (
    <input
      type="text"
      value={name}
      disabled={pending}
      onChange={(e) => setName(e.target.value)}
      onBlur={() => {
        const trimmed = name.trim();
        if (trimmed && trimmed !== category.name) onSave(trimmed);
      }}
      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-base font-semibold text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      aria-label={`Factor ${factorNumber} name`}
    />
  );
}

function FactorActionsMenu({
  category,
  pending,
  onToggleActive,
  onDelete,
}: {
  category: MatrixAdminCategory;
  pending: boolean;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton
        render={
          <Button variant="outline" size="sm" className="shrink-0">
            Actions
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem disabled={pending} onClick={onToggleActive}>
          {category.is_active ? "Hide in forms" : "Show in forms"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={pending} onClick={onDelete}>
          Delete factor
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MatrixWordInput({
  word,
  pending,
  inactive,
  onSave,
  onDelete,
}: {
  word: MatrixAdminOption;
  pending: boolean;
  inactive: boolean;
  onSave: (text: string) => void;
  onDelete: () => void;
}) {
  const [text, setText] = useState(word.option_text);

  useEffect(() => {
    setText(word.option_text);
  }, [word.option_text]);

  return (
    <div
      className={cn(
        "group relative rounded-lg border border-slate-200 bg-white shadow-sm",
        inactive && "bg-slate-50 opacity-70"
      )}
    >
      <input
        type="text"
        value={text}
        disabled={pending}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const trimmed = text.trim();
          if (trimmed && trimmed !== word.option_text) onSave(trimmed);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className={cn(
          "h-9 w-full rounded-lg border-0 bg-transparent px-2 text-sm outline-none",
          "focus:bg-emerald-50 focus:ring-2 focus:ring-inset focus:ring-emerald-400/50",
          inactive && "text-slate-400"
        )}
        aria-label={word.option_text}
      />
      <button
        type="button"
        disabled={pending}
        onClick={onDelete}
        title="Remove word"
        className="absolute right-1 top-1 hidden cursor-pointer rounded p-0.5 text-destructive hover:bg-destructive/10 group-hover:block"
        aria-label={`Delete ${word.option_text}`}
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

function MatrixEmptyWordInput({
  pending,
  onAdd,
}: {
  pending: boolean;
  onAdd: (text: string) => void;
}) {
  const [text, setText] = useState("");

  return (
    <input
      type="text"
      value={text}
      disabled={pending}
      placeholder="Type word…"
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && text.trim()) {
          onAdd(text.trim());
          setText("");
        }
      }}
      onBlur={() => {
        if (text.trim()) {
          onAdd(text.trim());
          setText("");
        }
      }}
      className="h-9 w-full rounded-lg border border-dashed border-amber-300 bg-amber-50/30 px-2 text-sm outline-none placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
    />
  );
}
