import type { MatrixCategory, MatrixOption, MatrixQuestion } from "@/types/database";
import {
  MATRIX_WORDS_PER_LEVEL,
  matrixOptionColumn,
} from "@/lib/matching/matrix-constants";
import { sortMatrixOptions } from "@/lib/matching/matrix-option-display";
import {
  getRootMatrixQuestions,
  type MatrixAnswersMap,
} from "@/lib/matching/matrix-tree";

export type MatrixCategoryTree = MatrixCategory & {
  matrix_questions: (MatrixQuestion & { matrix_options: MatrixOption[] })[];
};

export type ColumnFlowAnswer = {
  option_id?: string;
  answer_text?: string;
  matrix_column: number;
};

/** Client/server answer map keyed by `${questionId}__col${column}`. */
export type ColumnAnswersMap = Record<string, ColumnFlowAnswer>;

export type ColumnFlowStep = {
  column: number;
  factorLabel: string;
  /**
   * Question that owns the currently shown options.
   * For the factor’s first pick, options may come from several Level 2–7 questions;
   * `question` is then a display anchor and each option keeps its real `question_id`.
   */
  question: MatrixQuestion & { matrix_options?: MatrixOption[] };
  options: MatrixOption[];
  /** True when this step is the multi-level Col-N word pick (Initiator…Negotiator). */
  isFactorWordPick: boolean;
};

type QuestionWithOptions = MatrixQuestion & { matrix_options?: MatrixOption[] };

export function columnAnswerKey(questionId: string, column: number): string {
  return `${questionId}__col${column}`;
}

export function parseColumnAnswerKey(
  key: string
): { questionId: string; column: number } | null {
  const match = key.match(/^(.*)__col(\d+)$/);
  if (!match) return null;
  return { questionId: match[1]!, column: Number(match[2]) };
}

export function toColumnAnswersMap(
  rows: Array<{
    question_id: string;
    option_id?: string | null;
    answer_text?: string | null;
    matrix_column?: number | null;
  }>
): ColumnAnswersMap {
  const map: ColumnAnswersMap = {};
  for (const row of rows) {
    const column = row.matrix_column ?? 0;
    if (column < 1) continue;
    map[columnAnswerKey(row.question_id, column)] = {
      option_id: row.option_id ?? undefined,
      answer_text: row.answer_text ?? undefined,
      matrix_column: column,
    };
  }
  return map;
}

