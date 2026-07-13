import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  CandidateDashboardView,
  type CandidateDashboardStep,
} from "@/components/candidate/candidate-dashboard-view";
import { requireRole, ensureCandidateProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate, statusLabel } from "@/lib/utils/profile";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import {
  fetchCandidateOnboardingState,
  getOnboardingPath,
  getOnboardingStep,
} from "@/lib/candidate/onboarding";
import { Grid3X3, Upload, User } from "lucide-react";

export default async function CandidateDashboard() {
  const user = await requireRole("candidate");
  await ensureCandidateProfile(user.id);
  const supabase = await createClient();

  const onboarding = await fetchCandidateOnboardingState(supabase, user.id);
  const nextStep = getOnboardingStep(onboarding);

  if (nextStep !== "done") {
    redirect(getOnboardingPath(nextStep));
  }

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { count: cvCount } = await supabase
    .from("candidate_cv_files")
    .select("*", { count: "exact", head: true })
    .eq("candidate_id", profile?.id ?? "");

  const { count: matrixCount } = await supabase
    .from("candidate_matrix_answers")
    .select("*", { count: "exact", head: true })
    .eq("candidate_id", profile?.id ?? "");

  const hasCv = (cvCount ?? 0) > 0;
  const hasMatrix = (matrixCount ?? 0) > 0;
  const isReady = profile?.status === "ready_for_matching";

  const steps: CandidateDashboardStep[] = [
    {
      id: "profile",
      label: "Complete your profile",
      description:
        "Add your experience, skills, and work preferences so employers understand your background.",
      done: (profile?.completion_percentage ?? 0) >= 60,
      href: "/candidate/profile",
      icon: User,
    },
    {
      id: "cv",
      label: "Upload your CV",
      description: "Share your résumé for employers to review once they unlock your profile.",
      done: hasCv,
      href: "/candidate/cv",
      icon: Upload,
    },
    {
      id: "matrix",
      label: `Complete ${FRAMEWORK_MATCHING_LANGUAGE}`,
      description:
        "Answer framework questions that power smarter, longer-lasting job matches.",
      done: hasMatrix,
      href: "/candidate/matrix",
      icon: Grid3X3,
    },
  ];

  return (
    <DashboardShell
      role="candidate"
      userName={user.name}
      title="Dashboard"
      description="Track your progress and get match-ready"
    >
      <CandidateDashboardView
        userName={user.name ?? profile?.full_name}
        completionPercentage={profile?.completion_percentage ?? 0}
        status={profile?.status ?? "draft"}
        statusLabel={statusLabel(profile?.status ?? "draft")}
        lastUpdated={formatDate(profile?.updated_at)}
        isReady={isReady}
        steps={steps}
      />
    </DashboardShell>
  );
}
