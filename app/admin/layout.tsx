import { requireAdmin } from "@/lib/auth/session";
import { AdminLayoutShell } from "@/components/layout/admin-layout-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return <AdminLayoutShell userName={user.name}>{children}</AdminLayoutShell>;
}
