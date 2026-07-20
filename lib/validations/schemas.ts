import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["candidate", "employer"]),
});

export const signInSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password is required"),
});

export const candidateProfileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email(),
  phone: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  current_job_title: z.string().optional(),
  years_of_experience: z.coerce.number().min(0).optional(),
  highest_education: z.string().optional(),
  skills: z.string().optional(),
  certifications: z.string().optional(),
  languages: z.string().optional(),
  current_salary: z.string().optional(),
  expected_salary: z.string().optional(),
  employment_type_preference: z.string().optional(),
  work_arrangement_preference: z.string().optional(),
  availability: z.string().optional(),
});

export const employerProfileSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  registration_number: z.string().optional(),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  company_description: z.string().optional(),
  contact_person_name: z.string().optional(),
  contact_person_email: z.string().email().optional().or(z.literal("")),
  contact_person_phone: z.string().optional(),
});

export const jobSchema = z.object({
  job_title: z.string().min(1, "Job title is required"),
  job_description: z.string().min(1, "Job description is required"),
});

export const matrixCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sort_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
});

export const matrixQuestionSchema = z.object({
  category_id: z.string().uuid(),
  question_text: z.string().min(1),
  question_type: z.enum(["single_select", "multi_select", "text", "scale"]),
  target_role: z.enum(["candidate", "employer", "both"]),
  sort_order: z.coerce.number().default(0),
  is_required: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

export const matrixOptionSchema = z.object({
  question_id: z.string().uuid(),
  option_text: z.string().min(1),
  option_value: z.string().min(1),
  sort_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
});

export const formFieldSchema = z.object({
  audience: z.enum(["candidate", "employer"]),
  form_group: z.enum(["profile", "job"]),
  section: z.string().min(1),
  field_key: z.string().min(1),
  label: z.string().min(1),
  field_type: z
    .enum(["text", "email", "number", "textarea", "tel", "url", "select", "checkbox", "file"])
    .default("text"),
  placeholder: z.string().optional().nullable(),
  is_required: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_custom: z.boolean().default(false),
  employer_disclosure_mode: z
    .enum(["always_visible", "candidate_optional", "admin_removed"])
    .default("candidate_optional"),
  sort_order: z.coerce.number().default(0),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>;
export type EmployerProfileInput = z.infer<typeof employerProfileSchema>;
export type JobInput = z.infer<typeof jobSchema>;
