import {
  JOB_BACKGROUND_QUESTIONS,
  JOB_ELIMINATION_FIELDS,
  JOB_FORM_SECTIONS,
  JOB_PREFERRED_FIELDS,
} from "@/lib/constants/job-form";
import type { FormFieldAudience, FormFieldGroup, FormFieldType } from "@/lib/form-fields/types";

export type DefaultFormFieldInput = {
  audience: FormFieldAudience;
  form_group: FormFieldGroup;
  section: string;
  field_key: string;
  label: string;
  field_type?: FormFieldType;
  placeholder?: string;
  is_required?: boolean;
  sort_order: number;
};

function candidateProfileFields(): DefaultFormFieldInput[] {
  const section = "Candidate Profile";
  return [
    { audience: "candidate", form_group: "profile", section, field_key: "full_name", label: "Full Name", is_required: true, sort_order: 1 },
    { audience: "candidate", form_group: "profile", section, field_key: "email", label: "Email", field_type: "email", is_required: true, sort_order: 2 },
    { audience: "candidate", form_group: "profile", section, field_key: "phone", label: "Phone", field_type: "tel", sort_order: 3 },
    { audience: "candidate", form_group: "profile", section, field_key: "country", label: "Country", sort_order: 4 },
    { audience: "candidate", form_group: "profile", section, field_key: "city", label: "City", sort_order: 5 },
    { audience: "candidate", form_group: "profile", section, field_key: "current_job_title", label: "Current Job Title", sort_order: 6 },
    { audience: "candidate", form_group: "profile", section, field_key: "years_of_experience", label: "Years of Experience", field_type: "number", sort_order: 7 },
    { audience: "candidate", form_group: "profile", section, field_key: "highest_education", label: "Highest Education", sort_order: 8 },
    { audience: "candidate", form_group: "profile", section, field_key: "skills", label: "Skills (comma-separated)", field_type: "textarea", sort_order: 9 },
    { audience: "candidate", form_group: "profile", section, field_key: "certifications", label: "Certifications (comma-separated)", sort_order: 10 },
    { audience: "candidate", form_group: "profile", section, field_key: "languages", label: "Languages (comma-separated)", sort_order: 11 },
    { audience: "candidate", form_group: "profile", section, field_key: "current_salary", label: "Current Salary", sort_order: 12 },
    { audience: "candidate", form_group: "profile", section, field_key: "expected_salary", label: "Expected Salary", sort_order: 13 },
    { audience: "candidate", form_group: "profile", section, field_key: "employment_type_preference", label: "Employment Type Preference", sort_order: 14 },
    { audience: "candidate", form_group: "profile", section, field_key: "work_arrangement_preference", label: "Work Arrangement", sort_order: 15 },
    { audience: "candidate", form_group: "profile", section, field_key: "availability", label: "Availability", sort_order: 16 },
  ];
}

function employerProfileFields(): DefaultFormFieldInput[] {
  const section = "Company Profile";
  return [
    { audience: "employer", form_group: "profile", section, field_key: "company_name", label: "Company Name", is_required: true, sort_order: 1 },
    { audience: "employer", form_group: "profile", section, field_key: "registration_number", label: "UEN / Registration Number", sort_order: 2 },
    { audience: "employer", form_group: "profile", section, field_key: "industry", label: "Industry", sort_order: 3 },
    { audience: "employer", form_group: "profile", section, field_key: "company_size", label: "Company Size", sort_order: 4 },
    { audience: "employer", form_group: "profile", section, field_key: "website", label: "Website", field_type: "url", sort_order: 5 },
    { audience: "employer", form_group: "profile", section, field_key: "company_description", label: "Description", field_type: "textarea", sort_order: 6 },
    { audience: "employer", form_group: "profile", section, field_key: "contact_person_name", label: "Contact Person", sort_order: 7 },
    { audience: "employer", form_group: "profile", section, field_key: "contact_person_email", label: "Contact Email", field_type: "email", sort_order: 8 },
    { audience: "employer", form_group: "profile", section, field_key: "contact_person_phone", label: "Contact Phone", field_type: "tel", sort_order: 9 },
  ];
}

function employerJobFields(): DefaultFormFieldInput[] {
  const fields: DefaultFormFieldInput[] = [];
  let order = 1;

  const sectionById = Object.fromEntries(JOB_FORM_SECTIONS.map((s) => [s.id, s.title]));

  const push = (
    sectionId: keyof typeof sectionById | string,
    field_key: string,
    label: string,
    opts: Partial<DefaultFormFieldInput> = {}
  ) => {
    fields.push({
      audience: "employer",
      form_group: "job",
      section: sectionById[sectionId] ?? String(sectionId),
      field_key,
      label,
      field_type: "text",
      sort_order: order++,
      ...opts,
    });
  };

  push("job-identification", "job_title", "Job Title", { is_required: true });
  push("job-identification", "job_id", "Job ID");
  push("job-identification", "created_by_representative", "Created By Representative");
  push("job-description", "job_description", "Job Description", { field_type: "textarea", is_required: true });
  push("job-details", "working_hours", "Working Hours");
  push("job-details", "team_size", "Team Size");
  push("job-details", "importance_level", "Importance Level");
  push("job-details", "travel_needs", "Travel Needs");
  push("job-details", "reporting_to", "Reporting To");
  push("job-details", "additional_notes", "Additional Notes", { field_type: "textarea" });
  push("benefits-package", "benefits_package", "Benefits Package", { field_type: "checkbox" });

  for (const field of JOB_ELIMINATION_FIELDS) {
    push("basic-information", field.name, field.label, {
      field_type: "select",
      placeholder: field.placeholder,
    });
  }
  push("basic-information", "language_needs", "Language Needs", { field_type: "textarea" });

  for (const field of JOB_BACKGROUND_QUESTIONS) {
    push("background-information-questions", field.name, field.label, { field_type: "select" });
  }

  for (const field of JOB_PREFERRED_FIELDS) {
    push("preferred-selection-by-the-employer", field.name, field.label, {
      field_type: field.type === "multilevel" ? "select" : "text",
    });
  }

  return fields;
}

export function getDefaultFormFields(): DefaultFormFieldInput[] {
  return [...candidateProfileFields(), ...employerProfileFields(), ...employerJobFields()];
}

export function slugifyFieldKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
}
