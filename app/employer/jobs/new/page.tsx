import { requireRole } from "@/lib/auth/session";
import { saveJob } from "@/lib/employer/actions";
import { JobCreationForm } from "@/components/forms/job-creation/job-creation-form";
import { ensureFormFieldsReady, loadFormFields } from "@/lib/form-fields/queries";

export default async function NewJobPage() {
  await requireRole("employer");
  await ensureFormFieldsReady();
  const jobFields = await loadFormFields({ audience: "employer", formGroup: "job" });

  return <JobCreationForm action={saveJob} jobFields={jobFields} />;
}
