import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CandidateProfileForm } from "@/components/candidate/candidate-profile-form";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loadFormFields, ensureFormFieldsReady, loadFormSectionTitles } from "@/lib/form-fields/queries";
import { groupCandidateProfileFields } from "@/lib/candidate/profile-sections";
import {
  fetchCandidateOnboardingState,
  getOnboardingPath,
  getOnboardingStep,
} from "@/lib/candidate/onboarding";
import { getProfileCompletionDetails } from "@/lib/utils/profile";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { LayoutDashboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function CandidateProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; error?: string; saved?: string; completion?: string }>;
}) {
  const user = await requireRole("candidate");
  const supabase = await createClient();
  const params = await searchParams;

  await ensureFormFieldsReady();
  const [fields, sectionOrder] = await Promise.all([
    loadFormFields({ audience: "candidate", formGroup: "profile" }),
    loadFormSectionTitles("candidate", "profile"),
  ]);

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const p = profile ?? {};
  const onboarding = await fetchCandidateOnboardingState(supabase, user.id);
  const onboardingStep = getOnboardingStep(onboarding);
  const isOnboardingProfileStep = onboardingStep === "profile";

  const completion = getProfileCompletionDetails(p as never);
  const completionPct =
    params.completion && params.error === "profile-incomplete"
      ? Number(params.completion) || completion.percentage
      : profile?.completion_percentage ?? completion.percentage;

  const sections = groupCandidateProfileFields(fields, sectionOrder).map((section) => ({
    title: section.title,
    description: section.description,
    fields: section.fields,
  }));

  let continueHref: string | undefined;
  let continueLabel: string | undefined;
  if (!isOnboardingProfileStep && onboardingStep !== "done") {
    continueHref = getOnboardingPath(onboardingStep);
    if (onboardingStep === "cv") continueLabel = "Continue to CV upload";
    if (onboardingStep === "matrix") continueLabel = `Continue to ${FRAMEWORK_MATCHING_LANGUAGE}`;
  }

  const showOverviewLink = onboardingStep === "done";

  return (
    <DashboardShell
      role="candidate"
      userName={user.name}
      title="Profile"
      description="Build your match-ready profile, one page at a time"
    >
      <div className="mx-auto max-w-3xl space-y-5">
        {params.welcome === "1" ? (
          <Alert className="border-sky-200 bg-sky-50 text-sky-950">
            <Sparkles />
            <AlertTitle>Welcome — let&apos;s get you match-ready</AlertTitle>
            <AlertDescription>
              This takes about 5–10 minutes across a few short pages. Next: upload your CV, then
              complete the {FRAMEWORK_MATCHING_LANGUAGE} questionnaire.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Onboarding path" className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-sky-600 px-2.5 py-0.5 text-xs font-semibold text-white">
              1 · Profile
            </span>
            <span className="text-slate-300">→</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
              2 · CV
            </span>
            <span className="text-slate-300">→</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
              3 · {FRAMEWORK_MATCHING_LANGUAGE}
            </span>
          </nav>
          {showOverviewLink ? (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-slate-500" asChild>
              <Link href="/candidate">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Overview
              </Link>
            </Button>
          ) : null}
        </div>

        <CandidateProfileForm
          values={p}
          sections={sections}
          completionPercentage={completionPct}
          missingFieldLabels={completion.missingFields.map((f) => f.label)}
          isOnboardingProfileStep={isOnboardingProfileStep}
          continueHref={continueHref}
          continueLabel={continueLabel}
          showSavedDraft={params.saved === "draft"}
          showIncompleteError={params.error === "profile-incomplete"}
        />
      </div>
    </DashboardShell>
  );
}
