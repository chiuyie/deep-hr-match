-- Optional prompt shown with each matrix word; nested word levels branch from a parent word.
ALTER TABLE matrix_options
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE matrix_questions
  ADD COLUMN IF NOT EXISTS parent_option_id UUID REFERENCES matrix_options(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_matrix_questions_parent_option
  ON matrix_questions(parent_option_id);
