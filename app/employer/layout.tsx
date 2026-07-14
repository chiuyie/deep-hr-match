import { requireRole, ensureEmployerProfile } from "@/lib/auth/session";
import { EmployerLayoutShell } from "@/components/layout/employer-layout-shell";

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("employer");
  await ensureEmployerProfile(user.id);

  return <EmployerLayoutShell userName={user.name}>{children}</EmployerLayoutShell>;
}
