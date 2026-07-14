import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MatrixAdminEditor, type MatrixAdminCategory } from "@/components/admin/matrix-admin-editor";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";

export default async function AdminMatrixPage() {
  const user = await requireRole("admin");
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

  return (
    <DashboardShell
      role="admin"
      userName={user.name}
      title={`${FRAMEWORK_MATCHING_LANGUAGE} Editor`}
      description="Edit matching factors, question rounds, and word options"
    >
      <MatrixAdminEditor categories={sorted} />
    </DashboardShell>
  );
}
