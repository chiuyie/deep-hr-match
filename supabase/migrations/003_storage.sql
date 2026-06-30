-- Storage buckets and policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('candidate-cvs', 'candidate-cvs', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('job-jds', 'job-jds', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Candidate CV storage policies
CREATE POLICY "Candidates upload own CV"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'candidate-cvs'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = get_candidate_profile_id()::text
);

CREATE POLICY "Candidates read own CV"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'candidate-cvs'
  AND (
    (storage.foldername(name))[1] = get_candidate_profile_id()::text
    OR is_admin()
  )
);

CREATE POLICY "Candidates update own CV"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'candidate-cvs'
  AND (storage.foldername(name))[1] = get_candidate_profile_id()::text
);

CREATE POLICY "Candidates delete own CV"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'candidate-cvs'
  AND (storage.foldername(name))[1] = get_candidate_profile_id()::text
);

-- Employer JD storage policies
CREATE POLICY "Employers upload JD for own jobs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'job-jds'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id::text = (storage.foldername(name))[1]
      AND j.employer_id = get_employer_profile_id()
  )
);

CREATE POLICY "Employers read own JD files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'job-jds'
  AND (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id::text = (storage.foldername(name))[1]
        AND j.employer_id = get_employer_profile_id()
    )
    OR is_admin()
  )
);

CREATE POLICY "Employers update own JD files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'job-jds'
  AND EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id::text = (storage.foldername(name))[1]
      AND j.employer_id = get_employer_profile_id()
  )
);

CREATE POLICY "Employers delete own JD files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'job-jds'
  AND EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id::text = (storage.foldername(name))[1]
      AND j.employer_id = get_employer_profile_id()
  )
);
