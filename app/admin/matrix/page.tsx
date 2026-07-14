import { MatrixAdminEditor, type MatrixAdminCategory } from "@/components/admin/matrix-admin-editor";
import { createClient } from "@/lib/supabase/server";

export default async function AdminMatrixPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("matrix_categories")
    .select("*, matrix_questions(*, matrix_options(*))")
    .order("sort_order");

  const sorted: MatrixAdminCategory[] = (categories ?? []).map((cat) => ({
    ...cat,
    matrix_questions: (cat.matrix_questions ?? []).map((q) => ({
      ...q,
      matrix_options: q.matrix_options ?? [],
    })),
  }));

  return <MatrixAdminEditor categories={sorted} />;
}
