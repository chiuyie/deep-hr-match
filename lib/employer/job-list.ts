import type { Job, JobStatus } from "@/types/database";

export interface EmployerJobListItem {
  id: string;
  title: string;
  location: string | null;
  department: string | null;
  employment_type: string | null;
  status: JobStatus;
  created_at: string;
  matchCount: number;
  unlockCount: number;
}

export type JobStatusFilter = "all" | JobStatus;

export function countByJobId(rows: { job_id: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.job_id, (counts.get(row.job_id) ?? 0) + 1);
  }
  return counts;
}

export function toEmployerJobListItems(
  jobs: Array<
    Pick<
      Job,
      | "id"
      | "title"
      | "location"
      | "department"
      | "employment_type"
      | "status"
      | "created_at"
    >
  >,
  matchCounts: Map<string, number>,
  unlockCounts: Map<string, number>
): EmployerJobListItem[] {
  return jobs.map((job) => ({
    id: job.id,
    title: job.title,
    location: job.location,
    department: job.department,
    employment_type: job.employment_type,
    status: job.status,
    created_at: job.created_at,
    matchCount: matchCounts.get(job.id) ?? 0,
    unlockCount: unlockCounts.get(job.id) ?? 0,
  }));
}

export function jobPrimaryHref(job: Pick<EmployerJobListItem, "id" | "status">): string {
  if (job.status === "draft") return `/employer/jobs/${job.id}`;
  return `/employer/jobs/${job.id}/view`;
}

export function jobSearchText(job: EmployerJobListItem): string {
  return [job.title, job.location, job.department, job.employment_type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function statusFilterCounts(jobs: EmployerJobListItem[]) {
  return {
    all: jobs.length,
    active: jobs.filter((job) => job.status === "active").length,
    draft: jobs.filter((job) => job.status === "draft").length,
    closed: jobs.filter((job) => job.status === "closed").length,
  };
}
