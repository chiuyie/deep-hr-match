import Link from "next/link";
import { AlertCircle, CheckCircle2, CircleAlert } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { markCandidateReady } from "@/lib/candidate/actions";
import { statusLabel } from "@/lib/utils/profile";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import {
  fetchCandidateOnboardingState,
  isOnboardingChecklistComplete,
} from "@/lib/candidate/onboarding";

const statusMessages = {
  profile: {
    title: "Profile not complete enough",
    description:
      "Complete at least 60% of your profile before marking yourself ready for matching.",
    href: "/candidate/profile",
    action: "Complete profile",
  },
  cv: {
    title: "CV required",
    description: "Upload your CV before marking yourself ready for matching.",
    href: "/candidate/cv",
    action: "Upload CV",
  },
  matrix: {
    title: `${FRAMEWORK_MATCHING_LANGUAGE} required`,
    description: `Complete the ${FRAMEWORK_MATCHING_LANGUAGE} form before marking yourself ready for matching.`,
    href: "/candidate/matrix",
    action: "Complete form",
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

  const checks = [
    {
      label: "Profile details (60%+ complete)",
      done: onboarding.completionPercentage >= 60,
      href: "/candidate/profile",
    },
    {
      label: "CV uploaded",
      done: onboarding.hasCv,
      href: "/candidate/cv",
    },
    {
      label: `${FRAMEWORK_MATCHING_LANGUAGE} completed`,
      done: onboarding.hasMatrix,
      href: "/candidate/matrix",
    },
  ];

  const errorKey = params.error as keyof typeof statusMessages | undefined;
  const errorMessage = errorKey ? statusMessages[errorKey] : null;

  return (
    <DashboardShell
      role="candidate"
      userName={user.name}
      title="Profile Status"
      description="Review your matching readiness checklist"
    >
      <div className="space-y-4">
        {params.success === "ready" && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
            <CheckCircle2 />
            <AlertTitle>You're ready for matching</AlertTitle>
            <AlertDescription>
              Employers can now find you in matching results. You'll be contacted outside the
              platform when an employer unlocks your profile.
            </AlertDescription>
          </Alert>
        )}

        {params.matrix === "complete" && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
            <CheckCircle2 />
            <AlertTitle>{FRAMEWORK_MATCHING_LANGUAGE} complete</AlertTitle>
            <AlertDescription>
              {checklistComplete && profile?.status !== "ready_for_matching"
                ? "You have finished every onboarding step. Mark your profile ready below when you want to appear in employer matching results."
                : "Your matching language responses are saved."}
            </AlertDescription>
          </Alert>
        )}

        {params.prompt === "ready" && checklistComplete && profile?.status !== "ready_for_matching" && (
          <Alert>
            <CircleAlert />
            <AlertTitle>Almost there</AlertTitle>
            <AlertDescription>
              You've completed every onboarding step. Mark your profile ready when you want to
              appear in employer matching results.
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
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
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              Current Status
              <Badge>{statusLabel(profile?.status ?? "draft")}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {checks.map((check) => (
                <li
                  key={check.label}
                  className="flex items-center justify-between gap-4 rounded border p-3"
                >
                  <span>{check.label}</span>
                  <div className="flex items-center gap-2">
                    {!check.done && (
                      <Button variant="link" size="sm" className="h-auto px-0" asChild>
                        <Link href={check.href}>Complete</Link>
                      </Button>
                    )}
                    <Badge variant={check.done ? "default" : "secondary"}>
                      {check.done ? "Complete" : "Incomplete"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>

            {profile?.status !== "ready_for_matching" && (
              <div className="space-y-2">
                {checklistComplete ? (
                  <form action={markCandidateReady}>
                    <Button type="submit">Mark Ready For Matching</Button>
                  </form>
                ) : (
                  <>
                    <Button type="button" disabled>
                      Mark Ready For Matching
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Complete every checklist item above before marking yourself ready.
                    </p>
                  </>
                )}
              </div>
            )}

            {profile?.status === "ready_for_matching" && (
              <p className="text-sm text-muted-foreground">
                Your profile is visible to employers for matching. You will be contacted outside
                the platform when an employer unlocks your profile.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
