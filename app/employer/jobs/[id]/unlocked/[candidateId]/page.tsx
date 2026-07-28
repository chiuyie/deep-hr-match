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
import { UnlockedMatchReportSections } from "@/components/employer/unlocked-match-report";
import { requireEmployer } from "@/lib/auth/session";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/profile";
import { getEmployerUnlockedCandidateView } from "@/lib/employer/unlocked-candidate-view";
import {
  loadPlatformDisclosureMap,
  shouldShowUnlockedPlatformItem,
} from "@/lib/employer/platform-disclosure";
import { loadMatrixComparisonForUnlock } from "@/lib/matching/candidate-matrix-summary";
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
}: {
  params: Promise<{ id: string; candidateId: string }>;
}) {
  const { id: jobId, candidateId } = await params;
  const { profile: employer } = await requireEmployer();
  if (!employer) notFound();

  const supabase = await createClient();

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
  if (!candidateView) notFound();

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

  // Skip contact fields already shown in the header
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
        description="Unlocked candidate profile"
      />
      <JobWorkflowNav jobId={jobId} currentStep="unlocked" canEdit={job.status === "draft"} />

      <EmployerPageSection
        title={candidateView.displayName}
        description={
          candidateView.matchResult?.generated_at
            ? `Matched ${formatDate(candidateView.matchResult.generated_at)}`
            : "Full profile unlocked for this job"
        }
        icon={<UserRound className="h-6 w-6" />}
        gradient="from-emerald-500 to-emerald-600"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white">
              <LockOpen className="h-3.5 w-3.5" />
              Unlocked
            </span>
            {showCv && candidateView.cvDownloadUrl && (
              <Button size="sm" className="h-8 rounded-lg" asChild>
                <a href={candidateView.cvDownloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download CV
                </a>
              </Button>
            )}
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-1 break-all text-sm font-medium text-slate-800">
                {candidateView.displayEmail ?? "—"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {candidateView.displayPhone ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </EmployerPageSection>

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
          >
            {profileGroups.length ? (
              <div className="space-y-6">
                {profileGroups.map((group) => (
                  <section key={group.section}>
                    <h3 className="mb-3 text-sm font-semibold text-slate-800">{group.section}</h3>
                    <dl className="grid gap-3 sm:grid-cols-2">
                      {group.rows.map((field) => (
                        <div
                          key={field.id}
                          className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                        >
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {field.label}
                          </dt>
                          <dd className="mt-1.5 break-words text-sm leading-6 text-slate-800">
                            {field.value?.trim() ? field.value : <span className="text-slate-400">—</span>}
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
            >
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">File</p>
                <p className="mt-1 break-words text-sm font-medium text-slate-800">
                  {candidateView.cv?.file_name ?? "No CV uploaded"}
                </p>
                {candidateView.cv?.uploaded_at && (
                  <p className="mt-2 text-xs text-slate-500">
                    Uploaded {formatDate(candidateView.cv.uploaded_at)}
                  </p>
                )}
              </div>

              {candidateView.cvDownloadUrl ? (
                <Button className="mt-4 w-full rounded-xl" asChild>
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

      <div className="mt-6 flex flex-wrap gap-3">
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
