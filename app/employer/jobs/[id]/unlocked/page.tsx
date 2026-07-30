import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Target, Unlock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EmployerEmptyState,
  EmployerJobContext,
  EmployerPageSection,
} from "@/components/employer/employer-ui";
import { JobWorkflowNav } from "@/components/employer/job-workflow-nav";
import { UnlockedCandidateCard } from "@/components/employer/unlocked-candidate-card";
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
import { ensureFormFieldsReady, loadFormFields } from "@/lib/form-fields/queries";

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
  const supabase = await createClient();

  const [{ data: job }, { data: unlocks }] = await Promise.all([
    supabase
      .from("jobs")
      .select("title, status")
      .eq("id", jobId)
      .eq("employer_id", employer?.id ?? "")
      .single(),
    supabase
      .from("unlocks")
      .select("candidate_id, unlocked_at")
      .eq("employer_id", employer?.id ?? "")
      .eq("job_id", jobId)
      .order("unlocked_at", { ascending: false }),
  ]);

  if (!job) notFound();

  const unlockOrder = unlocks ?? [];
  const [details, candidateFields, platformDisclosure] = await Promise.all([
    getUnlockedCandidateDetailsBatch(
      employer!.id,
      jobId,
      unlockOrder.map((unlock) => unlock.candidate_id)
    ),
    ensureFormFieldsReady().then(() =>
      loadFormFields({ audience: "candidate", formGroup: "profile", includeInactive: false })
    ),
    loadPlatformDisclosureMap(),
  ]);
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
        description="Full candidate profiles unlocked for this job"
      />
      <JobWorkflowNav jobId={jobId} currentStep="unlocked" canEdit={job.status === "draft"} />

      {session_id && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-900">Payment successful</p>
            <p className="mt-0.5 text-sm text-emerald-700">
              Candidate profiles are now unlocked and ready to review below.
            </p>
          </div>
        </div>
      )}

      {!unlockedDetails.length ? (
        <EmployerPageSection
          title="Unlocked Candidates"
          description="Candidates you have purchased for this job"
          icon={<Users className="h-6 w-6" />}
          gradient="from-amber-500 to-amber-600"
        >
          <EmployerEmptyState
            icon={Users}
            title="No unlocked candidates yet"
            description="Generate matches and unlock profiles from the matching results page."
            actionLabel="Go to matching results"
            actionHref={`/employer/jobs/${jobId}/matching`}
            gradient="from-emerald-500 to-emerald-600"
          />
        </EmployerPageSection>
      ) : (
        <EmployerPageSection
          title="Unlocked Candidates"
          description={`${unlockedDetails.length} profile${unlockedDetails.length === 1 ? "" : "s"} unlocked for this job`}
          icon={<Unlock className="h-6 w-6" />}
          gradient="from-emerald-500 to-emerald-600"
          action={
            <Button variant="outline" size="sm" className="rounded-xl" asChild>
              <Link href={`/employer/jobs/${jobId}/matching`}>
                <Target className="mr-1.5 h-3.5 w-3.5" />
                Back to matching
              </Link>
            </Button>
          }
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {unlockedDetails.map(({ candidateId, profile, cvDownloadUrl, matchResult, unlocked_at }) => {
              const profileRecord = (profile as unknown as Record<string, unknown> | null) ?? null;
              const experienceValue = experienceField
                ? getCandidateFieldDisplayValue(experienceField, profileRecord)
                : profile?.years_of_experience != null
                  ? String(profile.years_of_experience)
                  : null;
              const skillsValue = skillsField
                ? getCandidateFieldDisplayValue(skillsField, profileRecord)
                : profile?.skills?.join(", ") ?? null;

              return (
                <UnlockedCandidateCard
                  key={candidateId}
                  candidateId={candidateId}
                  fullName={showName ? profile?.full_name : "Candidate"}
                  email={showEmail ? profile?.email : null}
                  phone={showPhone ? profile?.phone : null}
                  yearsOfExperience={
                    showExperience && experienceValue != null && experienceValue !== ""
                      ? Number(experienceValue) || null
                      : null
                  }
                  skills={
                    showSkills
                      ? Array.isArray(profile?.skills)
                        ? profile.skills
                        : skillsValue
                          ? skillsValue.split(",").map((item) => item.trim()).filter(Boolean)
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
            })}
          </div>
        </EmployerPageSection>
      )}
    </>
  );
}
