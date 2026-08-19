import { requireRole, getCandidateProfile, ensureCandidateProfile } from "@/lib/auth/session";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("candidate");
  // Only create profile if it doesn't exist in the session cache (rare first-time path)
  const existing = await getCandidateProfile(user.id);
  if (!existing) {
    await ensureCandidateProfile(user.id);
  }

  return children;
}
