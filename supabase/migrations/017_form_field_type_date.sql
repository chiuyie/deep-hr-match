-- Allow date as a form field input type.
ALTER TABLE form_fields
  DROP CONSTRAINT IF EXISTS form_fields_field_type_check;

ALTER TABLE form_fields
  ADD CONSTRAINT form_fields_field_type_check
  CHECK (
    field_type IN (
      'text',
      'email',
      'number',
      'textarea',
      'tel',
      'url',
      'select',
      'checkbox',
      'file',
      'date'
    )
  );
