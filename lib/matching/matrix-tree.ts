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

/**
 * Level 1 root question is the factor identity (Matching Factor N), not a user pick.
 * Candidates/employers start choosing at Level 2+ under each factor.
 */
export function getFactorIdentityRootQuestion(
  questions: MatrixQuestion[]
): MatrixQuestion | null {
  const roots = getRootMatrixQuestions(questions).filter((q) => q.is_active);
  return roots[0] ?? null;
}

/** Word-choice questions only — excludes the Level 1 factor-identity root when Level 2+ exists. */
export function getMatrixChoiceQuestions(questions: MatrixQuestion[]): MatrixQuestion[] {
  const roots = getRootMatrixQuestions(questions ?? []).filter((q) => q.is_active);
  // Minimal seeds may only have Level 1 — keep it as the choosable question.
  if (roots.length <= 1) return questions ?? [];
  const identity = roots[0];
  if (!identity) return questions ?? [];
  return (questions ?? []).filter((q) => q.id !== identity.id);
}

function isQuestionAnswered(
  question: MatrixQuestion,
  answers: MatrixAnswersMap
): boolean {
  const answer = answers[question.id];
  const selectedOptionId = answer?.option_id;
  const hasTextAnswer =
    (question.question_type === "text" || question.question_type === "scale") &&
    Boolean(answer?.answer_text?.trim());
  return Boolean(selectedOptionId || hasTextAnswer);
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
      if (!isQuestionAnswered(question, answers)) return;
      const selectedOptionId = answers[question.id]?.option_id;
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
      if (!isQuestionAnswered(question, answers)) return question;
      const selectedOptionId = answers[question.id]?.option_id;
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
