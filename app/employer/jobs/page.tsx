import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmployerEmptyState, EmployerPageSection } from "@/components/employer/employer-ui";
import { EmployerJobsList } from "@/components/employer/employer-jobs-list";
import { requireRole } from "@/lib/auth/session";
import { countByJobId, toEmployerJobListItems } from "@/lib/employer/job-list";
import { createClient } from "@/lib/supabase/server";

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

  const jobListItems = toEmployerJobListItems(
    jobs ?? [],
    countByJobId(matchRows ?? []),
    countByJobId(unlockRows ?? [])
  );

  return (
    <EmployerPageSection
      title="Your Jobs"
      description="Track postings, matching activity, and unlocked candidates in one place"
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
      {!jobListItems.length ? (
        <EmployerEmptyState
          icon={Briefcase}
          title="No jobs yet"
          description="Post your first role to start matching with qualified candidates."
          actionLabel="Create your first job"
          actionHref="/employer/jobs/new"
          gradient="from-emerald-500 to-emerald-600"
        />
      ) : (
        <EmployerJobsList jobs={jobListItems} />
      )}
    </EmployerPageSection>
  );
}
