-- Dropdown options for select-type form fields (JSON string array).
ALTER TABLE form_fields
  ADD COLUMN IF NOT EXISTS options JSONB;

COMMENT ON COLUMN form_fields.options IS
  'Optional list of select/dropdown choices as a JSON string array.';
