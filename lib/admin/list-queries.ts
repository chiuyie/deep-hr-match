import { createClient } from "@/lib/supabase/server";

/** List rows for /admin/candidates — omits custom_fields, skills, and other heavy columns. */
export async function loadAdminCandidatesList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("candidate_profiles")
    .select("id, full_name, email, status, completion_percentage, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** List rows for /admin/employers — omits custom_fields and long text fields. */
export async function loadAdminEmployersList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employer_profiles")
    .select("id, company_name, industry, contact_person_email, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** List rows for /admin/jobs — omits description, skills arrays, and matrix payloads. */
export async function loadAdminJobsList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("id, title, location, status, created_at, employer_profiles(company_name)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** List rows for /admin/matching — omits match_summary, strengths, and gaps arrays. */
export async function loadAdminMatchingList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("match_results")
    .select(
      "id, job_id, candidate_id, ranking_position, overall_score, is_placeholder, generated_at, jobs(title), candidate_profiles(full_name, email)"
    )
    .order("generated_at", { ascending: false });
  return data ?? [];
}

/** List rows for /admin/payments. */
export async function loadAdminPaymentsList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select(
      "id, amount, currency, status, created_at, selected_candidate_ids, jobs(title), employer_profiles(company_name)"
    )
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** List rows for /admin/unlocks. */
export async function loadAdminUnlocksList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("unlocks")
    .select(
      "id, unlocked_at, jobs(title), employer_profiles(company_name), candidate_profiles(full_name, email), payments(stripe_session_id)"
    )
    .order("unlocked_at", { ascending: false });
  return data ?? [];
}

/** CV and JD file lists for /admin/files — fetched in parallel with slim embeds. */
export async function loadAdminFileLists() {
  const supabase = await createClient();
  const [cvs, jds] = await Promise.all([
    supabase
      .from("candidate_cv_files")
      .select("id, file_name, file_path, file_size, uploaded_at, candidate_profiles(full_name, email)")
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("job_jd_files")
      .select("id, file_name, file_path, file_size, uploaded_at, jobs(title)")
      .order("uploaded_at", { ascending: false }),
  ]);

  return {
    cvs: cvs.data ?? [],
    jds: jds.data ?? [],
  };
}
