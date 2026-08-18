-- Allow employers to refresh match snapshots for their own jobs.
-- Without DELETE/UPDATE, refresh inserts collide on UNIQUE(job_id, candidate_id).

CREATE POLICY "Employers update match results for own jobs" ON match_results
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = match_results.job_id
        AND j.employer_id = get_employer_profile_id()
    )
    OR is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = match_results.job_id
        AND j.employer_id = get_employer_profile_id()
    )
    OR is_admin()
  );

CREATE POLICY "Employers delete match results for own jobs" ON match_results
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = match_results.job_id
        AND j.employer_id = get_employer_profile_id()
    )
    OR is_admin()
  );
