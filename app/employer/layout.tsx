import { requireRole, ensureEmployerProfile } from "@/lib/auth/session";

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("employer");
  await ensureEmployerProfile(user.id);
  return children;
}
