import type { MatrixQuestion } from "@/types/database";

export type MatrixAnswersMap = Record<
  string,
  { option_id?: string; answer_text?: string }
>;

function sortQuestions(questions: MatrixQuestion[]): MatrixQuestion[] {
  return [...questions].sort((a, b) => a.sort_order - b.sort_order);
}

export function getRootMatrixQuestions(questions: MatrixQuestion[]): MatrixQuestion[] {
  return sortQuestions(questions.filter((q) => !q.parent_option_id));
}

export function getChildMatrixQuestions(
  questions: MatrixQuestion[],
  parentOptionId: string
): MatrixQuestion[] {
  return sortQuestions(questions.filter((q) => q.parent_option_id === parentOptionId));
}

/** All questions on the user's current branch (answered steps only, stops at first gap). */
export function getMatrixPathQuestions(
  questions: MatrixQuestion[],
  answers: MatrixAnswersMap
): MatrixQuestion[] {
  const all = questions ?? [];
  const result: MatrixQuestion[] = [];

  function walk(level: MatrixQuestion[]) {
    for (const question of sortQuestions(level)) {
      if (!question.is_active) continue;
      result.push(question);
      const answer = answers[question.id];
      const selectedOptionId = answer?.option_id;
      const hasTextAnswer =
        (question.question_type === "text" || question.question_type === "scale") &&
        Boolean(answer?.answer_text?.trim());
      if (!selectedOptionId && !hasTextAnswer) return;
      const children = all.filter(
        (q) => q.is_active && q.parent_option_id === selectedOptionId
      );
      if (children.length) walk(children);
    }
  }

  walk(getRootMatrixQuestions(all));
  return result;
}

/** The single question the user should answer now (one level at a time). */
export function getCurrentMatrixQuestion(
  questions: MatrixQuestion[],
  answers: MatrixAnswersMap
): MatrixQuestion | null {
  const all = questions ?? [];

  function walk(level: MatrixQuestion[]): MatrixQuestion | null {
    for (const question of sortQuestions(level)) {
      if (!question.is_active) continue;
      const answer = answers[question.id];
      const selectedOptionId = answer?.option_id;
      const hasTextAnswer =
        (question.question_type === "text" || question.question_type === "scale") &&
        Boolean(answer?.answer_text?.trim());
      if (!selectedOptionId && !hasTextAnswer) return question;
      const children = all.filter(
        (q) => q.is_active && q.parent_option_id === selectedOptionId
      );
      if (children.length) {
        const nested = walk(children);
        if (nested) return nested;
      }
    }
    return null;
  }

  return walk(getRootMatrixQuestions(all));
}

/** @deprecated Prefer getCurrentMatrixQuestion for UI; path helper for validation. */
export function getApplicableMatrixQuestions(
  questions: MatrixQuestion[],
  answers: MatrixAnswersMap
): MatrixQuestion[] {
  const current = getCurrentMatrixQuestion(questions, answers);
  if (current) return [current];
  return getMatrixPathQuestions(questions, answers);
}
