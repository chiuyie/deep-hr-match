import { requireRole } from "@/lib/auth/session";
import { saveJob } from "@/lib/employer/actions";
import { JobCreationForm } from "@/components/forms/job-creation/job-creation-form";

export default async function NewJobPage() {
  await requireRole("employer");

  return <JobCreationForm action={saveJob} />;
}
