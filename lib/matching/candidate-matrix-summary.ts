import type { SupabaseClient } from "@supabase/supabase-js";
import type { MatrixQuestion } from "@/types/database";
import { MATRIX_CATEGORY_TREE_SELECT } from "@/lib/matching/matrix-queries";
import { getMatrixPathQuestions, type MatrixAnswersMap } from "@/lib/matching/matrix-tree";

export type MatrixAnswerStep = {
  questionId: string;
  factorLabel: string;
  wordLabel: string;
};

type MatrixQuestionWithOptions = MatrixQuestion & {
  matrix_options?: Array<{ id: string; option_text: string }>;
};

type MatrixCategoryRow = {
  name?: string | null;
  matrix_questions?: MatrixQuestionWithOptions[];
};

async function loadPrimaryMatrixCategory(supabase: SupabaseClient) {
  const { data: categories } = await supabase
    .from("matrix_categories")
    .select(MATRIX_CATEGORY_TREE_SELECT)
    .eq("is_active", true)
    .order("sort_order")
    .limit(1);
  return (categories?.[0] ?? null) as MatrixCategoryRow | null;
}

function buildMatrixAnswerSteps(
  category: MatrixCategoryRow,
  answerMap: MatrixAnswersMap
): MatrixAnswerStep[] {
  const questions = (category.matrix_questions ?? []) as MatrixQuestionWithOptions[];
  const path = getMatrixPathQuestions(questions, answerMap);
  const optionById = new Map<string, string>();
  for (const question of questions) {
    for (const option of question.matrix_options ?? []) {
      optionById.set(option.id, option.option_text);
    }
  }

  const steps: MatrixAnswerStep[] = [];
  for (const question of path) {
    const optionId = answerMap[question.id]?.option_id;
    if (!optionId) continue;
    const word = optionById.get(optionId) ?? "—";
    const isRoot = !question.parent_option_id;
    steps.push({
      questionId: question.id,
      factorLabel: isRoot
        ? category.name?.trim() || question.question_text
        : question.question_text,
      wordLabel: word,
    });
  }

  return steps;
}

/** Human-readable path of the candidate's submitted 7^7 word choices. */
export async function loadCandidateMatrixAnswerSteps(
  supabase: SupabaseClient,
  candidateId: string
): Promise<MatrixAnswerStep[]> {
  const { data: answers } = await supabase
    .from("candidate_matrix_answers")
    .select("question_id, option_id")
    .eq("candidate_id", candidateId);

  if (!answers?.length) return [];

  const answerMap: MatrixAnswersMap = Object.fromEntries(
    answers.map((row) => [row.question_id, { option_id: row.option_id ?? undefined }])
  );

  const category = await loadPrimaryMatrixCategory(supabase);
  if (!category) return [];

  return buildMatrixAnswerSteps(category, answerMap);
}

export async function loadJobMatrixAnswerSteps(
  supabase: SupabaseClient,
  jobId: string
): Promise<MatrixAnswerStep[]> {
  const { data: answers } = await supabase
    .from("job_matrix_answers")
    .select("question_id, option_id")
    .eq("job_id", jobId);

  if (!answers?.length) return [];

  const answerMap: MatrixAnswersMap = Object.fromEntries(
    answers.map((row) => [row.question_id, { option_id: row.option_id ?? undefined }])
  );

  const category = await loadPrimaryMatrixCategory(supabase);
  if (!category) return [];

  return buildMatrixAnswerSteps(category, answerMap);
}

export type MatrixComparisonRow = {
  factorLabel: string;
  jobWord: string;
  candidateWord: string;
  aligned: boolean;
};

export function buildMatrixComparisonRows(
  jobSteps: MatrixAnswerStep[],
  candidateSteps: MatrixAnswerStep[]
): MatrixComparisonRow[] {
  const candidateByQuestion = new Map(candidateSteps.map((step) => [step.questionId, step]));
  const rows: MatrixComparisonRow[] = [];

  for (const jobStep of jobSteps) {
    const candidateStep = candidateByQuestion.get(jobStep.questionId);
    if (!candidateStep) continue;
    rows.push({
      factorLabel: jobStep.factorLabel,
      jobWord: jobStep.wordLabel,
      candidateWord: candidateStep.wordLabel,
      aligned: jobStep.wordLabel === candidateStep.wordLabel,
    });
  }

  if (rows.length > 0) return rows;

  const max = Math.max(jobSteps.length, candidateSteps.length);
  for (let i = 0; i < max; i += 1) {
    const jobStep = jobSteps[i];
    const candidateStep = candidateSteps[i];
    if (!jobStep && !candidateStep) continue;
    rows.push({
      factorLabel: jobStep?.factorLabel ?? candidateStep?.factorLabel ?? `Level ${i + 1}`,
      jobWord: jobStep?.wordLabel ?? "—",
      candidateWord: candidateStep?.wordLabel ?? "—",
      aligned: Boolean(jobStep && candidateStep && jobStep.wordLabel === candidateStep.wordLabel),
    });
  }

  return rows;
}
