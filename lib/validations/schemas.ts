import { z } from "zod";
import { validateYearsOfExperienceValue } from "@/lib/form-fields/years-of-experience";

export const signUpSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["candidate", "employer"], { message: "Choose candidate or employer." }),
});

export const signInSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password is required"),
});

export const candidateProfileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  current_job_title: z.string().optional(),
  years_of_experience: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value, ctx) => {
      if (value === undefined || value === null || value === "") return undefined;
      const result = validateYearsOfExperienceValue(value, { required: false });
      if (result.ok === false) {
        ctx.addIssue({ code: "custom", message: result.message });
        return z.NEVER;
      }
      return result.value === null ? undefined : result.value;
    }),
  highest_education: z.string().optional(),
  skills: z.union([z.string(), z.array(z.string())]).optional(),
  certifications: z.union([z.string(), z.array(z.string())]).optional(),
  languages: z.union([z.string(), z.array(z.any())]).optional(),
  current_salary: z.string().optional(),
  expected_salary: z.string().optional(),
  employment_type_preference: z.string().optional(),
  work_arrangement_preference: z.string().optional(),
  availability: z.string().optional(),
});

export const employerProfileSchema = z.object({
  company_name: z.string().min(1, "Employer name is required"),
  registration_number: z.string().optional(),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  website: z
    .string()
    .url("Enter a full website address, including https://.")
    .optional()
    .or(z.literal("")),
  company_description: z.string().optional(),
  contact_person_name: z.string().optional(),
  contact_person_email: z
    .string()
    .email("Enter a valid email address.")
    .optional()
    .or(z.literal("")),
  contact_person_phone: z.string().optional(),
});

export const jobSchema = z.object({
  job_title: z.string().min(1, "Job title is required"),
  job_description: z.string().min(1, "Job description is required"),
});

export const matrixCategorySchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().optional(),
  sort_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
});

export const matrixQuestionSchema = z.object({
  category_id: z.string().uuid("Choose a valid category."),
  question_text: z.string().min(1, "Question text is required."),
  question_type: z.enum(["single_select", "multi_select", "text", "scale"]),
  target_role: z.enum(["candidate", "employer", "both"]),
  sort_order: z.coerce.number().default(0),
  is_required: z.boolean().default(true),
  is_active: z.boolean().default(true),
  parent_option_id: z.string().uuid().optional().nullable(),
});

export const matrixOptionSchema = z.object({
  question_id: z.string().uuid("Choose a valid question."),
  option_text: z.string().min(1, "Option text is required."),
  option_value: z.string().min(1, "Option value is required."),
  sort_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
  description: z.string().optional().nullable(),
});

export const formFieldSchema = z.object({
  audience: z.enum(["candidate", "employer"]),
  form_group: z.enum(["profile", "job"]),
  section: z.string().min(1, "Section is required."),
  field_key: z.string().min(1, "Field key is required."),
  label: z.string().min(1, "Label is required."),
  field_type: z
    .enum(["text", "email", "number", "textarea", "tel", "url", "select", "checkbox", "file", "date"])
    .default("text"),
  placeholder: z.string().optional().nullable(),
  options: z.array(z.string().min(1, "Option text is required.")).nullable().optional().default(null),
  is_required: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_custom: z.boolean().default(false),
  employer_disclosure_mode: z
    .enum(["always_visible", "candidate_optional", "admin_removed"])
    .default("candidate_optional"),
  show_on_anonymous_match: z.boolean().default(false),
  sort_order: z.coerce.number().default(0),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>;
export type EmployerProfileInput = z.infer<typeof employerProfileSchema>;
export type JobInput = z.infer<typeof jobSchema>;
