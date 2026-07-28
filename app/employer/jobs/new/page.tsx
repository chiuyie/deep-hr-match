import { requireRole } from "@/lib/auth/session";
import { saveJob } from "@/lib/employer/actions";
import { JobCreationForm } from "@/components/forms/job-creation/job-creation-form";
import { ensureFormFieldsReady, loadFormFields } from "@/lib/form-fields/queries";
import { createClient } from "@/lib/supabase/server";
import { filterSharedMatrixCategories } from "@/lib/matching/matrix-form";
import { loadPrimaryMatrixCategoryTree } from "@/lib/matching/matrix-queries";
import type { MatrixCategoryWithQuestions } from "@/lib/matching/matrix-form";

export default async function NewJobPage() {
  const supabase = await createClient();
  await Promise.all([requireRole("employer"), ensureFormFieldsReady()]);

  const [jobFields, primaryCategory] = await Promise.all([
    loadFormFields({ audience: "employer", formGroup: "job" }),
    loadPrimaryMatrixCategoryTree(supabase),
  ]);

  const matrixCategories = filterSharedMatrixCategories(
    (primaryCategory ? [primaryCategory] : []) as MatrixCategoryWithQuestions[]
  );

  return (
    <JobCreationForm
      action={saveJob}
      jobFields={jobFields}
      matrixCategories={matrixCategories}
    />
  );
}
