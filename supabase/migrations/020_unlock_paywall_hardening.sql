-- Harden unlock paywall: employers cannot self-insert unlocks or mark payments paid.
-- Candidate PII is readable only after unlock; anonymous match previews use service role.
-- CV access follows unlock rows (employer + candidate), not an arbitrary match_results.job_id.

-- ---------------------------------------------------------------------------
-- Payments: employers may select + insert pending rows only. Status → paid is
-- service-role / fulfill path only.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Employers manage own payments" ON payments;

CREATE POLICY "Employers select own payments"
  ON payments
  FOR SELECT
  USING (employer_id = get_employer_profile_id() OR is_admin());

CREATE POLICY "Employers insert pending payments"
  ON payments
  FOR INSERT
  WITH CHECK (
    (employer_id = get_employer_profile_id() AND status = 'pending')
    OR is_admin()
  );

CREATE POLICY "Admins manage payments"
  ON payments
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- Unlocks: employers read only; inserts via service role (fulfill / webhook).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "System creates unlocks" ON unlocks;

CREATE POLICY "Admins manage unlocks"
  ON unlocks
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- Candidate profiles: matched employers no longer get full-row SELECT.
-- Unlocked employers (any job for this employer) may read the profile.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Employers see anonymous candidate data via match"
  ON candidate_profiles;

CREATE POLICY "Employers read unlocked candidate profiles"
  ON candidate_profiles
  FOR SELECT
  USING (
    is_admin()
    OR user_id = get_user_id()
    OR (
      get_user_role() = 'employer'
      AND EXISTS (
        SELECT 1
        FROM unlocks u
        WHERE u.candidate_id = candidate_profiles.id
          AND u.employer_id = get_employer_profile_id()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- CV files: unlock check must not pick an arbitrary match_results.job_id.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Candidates manage own CV" ON candidate_cv_files;

CREATE POLICY "Candidates manage own CV"
  ON candidate_cv_files
  FOR ALL
  USING (
    candidate_id = get_candidate_profile_id()
    OR is_admin()
    OR (
      get_user_role() = 'employer'
      AND EXISTS (
        SELECT 1
        FROM unlocks u
        WHERE u.candidate_id = candidate_cv_files.candidate_id
          AND u.employer_id = get_employer_profile_id()
      )
    )
  );
