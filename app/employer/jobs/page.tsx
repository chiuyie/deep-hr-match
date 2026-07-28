import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmployerEmptyState, EmployerPageSection } from "@/components/employer/employer-ui";
import { EmployerJobsList } from "@/components/employer/employer-jobs-list";
import { requireEmployer } from "@/lib/auth/session";
import { loadEmployerJobsList } from "@/lib/employer/list-queries";

export default async function EmployerJobsPage() {
  const { profile: employer } = await requireEmployer();
  const jobListItems = await loadEmployerJobsList(employer?.id ?? "");

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
