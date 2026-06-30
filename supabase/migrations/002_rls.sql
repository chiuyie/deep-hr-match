-- Row Level Security Policies

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrix_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrix_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrix_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_matrix_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matrix_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_cv_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_jd_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_candidate_profile_id()
RETURNS UUID AS $$
  SELECT id FROM candidate_profiles WHERE user_id = get_user_id()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_employer_profile_id()
RETURNS UUID AS $$
  SELECT id FROM employer_profiles WHERE user_id = get_user_id()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'admin'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_unlock(p_job_id UUID, p_candidate_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM unlocks
    WHERE employer_id = get_employer_profile_id()
      AND job_id = p_job_id
      AND candidate_id = p_candidate_id
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Users policies
CREATE POLICY "Users can view own record" ON users
  FOR SELECT USING (auth_user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth_user_id = auth.uid() OR is_admin());

CREATE POLICY "Admin can view all users" ON users
  FOR ALL USING (is_admin());

-- Candidate profiles
CREATE POLICY "Candidates manage own profile" ON candidate_profiles
  FOR ALL USING (user_id = get_user_id() OR is_admin());

CREATE POLICY "Employers see anonymous candidate data via match" ON candidate_profiles
  FOR SELECT USING (
    is_admin()
    OR user_id = get_user_id()
    OR (
      get_user_role() = 'employer'
      AND status = 'ready_for_matching'
      AND EXISTS (
        SELECT 1 FROM match_results mr
        JOIN jobs j ON j.id = mr.job_id
        WHERE mr.candidate_id = candidate_profiles.id
          AND j.employer_id = get_employer_profile_id()
      )
    )
  );

-- Employer profiles
CREATE POLICY "Employers manage own profile" ON employer_profiles
  FOR ALL USING (user_id = get_user_id() OR is_admin());

-- Jobs
CREATE POLICY "Employers manage own jobs" ON jobs
  FOR ALL USING (employer_id = get_employer_profile_id() OR is_admin());

-- Matrix content (read for authenticated, write for admin)
CREATE POLICY "Authenticated users read active categories" ON matrix_categories
  FOR SELECT USING (is_active = TRUE OR is_admin());

CREATE POLICY "Admin manages categories" ON matrix_categories
  FOR ALL USING (is_admin());

CREATE POLICY "Authenticated users read active questions" ON matrix_questions
  FOR SELECT USING (is_active = TRUE OR is_admin());

CREATE POLICY "Admin manages questions" ON matrix_questions
  FOR ALL USING (is_admin());

CREATE POLICY "Authenticated users read active options" ON matrix_options
  FOR SELECT USING (is_active = TRUE OR is_admin());

CREATE POLICY "Admin manages options" ON matrix_options
  FOR ALL USING (is_admin());

-- Candidate matrix answers
CREATE POLICY "Candidates manage own matrix answers" ON candidate_matrix_answers
  FOR ALL USING (
    candidate_id = get_candidate_profile_id()
    OR is_admin()
  );

-- Job matrix answers
CREATE POLICY "Employers manage own job matrix answers" ON job_matrix_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_matrix_answers.job_id
        AND j.employer_id = get_employer_profile_id()
    )
    OR is_admin()
  );

-- CV files
CREATE POLICY "Candidates manage own CV" ON candidate_cv_files
  FOR ALL USING (
    candidate_id = get_candidate_profile_id()
    OR is_admin()
    OR (
      get_user_role() = 'employer'
      AND has_unlock(
        (SELECT job_id FROM match_results WHERE candidate_id = candidate_cv_files.candidate_id LIMIT 1),
        candidate_id
      )
    )
  );

-- JD files
CREATE POLICY "Employers manage own JD files" ON job_jd_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_jd_files.job_id
        AND j.employer_id = get_employer_profile_id()
    )
    OR is_admin()
  );

-- Match results
CREATE POLICY "Employers view own job match results" ON match_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = match_results.job_id
        AND j.employer_id = get_employer_profile_id()
    )
    OR is_admin()
  );

CREATE POLICY "Employers insert match results for own jobs" ON match_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = match_results.job_id
        AND j.employer_id = get_employer_profile_id()
    )
    OR is_admin()
  );

CREATE POLICY "Admin manages match results" ON match_results
  FOR ALL USING (is_admin());

-- Payments
CREATE POLICY "Employers manage own payments" ON payments
  FOR ALL USING (employer_id = get_employer_profile_id() OR is_admin());

-- Unlocks
CREATE POLICY "Employers view own unlocks" ON unlocks
  FOR SELECT USING (employer_id = get_employer_profile_id() OR is_admin());

CREATE POLICY "System creates unlocks" ON unlocks
  FOR INSERT WITH CHECK (employer_id = get_employer_profile_id() OR is_admin());

-- Activity logs
CREATE POLICY "Users view own activity" ON activity_logs
  FOR SELECT USING (user_id = get_user_id() OR is_admin());

CREATE POLICY "Users create activity logs" ON activity_logs
  FOR INSERT WITH CHECK (user_id = get_user_id() OR is_admin());

CREATE POLICY "Admin manages activity logs" ON activity_logs
  FOR ALL USING (is_admin());
