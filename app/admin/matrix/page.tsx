import { MatrixAdminEditor, type MatrixAdminCategory } from "@/components/admin/matrix-admin-editor";
import { MATRIX_CATEGORY_TREE_SELECT, pickPrimaryMatrixCategory } from "@/lib/matching/matrix-queries";
import { createClient } from "@/lib/supabase/server";

export default async function AdminMatrixPage() {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("matrix_categories")
    .select(MATRIX_CATEGORY_TREE_SELECT)
    .order("sort_order");

  if (error) {
    throw new Error(`Could not load matrix form: ${error.message}`);
  }

  const sorted: MatrixAdminCategory[] = (categories ?? []).map((cat) => ({
    ...cat,
    matrix_questions: (cat.matrix_questions ?? []).map((q) => ({
      ...q,
      matrix_options: q.matrix_options ?? [],
    })),
  }));

  const primary = pickPrimaryMatrixCategory(sorted);

  return <MatrixAdminEditor category={primary ?? null} />;
}
