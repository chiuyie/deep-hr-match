import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmployerEmptyState, EmployerPageSection } from "@/components/employer/employer-ui";
import { JobRowActions } from "@/components/employer/job-row-actions";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { JobLifecycleState } from "@/lib/employer/job-rules";
import { formatDate } from "@/lib/utils/profile";
import type { JobStatus } from "@/types/database";
export default async function EmployerJobsPage() {
  const user = await requireRole("employer");
  const supabase = await createClient();
  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("employer_id", employer?.id ?? "")
    .order("created_at", { ascending: false });

  const jobIds = jobs?.map((job) => job.id) ?? [];

  const [{ data: matchRows }, { data: unlockRows }] = await Promise.all([
    jobIds.length
      ? supabase.from("match_results").select("job_id").in("job_id", jobIds)
      : Promise.resolve({ data: [] as { job_id: string }[] }),
    jobIds.length
      ? supabase.from("unlocks").select("job_id").in("job_id", jobIds)
      : Promise.resolve({ data: [] as { job_id: string }[] }),
  ]);

  const matchJobIds = new Set((matchRows ?? []).map((row) => row.job_id));
  const unlockJobIds = new Set((unlockRows ?? []).map((row) => row.job_id));

  function lifecycleFor(status: JobStatus, jobId: string): JobLifecycleState {
    return {
      status,
      hasMatches: matchJobIds.has(jobId),
      hasUnlocks: unlockJobIds.has(jobId),
    };
  }

  return (
    <EmployerPageSection
      title="Your Jobs"
      description="Create and manage job postings — unlimited and free"
      icon={<Briefcase className="h-6 w-6" />}
      gradient="from-emerald-500 to-emerald-600"
      action={
        <Button className="rounded-xl" asChild>
          <Link href="/employer/jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Link>
        </Button>
      }
    >
      {!jobs?.length ? (
        <EmployerEmptyState
          icon={Briefcase}
          title="No jobs yet"
          description="Post your first role to start matching with qualified candidates."
          actionLabel="Create your first job"
          actionHref="/employer/jobs/new"
          gradient="from-emerald-500 to-emerald-600"
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{job.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{job.location ?? "No location"}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
                <p className="mt-3 text-xs text-slate-500">Created {formatDate(job.created_at)}</p>
                <div className="mt-4">
                  <JobRowActions
                    jobId={job.id}
                    lifecycle={lifecycleFor(job.status, job.id)}
                    compact
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium text-slate-800">{job.title}</TableCell>
                    <TableCell>{job.location ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={job.status} />
                    </TableCell>
                    <TableCell>{formatDate(job.created_at)}</TableCell>
                    <TableCell>
                      <JobRowActions
                        jobId={job.id}
                        lifecycle={lifecycleFor(job.status, job.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </EmployerPageSection>
  );
}
