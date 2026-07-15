/** 7 top-level matching factors — Level 1 in the 7^7 tree. */
export const MATRIX_FACTOR_COUNT = 7;

/** Level 1: the factor layer (7 matching dimensions). */
export const MATRIX_FACTOR_LEVEL = 1;

/** Word choices at each word level (Levels 2–7+). */
export const MATRIX_WORDS_PER_LEVEL = 7;

/** Word-selection depth per factor at full 7^7 (Level 2 through Level 8). */
export const MATRIX_LEVELS_PER_FACTOR = 7;

/** Deepest numbered level when all word layers exist (Level 1 + word depth). */
export const MATRIX_MAX_LEVEL =
  MATRIX_FACTOR_LEVEL + MATRIX_LEVELS_PER_FACTOR;

/** Total combination space at full depth: 7^7 paths through the word tree. */
export const MATRIX_COMBINATION_SPACE = Math.pow(
  MATRIX_WORDS_PER_LEVEL,
  MATRIX_LEVELS_PER_FACTOR
);

/** Map stored question index (0-based) to display level (Level 2 = first 7 words). */
export function matrixWordLevelNumber(questionIndex: number): number {
  return questionIndex + MATRIX_FACTOR_LEVEL + 1;
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

/** Placeholder words for each word level (7 per level). */
export const PLACEHOLDER_WORDS = [
  "word1",
  "word2",
  "word3",
  "word4",
  "word5",
  "word6",
  "word7",
] as const;

export function placeholderWordLabel(wordNumber: number): string {
  return `word${wordNumber}`;
}

export function wordLevelQuestionText(factorNumber: number, questionIndex: number): string {
  const level = matrixWordLevelNumber(questionIndex);
  return `[PLACEHOLDER] ${matchingFactorLabel(factorNumber)} — Level ${level}: choose one word`;
}

/** @deprecated Use wordLevelQuestionText */
export function subLevelQuestionText(factorNumber: number, subLevel: number): string {
  return wordLevelQuestionText(factorNumber, subLevel - 1);
}
