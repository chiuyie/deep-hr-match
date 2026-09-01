import { requireRole, getCandidateProfile, ensureCandidateProfile } from "@/lib/auth/session";
import { CandidateLayoutShell } from "@/components/layout/candidate-layout-shell";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("candidate");
  const existing = await getCandidateProfile(user.id);
  if (!existing) {
    await ensureCandidateProfile(user.id);
  }

  return <CandidateLayoutShell userName={user.name}>{children}</CandidateLayoutShell>;
}
