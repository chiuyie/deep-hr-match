import {
  MATRIX_FACTOR_COUNT,
  MATRIX_WORDS_PER_LEVEL,
} from "@/lib/matching/matrix-constants";

export type MatrixAnswerPick = {
  question_id: string;
  option_id: string | null;
  /** Factor column 1–7 from the column walk. Legacy rows may be 0 / null. */
  matrix_column?: number | null;
};

export type ColumnScoreBreakdown = {
  column: number;
  /** Platform default equal weight (1 / 7). */
  weight: number;
  matchedCount: number;
  totalCount: number;
  /** Exact-match ratio for this column, 0–100. */
  columnScore: number;
};

export type MatrixMatchResult = {
  matrixScore: number;
  matchedCount: number;
  totalCount: number;
  /** Per-factor breakdown when column-aware scoring ran. */
  columnScores: ColumnScoreBreakdown[];
};

/** Equal weight per matching factor (Col 1–7). Sum = 1. */
export const PLATFORM_EQUAL_COLUMN_WEIGHT =
  1 / MATRIX_FACTOR_COUNT;

export const PLATFORM_MATRIX_COLUMN_WEIGHTS: ReadonlyArray<number> = Array.from(
  { length: MATRIX_FACTOR_COUNT },
  () => PLATFORM_EQUAL_COLUMN_WEIGHT
);

function cellKey(questionId: string, column: number): string {
  return `${questionId}__col${column}`;
}

function optionMapByCell(rows: MatrixAnswerPick[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (!row.option_id) continue;
    const column = row.matrix_column ?? 0;
    if (column < 1 || column > MATRIX_WORDS_PER_LEVEL) continue;
    map.set(cellKey(row.question_id, column), row.option_id);
  }
  return map;
}

function optionMapByQuestion(rows: MatrixAnswerPick[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.option_id) map.set(row.question_id, row.option_id);
  }
  return map;
}

function hasColumnAnswers(rows: MatrixAnswerPick[]): boolean {
  return rows.some((row) => {
    const column = row.matrix_column ?? 0;
    return Boolean(row.option_id) && column >= 1 && column <= MATRIX_WORDS_PER_LEVEL;
  });
}

/**
 * Legacy fallback: exact option match keyed only by question_id
 * (used when neither side has matrix_column ≥ 1).
 */
function scoreLegacyByQuestion(
  jobAnswers: MatrixAnswerPick[],
  candidateAnswers: MatrixAnswerPick[],
  questionIds?: string[]
): MatrixMatchResult {
  const jobMap = optionMapByQuestion(jobAnswers);
  const candidateMap = optionMapByQuestion(candidateAnswers);

  const comparable =
    questionIds?.filter((id) => jobMap.has(id) && candidateMap.has(id)) ??
    [...jobMap.keys()].filter((id) => candidateMap.has(id));

  if (comparable.length === 0) {
    return { matrixScore: 0, matchedCount: 0, totalCount: 0, columnScores: [] };
  }

  let matchedCount = 0;
  for (const questionId of comparable) {
    if (jobMap.get(questionId) === candidateMap.get(questionId)) {
      matchedCount += 1;
    }
  }

  return {
    matrixScore: Math.round((matchedCount / comparable.length) * 100),
    matchedCount,
    totalCount: comparable.length,
    columnScores: [],
  };
}

/**
 * Platform-default 7^7 score:
 * - Compare job vs candidate picks per factor column (matrix_column 1–7)
 * - Within a column, exact same option_id at the same question_id = match
 * - Each comparable column is weighted equally (1/7 of the platform scheme;
 *   among scored columns, weights are renormalized so they still sum to 1)
 * - Overall matrix score = weighted average of column scores × 100, rounded
 */
export function scoreMatrixMatch(
  jobAnswers: MatrixAnswerPick[],
  candidateAnswers: MatrixAnswerPick[],
  questionIds?: string[]
): MatrixMatchResult {
  if (!hasColumnAnswers(jobAnswers) && !hasColumnAnswers(candidateAnswers)) {
    return scoreLegacyByQuestion(jobAnswers, candidateAnswers, questionIds);
  }

  const jobMap = optionMapByCell(jobAnswers);
  const candidateMap = optionMapByCell(candidateAnswers);
  const columnScores: ColumnScoreBreakdown[] = [];

  let matchedCount = 0;
  let totalCount = 0;
  let weightedSum = 0;
  let weightTotal = 0;

  for (let column = 1; column <= MATRIX_FACTOR_COUNT; column++) {
    const jobKeys = [...jobMap.keys()].filter((key) =>
      key.endsWith(`__col${column}`)
    );
    const comparableKeys = jobKeys.filter((key) => candidateMap.has(key));

    if (comparableKeys.length === 0) continue;

    let columnMatched = 0;
    for (const key of comparableKeys) {
      if (jobMap.get(key) === candidateMap.get(key)) {
        columnMatched += 1;
      }
    }

    const columnScore = (columnMatched / comparableKeys.length) * 100;
    const weight = PLATFORM_EQUAL_COLUMN_WEIGHT;

    columnScores.push({
      column,
      weight,
      matchedCount: columnMatched,
      totalCount: comparableKeys.length,
      columnScore: Math.round(columnScore),
    });

    matchedCount += columnMatched;
    totalCount += comparableKeys.length;
    weightedSum += columnScore * weight;
    weightTotal += weight;
  }

  if (weightTotal === 0) {
    return { matrixScore: 0, matchedCount: 0, totalCount: 0, columnScores: [] };
  }

  // Renormalize so missing columns do not silently dilute the score;
  // comparable factors still share equal relative weight.
  const matrixScore = Math.round(weightedSum / weightTotal);

  return { matrixScore, matchedCount, totalCount, columnScores };
}
