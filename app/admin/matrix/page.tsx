import { MatrixAdminEditor, type MatrixAdminCategory } from "@/components/admin/matrix-admin-editor";
import { loadPrimaryMatrixCategoryTree } from "@/lib/matching/matrix-queries";
import { createClient } from "@/lib/supabase/server";

export default async function AdminMatrixPage() {
  const supabase = await createClient();
  const primary = await loadPrimaryMatrixCategoryTree<MatrixAdminCategory>(supabase);

  return <MatrixAdminEditor category={primary} />;
}
