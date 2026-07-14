import { notFound } from "next/navigation";
import { FileUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmployerEmptyState,
  EmployerJobContext,
  EmployerPageSection,
  employerInputClassName,
} from "@/components/employer/employer-ui";
import { JobWorkflowNav } from "@/components/employer/job-workflow-nav";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { uploadJobJD } from "@/lib/employer/actions";
import { formatDate } from "@/lib/utils/profile";

export default async function JobJDPage({
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
    .select("title, status")
    .eq("id", id)
    .eq("employer_id", employer?.id ?? "")
    .single();

  if (!job) notFound();

  const { data: files } = await supabase
    .from("job_jd_files")
    .select("*")
    .eq("job_id", id)
    .order("uploaded_at", { ascending: false });

  async function upload(formData: FormData) {
    "use server";
    await uploadJobJD(formData, id);
  }

  return (
    <>
      <EmployerJobContext
        jobTitle={job.title}
        jobId={id}
        description="Upload the job description document for this role"
      />
      <JobWorkflowNav jobId={id} currentStep="jd" canEdit={job.status === "draft"} />

      <EmployerPageSection
        title="Upload Job Description"
        description="Accepted formats: PDF, DOC, DOCX"
        icon={<FileUp className="h-6 w-6" />}
        gradient="from-blue-500 to-blue-600"
      >
        <form action={upload} className="space-y-4">
          <input
            type="file"
            name="file"
            accept=".pdf,.doc,.docx"
            required
            className={employerInputClassName}
          />
          <Button type="submit" className="rounded-xl">
            Upload JD
          </Button>
        </form>
      </EmployerPageSection>

      <EmployerPageSection
        title="Uploaded Files"
        description="Previously uploaded documents for this job"
        icon={<FileText className="h-6 w-6" />}
        gradient="from-slate-500 to-slate-600"
        className="mt-6"
      >
        {!files?.length ? (
          <EmployerEmptyState
            icon={FileText}
            title="No files uploaded"
            description="Upload a job description document to keep everything in one place."
            gradient="from-blue-500 to-blue-600"
          />
        ) : (
          <ul className="space-y-3">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm"
              >
                <span className="font-medium text-slate-800">{f.file_name}</span>
                <span className="shrink-0 text-slate-500">{formatDate(f.uploaded_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </EmployerPageSection>
    </>
  );
}
