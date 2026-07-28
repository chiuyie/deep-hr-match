import { notFound } from "next/navigation";
import { CheckCircle2, Clock, RefreshCw, Target } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmployerJobContext, EmployerPageSection } from "@/components/employer/employer-ui";
import { JobWorkflowNav } from "@/components/employer/job-workflow-nav";
import { MatchingResultsTable } from "@/components/matching/matching-results-table";
import { requireEmployer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { generateMatchingResults } from "@/lib/employer/actions";
import { buildAnonymousCandidateMatches } from "@/lib/employer/anonymous-match";
import {
  canEditJob,
  canRunMatching,
  matchingRunButtonLabel,
  refreshMatchingWarning,
  runMatchingBlockedReason,
} from "@/lib/employer/job-rules";
import { getUnlockedCandidateIds } from "@/lib/auth/unlock";
import { EMPLOYER_MATCH_RESULT_LIST_SELECT } from "@/lib/employer/list-queries";
import { MATCH_DISPLAY_LIMIT } from "@/lib/matching/engine";
import { isMockPayments } from "@/lib/payments/mode";
import {
  countNewReadyCandidatesSince,
  getSnapshotGeneratedAt,
  newCandidatesNotice,
} from "@/lib/matching/snapshot";
import { formatDate } from "@/lib/utils/profile";
import { ensureFormFieldsReady, loadFormFields } from "@/lib/form-fields/queries";
import {
  isShownOnAnonymous,
  loadPlatformDisclosureMap,
} from "@/lib/employer/platform-disclosure";
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
  const { profile: employer } = await requireEmployer();
  if (!employer) notFound();

  const supabase = await createClient();

  const [{ data: job }, { data: matchResults }, unlockedIds] = await Promise.all([
    supabase
      .from("jobs")
      .select("title, status")
      .eq("id", id)
      .eq("employer_id", employer.id)
      .single(),
    supabase
      .from("match_results")
      .select(EMPLOYER_MATCH_RESULT_LIST_SELECT)
      .eq("job_id", id)
      .order("ranking_position"),
    getUnlockedCandidateIds(employer.id, id),
  ]);

  if (!job) notFound();

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
  const candidateIds = matchResults?.map((m) => m.candidate_id) ?? [];

  const [newCandidatesSince, candidateFields, platformDisclosure, candidatesResult] =
    await Promise.all([
      lastMatchedAt ? countNewReadyCandidatesSince(supabase, lastMatchedAt) : Promise.resolve(0),
      ensureFormFieldsReady().then(() =>
        loadFormFields({ audience: "candidate", formGroup: "profile", includeInactive: false })
      ),
      loadPlatformDisclosureMap(),
      candidateIds.length
        ? supabase
            .from("candidate_profiles")
            .select("id, full_name, years_of_experience, highest_education, skills, form_data")
            .in("id", candidateIds)
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    ]);

  const newCandidatesMessage = newCandidatesNotice(newCandidatesSince);

  const candidateMap = Object.fromEntries(
    (candidatesResult.data ?? []).map((c) => [String((c as { id: string }).id), c as Record<string, unknown>])
  );

  const results: AnonymousCandidateMatch[] = buildAnonymousCandidateMatches({
    matchResults: matchResults ?? [],
    profilesById: candidateMap,
    candidateFields,
    unlockedIds,
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
        description="Anonymous ranked snapshot — first run happens when you post the job; refresh anytime for new candidates ($49 to unlock each profile)"
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
        showMatchScore={isShownOnAnonymous(platformDisclosure, "match_score")}
        showMatchRank={isShownOnAnonymous(platformDisclosure, "match_rank")}
      />
    </>
  );
}
