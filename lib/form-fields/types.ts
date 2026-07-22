export type FormFieldAudience = "candidate" | "employer";
export type FormFieldGroup = "profile" | "job";
export type EmployerDisclosureMode = "always_visible" | "candidate_optional" | "admin_removed";
export type FormFieldType =
  | "text"
  | "email"
  | "number"
  | "textarea"
  | "tel"
  | "url"
  | "select"
  | "checkbox"
  | "file";

export interface FormFieldDefinition {
  id: string;
  audience: FormFieldAudience;
  form_group: FormFieldGroup;
  section: string;
  field_key: string;
  label: string;
  field_type: FormFieldType;
  placeholder: string | null;
  is_required: boolean;
  is_active: boolean;
  is_custom: boolean;
  employer_disclosure_mode: EmployerDisclosureMode;
  /** When true, field may appear on anonymized candidate-job match rankings. */
  show_on_anonymous_match: boolean;
  sort_order: number;
}

export interface FormFieldSectionGroup {
  section: string;
  fields: FormFieldDefinition[];
}
