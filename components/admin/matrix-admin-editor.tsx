"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { FRAMEWORK_MATCHING_LANGUAGE_FORM_EDITOR } from "@/lib/constants/branding";
import {
  MATRIX_LEVELS_PER_FACTOR,
  MATRIX_MAX_LEVEL,
  MATRIX_WORDS_PER_LEVEL,
  matrixWordLevelLabel,
  matrixWordLevelNumber,
} from "@/lib/matching/matrix-constants";
import {
  createMatrixSubLevel,
  createMatrixSubLevelForWord,
  createMatrixWord,
  deleteMatrixOption,
  deleteMatrixQuestion,
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
  description: string | null;
};

export type MatrixAdminQuestion = {
  id: string;
  question_text: string;
  question_type: string;
  target_role: string;
  sort_order: number;
  is_required: boolean;
  is_active: boolean;
  parent_option_id: string | null;
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
  category: MatrixAdminCategory | null;
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

function buildOptionFormData(
  option: MatrixAdminOption,
  questionId: string,
  optionText: string,
  description?: string | null
) {
  const formData = new FormData();
  formData.set("question_id", questionId);
  formData.set("option_text", optionText);
  formData.set("option_value", slugify(optionText));
  formData.set("sort_order", String(option.sort_order));
  formData.set("is_active", String(option.is_active));
  const desc =
    description === undefined ? option.description ?? "" : description ?? "";
  formData.set("description", desc);
  return formData;
}

function getQuestions(category: MatrixAdminCategory) {
  return sortByOrder(category.matrix_questions ?? []);
}

function getRootQuestions(category: MatrixAdminCategory) {
  return getQuestions(category).filter((q) => !q.parent_option_id);
}

function getSubLevelQuestion(category: MatrixAdminCategory, parentOptionId: string) {
  return getQuestions(category).find((q) => q.parent_option_id === parentOptionId);
}

export function MatrixAdminEditor({ category }: MatrixAdminEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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
    cat: MatrixAdminCategory,
    questionIndex: number
  ): Promise<{ error?: string; success?: boolean }> {
    let current = getRootQuestions(cat).length;
    while (current <= questionIndex) {
      const result = await createMatrixSubLevel(cat.id);
      if (result.error) return result;
      current += 1;
    }
    return { success: true };
  }

  function addRootWordLevel(cat: MatrixAdminCategory) {
    const nextIndex = getRootQuestions(cat).length;
    if (nextIndex >= MATRIX_LEVELS_PER_FACTOR) {
      toast.info(`Maximum depth is Level ${MATRIX_MAX_LEVEL}.`);
      return;
    }
    const nextLabel = matrixWordLevelLabel(nextIndex);
    runAction(
      () => ensureWordLevelForFactor(cat, nextIndex),
      `${nextLabel} added — fill all 7 columns (each cell is one field; text can be multiple words).`
    );
  }

  function removeLevel(cat: MatrixAdminCategory, questionId: string, levelIndex: number) {
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
            <strong className="text-slate-700">Level 1–3</strong> each have{" "}
            <strong className="text-slate-700">7 columns</strong> — one field per column (labels can
            be phrases). Optional <strong className="text-slate-700">description / question</strong>{" "}
            per field. Any word can branch into a <strong className="text-slate-700">sub-level</strong>{" "}
            with up to 7 follow-up words.
          </p>
        </CardContent>
      </Card>

      {!category ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="py-14 text-center">
            <p className="font-medium text-slate-700">No matrix configured.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Run <code className="rounded bg-slate-100 px-1">npm run seed-matrix-77</code> to load
              the placeholder form.
            </p>
          </CardContent>
        </Card>
      ) : (
        <FactorSpreadsheet
          category={category}
          pending={pending}
          onRunAction={runAction}
          onAddRootWordLevel={() => addRootWordLevel(category)}
          onRemoveLevel={(questionId, levelIndex) =>
            removeLevel(category, questionId, levelIndex)
          }
        />
      )}
    </div>
  );
}

