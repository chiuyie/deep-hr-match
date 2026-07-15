-- Configurable form field definitions for candidate / employer forms

CREATE TABLE form_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audience TEXT NOT NULL CHECK (audience IN ('candidate', 'employer')),
  form_group TEXT NOT NULL CHECK (form_group IN ('profile', 'job')),
  section TEXT NOT NULL,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text'
    CHECK (field_type IN ('text', 'email', 'number', 'textarea', 'tel', 'url', 'select', 'checkbox', 'file')),
  placeholder TEXT,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (audience, form_group, field_key)
);

CREATE INDEX form_fields_audience_group_idx ON form_fields (audience, form_group, sort_order);

ALTER TABLE candidate_profiles
  ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE employer_profiles
  ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TRIGGER update_form_fields_updated_at BEFORE UPDATE ON form_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read active form fields" ON form_fields
  FOR SELECT USING (is_active = TRUE OR is_admin());

CREATE POLICY "Admin manages form fields" ON form_fields
  FOR ALL USING (is_admin());
