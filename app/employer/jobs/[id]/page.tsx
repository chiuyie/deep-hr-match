import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { JobCreationForm } from "@/components/forms/job-creation/job-creation-form";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { saveJob } from "@/lib/employer/actions";
import { jobRecordToFormState } from "@/lib/utils/job-form";
import { FRAMEWORK } from "@/lib/constants/branding";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  async function updateJob(formData: FormData) {
    "use server";
    await saveJob(formData, id);
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/employer/jobs/${id}/jd`}>JD Upload</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/employer/jobs/${id}/matrix`}>{FRAMEWORK} Form</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href={`/employer/jobs/${id}/matching`}>Matching Results</Link>
        </Button>
      </div>
      <JobCreationForm
        initialValues={jobRecordToFormState(job)}
        submitLabel="Save Job"
        action={updateJob}
      />
    </>
  );
}
