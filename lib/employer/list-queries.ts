import { createClient, createServiceClient } from "@/lib/supabase/server";
import { toEmployerJobListItems, type EmployerJobListItem } from "@/lib/employer/job-list";

const EMPLOYER_JOB_LIST_SELECT =
  "id, title, location, department, employment_type, status, created_at, match_results(count), unlocks(count)";

type JobListRow = {
  id: string;
  title: string;
  location: string | null;
  department: string | null;
  employment_type: string | null;
  status: EmployerJobListItem["status"];
  created_at: string;
  match_results?: Array<{ count: number | null }> | null;
  unlocks?: Array<{ count: number | null }> | null;
};

function embedCount(rows: Array<{ count: number | null }> | null | undefined): number {
  return Number(rows?.[0]?.count ?? 0);
}

/** Slim jobs list with DB-side match/unlock counts (no full match_results row fetch). */
export async function loadEmployerJobsList(employerId: string): Promise<EmployerJobListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select(EMPLOYER_JOB_LIST_SELECT)
    .eq("employer_id", employerId)
    .order("created_at", { ascending: false });

  const jobs = (data ?? []) as JobListRow[];
  const matchCounts = new Map(jobs.map((job) => [job.id, embedCount(job.match_results)]));
  const unlockCounts = new Map(jobs.map((job) => [job.id, embedCount(job.unlocks)]));

  return toEmployerJobListItems(
    jobs.map(({ match_results: _m, unlocks: _u, ...job }) => job),
    matchCounts,
    unlockCounts
  );
}

/** Dashboard stats — head counts use `id` only; payments pull amount. */
export async function loadEmployerDashboardStats(employerId: string) {
  const supabase = await createClient();
  const [{ count: totalJobs }, { count: unlockCount }, { data: payments }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("employer_id", employerId),
    supabase
      .from("unlocks")
      .select("id", { count: "exact", head: true })
      .eq("employer_id", employerId),
    supabase
      .from("payments")
      .select("amount")
      .eq("employer_id", employerId)
      .eq("status", "paid"),
  ]);

  return {
    totalJobs: totalJobs ?? 0,
    unlockCount: unlockCount ?? 0,
    totalSpent: payments?.reduce((sum, payment) => sum + payment.amount, 0) ?? 0,
  };
}

/** Columns needed for anonymous match tables (omits per-factor score payloads). */
export const EMPLOYER_MATCH_RESULT_LIST_SELECT =
  "candidate_id, ranking_position, overall_score, is_placeholder, generated_at, match_summary, strengths, gaps";

/** Job overview fields for the read-only view page (omits form_data). */
export const EMPLOYER_JOB_VIEW_SELECT =
  "id, title, location, department, employment_type, salary_range, years_experience_required, education_required, required_skills, preferred_skills, description, status, created_at";

export type EmployerUnlockedListItem = {
  id: string;
  candidateId: string;
  jobId: string;
  name: string;
  jobTitle: string;
};

function embedTitle(value: unknown): string | null {
  if (Array.isArray(value)) {
    const title = value[0]?.title;
    return typeof title === "string" && title.trim() ? title : null;
  }
  if (value && typeof value === "object" && "title" in value) {
    const title = (value as { title?: unknown }).title;
    return typeof title === "string" && title.trim() ? title : null;
  }
  return null;
}

function embedName(value: unknown): string | null {
  if (Array.isArray(value)) {
    const name = value[0]?.full_name;
    return typeof name === "string" && name.trim() ? name : null;
  }
  if (value && typeof value === "object" && "full_name" in value) {
    const name = (value as { full_name?: unknown }).full_name;
    return typeof name === "string" && name.trim() ? name : null;
  }
  return null;
}

async function employerReadClient() {
  try {
    return await createServiceClient();
  } catch {
    return createClient();
  }
}

/**
 * Purchased unlocks across all jobs. Uses the service role so PostgREST
 * does not evaluate candidate_profiles RLS (EXISTS match_results) per row.
 */
export async function loadEmployerUnlockedList(
  employerId: string
): Promise<EmployerUnlockedListItem[]> {
  if (!employerId) return [];

  const supabase = await employerReadClient();
  const { data } = await supabase
    .from("unlocks")
    .select("id, candidate_id, job_id, jobs(title), candidate_profiles(full_name)")
    .eq("employer_id", employerId)
    .order("unlocked_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    candidateId: row.candidate_id,
    jobId: row.job_id,
    name: embedName(row.candidate_profiles) ?? "Candidate",
    jobTitle: embedTitle(row.jobs) ?? "Job",
  }));
}
