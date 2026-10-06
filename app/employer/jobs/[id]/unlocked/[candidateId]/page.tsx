import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileText,
  LockOpen,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmployerJobContext, EmployerPageSection } from "@/components/employer/employer-ui";
import { JobWorkflowNav } from "@/components/employer/job-workflow-nav";
import {
  CandidateAvatar,
  MatchFlowNotice,
  MatchScoreRing,
} from "@/components/employer/match-flow-ui";
import { UnlockedMatchReportSections } from "@/components/employer/unlocked-match-report";
import { UnlockPaymentPendingNotice } from "@/components/employer/unlock-payment-pending-notice";
import { requireEmployer } from "@/lib/auth/session";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/profile";
import { getEmployerUnlockedCandidateView } from "@/lib/employer/unlocked-candidate-view";
import {
  loadPlatformDisclosureMap,
  shouldShowUnlockedPlatformItem,
} from "@/lib/employer/platform-disclosure";
import { loadMatrixComparisonForUnlock } from "@/lib/matching/candidate-matrix-summary";
import { ensureUnlocksForCheckoutSession } from "@/lib/payments/ensure-checkout-unlocks";
import type { EmployerVisibleCandidateField } from "@/lib/employer/unlocked-candidate-view";

function groupFieldsBySection(fields: EmployerVisibleCandidateField[]) {
  return fields.reduce<Array<{ section: string; rows: EmployerVisibleCandidateField[] }>>(
    (groups, field) => {
      const existing = groups.find((group) => group.section === field.section);
      if (existing) {
        existing.rows.push(field);
        return groups;
      }
      groups.push({ section: field.section, rows: [field] });
      return groups;
    },
    []
  );
}

export default async function EmployerUnlockedCandidateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; candidateId: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { id: jobId, candidateId } = await params;
  const { session_id } = await searchParams;
  const { profile: employer } = await requireEmployer();
  if (!employer) notFound();

  const supabase = await createClient();

  if (session_id) {
    await ensureUnlocksForCheckoutSession(supabase, {
      employerId: employer.id,
      jobId,
      sessionId: session_id,
      candidateId,
    });
  }

  const [jobResult, matrixClient] = await Promise.all([
    supabase
      .from("jobs")
      .select("title, status")
      .eq("id", jobId)
      .eq("employer_id", employer.id)
      .single(),
    createServiceClient().catch(() => supabase),
  ]);

  const job = jobResult.data;
  if (!job) notFound();

  let candidateView:
    | (Awaited<ReturnType<typeof getEmployerUnlockedCandidateView>> & {
        visibleFields: EmployerVisibleCandidateField[];
      })
    | null = null;

  const [candidateViewResult, disclosureMap, matrixComparison] = await Promise.all([
    getEmployerUnlockedCandidateView(employer.id, jobId, candidateId).catch(() => null),
    loadPlatformDisclosureMap(),
    loadMatrixComparisonForUnlock(matrixClient, jobId, candidateId),
  ]);

  candidateView = candidateViewResult;
  if (!candidateView) {
    if (session_id) {
      return (
        <>
          <EmployerJobContext
            jobTitle={job.title}
            jobId={jobId}
            description="Opening unlocked candidate profile"
          />
          <JobWorkflowNav jobId={jobId} currentStep="unlocked" canEdit={job.status === "draft"} />
          <UnlockPaymentPendingNotice
            active
            message="Payment went through. Opening this profile as soon as unlock finishes."
          />
        </>
      );
    }
    notFound();
  }

  const { candidateSteps, comparisonRows } = matrixComparison;

  const showCv = shouldShowUnlockedPlatformItem(
    disclosureMap,
    "candidate_cv",
    Boolean(candidateView.cv)
  );
  const overallScore =
    candidateView.matchResult?.overall_score != null
      ? Number(candidateView.matchResult.overall_score)
      : null;
  const rankingPosition = candidateView.matchResult?.ranking_position ?? null;
  const groupedFields = groupFieldsBySection(candidateView.visibleFields);

  const profileGroups = groupedFields
    .map((group) => ({
      ...group,
      rows: group.rows.filter(
        (field) => !["full_name", "email", "phone"].includes(field.field_key)
      ),
    }))
    .filter((group) => group.rows.length > 0);

  return (
    <>
      <EmployerJobContext
        jobTitle={job.title}
        jobId={jobId}
        description="Full unlocked profile, contact details, and match report"
      />
      <JobWorkflowNav jobId={jobId} currentStep="unlocked" canEdit={job.status === "draft"} />

      {session_id ? (
        <MatchFlowNotice tone="success" title="Payment successful">
          This candidate profile is unlocked and ready to review.
        </MatchFlowNotice>
      ) : null}

      <section className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_24px_55px_-34px_rgba(15,23,42,0.42)]">
        <div className="h-1.5 bg-[linear-gradient(90deg,#10b981,#14b8a6,#06b6d4)]" />
        <div className="bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_42%)] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <CandidateAvatar name={candidateView.displayName} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.7rem]">
                    {candidateView.displayName}
                  </h1>
                  <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 text-xs font-semibold text-white shadow-sm">
                    <LockOpen className="h-3.5 w-3.5" />
                    Unlocked
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-500">
                  {candidateView.matchResult?.generated_at
                    ? `Matched ${formatDate(candidateView.matchResult.generated_at)} · full profile unlocked for this job`
                    : "Full profile unlocked for this job"}
                </p>

                <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-sm ring-1 ring-slate-100">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                      <Mail className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Email
                      </p>
                      {candidateView.displayEmail ? (
                        <a
                          href={`mailto:${candidateView.displayEmail}`}
                          className="block truncate text-sm font-semibold text-slate-900 hover:text-emerald-700"
                        >
                          {candidateView.displayEmail}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-slate-400">—</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-sm ring-1 ring-slate-100">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                      <Phone className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Phone
                      </p>
                      {candidateView.displayPhone ? (
                        <a
                          href={`tel:${candidateView.displayPhone}`}
                          className="block text-sm font-semibold text-slate-900 hover:text-emerald-700"
                        >
                          {candidateView.displayPhone}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-slate-400">—</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-end">
              {overallScore != null ? (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-[linear-gradient(145deg,#ecfdf5,#ffffff)] px-4 py-3.5 shadow-sm">
                  <MatchScoreRing score={overallScore} size="lg" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/80">
                      Match score
                    </p>
                    {rankingPosition != null ? (
                      <p className="mt-0.5 text-sm font-semibold text-emerald-900">
                        Rank #{rankingPosition} for this job
                      </p>
                    ) : (
                      <p className="mt-0.5 text-sm text-emerald-800/80">Overall fit</p>
                    )}
                  </div>
                </div>
              ) : null}
              {showCv && candidateView.cvDownloadUrl ? (
                <Button className="rounded-xl shadow-sm" asChild>
                  <a href={candidateView.cvDownloadUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Download CV
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 space-y-6">
        <UnlockedMatchReportSections
          overallScore={overallScore}
          rankingPosition={rankingPosition}
          showMatchScore={shouldShowUnlockedPlatformItem(
            disclosureMap,
            "match_score",
            overallScore != null
          )}
          showMatchRank={shouldShowUnlockedPlatformItem(
            disclosureMap,
            "match_rank",
            rankingPosition != null
          )}
          showMatchNarrative={shouldShowUnlockedPlatformItem(
            disclosureMap,
            "match_narrative",
            Boolean(
              candidateView.matchResult?.match_summary ||
                candidateView.matchResult?.strengths?.length ||
                candidateView.matchResult?.gaps?.length
            )
          )}
          matchSummary={candidateView.matchResult?.match_summary ?? null}
          strengths={candidateView.matchResult?.strengths ?? null}
          gaps={candidateView.matchResult?.gaps ?? null}
          showMatrixAnswers={shouldShowUnlockedPlatformItem(
            disclosureMap,
            "matrix_candidate_answers",
            candidateSteps.length > 0
          )}
          showMatrixComparison={shouldShowUnlockedPlatformItem(
            disclosureMap,
            "matrix_job_comparison",
            comparisonRows.length > 0
          )}
          candidateSteps={candidateSteps}
          comparisonRows={comparisonRows}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
          <EmployerPageSection
            title="Profile"
            description="Details from the candidate's application"
            icon={<UserRound className="h-6 w-6" />}
            gradient="from-cyan-500 to-cyan-600"
            className="border-slate-200/70 shadow-[0_22px_50px_-36px_rgba(15,23,42,0.4)]"
          >
            {profileGroups.length ? (
              <div className="space-y-7">
                {profileGroups.map((group) => (
                  <section key={group.section}>
                    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {group.section}
                    </h3>
                    <dl className="grid gap-3 sm:grid-cols-2">
                      {group.rows.map((field) => (
                        <div
                          key={field.id}
                          className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                        >
                          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {field.label}
                          </dt>
                          <dd className="mt-1.5 break-words text-sm leading-6 text-slate-800">
                            {field.value?.trim() ? (
                              field.value
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No additional profile details available.</p>
            )}
          </EmployerPageSection>

          {showCv ? (
            <EmployerPageSection
              title="CV"
              description="Resume on file for this candidate"
              icon={<FileText className="h-6 w-6" />}
              gradient="from-amber-500 to-orange-600"
              className="border-slate-200/70 shadow-[0_22px_50px_-36px_rgba(15,23,42,0.4)]"
            >
              <div className="rounded-2xl border border-amber-100 bg-[linear-gradient(160deg,#fffbeb,#ffffff)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/70">
                  File
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                  {candidateView.cv?.file_name ?? "No CV uploaded"}
                </p>
                {candidateView.cv?.uploaded_at ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Uploaded {formatDate(candidateView.cv.uploaded_at)}
                  </p>
                ) : null}
              </div>

              {candidateView.cvDownloadUrl ? (
                <Button className="mt-4 w-full rounded-xl shadow-sm" asChild>
                  <a href={candidateView.cvDownloadUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download CV
                  </a>
                </Button>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No downloadable CV available yet.</p>
              )}
            </EmployerPageSection>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
        <Button variant="outline" className="rounded-xl" asChild>
          <Link href={`/employer/jobs/${jobId}/unlocked`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to unlocked candidates
          </Link>
        </Button>
        <Button variant="ghost" className="rounded-xl" asChild>
          <Link href={`/employer/jobs/${jobId}/matching`}>Back to matching results</Link>
        </Button>
      </div>
    </>
  );
}
