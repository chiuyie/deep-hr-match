import { requireRole, ensureCandidateProfile } from "@/lib/auth/session";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("candidate");
  await ensureCandidateProfile(user.id);

  return children;
}
