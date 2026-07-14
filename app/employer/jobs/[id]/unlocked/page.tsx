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
import { getUnlockedCandidateDetails } from "@/lib/auth/unlock";

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

  const unlockedDetails = [];
  for (const u of unlocks ?? []) {
    try {
      const details = await getUnlockedCandidateDetails(
        employer!.id,
        jobId,
        u.candidate_id
      );
      unlockedDetails.push({ ...details, unlocked_at: u.unlocked_at });
    } catch {
      // skip if access denied
    }
  }

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
          {unlockedDetails.map(({ profile, cvDownloadUrl, matchResult, unlocked_at }) => (
            <UnlockedCandidateCard
              key={profile?.id}
              fullName={profile?.full_name}
              email={profile?.email}
              phone={profile?.phone}
              yearsOfExperience={profile?.years_of_experience}
              skills={profile?.skills}
              matchScore={matchResult?.overall_score != null ? Number(matchResult.overall_score) : null}
              isPlaceholder={matchResult?.is_placeholder}
              unlockedAt={unlocked_at}
              cvDownloadUrl={cvDownloadUrl}
            />
          ))}
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
