import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Unlock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmployerEmptyState,
  EmployerJobContext,
  EmployerPageSection,
} from "@/components/employer/employer-ui";
import { JobWorkflowNav } from "@/components/employer/job-workflow-nav";
import { UnlockedCandidateCard } from "@/components/employer/unlocked-candidate-card";
import { requireRole } from "@/lib/auth/session";
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
  const user = await requireRole("employer");
  const supabase = await createClient();

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: job } = await supabase
    .from("jobs")
    .select("title, status")
    .eq("id", jobId)
    .eq("employer_id", employer?.id ?? "")
    .single();

  if (!job) notFound();

  const { data: unlocks } = await supabase
    .from("unlocks")
    .select("candidate_id, unlocked_at")
    .eq("employer_id", employer?.id ?? "")
    .eq("job_id", jobId)
    .order("unlocked_at", { ascending: false });

  const unlockOrder = unlocks ?? [];
  await ensureFormFieldsReady();
  const [details, candidateFields, platformDisclosure] = await Promise.all([
    getUnlockedCandidateDetailsBatch(
      employer!.id,
      jobId,
      unlockOrder.map((unlock) => unlock.candidate_id)
    ),
    loadFormFields({ audience: "candidate", formGroup: "profile", includeInactive: false }),
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
        <EmployerPageSection
          title="Payment successful"
          description="Candidate profiles are now unlocked and ready to review"
          icon={<Unlock className="h-6 w-6" />}
          gradient="from-emerald-500 to-emerald-600"
          className="mb-6 !p-5"
        >
          <p className="text-sm text-emerald-800">
            Your unlock purchase was completed. View the candidate details below.
          </p>
        </EmployerPageSection>
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
        <div className="space-y-4">
          {unlockedDetails.map(({ profile, cvDownloadUrl, matchResult, unlocked_at }) => {
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
              key={profile?.id}
              candidateId={profile?.id}
              fullName={showName ? profile?.full_name : "Candidate"}
              email={showEmail ? profile?.email : null}
              phone={showPhone ? profile?.phone : null}
              yearsOfExperience={
                showExperience && experienceValue != null && experienceValue !== ""
                  ? Number(experienceValue) || null
                  : null
              }
              skills={
                showSkills && skillsValue
                  ? skillsValue.split(",").map((item) => item.trim()).filter(Boolean)
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
      )}

      <Button variant="outline" className="mt-6 rounded-xl" asChild>
        <Link href={`/employer/jobs/${jobId}/matching`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Matching Results
        </Link>
      </Button>
    </>
  );
}
