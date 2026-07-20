/**
 * PostgREST embed for matrix_categories → questions → options.
 * After migration 009, disambiguate options FK (question_id vs parent_option_id).
 */
export const MATRIX_CATEGORY_TREE_SELECT =
  "*, matrix_questions(*, matrix_options!matrix_options_question_id_fkey(*))";
