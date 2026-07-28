import type { SupabaseClient } from "@supabase/supabase-js";
import type { MatrixOption, MatrixQuestion } from "@/types/database";
import {
  MATRIX_FACTOR_COUNT,
  matchingFactorLabel,
  matrixOptionColumn,
} from "@/lib/matching/matrix-constants";
import {
  getAnsweredColumnPath,
  toColumnAnswersMap,
  type ColumnAnswersMap,
  type MatrixCategoryTree,
} from "@/lib/matching/matrix-column-flow";
import { MATRIX_CATEGORY_TREE_SELECT, pickPrimaryMatrixCategory } from "@/lib/matching/matrix-queries";
import { getRootMatrixQuestions } from "@/lib/matching/matrix-tree";
import { sortMatrixOptions } from "@/lib/matching/matrix-option-display";

export type MatrixAnswerStep = {
  column: number;
  questionId: string;
  factorLabel: string;
  wordLabel: string;
  /** Full word path for this factor (primary pick + any sub-levels). */
  wordPath: string[];
};

export type MatrixComparisonRow = {
  column: number;
  factorLabel: string;
  jobWord: string;
  candidateWord: string;
  jobWords: string[];
  candidateWords: string[];
  aligned: boolean;
};

type QuestionWithOptions = MatrixQuestion & {
  matrix_options?: MatrixOption[];
};

function displayOptionLabel(option: MatrixOption | undefined): string {
  if (!option) return "—";
  const description = option.description?.trim();
  const text = option.option_text?.trim();
  // Prefer the readable word; description is often richer when present.
  if (description && description !== text) return description;
  return text || description || "—";
}

function optionById(category: MatrixCategoryTree): Map<string, MatrixOption> {
  const map = new Map<string, MatrixOption>();
  for (const question of category.matrix_questions ?? []) {
    for (const option of question.matrix_options ?? []) {
      map.set(option.id, option);
    }
  }
  return map;
}

function factorLabelForColumn(category: MatrixCategoryTree, column: number): string {
  const questions = (category.matrix_questions ?? []).filter((q) => q.is_active) as QuestionWithOptions[];
  const roots = getRootMatrixQuestions(questions);
  const level1 = roots[0];
  if (!level1) return matchingFactorLabel(column);

  const factorOption = sortMatrixOptions(level1.matrix_options ?? []).find(
    (option) => option.is_active && matrixOptionColumn(option.sort_order) === column
  );
  const label =
    factorOption?.option_text?.trim() ||
    factorOption?.description?.trim() ||
    matchingFactorLabel(column);
  return label;
}

function wordPathForColumn(
  category: MatrixCategoryTree,
  answers: ColumnAnswersMap,
  column: number,
  options: Map<string, MatrixOption>
): string[] {
  const pathQuestions = getAnsweredColumnPath(category, answers, column);
  const words: string[] = [];

  for (const question of pathQuestions) {
    const key = `${question.id}__col${column}`;
    const optionId = answers[key]?.option_id;
    if (!optionId) continue;
    words.push(displayOptionLabel(options.get(optionId)));
  }

  return words;
}

/** Build one step per completed matching factor (column 1–7). */
export function buildColumnAnswerSteps(
  category: MatrixCategoryTree,
  answers: ColumnAnswersMap
): MatrixAnswerStep[] {
  const options = optionById(category);
  const steps: MatrixAnswerStep[] = [];

  for (let column = 1; column <= MATRIX_FACTOR_COUNT; column += 1) {
    const wordPath = wordPathForColumn(category, answers, column, options);
    if (wordPath.length === 0) continue;
    steps.push({
      column,
      questionId: `col-${column}`,
      factorLabel: factorLabelForColumn(category, column),
      wordLabel: wordPath[0]!,
      wordPath,
    });
  }

  return steps;
}

async function loadPrimaryMatrixCategory(
  supabase: SupabaseClient
): Promise<MatrixCategoryTree | null> {
  const { data: categories } = await supabase
    .from("matrix_categories")
    .select(MATRIX_CATEGORY_TREE_SELECT)
    .eq("is_active", true)
    .order("sort_order");

  const primary = pickPrimaryMatrixCategory(categories ?? []);
  if (!primary) return null;
  return primary as MatrixCategoryTree;
}

/** Human-readable 7^7 factor picks for a candidate. */
export async function loadCandidateMatrixAnswerSteps(
  supabase: SupabaseClient,
  candidateId: string
): Promise<MatrixAnswerStep[]> {
  const { data: answers } = await supabase
    .from("candidate_matrix_answers")
    .select("question_id, option_id, answer_text, matrix_column")
    .eq("candidate_id", candidateId);

  if (!answers?.length) return [];

  const category = await loadPrimaryMatrixCategory(supabase);
  if (!category) return [];

  return buildColumnAnswerSteps(category, toColumnAnswersMap(answers));
}

export async function loadJobMatrixAnswerSteps(
  supabase: SupabaseClient,
  jobId: string
): Promise<MatrixAnswerStep[]> {
  const { data: answers } = await supabase
    .from("job_matrix_answers")
    .select("question_id, option_id, answer_text, matrix_column")
    .eq("job_id", jobId);

  if (!answers?.length) return [];

  const category = await loadPrimaryMatrixCategory(supabase);
  if (!category) return [];

  return buildColumnAnswerSteps(category, toColumnAnswersMap(answers));
}

export function buildMatrixComparisonRows(
  jobSteps: MatrixAnswerStep[],
  candidateSteps: MatrixAnswerStep[]
): MatrixComparisonRow[] {
  const candidateByColumn = new Map(candidateSteps.map((step) => [step.column, step]));
  const jobByColumn = new Map(jobSteps.map((step) => [step.column, step]));
  const columns = new Set([...jobByColumn.keys(), ...candidateByColumn.keys()]);
  const sortedColumns = [...columns].sort((a, b) => a - b);

  return sortedColumns.map((column) => {
    const jobStep = jobByColumn.get(column);
    const candidateStep = candidateByColumn.get(column);
    const jobWords = jobStep?.wordPath ?? (jobStep ? [jobStep.wordLabel] : []);
    const candidateWords =
      candidateStep?.wordPath ?? (candidateStep ? [candidateStep.wordLabel] : []);
    const jobWord = jobWords.join(" → ") || "—";
    const candidateWord = candidateWords.join(" → ") || "—";

    return {
      column,
      factorLabel:
        jobStep?.factorLabel ??
        candidateStep?.factorLabel ??
        matchingFactorLabel(column),
      jobWord,
      candidateWord,
      jobWords,
      candidateWords,
      aligned:
        jobWords.length > 0 &&
        candidateWords.length > 0 &&
        jobWords[0] === candidateWords[0],
    };
  });
}
