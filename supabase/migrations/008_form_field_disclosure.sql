-- Employer-facing disclosure controls for candidate form fields.
-- Admin may remove a field entirely from employer-facing surfaces,
-- or leave it candidate-optional so candidates can blank the value later.

ALTER TABLE form_fields
  ADD COLUMN IF NOT EXISTS employer_disclosure_mode TEXT NOT NULL DEFAULT 'candidate_optional'
  CHECK (employer_disclosure_mode IN ('always_visible', 'candidate_optional', 'admin_removed'));

UPDATE form_fields
SET employer_disclosure_mode = 'candidate_optional'
WHERE employer_disclosure_mode IS NULL;
