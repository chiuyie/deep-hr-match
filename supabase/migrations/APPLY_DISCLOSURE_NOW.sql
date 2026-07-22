-- Paste this entire file into Supabase Dashboard → SQL Editor → Run
-- Applies: 008 employer_disclosure_mode, 011 platform_disclosure_items, 012 unlocked matrix RLS

-- Employer-facing disclosure controls for candidate form fields.
-- Admin may remove a field entirely from employer-facing surfaces,
-- or leave it candidate-optional so candidates can blank the value later.

ALTER TABLE form_fields
  ADD COLUMN IF NOT EXISTS employer_disclosure_mode TEXT NOT NULL DEFAULT 'candidate_optional'
  CHECK (employer_disclosure_mode IN ('always_visible', 'candidate_optional', 'admin_removed'));

UPDATE form_fields
SET employer_disclosure_mode = 'candidate_optional'
WHERE employer_disclosure_mode IS NULL;


-- Admin-controlled disclosure for platform data beyond profile form fields
-- (match scores, 7^7 answers, match narrative, CV).

CREATE TABLE IF NOT EXISTS platform_disclosure_items (
  disclosure_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('scores', 'matrix', 'report')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  show_on_anonymous_match BOOLEAN NOT NULL DEFAULT FALSE,
  employer_disclosure_mode TEXT NOT NULL DEFAULT 'admin_removed'
    CHECK (employer_disclosure_mode IN ('always_visible', 'candidate_optional', 'admin_removed'))
);

INSERT INTO platform_disclosure_items (
  disclosure_key,
  label,
  description,
  category,
  sort_order,
  show_on_anonymous_match,
  employer_disclosure_mode
) VALUES
  (
    'match_score',
    'Match score',
    'Overall match percentage shown on ranked candidate lists.',
    'scores',
    1,
    TRUE,
    'always_visible'
  ),
  (
    'match_rank',
    'Ranking position',
    'Position in the ranked list for this job (e.g. #1, #2).',
    'scores',
    2,
    TRUE,
    'always_visible'
  ),
  (
    'matrix_candidate_answers',
    'Candidate 7^7 word choices',
    'The words the candidate selected on their matching language form (factor by factor).',
    'matrix',
    10,
    FALSE,
    'always_visible'
  ),
  (
    'matrix_job_comparison',
    'Job vs candidate word comparison',
    'Side-by-side comparison of job and candidate words at each factor level.',
    'matrix',
    11,
    FALSE,
    'always_visible'
  ),
  (
    'match_narrative',
    'Match summary, strengths & gaps',
    'Text summary generated with the match (including demo placeholder copy today).',
    'report',
    20,
    FALSE,
    'candidate_optional'
  ),
  (
    'candidate_cv',
    'CV / rÃ©sumÃ© download',
    'Lets employers download the candidate CV after unlock.',
    'report',
    21,
    FALSE,
    'always_visible'
  )
ON CONFLICT (disclosure_key) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users read platform disclosure" ON platform_disclosure_items;
DROP POLICY IF EXISTS "Admin manages platform disclosure" ON platform_disclosure_items;

ALTER TABLE platform_disclosure_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read platform disclosure" ON platform_disclosure_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manages platform disclosure" ON platform_disclosure_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- Allow employers who unlocked a candidate to read that candidate's 7^7 answers
-- (needed for unlocked match report). Candidates and admins keep full access.

DROP POLICY IF EXISTS "Employers read unlocked candidate matrix answers"
  ON candidate_matrix_answers;

CREATE POLICY "Employers read unlocked candidate matrix answers"
  ON candidate_matrix_answers
  FOR SELECT
  USING (
    is_admin()
    OR candidate_id = get_candidate_profile_id()
    OR (
      get_user_role() = 'employer'
      AND EXISTS (
        SELECT 1
        FROM unlocks u
        WHERE u.candidate_id = candidate_matrix_answers.candidate_id
          AND u.employer_id = get_employer_profile_id()
      )
    )
  );

