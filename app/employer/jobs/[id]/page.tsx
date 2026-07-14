import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { JobCreationForm } from "@/components/forms/job-creation/job-creation-form";
import { EmployerJobContext } from "@/components/employer/employer-ui";
import { JobWorkflowNav } from "@/components/employer/job-workflow-nav";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { saveJob } from "@/lib/employer/actions";
import { canEditJob } from "@/lib/employer/job-rules";
import { jobRecordToFormState } from "@/lib/utils/job-form";

export default async function EditJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ matrix?: string }>;
}) {
  const { id } = await params;
  const { matrix } = await searchParams;
  const user = await requireRole("employer");
  const supabase = await createClient();

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("employer_id", employer?.id ?? "")
    .single();

  if (!job) notFound();

  const [{ count: matchCount }, { count: unlockCount }] = await Promise.all([
    supabase
      .from("match_results")
      .select("*", { count: "exact", head: true })
      .eq("job_id", id),
    supabase
      .from("unlocks")
      .select("*", { count: "exact", head: true })
      .eq("job_id", id)
      .eq("employer_id", employer?.id ?? ""),
  ]);

  const lifecycle = {
    status: job.status,
    hasMatches: (matchCount ?? 0) > 0,
    hasUnlocks: (unlockCount ?? 0) > 0,
  };

  if (!canEditJob(lifecycle)) {
    redirect(`/employer/jobs/${id}/view`);
  }

  async function updateJob(formData: FormData) {
    "use server";
    await saveJob(formData, id);
  }

  return (
    <>
      <EmployerJobContext
        jobTitle={job.title}
        jobId={id}
        description="Update draft job details before publishing and generating matches"
      />
      <JobWorkflowNav jobId={id} currentStep="edit" canEdit />
      {matrix === "complete" && (
        <Alert className="mb-6 border-emerald-200 bg-emerald-50 text-emerald-900">
          <CheckCircle2 />
          <AlertTitle>{FRAMEWORK_MATCHING_LANGUAGE} saved</AlertTitle>
          <AlertDescription>
            Your matching questionnaire is complete. Review the job details below and post the job
            when you are ready to generate matches.
          </AlertDescription>
        </Alert>
      )}
      <JobCreationForm
        initialValues={jobRecordToFormState(job)}
        submitLabel="Save Job"
        action={updateJob}
      />
    </>
  );
}
