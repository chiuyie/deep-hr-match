import {
  CANDIDATE_MATCHING_ATTRIBUTE_FIELDS,
  CANDIDATE_ROLE_REQUIREMENT_QUESTIONS,
  JOB_BACKGROUND_QUESTIONS,
  JOB_ELIMINATION_FIELDS,
  JOB_FORM_SECTIONS,
  JOB_PREFERRED_FIELDS,
  YES_NO_OPTIONS,
} from "@/lib/constants/job-form";
import {
  CANDIDATE_PROFILE_SECTIONS,
  EMPLOYER_PROFILE_SECTIONS,
} from "@/lib/form-fields/profile-sections";
import { DEFAULT_SELECT_OPTIONS_BY_KEY } from "@/lib/form-fields/select-options";
import type { FormFieldAudience, FormFieldGroup, FormFieldType } from "@/lib/form-fields/types";

export type DefaultFormFieldInput = {
  audience: FormFieldAudience;
  form_group: FormFieldGroup;
  section: string;
  field_key: string;
  label: string;
  field_type?: FormFieldType;
  options?: string[];
  placeholder?: string;
  is_required?: boolean;
  sort_order: number;
};

function candidateProfileFields(): DefaultFormFieldInput[] {
  const labelByKey: Record<
    string,
    { label: string; field_type?: FormFieldType; is_required?: boolean; options?: string[] }
  > = {
    full_name: { label: "Full Name", is_required: true },
    email: { label: "Email", field_type: "email", is_required: true },
    phone: { label: "Phone", field_type: "tel" },
    country: { label: "Country", field_type: "select" },
    city: { label: "City", field_type: "select" },
    current_job_title: { label: "Current Job Title" },
    years_of_experience: { label: "Years of Experience", field_type: "number" },
    highest_education: { label: "Highest Education", field_type: "select" },
    skills: { label: "Skills", field_type: "textarea" },
    certifications: { label: "Certifications", field_type: "textarea" },
    languages: { label: "Languages", field_type: "textarea" },
    current_salary: { label: "Current Salary" },
    expected_salary: { label: "Expected Salary" },
    employment_type_preference: { label: "Employment Type Preference", field_type: "select" },
    work_arrangement_preference: { label: "Work Arrangement", field_type: "select" },
    availability: { label: "Availability", field_type: "select" },
  };

  for (const question of CANDIDATE_ROLE_REQUIREMENT_QUESTIONS) {
    labelByKey[question.name] = {
      label: question.label,
      field_type: "select",
      is_required: true,
      options: [...YES_NO_OPTIONS],
    };
  }

  for (const field of CANDIDATE_MATCHING_ATTRIBUTE_FIELDS) {
    labelByKey[field.name] = {
      label: field.label,
      field_type: "select",
      is_required: false,
      options: [...field.options],
    };
  }

  let order = 1;
  const fields: DefaultFormFieldInput[] = [];
  for (const section of CANDIDATE_PROFILE_SECTIONS) {
    for (const field_key of section.fieldKeys) {
      const meta = labelByKey[field_key];
      if (!meta) continue;
      fields.push({
        audience: "candidate",
        form_group: "profile",
        section: section.title,
        field_key,
        label: meta.label,
        field_type: meta.field_type,
        options:
          meta.options ??
          (meta.field_type === "select"
            ? [...(DEFAULT_SELECT_OPTIONS_BY_KEY[field_key] ?? [])]
            : undefined),
        is_required: meta.is_required,
        sort_order: order++,
      });
    }
  }
  return fields;
}

function employerProfileFields(): DefaultFormFieldInput[] {
  const labelByKey: Record<string, { label: string; field_type?: FormFieldType; is_required?: boolean }> = {
    company_name: { label: "Employer name", is_required: true },
    registration_number: { label: "UEN / Registration Number" },
    industry: { label: "Industry" },
    company_size: { label: "Employer size" },
    website: { label: "Website", field_type: "url" },
    company_description: { label: "Description", field_type: "textarea" },
    contact_person_name: { label: "Contact Person" },
    contact_person_email: { label: "Contact Email", field_type: "email" },
    contact_person_phone: { label: "Contact Phone", field_type: "tel" },
  };

  let order = 1;
  const fields: DefaultFormFieldInput[] = [];
  for (const section of EMPLOYER_PROFILE_SECTIONS) {
    for (const field_key of section.fieldKeys) {
      const meta = labelByKey[field_key];
      if (!meta) continue;
      fields.push({
        audience: "employer",
        form_group: "profile",
        section: section.title,
        field_key,
        label: meta.label,
        field_type: meta.field_type,
        is_required: meta.is_required,
        sort_order: order++,
      });
    }
  }
  return fields;
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
  push("job-identification", "job_description", "Job Description", { field_type: "textarea", is_required: true });
  push("job-details", "working_hours", "Working hours / schedule", {
    field_type: "select",
    placeholder: "Select the closest schedule",
  });
  push("job-details", "team_size", "Team Size");
  push("job-details", "importance_level", "Importance Level");
  push("job-details", "travel_needs", "Travel Needs");
  push("job-details", "reporting_to", "Reporting To");
  push("job-details", "additional_notes", "Additional Notes", { field_type: "textarea" });
  push("compensation", "desired_minimum_salary", "Minimum Salary Budget (SGD)", {
    field_type: "number",
  });
  push("compensation", "desired_maximum_salary", "Maximum Salary Budget (SGD)", {
    field_type: "number",
  });
  push("compensation", "benefits_package", "Benefits Package", { field_type: "checkbox" });

  for (const field of JOB_ELIMINATION_FIELDS) {
    push("basic-information", field.name, field.label, {
      field_type: "select",
      placeholder: field.placeholder,
      options: [...field.options],
    });
  }
  push("basic-information", "language_needs", "Languages genuinely needed for the role", {
    field_type: "textarea",
    placeholder:
      "Example: English for internal communication and email writing. Mandarin preferred for customer calls.",
  });

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
