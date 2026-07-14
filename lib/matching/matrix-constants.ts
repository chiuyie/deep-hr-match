/** 7 top-level matching factors (level 1). */
export const MATRIX_FACTOR_COUNT = 7;

/** Word choices at each sub-level. */
export const MATRIX_WORDS_PER_LEVEL = 7;

/** Sub-levels per factor at full depth (7^7 tree). */
export const MATRIX_LEVELS_PER_FACTOR = 7;

/** Total combination space at full depth: 7 choices ^ 7 levels. */
export const MATRIX_COMBINATION_SPACE = Math.pow(
  MATRIX_WORDS_PER_LEVEL,
  MATRIX_LEVELS_PER_FACTOR
);

/** Display label for a matching factor (1–7). No HR-themed names in Phase 1. */
export function matchingFactorLabel(factorNumber: number): string {
  return `Matching Factor ${factorNumber}`;
}

/** Placeholder factor names — numbered factors only. */
export const PLACEHOLDER_FACTOR_NAMES = Array.from(
  { length: MATRIX_FACTOR_COUNT },
  (_, index) => matchingFactorLabel(index + 1)
) as readonly [
  "Matching Factor 1",
  "Matching Factor 2",
  "Matching Factor 3",
  "Matching Factor 4",
  "Matching Factor 5",
  "Matching Factor 6",
  "Matching Factor 7",
];

/** Placeholder words for each sub-level (7 per level). */
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

export function subLevelQuestionText(factorNumber: number, subLevel: number): string {
  return `[PLACEHOLDER] ${matchingFactorLabel(factorNumber)} — sub-level ${subLevel}: choose one word`;
}
