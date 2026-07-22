import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  CircleAlert,
  FileText,
  Grid3X3,
  LayoutDashboard,
  UserRound,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CandidateReadyConsent } from "@/components/candidate/candidate-ready-consent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { statusBadgeClassName, statusLabel } from "@/lib/utils/profile";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import {
  fetchCandidateOnboardingState,
  isOnboardingChecklistComplete,
} from "@/lib/candidate/onboarding";
import { cn } from "@/lib/utils";

const statusMessages = {
  profile: {
    title: "Profile not complete enough",
    description: "Reach at least 60% profile completion before going live for matching.",
    href: "/candidate/profile",
    action: "Open profile",
  },
  cv: {
    title: "CV required",
    description: "Upload your CV before going live for matching.",
    href: "/candidate/cv",
    action: "Upload CV",
  },
  matrix: {
    title: `${FRAMEWORK_MATCHING_LANGUAGE} required`,
    description: `Complete the ${FRAMEWORK_MATCHING_LANGUAGE} form before going live for matching.`,
    href: "/candidate/matrix",
    action: "Open form",
  },
  consent: {
    title: "Confirmation required",
    description: "Tick the agreement box before marking yourself ready for matching.",
    href: "/candidate/status",
    action: "Review agreement",
  },
} as const;

export default async function CandidateStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; prompt?: string; matrix?: string }>;
}) {
  const user = await requireRole("candidate");
  const supabase = await createClient();
  const params = await searchParams;

  const onboarding = await fetchCandidateOnboardingState(supabase, user.id);
  const checklistComplete = isOnboardingChecklistComplete(onboarding);

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const isReady = profile?.status === "ready_for_matching";
  const doneCount = [
    onboarding.completionPercentage >= 60,
    onboarding.hasCv,
    onboarding.hasMatrix,
  ].filter(Boolean).length;

  const checks = [
    {
      label: "Profile details",
      detail: `${onboarding.completionPercentage}% complete · 60% needed`,
      done: onboarding.completionPercentage >= 60,
      href: "/candidate/profile",
      icon: UserRound,
    },
    {
      label: "CV / résumé",
      detail: onboarding.hasCv ? "Uploaded" : "Not uploaded yet",
      done: onboarding.hasCv,
      href: "/candidate/cv",
      icon: FileText,
    },
    {
      label: FRAMEWORK_MATCHING_LANGUAGE,
      detail: onboarding.hasMatrix ? "Submitted" : "Not submitted yet",
      done: onboarding.hasMatrix,
      href: "/candidate/matrix",
      icon: Grid3X3,
    },
  ];

  const errorKey = params.error as keyof typeof statusMessages | undefined;
  const errorMessage = errorKey ? statusMessages[errorKey] : null;

  return (
    <DashboardShell
      role="candidate"
      userName={user.name}
      title="Matching status"
      description="Check what’s done, then go live when you’re ready"
    >
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">Status</span>
            <Badge
              className={cn(
                "rounded-full border font-medium",
                statusBadgeClassName(profile?.status ?? "draft")
              )}
            >
              {statusLabel(profile?.status ?? "draft")}
            </Badge>
          </div>
          {isReady ? (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-slate-500" asChild>
              <Link href="/candidate">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Overview
              </Link>
            </Button>
          ) : null}
        </div>

        {params.success === "ready" || isReady ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
            <CheckCircle2 />
            <AlertTitle>You&apos;re live for matching</AlertTitle>
            <AlertDescription>
              Employers can find you in matching results. If they unlock your profile, they may
              contact you outside this app.
            </AlertDescription>
          </Alert>
        ) : null}

        {params.matrix === "complete" && !isReady ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
            <CheckCircle2 />
            <AlertTitle>{FRAMEWORK_MATCHING_LANGUAGE} saved</AlertTitle>
            <AlertDescription>
              {checklistComplete
                ? "All setup steps are done. Confirm the agreement below to go live for matching."
                : "Your answers are saved. Finish any remaining checklist items, then go live."}
            </AlertDescription>
          </Alert>
        ) : null}

        {params.prompt === "ready" && checklistComplete && !isReady ? (
          <Alert>
            <CircleAlert />
            <AlertTitle>Almost there</AlertTitle>
            <AlertDescription>
              Setup is complete. Confirm the agreement below to appear in employer matching
              results.
            </AlertDescription>
          </Alert>
        ) : null}

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>{errorMessage.title}</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{errorMessage.description}</span>
              <Button variant="outline" size="sm" className="shrink-0 bg-background" asChild>
                <Link href={errorMessage.href}>{errorMessage.action}</Link>
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50/50 px-5 py-5 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-800/70">
              Readiness checklist
            </p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-xl font-semibold text-slate-900">
                {doneCount} of {checks.length} steps done
              </h2>
              {!isReady ? (
                <p className="text-sm text-slate-500">
                  {checklistComplete
                    ? "Ready to confirm and go live"
                    : "Complete the remaining steps first"}
                </p>
              ) : (
                <p className="text-sm text-emerald-700">All set for matching</p>
              )}
            </div>
          </div>

          <ul className="divide-y divide-slate-100">
            {checks.map((check) => {
              const Icon = check.icon;
              return (
                <li
                  key={check.label}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        check.done
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {check.done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{check.label}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{check.detail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    {!check.done ? (
                      <Button variant="secondary" size="sm" className="rounded-lg" asChild>
                        <Link href={check.href}>Complete</Link>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="rounded-lg text-slate-500" asChild>
                        <Link href={check.href}>Review</Link>
                      </Button>
                    )}
                    <Badge
                      variant={check.done ? "default" : "secondary"}
                      className={cn(
                        "rounded-full",
                        check.done && "bg-emerald-600 hover:bg-emerald-600"
                      )}
                    >
                      {check.done ? "Done" : "To do"}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {!isReady ? <CandidateReadyConsent enabled={checklistComplete} /> : null}
      </div>
    </DashboardShell>
  );
}
