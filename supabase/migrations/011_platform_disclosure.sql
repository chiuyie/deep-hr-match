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
    'CV / résumé download',
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
