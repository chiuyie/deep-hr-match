import { notFound } from "next/navigation";
import { CheckCircle2, Clock, RefreshCw, Target, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  EmployerJobContext,
  EmployerStatCard,
} from "@/components/employer/employer-ui";
import { MatchFlowNotice } from "@/components/employer/match-flow-ui";
import { JobWorkflowNav } from "@/components/employer/job-workflow-nav";
import { MatchingResultsTable } from "@/components/matching/matching-results-table";
import { requireEmployer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";
import { generateMatchingResults } from "@/lib/employer/actions";
import { buildAnonymousCandidateMatches } from "@/lib/employer/anonymous-match";
import { loadMatchPreviewProfilesByIds } from "@/lib/employer/match-preview-profiles";
import {
  canEditJob,
  canRunMatching,
  matchingRunButtonLabel,
  refreshMatchingWarning,
  runMatchingBlockedReason,
} from "@/lib/employer/job-rules";
import { getUnlockedCandidateIds } from "@/lib/auth/unlock";
import { EMPLOYER_MATCH_RESULT_LIST_SELECT } from "@/lib/employer/list-queries";
import { MATCH_DISPLAY_LIMIT, UNLOCK_CURRENCY, UNLOCK_PRICE_CENTS } from "@/lib/matching/engine";
import { isMockPayments } from "@/lib/payments/mode";
import {
  countNewReadyCandidatesSince,
  getSnapshotGeneratedAt,
  newCandidatesNotice,
} from "@/lib/matching/snapshot";
import { formatCurrency, formatDate } from "@/lib/utils/profile";
import { loadFormFields } from "@/lib/form-fields/queries";
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

  const [{ data: job }, { data: matchResults }, unlockedIds, candidateFields, platformDisclosure] =
    await Promise.all([
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
      loadFormFields({ audience: "candidate", formGroup: "profile", includeInactive: false }),
      loadPlatformDisclosureMap(),
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

  const [newCandidatesSince, candidateMap] = await Promise.all([
    lastMatchedAt ? countNewReadyCandidatesSince(supabase, lastMatchedAt) : Promise.resolve(0),
    loadMatchPreviewProfilesByIds(candidateIds.slice(0, 50)),
  ]);

  const newCandidatesMessage = newCandidatesNotice(newCandidatesSince);

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
        description="Review anonymous rankings, then unlock the candidates you want to contact"
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

      {results.length > 0 ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <EmployerStatCard
            label="In this snapshot"
            value={results.length}
            icon={Users}
            accent="from-emerald-500/15 to-emerald-500/5 text-emerald-700"
          />
          <EmployerStatCard
            label="Already unlocked"
            value={unlockedIds.length}
            icon={CheckCircle2}
            accent="from-teal-500/15 to-teal-500/5 text-teal-700"
          />
          <EmployerStatCard
            label="Unlock price"
            value={formatCurrency(UNLOCK_PRICE_CENTS, UNLOCK_CURRENCY)}
            icon={Target}
            accent="from-slate-500/15 to-slate-500/5 text-slate-700"
          />
        </div>
      ) : null}

      {lastMatchedAt && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Clock className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">Match snapshot</p>
              <p className="mt-0.5 text-sm text-slate-500">
                Last matched <span className="font-medium text-slate-700">{formatDate(lastMatchedAt)}</span>
                {newCandidatesSince > 0 ? (
                  <>
                    {" "}
                    ·{" "}
                    <span className="font-medium text-amber-700">
                      {newCandidatesSince} new candidate{newCandidatesSince === 1 ? "" : "s"} in pool
                    </span>
                  </>
                ) : null}
              </p>
              {newCandidatesMessage ? (
                <p className="mt-1 text-sm text-slate-500">{newCandidatesMessage}</p>
              ) : null}
            </div>
          </div>
          {canRun ? (
            <form action={generate}>
              <Button type="submit" className="rounded-xl shadow-sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                {runLabel}
              </Button>
            </form>
          ) : null}
        </div>
      )}

      {canRun && refreshWarning ? (
        <MatchFlowNotice tone="warning" title="Refresh recommended" icon={RefreshCw}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>{refreshWarning}</p>
            <form action={generate}>
              <Button type="submit" size="sm" className="rounded-xl">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                {runLabel}
              </Button>
            </form>
          </div>
        </MatchFlowNotice>
      ) : null}

      {canRun && !refreshWarning && !lastMatchedAt ? (
        <div className="mb-6 flex justify-end">
          <form action={generate}>
            <Button type="submit" size="lg" className="rounded-xl px-6 shadow-md">
              <RefreshCw className="mr-2 h-4 w-4" />
              {runLabel}
            </Button>
          </form>
        </div>
      ) : null}

      {!canRun && runBlocked ? (
        <MatchFlowNotice tone="info" title="Matching unavailable" icon={Target}>
          {runBlocked}
        </MatchFlowNotice>
      ) : null}

      <MatchingResultsTable
        jobId={id}
        results={results}
        displayLimit={MATCH_DISPLAY_LIMIT}
        lastMatchedAt={lastMatchedAt}
        mockPayments={isMockPayments()}
        showMatchScore={isShownOnAnonymous(platformDisclosure, "match_score")}
        showMatchRank={isShownOnAnonymous(platformDisclosure, "match_rank")}
        showMatchNarrative={isShownOnAnonymous(platformDisclosure, "match_narrative")}
      />
    </>
  );
}
