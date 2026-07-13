import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole, ensureCandidateProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  fetchCandidateOnboardingState,
  getOnboardingPath,
  getOnboardingStep,
  isOnboardingPathAllowed,
} from "@/lib/candidate/onboarding";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("candidate");
  await ensureCandidateProfile(user.id);

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (pathname.startsWith("/candidate")) {
    const supabase = await createClient();
    const onboarding = await fetchCandidateOnboardingState(supabase, user.id);
    const step = getOnboardingStep(onboarding);

    if (!isOnboardingPathAllowed(pathname, step)) {
      redirect(getOnboardingPath(step));
    }
  }

  return children;
}
