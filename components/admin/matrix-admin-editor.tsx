"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Check,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FRAMEWORK_MATCHING_LANGUAGE_FORM_EDITOR } from "@/lib/constants/branding";
import {
  MATRIX_FACTOR_COUNT,
  MATRIX_LEVELS_PER_FACTOR,
  MATRIX_MAX_LEVEL,
  MATRIX_WORDS_PER_LEVEL,
  matrixWordLevelLabel,
  matrixWordLevelNumber,
} from "@/lib/matching/matrix-constants";
import {
  createMatrixSubLevel,
  createMatrixWord,
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

const SPREADSHEET_CELL =
  "border border-slate-400 bg-white p-1.5 align-top text-sm vertical-align-top";
const SPREADSHEET_LABEL =
  "border border-slate-400 bg-slate-100 px-1 py-1.5 text-[11px] font-semibold text-slate-700 align-top w-12";

function sortByOrder<T extends { sort_order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "_");
}

function columnFromSortOrder(sortOrder: number): number {
  return ((sortOrder - 1) % MATRIX_WORDS_PER_LEVEL) + 1;
}

function getWordsInColumn(question: MatrixAdminQuestion, colIndex: number): MatrixAdminOption[] {
  const column = colIndex + 1;
  return sortByOrder(question.matrix_options ?? []).filter(
    (option) => columnFromSortOrder(option.sort_order) === column
  );
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
  formData.set("option_value", slugify(optionText));
  formData.set("sort_order", String(option.sort_order));
  formData.set("is_active", String(option.is_active));
  return formData;
}

function getQuestions(category: MatrixAdminCategory) {
  return sortByOrder(category.matrix_questions ?? []);
}

