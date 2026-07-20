export type UserRole = "candidate" | "employer" | "admin";

export type CandidateStatus = "draft" | "incomplete" | "ready_for_matching";

export type JobStatus = "draft" | "active" | "closed";

export type MatrixTargetRole = "candidate" | "employer" | "both";

export type QuestionType = "single_select" | "multi_select" | "text" | "scale";

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";

export type PaymentType = "candidate_profile_unlock";

export interface User {
  id: string;
  auth_user_id: string;
  role: UserRole;
  name: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface CandidateProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  current_job_title: string | null;
  years_of_experience: number | null;
  highest_education: string | null;
  skills: string[] | null;
  certifications: string[] | null;
  languages: string[] | null;
  current_salary: string | null;
  expected_salary: string | null;
  employment_type_preference: string | null;
  work_arrangement_preference: string | null;
  availability: string | null;
  status: CandidateStatus;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface EmployerProfile {
  id: string;
  user_id: string;
  company_name: string | null;
  registration_number: string | null;
  industry: string | null;
  company_size: string | null;
  website: string | null;
  company_description: string | null;
  contact_person_name: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  salary_range: string | null;
  years_experience_required: number | null;
  education_required: string | null;
  required_skills: string[] | null;
  preferred_skills: string[] | null;
  description: string | null;
  status: JobStatus;
  form_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface MatrixCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatrixQuestion {
  id: string;
  category_id: string;
  question_text: string;
  question_type: QuestionType;
  target_role: MatrixTargetRole;
  sort_order: number;
  is_required: boolean;
  is_active: boolean;
  parent_option_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatrixOption {
  id: string;
  question_id: string;
  option_text: string;
  option_value: string;
  sort_order: number;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchResult {
  id: string;
  job_id: string;
  candidate_id: string;
  overall_score: number;
  matrix_score: number | null;
  profile_score: number | null;
  skills_score: number | null;
  experience_score: number | null;
  education_score: number | null;
  match_summary: string | null;
  strengths: string[] | null;
  gaps: string[] | null;
  ranking_position: number;
  is_placeholder: boolean;
  generated_at: string;
  created_at: string;
}

export interface Payment {
  id: string;
  employer_id: string;
  job_id: string;
  candidate_id: string | null;
  selected_candidate_ids: string[];
  stripe_session_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_type: PaymentType;
  created_at: string;
  paid_at: string | null;
}

export interface Unlock {
  id: string;
  employer_id: string;
  job_id: string;
  candidate_id: string;
  payment_id: string;
  unlocked_at: string;
}

export interface AnonymousCandidateMatch {
  id: string;
  anonymous_id: string;
  ranking_position: number;
  overall_score: number;
  is_placeholder: boolean;
  years_of_experience: number | null;
  highest_education: string | null;
  skills_overview: string[];
  is_unlocked: boolean;
}

export interface UnlockedCandidateView {
  candidate_id: string;
  full_name: string;
  email: string;
  phone: string;
  profile: CandidateProfile;
  cv_download_url: string | null;
  match_result: MatchResult | null;
}
