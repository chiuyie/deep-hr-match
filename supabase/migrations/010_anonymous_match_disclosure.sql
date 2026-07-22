-- Separate control for anonymized match rankings vs unlocked profiles.
-- Unlocked disclosure continues to use employer_disclosure_mode.
-- Anonymous rankings only show fields with show_on_anonymous_match = true.

ALTER TABLE form_fields
  ADD COLUMN IF NOT EXISTS show_on_anonymous_match BOOLEAN NOT NULL DEFAULT FALSE;

-- Preserve today's hardcoded anonymous ranking columns by default.
UPDATE form_fields
SET show_on_anonymous_match = TRUE
WHERE audience = 'candidate'
  AND form_group = 'profile'
  AND field_key IN ('years_of_experience', 'highest_education', 'skills');