export function MatrixAdminEditor({ categories }: MatrixAdminEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const sortedCategories = useMemo(
    () => sortByOrder(categories).slice(0, MATRIX_FACTOR_COUNT),
    [categories]
  );
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

  function addSubLevel(category: MatrixAdminCategory) {
    const nextIndex = getQuestions(category).length;
    if (nextIndex >= MATRIX_LEVELS_PER_FACTOR) {
      toast.info(`Maximum depth is Level ${MATRIX_MAX_LEVEL}.`);
      return;
    }
    const nextLabel = matrixWordLevelLabel(nextIndex);
    runAction(
      () => ensureWordLevelForFactor(category, nextIndex),
      `${nextLabel} added under that word — add sub-level words in the same column below.`
    );
  }

  function removeLevel(category: MatrixAdminCategory, questionId: string, levelIndex: number) {
    const label = matrixWordLevelLabel(levelIndex);
    if (!window.confirm(`Remove ${label} and all its words? This cannot be undone.`)) return;
    runAction(() => deleteMatrixQuestion(questionId), `${label} removed`);
  }

  return (
    <div className="space-y-5">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-3 pt-5">
          <h2 className="text-xl font-bold tracking-tight text-slate-800">
            {FRAMEWORK_MATCHING_LANGUAGE_FORM_EDITOR}
          </h2>
          <p className="text-sm text-muted-foreground">
            Same layout as your Excel sheet. <strong className="text-slate-700">Lvl 1</strong> is
            the factor name only. From <strong className="text-slate-700">Lvl 2</strong> onward,
            each row has <strong className="text-slate-700">7 columns</strong> — add multiple words
            per column (stacked). Use <strong className="text-slate-700">Add sub-level</strong> on a
            word to branch deeper in that same column (Lvl 3 under a Lvl 2 word, Lvl 4 under a Lvl
            3 word, and so on).
          </p>
        </CardContent>
      </Card>

      {sortedCategories.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="py-14 text-center">
            <p className="font-medium text-slate-700">No factors found.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Run <code className="rounded bg-slate-100 px-1">npm run seed-matrix-77</code> to load
              the 7 default factors.
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
                {category.name.trim() || `Factor ${index + 1}`}
              </TabsTrigger>
            ))}
          </TabsList>

          {sortedCategories.map((category, index) => (
            <TabsContent key={category.id} value={category.id} className="mt-0">
              <FactorSpreadsheet
                category={category}
                factorNumber={index + 1}
                pending={pending}
                onRunAction={runAction}
                onAddSubLevel={() => addSubLevel(category)}
                onRemoveLevel={(questionId, levelIndex) =>
                  removeLevel(category, questionId, levelIndex)
                }
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

function FactorSpreadsheet({
  category,
  factorNumber,
  pending,
  onRunAction,
  onAddSubLevel,
  onRemoveLevel,
}: {
  category: MatrixAdminCategory;
  factorNumber: number;
  pending: boolean;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
  onAddSubLevel: () => void;
  onRemoveLevel: (questionId: string, levelIndex: number) => void;
}) {
  const questions = getQuestions(category);
  const canAddSubLevel = questions.length < MATRIX_LEVELS_PER_FACTOR;
  const nextLevelNumber =
    questions.length > 0
      ? matrixWordLevelNumber(questions.length - 1) + 1
      : matrixWordLevelNumber(0);

  return (
    <Card className="border-slate-300 shadow-sm">
      <CardHeader className="gap-3 border-b border-slate-100 bg-slate-50/50 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600">
            Factor {factorNumber} — edit cells like Excel. Click <strong>Edit</strong> then{" "}
            <strong>Save</strong> on each change.
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              onRunAction(
                () =>
                  toggleMatrixItem("matrix_categories", category.id, !category.is_active),
                category.is_active ? "Factor hidden from forms" : "Factor shown on forms"
              )
            }
          >
            {category.is_active ? (
              <>
                <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                Hide from forms
              </>
            ) : (
              <>
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                Show on forms
              </>
            )}
          </Button>
        </div>
        {!category.is_active && (
          <p className="text-sm text-amber-700">
            Hidden — candidates and employers will not see this factor.
          </p>
        )}
      </CardHeader>

      <CardContent className="p-3 sm:p-4">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full border-collapse border border-slate-500 text-left">
            <thead>
              <tr className="bg-emerald-700 text-white">
                <th className="w-12 border border-slate-500 px-1 py-1.5 text-xs font-semibold" />
                {Array.from({ length: MATRIX_WORDS_PER_LEVEL }, (_, i) => (
                  <th
                    key={i}
                    className="min-w-[130px] border border-slate-500 px-2 py-1.5 text-center text-xs font-semibold"
                  >
                    Col {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={SPREADSHEET_LABEL}>
                  <span>Lvl 1:</span>
                </td>
                <td colSpan={MATRIX_WORDS_PER_LEVEL} className={cn(SPREADSHEET_CELL, "text-center")}>
                  <EditableFactorName
                    category={category}
                    factorNumber={factorNumber}
                    pending={pending}
                    centered
                    onSave={(name) =>
                      onRunAction(
                        () =>
                          saveMatrixCategory(buildCategoryFormData(category, { name }), category.id),
                        "Factor name saved"
                      )
                    }
                  />
                  {questions.length === 0 && canAddSubLevel && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 text-xs"
                      disabled={pending}
                      onClick={onAddSubLevel}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add sub-level (Lvl 2)
                    </Button>
                  )}
                </td>
              </tr>

              {questions.map((question, levelIndex) => {
                const levelNumber = matrixWordLevelNumber(levelIndex);
                const isDeepestLevel = levelIndex === questions.length - 1;
                return (
                  <tr key={question.id}>
                    <td className={SPREADSHEET_LABEL}>
                      <div className="flex min-h-[4rem] flex-col justify-between gap-3">
                        <span>Lvl {levelNumber}:</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 w-full px-0.5 text-[9px] leading-tight text-destructive hover:text-destructive"
                          disabled={pending}
                          onClick={() => onRemoveLevel(question.id, levelIndex)}
                        >
                          <Trash2 className="mr-0.5 h-2.5 w-2.5" />
                          Remove
                        </Button>
                      </div>
                    </td>
                    {Array.from({ length: MATRIX_WORDS_PER_LEVEL }, (_, colIndex) => (
                      <td key={colIndex} className={SPREADSHEET_CELL}>
                        <SpreadsheetColumnCell
                          question={question}
                          colIndex={colIndex}
                          pending={pending}
                          inactive={!question.is_active || !category.is_active}
                          isDeepestLevel={isDeepestLevel}
                          canAddSubLevel={canAddSubLevel}
                          nextLevelNumber={nextLevelNumber}
                          onAddSubLevel={onAddSubLevel}
                          onRunAction={onRunAction}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function SpreadsheetColumnCell({
  question,
  colIndex,
  pending,
  inactive,
  isDeepestLevel,
  canAddSubLevel,
  nextLevelNumber,
  onAddSubLevel,
  onRunAction,
}: {
  question: MatrixAdminQuestion;
  colIndex: number;
  pending: boolean;
  inactive: boolean;
  isDeepestLevel: boolean;
  canAddSubLevel: boolean;
  nextLevelNumber: number;
  onAddSubLevel: () => void;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  const words = getWordsInColumn(question, colIndex);
  const column = colIndex + 1;

  return (
    <div className={cn("min-h-[4rem] space-y-1", inactive && "opacity-60")}>
      {words.map((word, wordIndex) => (
        <SpreadsheetWordCell
          key={word.id}
          word={word}
          pending={pending}
          showAddSubLevel={
            isDeepestLevel &&
            canAddSubLevel &&
            wordIndex === words.length - 1
          }
          nextLevelNumber={nextLevelNumber}
          onAddSubLevel={onAddSubLevel}
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
      ))}
      <AddWordInColumn
        pending={pending}
        onAdd={(text) =>
          onRunAction(
            () => createMatrixWord(question.id, text, column),
            "Word added"
          )
        }
      />
    </div>
  );
}

function SpreadsheetWordCell({
  word,
  pending,
  showAddSubLevel,
  nextLevelNumber,
  onAddSubLevel,
  onSave,
  onDelete,
}: {
  word: MatrixAdminOption;
  pending: boolean;
  showAddSubLevel?: boolean;
  nextLevelNumber?: number;
  onAddSubLevel?: () => void;
  onSave: (text: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(word.option_text);

  useEffect(() => {
    setText(word.option_text);
  }, [word.option_text]);

  function cancel() {
    setText(word.option_text);
    setEditing(false);
  }

  function save() {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Word cannot be empty. Use Delete to remove it.");
      return;
    }
    if (trimmed === word.option_text) {
      setEditing(false);
      return;
    }
    onSave(trimmed);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="rounded border border-slate-200 bg-slate-50/80 px-1.5 py-1">
        <p className="mb-1 break-words text-xs leading-snug text-slate-800">{word.option_text}</p>
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-6 px-1.5 text-[10px]"
            disabled={pending}
            onClick={() => setEditing(true)}
          >
            <Pencil className="mr-0.5 h-2.5 w-2.5" />
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-6 px-1.5 text-[10px] text-destructive hover:text-destructive"
            disabled={pending}
            onClick={onDelete}
          >
            <Trash2 className="mr-0.5 h-2.5 w-2.5" />
            Del
          </Button>
        </div>
        {showAddSubLevel && onAddSubLevel && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-1 h-6 w-full px-1 text-[9px] leading-tight text-indigo-700 hover:text-indigo-800"
            disabled={pending}
            onClick={onAddSubLevel}
          >
            <Plus className="mr-0.5 h-2.5 w-2.5" />
            Add sub-level (Lvl {nextLevelNumber})
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded border border-primary/40 bg-white p-1 ring-1 ring-primary/20">
      <Input
        value={text}
        disabled={pending}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") cancel();
        }}
        className="mb-1 h-7 text-xs"
        autoFocus
      />
      <div className="flex gap-1">
        <Button
          type="button"
          size="sm"
          className="h-6 flex-1 px-1 text-[10px]"
          disabled={pending}
          onClick={save}
        >
          <Check className="mr-0.5 h-2.5 w-2.5" />
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-6 flex-1 px-1 text-[10px]"
          disabled={pending}
          onClick={cancel}
        >
          <X className="mr-0.5 h-2.5 w-2.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

function AddWordInColumn({
  pending,
  onAdd,
}: {
  pending: boolean;
  onAdd: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  function add() {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Type a word first.");
      return;
    }
    onAdd(trimmed);
    setText("");
    setOpen(false);
  }

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-6 w-full px-1 text-[10px] text-slate-500 hover:text-slate-800"
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-0.5 h-2.5 w-2.5" />
        Add word
      </Button>
    );
  }

  return (
    <div className="rounded border border-dashed border-amber-400 bg-amber-50/50 p-1">
      <Input
        value={text}
        disabled={pending}
        placeholder="New word…"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") add();
          if (e.key === "Escape") {
            setOpen(false);
            setText("");
          }
        }}
        className="mb-1 h-7 border-amber-200 bg-white text-xs"
        autoFocus
      />
      <div className="flex gap-1">
        <Button
          type="button"
          size="sm"
          className="h-6 flex-1 px-1 text-[10px]"
          disabled={pending}
          onClick={add}
        >
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-6 flex-1 px-1 text-[10px]"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setText("");
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function EditableFactorName({
  category,
  factorNumber,
  pending,
  centered,
  onSave,
}: {
  category: MatrixAdminCategory;
  factorNumber: number;
  pending: boolean;
  centered?: boolean;
  onSave: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);

  useEffect(() => {
    setName(category.name);
  }, [category.name]);

  function cancel() {
    setName(category.name);
    setEditing(false);
  }

  function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Factor name cannot be empty.");
      return;
    }
    if (trimmed === category.name) {
      setEditing(false);
      return;
    }
    onSave(trimmed);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          centered && "justify-center"
        )}
      >
        <p className="text-sm font-semibold text-slate-800">
          {category.name || `Factor ${factorNumber}`}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          disabled={pending}
          onClick={() => setEditing(true)}
        >
          <Pencil className="mr-1 h-3 w-3" />
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        centered && "justify-center"
      )}
    >
      <Input
        value={name}
        disabled={pending}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") cancel();
        }}
        className="h-8 max-w-sm text-sm font-semibold"
        aria-label={`Factor ${factorNumber} name`}
        autoFocus
      />
      <Button type="button" size="sm" className="h-7 px-2 text-xs" disabled={pending} onClick={save}>
        <Check className="mr-1 h-3 w-3" />
        Save
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 px-2 text-xs"
        disabled={pending}
        onClick={cancel}
      >
        <X className="mr-1 h-3 w-3" />
        Cancel
      </Button>
    </div>
  );
}
