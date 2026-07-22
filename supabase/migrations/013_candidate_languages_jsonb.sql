-- Convert candidate_profiles.languages from TEXT[] to structured JSONB:
-- [{ "language": "English", "proficiency": "Fluent" | null }, ...]

ALTER TABLE candidate_profiles
  ADD COLUMN IF NOT EXISTS languages_v2 JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Migrate legacy TEXT[] values when the original column still exists as text[].
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'candidate_profiles'
      AND column_name = 'languages'
      AND udt_name = '_text'
  ) THEN
    UPDATE candidate_profiles
    SET languages_v2 = COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object('language', btrim(lang), 'proficiency', NULL)
          ORDER BY ord
        )
        FROM unnest(COALESCE(languages, '{}'::text[])) WITH ORDINALITY AS t(lang, ord)
        WHERE btrim(lang) <> ''
      ),
      '[]'::jsonb
    );
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'candidate_profiles'
      AND column_name = 'languages'
      AND udt_name = 'jsonb'
  ) THEN
    UPDATE candidate_profiles
    SET languages_v2 = COALESCE(languages, '[]'::jsonb);
  END IF;
END $$;

ALTER TABLE candidate_profiles DROP COLUMN IF EXISTS languages;
ALTER TABLE candidate_profiles RENAME COLUMN languages_v2 TO languages;

COMMENT ON COLUMN candidate_profiles.languages IS
  'Structured language entries: [{language, proficiency}]';
