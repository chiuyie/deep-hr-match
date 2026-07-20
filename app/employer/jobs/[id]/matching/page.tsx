import { notFound } from "next/navigation";
import { CheckCircle2, Clock, RefreshCw, Target } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmployerJobContext, EmployerPageSection } from "@/components/employer/employer-ui";
import { JobWorkflowNav } from "@/components/employer/job-workflow-nav";
import { MatchingResultsTable } from "@/components/matching/matching-results-table";
import { requireRole, anonymizeCandidateId } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { generateMatchingResults } from "@/lib/employer/actions";
import {
  canEditJob,
  canRunMatching,
  matchingRunButtonLabel,
  refreshMatchingWarning,
  runMatchingBlockedReason,
} from "@/lib/employer/job-rules";
import { getUnlockedCandidateIds } from "@/lib/auth/unlock";
import { MATCH_DISPLAY_LIMIT } from "@/lib/matching/engine";
import { isMockPayments } from "@/lib/payments/mode";
import {
  countNewReadyCandidatesSince,
  getSnapshotGeneratedAt,
  newCandidatesNotice,
} from "@/lib/matching/snapshot";
import { formatDate } from "@/lib/utils/profile";
import type { AnonymousCandidateMatch } from "@/types/database";

export default async function JobMatchingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ matrix?: string }>;
}) {
  const { id } = await params;
  const { matrix } = await searchParams;
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
    .eq("id", id)
    .eq("employer_id", employer?.id ?? "")
    .single();

  if (!job || !employer) notFound();

  const { data: matchResults } = await supabase
    .from("match_results")
    .select("*")
    .eq("job_id", id)
    .order("ranking_position");

  const unlockedIds = await getUnlockedCandidateIds(employer.id, id);

  const lifecycle = {
    status: job.status,
    hasMatches: (matchResults?.length ?? 0) > 0,
    hasUnlocks: unlockedIds.length > 0,
  };

  const canRun = canRunMatching(lifecycle);
  const runBlocked = runMatchingBlockedReason(lifecycle);
  const runLabel = matchingRunButtonLabel(lifecycle);
  const refreshWarning = refreshMatchingWarning(lifecycle);

  const lastMatchedAt = getSnapshotGeneratedAt(matchResults ?? []);
  const newCandidatesSince = lastMatchedAt
    ? await countNewReadyCandidatesSince(supabase, lastMatchedAt)
    : 0;
  const newCandidatesMessage = newCandidatesNotice(newCandidatesSince);

  const candidateIds = matchResults?.map((m) => m.candidate_id) ?? [];
  const { data: candidates } = candidateIds.length
    ? await supabase
        .from("candidate_profiles")
        .select("id, years_of_experience, highest_education, skills")
        .in("id", candidateIds)
    : { data: [] };

  const candidateMap = Object.fromEntries((candidates ?? []).map((c) => [c.id, c]));

  const results: AnonymousCandidateMatch[] = (matchResults ?? []).map((m) => {
    const c = candidateMap[m.candidate_id];
    return {
      id: m.candidate_id,
      anonymous_id: anonymizeCandidateId(m.candidate_id),
      ranking_position: m.ranking_position,
      overall_score: Number(m.overall_score),
      is_placeholder: m.is_placeholder,
      years_of_experience: c?.years_of_experience ?? null,
      highest_education: c?.highest_education ?? null,
      skills_overview: c?.skills ?? [],
      is_unlocked: unlockedIds.includes(m.candidate_id),
    };
  });

  async function generate() {
    "use server";
    await generateMatchingResults(id);
  }

  return (
    <>
      <EmployerJobContext
        jobTitle={job.title}
        jobId={id}
        description="Anonymous ranked snapshot — unlock profiles to view full details ($49 each)"
      />
      <JobWorkflowNav jobId={id} currentStep="matching" canEdit={canEditJob(lifecycle)} />

      {matrix === "complete" && (
        <Alert className="mb-6 border-emerald-200 bg-emerald-50 text-emerald-900">
          <CheckCircle2 />
          <AlertTitle>{FRAMEWORK_MATCHING_LANGUAGE} saved</AlertTitle>
          <AlertDescription>
            {canRun
              ? "Your matching questionnaire is complete. Generate matches below when you are ready."
              : "Your matching questionnaire is complete. Post the job as Active before generating matches."}
          </AlertDescription>
        </Alert>
      )}

      {lastMatchedAt && (
        <EmployerPageSection
          title="Match snapshot"
          description={
            newCandidatesMessage ??
            "Results reflect the candidate pool at the time of the last run. Refresh to include new candidates."
          }
          icon={<Clock className="h-6 w-6" />}
          gradient="from-slate-500 to-slate-600"
          className="mb-6 !p-5"
        >
          <p className="text-sm text-slate-600">
            Last matched <span className="font-medium text-slate-800">{formatDate(lastMatchedAt)}</span>
            {newCandidatesSince > 0 && (
              <>
                {" "}
                ·{" "}
                <span className="font-medium text-amber-700">
                  {newCandidatesSince} new candidate{newCandidatesSince === 1 ? "" : "s"} in pool
                </span>
              </>
            )}
          </p>
        </EmployerPageSection>
      )}

      {canRun ? (
        <div className="mb-6 space-y-3">
          {refreshWarning && (
            <EmployerPageSection
              title="Refresh matches"
              description={refreshWarning}
              icon={<RefreshCw className="h-6 w-6" />}
              gradient="from-amber-500 to-amber-600"
              className="!p-5"
            />
          )}
          <form action={generate} className="flex justify-end">
            <Button type="submit" className="rounded-xl">
              {runLabel}
            </Button>
          </form>
        </div>
      ) : (
        runBlocked && (
          <EmployerPageSection
            title="Matching unavailable"
            description={runBlocked}
            icon={<Target className="h-6 w-6" />}
            gradient="from-slate-500 to-slate-600"
            className="mb-6 !p-5"
          />
        )
      )}

      <MatchingResultsTable
        jobId={id}
        results={results}
        displayLimit={MATCH_DISPLAY_LIMIT}
        lastMatchedAt={lastMatchedAt}
        mockPayments={isMockPayments()}
      />
    </>
  );
}
