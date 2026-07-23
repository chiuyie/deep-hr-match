import { requireRole } from "@/lib/auth/session";
import { saveJob } from "@/lib/employer/actions";
import { JobCreationForm } from "@/components/forms/job-creation/job-creation-form";
import { ensureFormFieldsReady, loadFormFields } from "@/lib/form-fields/queries";
import { createClient } from "@/lib/supabase/server";
import { filterSharedMatrixCategories } from "@/lib/matching/matrix-form";
import { MATRIX_CATEGORY_TREE_SELECT } from "@/lib/matching/matrix-queries";

export default async function NewJobPage() {
  await requireRole("employer");
  await ensureFormFieldsReady();
  const supabase = await createClient();
  const [jobFields, { data: categories }] = await Promise.all([
    loadFormFields({ audience: "employer", formGroup: "job" }),
    supabase
      .from("matrix_categories")
      .select(MATRIX_CATEGORY_TREE_SELECT)
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const matrixCategories = filterSharedMatrixCategories(categories ?? []);

  return (
    <JobCreationForm
      action={saveJob}
      jobFields={jobFields}
      matrixCategories={matrixCategories}
    />
  );
}