export function flattenColumnAnswers(
  answers: ColumnAnswersMap
): Array<{
  question_id: string;
  option_id?: string;
  answer_text?: string;
  matrix_column: number;
}> {
  return Object.entries(answers)
    .map(([key, value]) => {
      const parsed = parseColumnAnswerKey(key);
      if (!parsed) return null;
      if (!value.option_id && !value.answer_text?.trim()) return null;
      return {
        question_id: parsed.questionId,
        option_id: value.option_id,
        answer_text: value.answer_text,
        matrix_column: value.matrix_column || parsed.column,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
}

function sortQuestions<T extends { sort_order: number }>(questions: T[]): T[] {
  return [...questions].sort((a, b) => a.sort_order - b.sort_order);
}

function activeOptions(options: MatrixOption[] | undefined): MatrixOption[] {
  return sortMatrixOptions(options ?? []).filter((option) => option.is_active);
}

function optionsInColumn(options: MatrixOption[] | undefined, column: number): MatrixOption[] {
  return activeOptions(options).filter(
    (option) => matrixOptionColumn(option.sort_order) === column
  );
}

function isAnswered(
  question: MatrixQuestion,
  answer: ColumnFlowAnswer | undefined
): boolean {
  if (question.question_type === "text" || question.question_type === "scale") {
    return Boolean(answer?.answer_text?.trim());
  }
  return Boolean(answer?.option_id);
}

function getChildQuestion(questions: QuestionWithOptions[], parentOptionId: string) {
  return sortQuestions(
    questions.filter((q) => q.is_active && q.parent_option_id === parentOptionId)
  )[0];
}

/** Col N words from Level 2–7 — e.g. Col1: Initiator, Leader, … Negotiator. */
function collectColumnWordOptions(
  wordRoots: QuestionWithOptions[],
  column: number
): MatrixOption[] {
  const options: MatrixOption[] = [];
  for (const root of sortQuestions(wordRoots)) {
    const cell = optionsInColumn(root.matrix_options, column)[0];
    if (cell) options.push(cell);
  }
  return options;
}

/**
 * Which Level 2–7 questions hold this factor’s chosen word(s) for the column.
 * Order follows word-root sort order (Level 2 → 7).
 */
export function findFactorWordPicks(
  wordRoots: QuestionWithOptions[],
  column: number,
  answers: ColumnAnswersMap
): Array<{ question: QuestionWithOptions; optionId: string }> {
  const picks: Array<{ question: QuestionWithOptions; optionId: string }> = [];
  for (const root of wordRoots) {
    const key = columnAnswerKey(root.id, column);
    const answer = answers[key];
    if (!answer?.option_id) continue;
    const colOpts = optionsInColumn(root.matrix_options, column);
    if (colOpts.some((o) => o.id === answer.option_id)) {
      picks.push({ question: root, optionId: answer.option_id });
    }
  }
  return picks;
}

export type MatrixColumnFlowOptions = {
  /** Max words on the factor word-pick step. Default 1 (employer / legacy). */
  maxFactorWordSelections?: number;
  /**
   * When set (candidate multi-select), keep showing the factor word-pick step
   * for this column even after 1+ words are selected, until the UI clears it
   * via Continue.
   */
  holdingFactorColumn?: number | null;
};

/**
 * Live admin layout (confirmed from DB):
 *
 * Level 1 Col1 = Character - Roles (factor label only)
 * Level 2 Col1 = Initiator
 * Level 3 Col1 = Leader
 * …
 * Level 7 Col1 = Negotiator
 *
 * Factor 1 choices = ALL Col1 words from Level 2–7 (Initiator…Negotiator).
 * Candidates may pick up to 3 → drill each word’s sub-levels → Factor 2 (Col2), etc.
 * Employers pick one.
 */
function resolveFactorStep(
  questions: QuestionWithOptions[],
  level1: QuestionWithOptions,
  wordRoots: QuestionWithOptions[],
  column: number,
  answers: ColumnAnswersMap,
  options: MatrixColumnFlowOptions = {}
): ColumnFlowStep | "complete" {
  const maxSelections = Math.max(1, options.maxFactorWordSelections ?? 1);
  const holdingThisColumn =
    maxSelections > 1 && options.holdingFactorColumn === column;

  const factorOption = optionsInColumn(level1.matrix_options, column)[0];
  const factorLabel =
    factorOption?.option_text?.trim() ||
    factorOption?.description?.trim() ||
    `Factor ${column}`;

  // Optional: sub-level hanging directly under the Level 1 factor word
  // (e.g. Character - Roles → Initiator…Negotiator as one branch’s 7 words).
  if (factorOption) {
    const underFactor = getChildQuestion(questions, factorOption.id);
    if (underFactor) {
      const underOptions = activeOptions(underFactor.matrix_options);
      if (underOptions.length) {
        const key = columnAnswerKey(underFactor.id, column);
        if (!isAnswered(underFactor, answers[key])) {
          return {
            column,
            factorLabel,
            question: underFactor,
            options: underOptions,
            isFactorWordPick: false,
          };
        }
        const drilled = drillSubLevels(
          questions,
          answers,
          column,
          factorLabel,
          answers[key]?.option_id
        );
        if (drilled) return drilled;
        return "complete";
      }
    }
  }

  const columnWords = collectColumnWordOptions(wordRoots, column);
  if (!columnWords.length) return "complete";

  const picks = findFactorWordPicks(wordRoots, column, answers);
  if (!picks.length || holdingThisColumn) {
    // First pick (or still editing multi-select): Initiator, Leader, … Negotiator
    return {
      column,
      factorLabel,
      question: wordRoots[0]!,
      options: columnWords,
      isFactorWordPick: true,
    };
  }

  for (const pick of picks) {
    const drilled = drillSubLevels(
      questions,
      answers,
      column,
      factorLabel,
      pick.optionId
    );
    if (drilled) return drilled;
  }
  return "complete";
}

function drillSubLevels(
  questions: QuestionWithOptions[],
  answers: ColumnAnswersMap,
  column: number,
  factorLabel: string,
  parentOptionId: string | undefined
): ColumnFlowStep | null {
  let currentParent = parentOptionId;
  while (currentParent) {
    const child = getChildQuestion(questions, currentParent);
    if (!child) break;
    const childOptions = activeOptions(child.matrix_options);
    if (!childOptions.length) break;

    const childKey = columnAnswerKey(child.id, column);
    const childAnswer = answers[childKey];
    if (!isAnswered(child, childAnswer)) {
      return {
        column,
        factorLabel,
        question: child,
        options: childOptions,
        isFactorWordPick: false,
      };
    }
    currentParent = childAnswer?.option_id;
  }
  return null;
}

export function getMatrixColumnFlowState(
  category: MatrixCategoryTree,
  answers: ColumnAnswersMap,
  flowOptions: MatrixColumnFlowOptions = {}
): {
  current: ColumnFlowStep | null;
  formComplete: boolean;
  completedColumns: number;
} {
  const questions = (category.matrix_questions ?? []).filter((q) => q.is_active);
  const roots = getRootMatrixQuestions(questions);
  const level1 = roots[0];
  const wordRoots = roots.slice(1);

  if (!level1) {
    return { current: null, formComplete: false, completedColumns: 0 };
  }

  let completedColumns = 0;

  for (let column = 1; column <= MATRIX_WORDS_PER_LEVEL; column += 1) {
    const step = resolveFactorStep(
      questions,
      level1,
      wordRoots,
      column,
      answers,
      flowOptions
    );
    if (step !== "complete") {
      return {
        current: step,
        formComplete: false,
        completedColumns: column - 1,
      };
    }
    completedColumns = column;
  }

  return {
    current: null,
    formComplete: completedColumns >= MATRIX_WORDS_PER_LEVEL,
    completedColumns,
  };
}

/**
 * Clear Level 2–7 picks in this column that are not in `keepQuestionIds`.
 * With single-select, pass one id; with multi-select, pass all currently selected ids.
 */
export function clearOtherFactorWordPicks(
  answers: ColumnAnswersMap,
  wordRoots: QuestionWithOptions[],
  column: number,
  keepQuestionIds: string | string[]
): ColumnAnswersMap {
  const keep = new Set(
    Array.isArray(keepQuestionIds) ? keepQuestionIds : [keepQuestionIds]
  );
  const next = { ...answers };
  for (const root of wordRoots) {
    if (keep.has(root.id)) continue;
    const key = columnAnswerKey(root.id, column);
    if (next[key]) delete next[key];
  }
  return next;
}

export function getWordRootQuestions(
  category: MatrixCategoryTree
): QuestionWithOptions[] {
  const questions = (category.matrix_questions ?? []).filter((q) => q.is_active);
  return getRootMatrixQuestions(questions).slice(1);
}

export function getAnsweredColumnPath(
  category: MatrixCategoryTree,
  answers: ColumnAnswersMap,
  column: number
): QuestionWithOptions[] {
  const questions = (category.matrix_questions ?? []).filter((q) => q.is_active);
  const roots = getRootMatrixQuestions(questions);
  const wordRoots = roots.slice(1);
  const picks = findFactorWordPicks(wordRoots, column, answers);
  if (!picks.length) return [];

  // Prefer the deepest sub-path among picks (last pick first),
  // so Back undoes sub-levels before removing a factor word.
  for (let i = picks.length - 1; i >= 0; i -= 1) {
    const pick = picks[i]!;
    const path: QuestionWithOptions[] = [pick.question];
    let parentOptionId: string | undefined = pick.optionId;
    while (parentOptionId) {
      const child = getChildQuestion(questions, parentOptionId);
      if (!child) break;
      const childKey = columnAnswerKey(child.id, column);
      if (!isAnswered(child, answers[childKey])) break;
      path.push(child);
      parentOptionId = answers[childKey]?.option_id;
    }
    if (path.length > 1) return path;
  }

  return picks.map((pick) => pick.question);
}

export function validateMatrixColumnSubmission(
  category: MatrixCategoryTree,
  answers: ColumnAnswersMap
): string | null {
  const state = getMatrixColumnFlowState(category, answers);
  if (!state.formComplete) {
    return "Please complete all 7 factors before submitting.";
  }
  return null;
}

export function columnAnswersToLegacyMap(
  answers: ColumnAnswersMap,
  column: number
): MatrixAnswersMap {
  const map: MatrixAnswersMap = {};
  for (const [key, value] of Object.entries(answers)) {
    const parsed = parseColumnAnswerKey(key);
    if (!parsed || parsed.column !== column) continue;
    map[parsed.questionId] = {
      option_id: value.option_id,
      answer_text: value.answer_text,
    };
  }
  return map;
}
