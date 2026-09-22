-- Candidate profile expansions: timelines, address, DOB, job targets.

ALTER TABLE candidate_profiles
  ADD COLUMN IF NOT EXISTS home_address TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS work_experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS education_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS volunteer_experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS desired_job_titles TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS preferred_locations TEXT[] DEFAULT '{}'::text[];

COMMENT ON COLUMN candidate_profiles.home_address IS
  'Residential street / unit address (optional).';
COMMENT ON COLUMN candidate_profiles.postal_code IS
  'Postal / ZIP code for residential address.';
COMMENT ON COLUMN candidate_profiles.date_of_birth IS
  'Candidate date of birth (DATE).';
COMMENT ON COLUMN candidate_profiles.work_experience IS
  'Work timeline: [{company, title, start_date, end_date, is_current, description}]';
COMMENT ON COLUMN candidate_profiles.education_history IS
  'Education timeline: [{school, degree, field_of_study, start_date, end_date, is_current}]';
COMMENT ON COLUMN candidate_profiles.volunteer_experience IS
  'Volunteer / extracurricular: [{organization, role, start_date, end_date, is_current, description}]';
COMMENT ON COLUMN candidate_profiles.desired_job_titles IS
  'Target / desired job titles (multi).';
COMMENT ON COLUMN candidate_profiles.preferred_locations IS
  'Preferred work locations (multi).';
