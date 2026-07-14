export type MatrixAnswerPick = {
  question_id: string;
  option_id: string | null;
};

export type MatrixMatchResult = {
  matrixScore: number;
  matchedCount: number;
  totalCount: number;
};

function optionMap(rows: MatrixAnswerPick[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.option_id) map.set(row.question_id, row.option_id);
  }
  return map;
}

/**
 * Compare job vs candidate matrix picks. Exact same option at the same question
 * is a perfect match for that cell. Score = matched cells / comparable cells × 100.
 */
export function scoreMatrixMatch(
  jobAnswers: MatrixAnswerPick[],
  candidateAnswers: MatrixAnswerPick[],
  questionIds?: string[]
): MatrixMatchResult {
  const jobMap = optionMap(jobAnswers);
  const candidateMap = optionMap(candidateAnswers);

  const comparable =
    questionIds?.filter((id) => jobMap.has(id) && candidateMap.has(id)) ??
    [...jobMap.keys()].filter((id) => candidateMap.has(id));

  if (comparable.length === 0) {
    return { matrixScore: 0, matchedCount: 0, totalCount: 0 };
  }

  let matchedCount = 0;
  for (const questionId of comparable) {
    if (jobMap.get(questionId) === candidateMap.get(questionId)) {
      matchedCount += 1;
    }
  }

  const matrixScore = Math.round((matchedCount / comparable.length) * 100);
  return { matrixScore, matchedCount, totalCount: comparable.length };
}
