import { notFound } from "next/navigation";
import { CheckCircle2, Clock, RefreshCw, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmployerJobContext } from "@/components/employer/employer-ui";
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

      {matrix === "complete" ? (
        <MatchFlowNotice tone="success" title={`${FRAMEWORK_MATCHING_LANGUAGE} saved`}>
          {canRun
            ? "Your matching questionnaire is complete. Generate matches below when you are ready."
            : "Your matching questionnaire is complete. Post the job as Active before generating matches."}
        </MatchFlowNotice>
      ) : null}

      {results.length > 0 || lastMatchedAt ? (
        <div className="mb-6 overflow-hidden rounded-[1.35rem] border border-slate-200/70 bg-white shadow-[0_20px_50px_-34px_rgba(15,23,42,0.4)]">
          <div className="grid gap-0 sm:grid-cols-3">
            <div className="border-b border-slate-100 px-5 py-4 sm:border-b-0 sm:border-r">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    In this snapshot
                  </p>
                  <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                    {results.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="border-b border-slate-100 px-5 py-4 sm:border-b-0 sm:border-r">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Already unlocked
                  </p>
                  <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                    {unlockedIds.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 ring-1 ring-slate-200/80">
                  <Target className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Unlock price
                  </p>
                  <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                    {formatCurrency(UNLOCK_PRICE_CENTS, UNLOCK_CURRENCY)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {lastMatchedAt ? (
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200/80">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Match snapshot</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Last matched{" "}
                    <span className="font-medium text-slate-700">{formatDate(lastMatchedAt)}</span>
                    {newCandidatesSince > 0 ? (
                      <>
                        {" "}
                        ·{" "}
                        <span className="font-medium text-amber-700">
                          {newCandidatesSince} new candidate
                          {newCandidatesSince === 1 ? "" : "s"} in pool
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
          ) : null}
        </div>
      ) : null}

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
        <div className="mb-6 overflow-hidden rounded-[1.35rem] border border-emerald-200/70 bg-[linear-gradient(135deg,#ecfdf5,#ffffff)] px-5 py-5 shadow-sm sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Ready to rank candidates</p>
            <p className="mt-1 text-sm text-slate-500">
              Generate a free match snapshot, then unlock the profiles that fit.
            </p>
          </div>
          <form action={generate} className="mt-4 sm:mt-0">
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
