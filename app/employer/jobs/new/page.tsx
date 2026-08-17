import { requireRole } from "@/lib/auth/session";
import { saveJob } from "@/lib/employer/actions";
import { JobCreationForm } from "@/components/forms/job-creation/job-creation-form";
import { loadFormFields } from "@/lib/form-fields/queries";
import { createClient } from "@/lib/supabase/server";
import { filterSharedMatrixCategories } from "@/lib/matching/matrix-form";
import { loadPrimaryMatrixCategoryTree } from "@/lib/matching/matrix-queries";

export default async function NewJobPage() {
  const supabase = await createClient();

  const [, jobFields, primaryCategory] = await Promise.all([
    requireRole("employer"),
    loadFormFields({ audience: "employer", formGroup: "job" }),
    loadPrimaryMatrixCategoryTree(supabase),
  ]);

  const matrixCategories = filterSharedMatrixCategories(primaryCategory ? [primaryCategory] : []);

  return (
    <JobCreationForm
      action={saveJob}
      jobFields={jobFields}
      matrixCategories={matrixCategories}
    />
  );
}
