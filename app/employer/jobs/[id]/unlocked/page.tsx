import Link from "next/link";
import { notFound } from "next/navigation";
import { Target, Unlock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmployerEmptyState,
  EmployerJobContext,
  EmployerPageSection,
} from "@/components/employer/employer-ui";
import { JobWorkflowNav } from "@/components/employer/job-workflow-nav";
import { MatchFlowNotice } from "@/components/employer/match-flow-ui";
import { UnlockedCandidateCard } from "@/components/employer/unlocked-candidate-card";
import { UnlockPaymentPendingNotice } from "@/components/employer/unlock-payment-pending-notice";
import { requireEmployer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getUnlockedCandidateDetailsBatch } from "@/lib/auth/unlock";
import {
  getCandidateFieldDisplayValue,
  isUnlockedContactFieldVisible,
} from "@/lib/employer/match-disclosure";
import {
  loadPlatformDisclosureMap,
  shouldShowUnlockedPlatformItem,
} from "@/lib/employer/platform-disclosure";
import { loadFormFields } from "@/lib/form-fields/queries";
import { ensureUnlocksForCheckoutSession } from "@/lib/payments/ensure-checkout-unlocks";

export default async function JobUnlockedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { id: jobId } = await params;
  const { session_id } = await searchParams;
  const { profile: employer } = await requireEmployer();
  if (!employer) notFound();
  const supabase = await createClient();

  let checkoutNotice: string | undefined;
  let checkoutPending = false;
  if (session_id) {
    const ensured = await ensureUnlocksForCheckoutSession(supabase, {
      employerId: employer.id,
      jobId,
      sessionId: session_id,
    });
    checkoutPending = !ensured.ready;
    checkoutNotice = ensured.error;
  }

  const [{ data: job }, { data: unlocks }, candidateFields, platformDisclosure] = await Promise.all([
    supabase
      .from("jobs")
      .select("title, status")
      .eq("id", jobId)
      .eq("employer_id", employer.id)
      .single(),
    supabase
      .from("unlocks")
      .select("candidate_id, unlocked_at")
      .eq("employer_id", employer.id)
      .eq("job_id", jobId)
      .order("unlocked_at", { ascending: false }),
    loadFormFields({ audience: "candidate", formGroup: "profile", includeInactive: false }),
    loadPlatformDisclosureMap(),
  ]);

  if (!job) notFound();

  const unlockOrder = unlocks ?? [];
  const details = await getUnlockedCandidateDetailsBatch(
    employer.id,
    jobId,
    unlockOrder.map((unlock) => unlock.candidate_id)
  );
  const detailsMap = new Map(details.map((item) => [item.candidateId, item]));
  const unlockedDetails = unlockOrder
    .map((unlock) => {
      const detail = detailsMap.get(unlock.candidate_id);
      if (!detail) return null;
      return { ...detail, unlocked_at: unlock.unlocked_at };
    })
    .filter(Boolean);

  const showName = isUnlockedContactFieldVisible(candidateFields, "full_name");
  const showEmail = isUnlockedContactFieldVisible(candidateFields, "email");
  const showPhone = isUnlockedContactFieldVisible(candidateFields, "phone");
  const experienceField = candidateFields.find((field) => field.field_key === "years_of_experience");
  const skillsField = candidateFields.find((field) => field.field_key === "skills");
  const showExperience = experienceField
    ? experienceField.employer_disclosure_mode !== "admin_removed"
    : true;
  const showSkills = skillsField
    ? skillsField.employer_disclosure_mode !== "admin_removed"
    : true;
  const showMatchScore = shouldShowUnlockedPlatformItem(platformDisclosure, "match_score");
  const showCv = shouldShowUnlockedPlatformItem(platformDisclosure, "candidate_cv");

  return (
    <>
      <EmployerJobContext
        jobTitle={job.title}
        jobId={jobId}
        description="Purchased profiles with contact details, CV, and full match reports"
      />
      <JobWorkflowNav jobId={jobId} currentStep="unlocked" canEdit={job.status === "draft"} />

      {session_id && unlockedDetails.length > 0 ? (
        <MatchFlowNotice tone="success" title="Payment successful">
          Candidate profiles are unlocked and ready to review below. Open a full report to contact
          them and review the 7^7 match.
        </MatchFlowNotice>
      ) : null}

      <UnlockPaymentPendingNotice
        active={Boolean(session_id) && (checkoutPending || unlockedDetails.length === 0)}
        message={checkoutNotice}
      />

      {!unlockedDetails.length ? (
        <EmployerPageSection
          title="Unlocked Candidates"
          description="Profiles you purchase for this job appear here"
          icon={<Users className="h-6 w-6" />}
          gradient="from-emerald-500 to-teal-600"
          className="border-slate-200/70 shadow-[0_22px_50px_-36px_rgba(15,23,42,0.45)]"
        >
          <EmployerEmptyState
            icon={Users}
            title={session_id ? "Unlocking profiles…" : "No unlocked candidates yet"}
            description={
              session_id
                ? "Your payment went through. Profiles appear here as soon as unlock finishes."
                : "Go to matching results, select candidates that fit, then unlock to reveal full profiles."
            }
            actionLabel="Go to matching results"
            actionHref={`/employer/jobs/${jobId}/matching`}
            gradient="from-emerald-500 to-emerald-600"
          />
        </EmployerPageSection>
      ) : (
        <EmployerPageSection
          title="Unlocked Candidates"
          description={`${unlockedDetails.length} profile${unlockedDetails.length === 1 ? "" : "s"} ready to review for this job`}
          icon={<Unlock className="h-6 w-6" />}
          gradient="from-emerald-500 to-teal-600"
          className="border-slate-200/70 shadow-[0_22px_50px_-36px_rgba(15,23,42,0.45)]"
          action={
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100"
              asChild
            >
              <Link href={`/employer/jobs/${jobId}/matching`}>
                <Target className="mr-1.5 h-3.5 w-3.5" />
                Find more matches
              </Link>
            </Button>
          }
        >
          <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            Contact details and CVs are available on each card. Open{" "}
            <span className="font-semibold text-slate-800">Full report</span> for the complete 7^7
            match breakdown.
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {unlockedDetails.map(
              ({ candidateId, profile, cvDownloadUrl, matchResult, unlocked_at }) => {
                const profileRecord =
                  (profile as unknown as Record<string, unknown> | null) ?? null;
                const experienceValue = experienceField
                  ? getCandidateFieldDisplayValue(experienceField, profileRecord)
                  : profile?.years_of_experience != null
                    ? String(profile.years_of_experience)
                    : null;
                const skillsValue = skillsField
                  ? getCandidateFieldDisplayValue(skillsField, profileRecord)
                  : (profile?.skills?.join(", ") ?? null);

                return (
                  <UnlockedCandidateCard
                    key={candidateId}
                    candidateId={candidateId}
                    fullName={showName ? profile?.full_name : "Candidate"}
                    email={showEmail ? profile?.email : null}
                    phone={showPhone ? profile?.phone : null}
                    yearsOfExperience={
                      showExperience && experienceValue?.trim() ? experienceValue : null
                    }
                    skills={
                      showSkills
                        ? Array.isArray(profile?.skills)
                          ? profile.skills
                          : skillsValue
                            ? skillsValue
                                .split(",")
                                .map((item) => item.trim())
                                .filter(Boolean)
                            : null
                        : null
                    }
                    matchScore={
                      showMatchScore && matchResult?.overall_score != null
                        ? Number(matchResult.overall_score)
                        : null
                    }
                    isPlaceholder={matchResult?.is_placeholder}
                    unlockedAt={unlocked_at}
                    cvDownloadUrl={showCv ? cvDownloadUrl : null}
                    jobId={jobId}
                  />
                );
              }
            )}
          </div>
        </EmployerPageSection>
      )}
    </>
  );
}
