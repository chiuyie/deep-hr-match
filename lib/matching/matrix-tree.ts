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

/** Depth-first list of questions the user should see given current picks. */
export function getApplicableMatrixQuestions(
  questions: MatrixQuestion[],
  answers: MatrixAnswersMap
): MatrixQuestion[] {
  const all = questions ?? [];
  const result: MatrixQuestion[] = [];

  function walk(level: MatrixQuestion[]) {
    for (const question of sortQuestions(level)) {
      if (!question.is_active) continue;
      result.push(question);
      const selectedOptionId = answers[question.id]?.option_id;
      if (!selectedOptionId) continue;
      const children = all.filter(
        (q) => q.is_active && q.parent_option_id === selectedOptionId
      );
      if (children.length) walk(children);
    }
  }

  walk(getRootMatrixQuestions(all));
  return result;
}
