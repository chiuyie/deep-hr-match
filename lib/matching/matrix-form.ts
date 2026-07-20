import type { MatrixCategory, MatrixQuestion, MatrixOption } from "@/types/database";
import { getApplicableMatrixQuestions } from "@/lib/matching/matrix-tree";

export type MatrixCategoryWithQuestions = MatrixCategory & {
  matrix_questions: (MatrixQuestion & { matrix_options: MatrixOption[] })[];
};

export type MatrixAnswerPayload = {
  question_id: string;
  option_id?: string;
  answer_text?: string;
};

/** Employer and candidate share the same 7^7 form (`target_role = both`). */
export function filterSharedMatrixCategories(
  categories: MatrixCategoryWithQuestions[]
): MatrixCategoryWithQuestions[] {
  return categories
    .map((cat) => ({
      ...cat,
      matrix_questions: (cat.matrix_questions ?? []).filter(
        (q) => q.is_active && q.target_role === "both"
      ),
    }))
    .filter((cat) => cat.matrix_questions.length > 0);
}

export function validateMatrixSubmission(
  categories: MatrixCategoryWithQuestions[],
  answers: Record<string, { option_id?: string; answer_text?: string }>
): string | null {
  for (const cat of categories.filter((c) => c.is_active)) {
    const applicable = getApplicableMatrixQuestions(cat.matrix_questions ?? [], answers);
    for (const question of applicable.filter((q) => q.is_required)) {
      const answer = answers[question.id];
      if (question.question_type === "text" || question.question_type === "scale") {
        if (!answer?.answer_text?.trim()) {
          return `Please answer: ${question.question_text}`;
        }
      } else if (!answer?.option_id) {
        return `Please choose a word for: ${question.question_text}`;
      }
    }
  }
  return null;
}

export function flattenMatrixAnswers(
  answers: Record<string, { option_id?: string; answer_text?: string }>
): MatrixAnswerPayload[] {
  return Object.entries(answers).map(([question_id, val]) => ({
    question_id,
    ...val,
  }));
}
