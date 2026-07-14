"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Grid3X3,
  HelpCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { FRAMEWORK, FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import {
  MATRIX_FACTOR_COUNT,
  MATRIX_LEVELS_PER_FACTOR,
  MATRIX_WORDS_PER_LEVEL,
} from "@/lib/matching/matrix-constants";
import {
  createMatrixFactor,
  createMatrixSubLevel,
  createMatrixWord,
  deleteMatrixCategory,
  deleteMatrixOption,
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

const cellBorder = "border border-slate-300";
const rowHeader =
  "bg-slate-100 px-3 py-2 text-left text-xs font-medium text-slate-600 whitespace-nowrap";
const colHeader = "bg-slate-100 px-2 py-2 text-center text-xs font-semibold text-slate-700";
const dataCell = "bg-white px-1 py-0 align-middle text-sm";

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

function countWords(question: MatrixAdminQuestion | null): number {
  if (!question) return 0;
  return sortByOrder(question.matrix_options ?? []).filter((o) => o.is_active).length;
}

export function MatrixAdminEditor({ categories }: MatrixAdminEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeRound, setActiveRound] = useState(0);
  const [showHelp, setShowHelp] = useState(true);

  const sortedCategories = useMemo(() => sortByOrder(categories), [categories]);

  const maxRounds = useMemo(() => {
    const depths = sortedCategories.map((c) => c.matrix_questions?.length ?? 0);
    return Math.max(1, ...depths);
  }, [sortedCategories]);

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

  function getQuestion(category: MatrixAdminCategory, roundIndex: number) {
    const questions = sortByOrder(category.matrix_questions ?? []);
    return questions[roundIndex] ?? null;
  }

  function getWord(question: MatrixAdminQuestion | null, wordIndex: number) {
    if (!question) return null;
    const options = sortByOrder(question.matrix_options ?? []);
    return options[wordIndex] ?? null;
  }

  const roundStats = useMemo(() => {
    let factorsWithRound = 0;
    let totalWords = 0;
    let completeFactors = 0;

    for (const category of sortedCategories) {
      const questions = sortByOrder(category.matrix_questions ?? []);
      const question = questions[activeRound] ?? null;
      if (!question) continue;
      factorsWithRound += 1;
      const words = sortByOrder(question.matrix_options ?? []);
      totalWords += words.length;
      if (words.length >= MATRIX_WORDS_PER_LEVEL) completeFactors += 1;
    }

    return {
      factorsWithRound,
      totalWords,
      completeFactors,
      targetWords: factorsWithRound * MATRIX_WORDS_PER_LEVEL,
    };
  }, [sortedCategories, activeRound]);

  return (
    <div className="space-y-5">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Grid3X3 className="h-5 w-5 text-primary" />
              {FRAMEWORK_MATCHING_LANGUAGE}
            </CardTitle>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Configure the words employers and candidates choose during matching.
            </p>
          </div>
          <Button
            disabled={pending || sortedCategories.length >= MATRIX_FACTOR_COUNT}
            className="shrink-0"
            onClick={() =>
              runAction(
                () => createMatrixFactor(),
                "New matching factor added"
              )
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add matching factor
          </Button>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 pt-4">
          <Stat label="Matching factors" value={`${sortedCategories.length} / ${MATRIX_FACTOR_COUNT}`} />
          <Stat label="Question rounds" value={`${maxRounds} / ${MATRIX_LEVELS_PER_FACTOR}`} />
          <Stat label="Word options per question" value={MATRIX_WORDS_PER_LEVEL} />
        </CardContent>
      </Card>

      {showHelp && (
        <Alert className="border-blue-200 bg-blue-50/80 text-blue-950">
          <HelpCircle className="text-blue-600" />
          <AlertTitle className="text-blue-900">How this grid works</AlertTitle>
          <AlertDescription asChild>
            <div className="space-y-3 text-blue-900/90">
              <ol className="list-decimal space-y-1.5 pl-4 text-sm">
                <li>
                  <strong>Columns</strong> are matching factors (e.g. Communication, Finance).
                  Rename them in the column header.
                </li>
                <li>
                  <strong>Question rounds</strong> are steps within each factor. At each round, the
                  user picks <strong>one word</strong> from that factor&apos;s column.
                </li>
                <li>
                  <strong>Rows</strong> are the {MATRIX_WORDS_PER_LEVEL} word choices shown for that
                  round. Edit any cell, then click outside to save.
                </li>
              </ol>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-300 bg-white text-blue-900 hover:bg-blue-100"
                onClick={() => setShowHelp(false)}
              >
                Got it, hide this
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!showHelp && (
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="cursor-pointer text-sm text-primary hover:underline"
        >
          Show help
        </button>
      )}

      {sortedCategories.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="py-14 text-center">
            <p className="text-muted-foreground">No matching factors yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Run <code className="rounded bg-slate-100 px-1">npm run seed-matrix-77</code> or click
              &quot;Add matching factor&quot;.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="space-y-3 pt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Question round</p>
                  <p className="text-xs text-muted-foreground">
                    Switch rounds to edit a different step in the {FRAMEWORK} questionnaire.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: MATRIX_LEVELS_PER_FACTOR }, (_, index) => (
                    <Button
                      key={index}
                      type="button"
                      size="sm"
                      variant={activeRound === index ? "default" : "outline"}
                      className="min-w-[2.75rem]"
                      onClick={() => setActiveRound(index)}
                    >
                      Round {index + 1}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className="font-medium text-slate-800">
                  Round {activeRound + 1} summary:
                </span>
                <span>
                  {roundStats.factorsWithRound} of {sortedCategories.length} factors set up
                </span>
                <span aria-hidden>·</span>
                <span>
                  {roundStats.totalWords} / {roundStats.targetWords || sortedCategories.length * MATRIX_WORDS_PER_LEVEL} words filled
                </span>
                {roundStats.completeFactors === roundStats.factorsWithRound &&
                roundStats.factorsWithRound > 0 ? (
                  <Badge variant="outline" className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" />
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-800">
                    <CircleAlert className="h-3 w-3" />
                    Incomplete
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="overflow-x-auto rounded-lg border border-slate-400 bg-white shadow-sm">
            <table className="w-full min-w-[880px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className={cn(cellBorder, colHeader, "min-w-[7rem] text-left")} scope="col">
                    Word options
                  </th>
                  {sortedCategories.map((category, index) => (
                    <FactorColumnHeader
                      key={category.id}
                      category={category}
                      factorNumber={index + 1}
                      roundIndex={activeRound}
                      question={getQuestion(category, activeRound)}
                      pending={pending}
                      onSaveName={(name) =>
                        runAction(
                          () =>
                            saveMatrixCategory(
                              buildCategoryFormData(category, { name }),
                              category.id
                            ),
                          "Factor name saved"
                        )
                      }
                      onToggleActive={() =>
                        runAction(
                          () =>
                            toggleMatrixItem(
                              "matrix_categories",
                              category.id,
                              !category.is_active
                            ),
                          category.is_active ? "Factor hidden from forms" : "Factor visible in forms"
                        )
                      }
                      onAddRound={() =>
                        runAction(
                          () => createMatrixSubLevel(category.id),
                          `Question round ${activeRound + 1} added for this factor`
                        )
                      }
                      onDelete={() => {
                        if (
                          !window.confirm(
                            `Delete "${category.name}" and all its question rounds? This cannot be undone.`
                          )
                        ) {
                          return;
                        }
                        runAction(() => deleteMatrixCategory(category.id), "Factor deleted");
                      }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: MATRIX_WORDS_PER_LEVEL }, (_, wordIndex) => (
                  <tr key={wordIndex}>
                    <th className={cn(cellBorder, rowHeader)} scope="row">
                      Option {wordIndex + 1}
                    </th>
                    {sortedCategories.map((category) => {
                      const question = getQuestion(category, activeRound);
                      const word = getWord(question, wordIndex);

                      if (!question) {
                        return (
                          <td
                            key={category.id}
                            className={cn(cellBorder, dataCell, "bg-slate-50/60 p-0")}
                          >
                            {wordIndex === 0 ? (
                              <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
                                <p className="text-xs text-muted-foreground">
                                  Round {activeRound + 1} not set up for this factor
                                </p>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={pending}
                                  onClick={() =>
                                    runAction(
                                      () => createMatrixSubLevel(category.id),
                                      "Question round added"
                                    )
                                  }
                                >
                                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                                  Set up round {activeRound + 1}
                                </Button>
                              </div>
                            ) : (
                              <span className="block py-3 text-center text-slate-300">—</span>
                            )}
                          </td>
                        );
                      }

                      if (!word) {
                        return (
                          <td
                            key={category.id}
                            className={cn(cellBorder, dataCell, "bg-amber-50/50 p-0")}
                          >
                            <EmptyWordCell
                              pending={pending}
                              label={`Option ${wordIndex + 1}`}
                              onAdd={(text) =>
                                runAction(
                                  () => createMatrixWord(question.id, text),
                                  "Word added"
                                )
                              }
                            />
                          </td>
                        );
                      }

                      return (
                        <WordCell
                          key={word.id}
                          word={word}
                          optionNumber={wordIndex + 1}
                          pending={pending}
                          inactive={
                            !word.is_active || !question.is_active || !category.is_active
                          }
                          onSave={(text) =>
                            runAction(
                              () =>
                                saveMatrixOption(
                                  buildOptionFormData(word, question.id, text),
                                  word.id
                                ),
                              "Word saved"
                            )
                          }
                          onDelete={() => {
                            if (!window.confirm(`Delete "${word.option_text}"?`)) return;
                            runAction(() => deleteMatrixOption(word.id), "Word deleted");
                          }}
                        />
                      );
                    })}
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <th className={cn(cellBorder, rowHeader, "font-normal")} scope="row">
                    Status
                  </th>
                  {sortedCategories.map((category) => {
                    const question = getQuestion(category, activeRound);
                    if (!question) {
                      return (
                        <td
                          key={category.id}
                          className={cn(cellBorder, "px-2 py-2 text-center text-xs text-muted-foreground")}
                        >
                          Not set up
                        </td>
                      );
                    }
                    const wordCount = countWords(question);
                    const complete = wordCount >= MATRIX_WORDS_PER_LEVEL;

                    return (
                      <td
                        key={category.id}
                        className={cn(
                          cellBorder,
                          "px-2 py-2 text-center text-xs",
                          complete ? "text-emerald-700" : "text-amber-700"
                        )}
                      >
                        {complete ? (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {MATRIX_WORDS_PER_LEVEL}/{MATRIX_WORDS_PER_LEVEL} words
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <CircleAlert className="h-3.5 w-3.5" />
                            {wordCount}/{MATRIX_WORDS_PER_LEVEL} words
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Employers and candidates see the same words during matching. When both pick the{" "}
            <strong>same word at the same round</strong>, that cell counts as a perfect match.
          </p>
        </>
      )}
    </div>
  );
}

function FactorColumnHeader({
  category,
  factorNumber,
  roundIndex,
  question,
  pending,
  onSaveName,
  onToggleActive,
  onAddRound,
  onDelete,
}: {
  category: MatrixAdminCategory;
  factorNumber: number;
  roundIndex: number;
  question: MatrixAdminQuestion | null;
  pending: boolean;
  onSaveName: (name: string) => void;
  onToggleActive: () => void;
  onAddRound: () => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(category.name);

  useEffect(() => {
    setName(category.name);
  }, [category.name]);

  return (
    <th className={cn(cellBorder, colHeader, "min-w-[10rem] p-0 align-top font-normal")} scope="col">
      <div className="flex flex-col">
        <div className="border-b border-slate-200 bg-slate-50 px-2 py-1.5">
          <Badge variant="secondary" className="mb-1.5 text-[10px]">
            Factor {factorNumber}
          </Badge>
          <input
            type="text"
            value={name}
            disabled={pending}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              const trimmed = name.trim();
              if (trimmed && trimmed !== category.name) onSaveName(trimmed);
            }}
            className="w-full rounded border-0 bg-transparent px-1 py-0.5 text-center text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-primary/30"
            aria-label={`Factor ${factorNumber} name`}
          />
        </div>
        <div className="flex items-center justify-center gap-1 px-1 py-1.5">
          <Badge
            variant={category.is_active ? "default" : "secondary"}
            className="text-[10px]"
          >
            {category.is_active ? "Visible" : "Hidden"}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger
              nativeButton
              render={
                <Button variant="ghost" size="xs" className="h-6 px-2 text-xs">
                  Manage
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem disabled={pending} onClick={onToggleActive}>
                {category.is_active ? "Hide from forms" : "Show in forms"}
              </DropdownMenuItem>
              {!question && (
                <DropdownMenuItem disabled={pending} onClick={onAddRound}>
                  Set up round {roundIndex + 1}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={pending}
                onClick={onDelete}
              >
                Delete factor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </th>
  );
}

function WordCell({
  word,
  optionNumber,
  pending,
  inactive,
  onSave,
  onDelete,
}: {
  word: MatrixAdminOption;
  optionNumber: number;
  pending: boolean;
  inactive: boolean;
  onSave: (text: string) => void;
  onDelete: () => void;
}) {
  const [text, setText] = useState(word.option_text);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setText(word.option_text);
    setDirty(false);
  }, [word.option_text]);

  return (
    <td
      className={cn(
        cellBorder,
        dataCell,
        "group relative min-w-[8rem] p-0",
        inactive && "bg-slate-100",
        dirty && "ring-2 ring-inset ring-amber-300"
      )}
    >
      <input
        type="text"
        value={text}
        disabled={pending}
        onChange={(e) => {
          setText(e.target.value);
          setDirty(e.target.value.trim() !== word.option_text);
        }}
        onBlur={() => {
          const trimmed = text.trim();
          if (trimmed && trimmed !== word.option_text) {
            onSave(trimmed);
          }
          setDirty(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        placeholder={`Option ${optionNumber}`}
        className={cn(
          "h-10 w-full border-0 bg-transparent px-2 text-center outline-none",
          "focus:bg-emerald-50 focus:ring-2 focus:ring-inset focus:ring-emerald-400/60",
          inactive && "text-slate-400"
        )}
        aria-label={`Option ${optionNumber}: ${word.option_text}`}
      />
      <button
        type="button"
        disabled={pending}
        onClick={onDelete}
        title="Remove this word"
        className="absolute right-1 top-1 hidden cursor-pointer rounded p-0.5 text-destructive hover:bg-destructive/10 group-hover:block"
        aria-label={`Delete ${word.option_text}`}
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </td>
  );
}

function EmptyWordCell({
  pending,
  label,
  onAdd,
}: {
  pending: boolean;
  label: string;
  onAdd: (text: string) => void;
}) {
  const [text, setText] = useState("");

  return (
    <div className="px-2 py-1.5">
      <input
        type="text"
        value={text}
        disabled={pending}
        placeholder={`Add ${label.toLowerCase()}…`}
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
        className="h-9 w-full rounded border border-dashed border-slate-300 bg-white px-2 text-center text-sm outline-none placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold text-slate-800">{value}</p>
    </div>
  );
}
