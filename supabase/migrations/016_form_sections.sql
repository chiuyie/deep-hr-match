-- Ordered form sections for admin-managed profile/job forms.
CREATE TABLE IF NOT EXISTS form_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audience TEXT NOT NULL CHECK (audience IN ('candidate', 'employer')),
  form_group TEXT NOT NULL CHECK (form_group IN ('profile', 'job')),
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (audience, form_group, title)
);

CREATE INDEX IF NOT EXISTS form_sections_audience_group_idx
  ON form_sections (audience, form_group, sort_order);

CREATE TRIGGER update_form_sections_updated_at
  BEFORE UPDATE ON form_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE form_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read form sections" ON form_sections
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin manages form sections" ON form_sections
  FOR ALL USING (is_admin());

-- Seed from existing field sections.
INSERT INTO form_sections (audience, form_group, title, sort_order)
SELECT
  audience,
  form_group,
  section,
  MIN(sort_order)
FROM form_fields
GROUP BY audience, form_group, section
ON CONFLICT (audience, form_group, title) DO NOTHING;
