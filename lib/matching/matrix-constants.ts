/** 7 top-level matching factors — Level 1 in the 7^7 tree. */
export const MATRIX_FACTOR_COUNT = 7;

/** Level 1: the factor layer (7 matching dimensions). */
export const MATRIX_FACTOR_LEVEL = 1;

/** Word choices at each word level (Levels 2–7+). */
export const MATRIX_WORDS_PER_LEVEL = 7;

/** Word-selection rows per factor (Level 1–3 word grid). Optional sub-levels branch from individual words. */
export const MATRIX_LEVELS_PER_FACTOR = 3;

/** Deepest numbered word row when all three layers exist. */
export const MATRIX_MAX_LEVEL = MATRIX_LEVELS_PER_FACTOR;

/** Total combination space at full depth: 7^7 paths through the word tree. */
export const MATRIX_COMBINATION_SPACE = Math.pow(
  MATRIX_WORDS_PER_LEVEL,
  MATRIX_LEVELS_PER_FACTOR
);

/** Map stored root question index (0-based) to display level (Level 1 = first 7 words). */
export function matrixWordLevelNumber(questionIndex: number): number {
  return questionIndex + 1;
}

export function matrixWordLevelLabel(questionIndex: number): string {
  return `Level ${matrixWordLevelNumber(questionIndex)}`;
}

/** Display label for a matching factor (1–7). No HR-themed names in Phase 1. */
export function matchingFactorLabel(factorNumber: number): string {
  return `Matching Factor ${factorNumber}`;
}

/** Placeholder factor names — numbered factors only. */
export const PLACEHOLDER_FACTOR_NAMES = [
  "Matching Factor 1",
  "Matching Factor 2",
  "Matching Factor 3",
  "Matching Factor 4",
  "Matching Factor 5",
  "Matching Factor 6",
  "Matching Factor 7",
] as const;

/** Column (1–7) from option sort_order in the spreadsheet layout. */
export function matrixOptionColumn(sortOrder: number): number {
  return ((sortOrder - 1) % MATRIX_WORDS_PER_LEVEL) + 1;
}

/** Root grid row labels: Level 1 → factor1…factor7; Level 2 → Level1Word1…; Level 3 → Level2Word1… */
export function placeholderRootWordLabel(levelIndex: number, column: number): string {
  if (levelIndex <= 0) return `factor${column}`;
  return `Level${levelIndex}Word${column}`;
}

/** Branch labels under a word at root level row `parentLevelIndex`, column `parentColumn`. */
export function placeholderSubLevelWordLabel(
  parentLevelIndex: number,
  parentColumn: number,
  wordIndex: number
): string {
  return `Level${parentLevelIndex + 1}SubLevel${parentColumn}Word${wordIndex}`;
}

/** @deprecated Use placeholderRootWordLabel or placeholderSubLevelWordLabel */
export function placeholderWordLabel(wordNumber: number): string {
  return `factor${wordNumber}`;
}

export const PLACEHOLDER_WORDS = [
  "factor1",
  "factor2",
  "factor3",
  "factor4",
  "factor5",
  "factor6",
  "factor7",
] as const;

export function wordLevelQuestionText(factorNumber: number, questionIndex: number): string {
  const level = matrixWordLevelNumber(questionIndex);
  return `[PLACEHOLDER] ${matchingFactorLabel(factorNumber)} — Level ${level}: choose one word`;
}

/** @deprecated Use wordLevelQuestionText */
export function subLevelQuestionText(factorNumber: number, subLevel: number): string {
  return wordLevelQuestionText(factorNumber, subLevel - 1);
}
