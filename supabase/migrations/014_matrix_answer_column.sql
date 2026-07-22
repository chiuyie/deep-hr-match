-- Allow one answer per question per factor column (Col 1–7).
-- Level 2+ root rows are shared across columns in the spreadsheet; candidates
-- answer each column’s words separately while walking Factor 1 → Factor 7.

ALTER TABLE candidate_matrix_answers
  ADD COLUMN IF NOT EXISTS matrix_column INTEGER NOT NULL DEFAULT 0;

ALTER TABLE job_matrix_answers
  ADD COLUMN IF NOT EXISTS matrix_column INTEGER NOT NULL DEFAULT 0;

ALTER TABLE candidate_matrix_answers
  DROP CONSTRAINT IF EXISTS candidate_matrix_answers_candidate_id_question_id_key;

ALTER TABLE job_matrix_answers
  DROP CONSTRAINT IF EXISTS job_matrix_answers_job_id_question_id_key;

-- Keep legacy rows (matrix_column = 0) unique, and allow 1–7 for column walks.
CREATE UNIQUE INDEX IF NOT EXISTS candidate_matrix_answers_candidate_question_column_uidx
  ON candidate_matrix_answers (candidate_id, question_id, matrix_column);

CREATE UNIQUE INDEX IF NOT EXISTS job_matrix_answers_job_question_column_uidx
  ON job_matrix_answers (job_id, question_id, matrix_column);
