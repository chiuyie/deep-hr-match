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
