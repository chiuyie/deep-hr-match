import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CandidateCvManager } from "@/components/candidate/candidate-cv-manager";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  fetchCandidateOnboardingState,
  getOnboardingPath,
  getOnboardingStep,
} from "@/lib/candidate/onboarding";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { LayoutDashboard } from "lucide-react";
import type { CandidateCvFile } from "@/types/database";
import { cn } from "@/lib/utils";

export default async function CandidateCVPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const user = await requireRole("candidate");
  const supabase = await createClient();
  const params = await searchParams;

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: files } = await supabase
    .from("candidate_cv_files")
    .select("*")
    .eq("candidate_id", profile?.id ?? "")
    .order("uploaded_at", { ascending: false });

  const onboarding = await fetchCandidateOnboardingState(supabase, user.id);
  const onboardingStep = getOnboardingStep(onboarding);
  const showOverviewLink = onboardingStep === "done";

  let continueHref: string | undefined;
  let continueLabel: string | undefined;
  if (onboarding.hasCv && onboardingStep === "matrix") {
    continueHref = getOnboardingPath("matrix");
    continueLabel = `Continue to ${FRAMEWORK_MATCHING_LANGUAGE}`;
  } else if (onboarding.hasCv && onboardingStep === "done") {
    continueHref = "/candidate";
    continueLabel = "Back to overview";
  }

  const cvFiles = (files ?? []) as CandidateCvFile[];

  return (
    <DashboardShell
      role="candidate"
      userName={user.name}
      title="CV / Résumé"
      description="Upload, replace, or download the CV employers receive after unlock"
    >
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Onboarding path" className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
              1 · Profile
            </span>
            <span className="text-slate-300">→</span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                onboardingStep === "cv" || onboardingStep === "matrix" || onboardingStep === "done"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-500"
              )}
            >
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

        <CandidateCvManager
          files={cvFiles}
          continueHref={continueHref}
          continueLabel={continueLabel}
          showProfileComplete={params.step === "profile-complete"}
          redirectOnFirstUpload={onboardingStep === "cv"}
        />
      </div>
    </DashboardShell>
  );
}