function FactorSpreadsheet({
  category,
  pending,
  onRunAction,
  onAddRootWordLevel,
  onRemoveLevel,
}: {
  category: MatrixAdminCategory;
  pending: boolean;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
  onAddRootWordLevel: () => void;
  onRemoveLevel: (questionId: string, levelIndex: number) => void;
}) {
  const rootQuestions = getRootQuestions(category);
  const canAddRootLevel = rootQuestions.length < MATRIX_LEVELS_PER_FACTOR;

  return (
    <Card className="border-slate-300 shadow-sm">
      <CardHeader className="gap-3 border-b border-slate-100 bg-slate-50/50 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600">
            Edit cells like Excel. Click <strong>Edit</strong> then <strong>Save</strong> on each
            change.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {rootQuestions.length === 0 && canAddRootLevel && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={pending}
                onClick={onAddRootWordLevel}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Level 1 words
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                onRunAction(
                  () =>
                    toggleMatrixItem("matrix_categories", category.id, !category.is_active),
                  category.is_active ? "Form hidden from users" : "Form shown to users"
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
        </div>
        {!category.is_active && (
          <p className="text-sm text-amber-700">
            Hidden — candidates and employers will not see this form.
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
              {rootQuestions.map((question, levelIndex) => {
                const levelNumber = matrixWordLevelNumber(levelIndex);
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
                          category={category}
                          question={question}
                          colIndex={colIndex}
                          pending={pending}
                          inactive={!question.is_active || !category.is_active}
                          onRunAction={onRunAction}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
              {canAddRootLevel && rootQuestions.length > 0 && (
                <tr>
                  <td colSpan={MATRIX_WORDS_PER_LEVEL + 1} className="border border-slate-400 p-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={pending}
                      onClick={onAddRootWordLevel}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add Level {rootQuestions.length + 1} row
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function SpreadsheetColumnCell({
  category,
  question,
  colIndex,
  pending,
  inactive,
  onRunAction,
}: {
  category: MatrixAdminCategory;
  question: MatrixAdminQuestion;
  colIndex: number;
  pending: boolean;
  inactive: boolean;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  const words = getWordsInColumn(question, colIndex);
  const column = colIndex + 1;

  return (
    <div className={cn("min-h-[4rem] space-y-1", inactive && "opacity-60")}>
      {words.map((word) => (
        <SpreadsheetWordCell
          key={word.id}
          category={category}
          parentQuestion={question}
          word={word}
          pending={pending}
          onSave={(text, description) =>
            onRunAction(
              () =>
                saveMatrixOption(
                  buildOptionFormData(word, question.id, text, description),
                  word.id
                ),
              "Field saved"
            )
          }
          onDelete={() => {
            if (!window.confirm(`Delete "${word.option_text}"?`)) return;
            onRunAction(() => deleteMatrixOption(word.id), "Field deleted");
          }}
          onRunAction={onRunAction}
        />
      ))}
      <AddWordInColumn
        pending={pending}
        onAdd={(text) =>
          onRunAction(
            () => createMatrixWord(question.id, text, column),
            "Field added"
          )
        }
      />
    </div>
  );
}

function SpreadsheetWordCell({
  category,
  parentQuestion: _parentQuestion,
  word,
  pending,
  onSave,
  onDelete,
  onRunAction,
}: {
  category: MatrixAdminCategory;
  parentQuestion: MatrixAdminQuestion;
  word: MatrixAdminOption;
  pending: boolean;
  onSave: (text: string, description: string | null) => void;
  onDelete: () => void;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(word.option_text);
  const [description, setDescription] = useState(word.description ?? "");
  const subQuestion = getSubLevelQuestion(category, word.id);

  useEffect(() => {
    setText(word.option_text);
    setDescription(word.description ?? "");
  }, [word.option_text, word.description]);

  function cancel() {
    setText(word.option_text);
    setDescription(word.description ?? "");
    setEditing(false);
  }

  function save() {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Field label cannot be empty. Use Delete to remove it.");
      return;
    }
    const descTrimmed = description.trim();
    const nextDesc = descTrimmed.length ? descTrimmed : null;
    if (trimmed === word.option_text && nextDesc === (word.description ?? null)) {
      setEditing(false);
      return;
    }
    onSave(trimmed, nextDesc);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="rounded border border-slate-200 bg-slate-50/80 px-1.5 py-1">
        <p className="mb-1 break-words text-xs leading-snug text-slate-800">{word.option_text}</p>
        {word.description?.trim() ? (
          <p className="mb-1 break-words text-[10px] leading-snug text-slate-500">
            {word.description}
          </p>
        ) : null}
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
        {!subQuestion && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-1 h-6 w-full px-1 text-[9px] leading-tight text-indigo-700 hover:text-indigo-800"
            disabled={pending}
            onClick={() =>
              onRunAction(
                () => createMatrixSubLevelForWord(word.id),
                "Sub-level added under this field"
              )
            }
          >
            <Plus className="mr-0.5 h-2.5 w-2.5" />
            Add sub-level (7 words)
          </Button>
        )}
        {subQuestion ? (
          <WordSubLevelPanel
            category={category}
            subQuestion={subQuestion}
            pending={pending}
            onRunAction={onRunAction}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded border border-primary/40 bg-white p-1 ring-1 ring-primary/20">
      <Input
        value={text}
        disabled={pending}
        placeholder="Field label (can be a phrase)"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) save();
          if (e.key === "Escape") cancel();
        }}
        className="mb-1 h-7 text-xs"
        autoFocus
      />
      <Textarea
        value={description}
        disabled={pending}
        placeholder="Description / question (optional)"
        onChange={(e) => setDescription(e.target.value)}
        className="mb-1 min-h-[52px] text-[11px]"
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

function WordSubLevelPanel({
  category,
  subQuestion,
  pending,
  onRunAction,
}: {
  category: MatrixAdminCategory;
  subQuestion: MatrixAdminQuestion;
  pending: boolean;
  onRunAction: (
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMsg: string
  ) => void;
}) {
  const words = sortByOrder(subQuestion.matrix_options ?? []);

  return (
    <div className="mt-2 rounded border border-indigo-200 bg-indigo-50/40 p-1.5">
      <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-indigo-800">
        Sub-level
      </p>
      <div className="space-y-1">
        {words.map((word) => (
          <SpreadsheetWordCell
            key={word.id}
            category={category}
            parentQuestion={subQuestion}
            word={word}
            pending={pending}
            onSave={(text, description) =>
              onRunAction(
                () =>
                  saveMatrixOption(
                    buildOptionFormData(word, subQuestion.id, text, description),
                    word.id
                  ),
                "Sub-level field saved"
              )
            }
            onDelete={() => {
              if (!window.confirm(`Delete "${word.option_text}"?`)) return;
              onRunAction(() => deleteMatrixOption(word.id), "Sub-level field deleted");
            }}
            onRunAction={onRunAction}
          />
        ))}
        <AddWordInColumn
          pending={pending}
          placeholder="Sub-level field…"
          onAdd={(text) =>
            onRunAction(
              () => createMatrixWord(subQuestion.id, text),
              "Sub-level field added"
            )
          }
        />
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-1 h-6 w-full px-1 text-[9px] text-destructive hover:text-destructive"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Remove entire sub-level for this word?")) return;
          onRunAction(() => deleteMatrixQuestion(subQuestion.id), "Sub-level removed");
        }}
      >
        <Trash2 className="mr-0.5 h-2.5 w-2.5" />
        Remove sub-level
      </Button>
    </div>
  );
}

function AddWordInColumn({
  pending,
  onAdd,
  placeholder = "New field…",
}: {
  pending: boolean;
  onAdd: (text: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  function add() {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Type a field label first.");
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
        placeholder={placeholder}
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
