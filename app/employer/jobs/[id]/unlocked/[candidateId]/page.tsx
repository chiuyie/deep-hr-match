import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Download,
  FileText,
  LockOpen,
  UserRoundSearch,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmployerJobContext, EmployerPageSection } from "@/components/employer/employer-ui";
import { JobWorkflowNav } from "@/components/employer/job-workflow-nav";
import { UnlockedMatchReportSections } from "@/components/employer/unlocked-match-report";
import { requireRole } from "@/lib/auth/session";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/profile";
import { getEmployerUnlockedCandidateView } from "@/lib/employer/unlocked-candidate-view";
import {
  loadPlatformDisclosureMap,
  shouldShowUnlockedPlatformItem,
} from "@/lib/employer/platform-disclosure";
import {
  buildMatrixComparisonRows,
  loadCandidateMatrixAnswerSteps,
  loadJobMatrixAnswerSteps,
} from "@/lib/matching/candidate-matrix-summary";
import type { EmployerVisibleCandidateField } from "@/lib/employer/unlocked-candidate-view";

export default async function EmployerUnlockedCandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string; candidateId: string }>;
}) {
  const { id: jobId, candidateId } = await params;
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

  if (!job || !employer) notFound();

  let candidateView:
    | (Awaited<ReturnType<typeof getEmployerUnlockedCandidateView>> & {
        visibleFields: EmployerVisibleCandidateField[];
      })
    | null = null;
  try {
    candidateView = await getEmployerUnlockedCandidateView(employer.id, jobId, candidateId);
  } catch {
    notFound();
  }

  if (!candidateView) notFound();

  const disclosureMap = await loadPlatformDisclosureMap();
  let matrixClient = supabase;
  try {
    matrixClient = await createServiceClient();
  } catch {
    matrixClient = supabase;
  }
  const [candidateSteps, jobSteps] = await Promise.all([
    loadCandidateMatrixAnswerSteps(matrixClient, candidateId),
    loadJobMatrixAnswerSteps(supabase, jobId),
  ]);
  const comparisonRows = buildMatrixComparisonRows(jobSteps, candidateSteps);

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

  const candidateFirstName = candidateView.displayName?.split(" ")[0] ?? "This candidate";

  const groupedFields = candidateView.visibleFields.reduce<
    Array<{ section: string; rows: EmployerVisibleCandidateField[] }>
  >((groups, field) => {
    const existing = groups.find((group) => group.section === field.section);
    if (existing) {
      existing.rows.push(field);
      return groups;
    }
    groups.push({ section: field.section, rows: [field] });
    return groups;
  }, []);

  return (
    <>
      <EmployerJobContext
        jobTitle={job.title}
        jobId={jobId}
        description="Unlocked candidate profile and match report"
      />
      <JobWorkflowNav jobId={jobId} currentStep="unlocked" canEdit={job.status === "draft"} />

      <EmployerPageSection
        title={candidateView.displayName}
        description="Employer-facing candidate report after unlock"
        icon={<UserRoundSearch className="h-6 w-6" />}
        gradient="from-emerald-500 to-emerald-600"
        action={
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-emerald-600 hover:bg-emerald-600">
              <LockOpen className="h-3 w-3" />
              Unlocked
            </Badge>
            {showCv && candidateView.cvDownloadUrl && (
              <Button size="sm" className="rounded-lg" asChild>
                <a href={candidateView.cvDownloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-1.5 h-4 w-4" />
                  Download CV
                </a>
              </Button>
            )}
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {candidateView.displayEmail ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {candidateView.displayPhone ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Match generated
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {candidateView.matchResult?.generated_at
                ? formatDate(candidateView.matchResult.generated_at)
                : "Available after unlock"}
            </p>
          </div>
        </div>
      </EmployerPageSection>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
        <div className="space-y-6">
          <UnlockedMatchReportSections
            candidateFirstName={candidateFirstName}
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
            showNarrative={shouldShowUnlockedPlatformItem(
              disclosureMap,
              "match_narrative",
              Boolean(candidateView.matchResult)
            )}
            candidateSteps={candidateSteps}
            comparisonRows={comparisonRows}
          />

          <EmployerPageSection
            title="Candidate Information Shared With Employers"
            description="Admin-removed fields are hidden completely. Candidate-optional fields stay listed and may be blank."
            icon={<BadgeCheck className="h-6 w-6" />}
            gradient="from-cyan-500 to-cyan-600"
          >
            <div className="space-y-5">
              {groupedFields.length ? (
                groupedFields.map((group) => (
                  <section
                    key={group.section}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                  >
                    <h3 className="text-sm font-semibold text-slate-800">{group.section}</h3>

                    <div className="mt-3 space-y-3 md:hidden">
                      {group.rows.map((field) => (
                        <article
                          key={field.id}
                          className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {field.label}
                          </p>
                          <p className="mt-2 break-words text-sm leading-6 text-slate-700">
                            {field.value ?? (
                              <span className="text-slate-400">
                                {field.employer_disclosure_mode === "candidate_optional"
                                  ? "Blank or hidden by candidate"
                                  : "No value provided"}
                              </span>
                            )}
                          </p>
                        </article>
                      ))}
                    </div>

                    <div className="mt-3 hidden overflow-hidden rounded-xl border border-slate-100 bg-white md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[32%]">Field</TableHead>
                            <TableHead>Value visible to employer</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.rows.map((field) => (
                            <TableRow key={field.id}>
                              <TableCell className="align-top font-medium text-slate-700">
                                {field.label}
                              </TableCell>
                              <TableCell className="whitespace-normal break-words text-slate-600">
                                {field.value ?? (
                                  <span className="text-slate-400">
                                    {field.employer_disclosure_mode === "candidate_optional"
                                      ? "Blank or hidden by candidate"
                                      : "No value provided"}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </section>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No employer-visible candidate fields are configured yet.
                </div>
              )}
            </div>
          </EmployerPageSection>
        </div>

        <div className="space-y-6">
          {showCv ? (
            <EmployerPageSection
              title="CV"
              description="Latest uploaded CV available to the employer after unlock"
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
                    Download Candidate CV
                  </a>
                </Button>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No downloadable CV is available for this candidate yet.
                </div>
              )}
            </EmployerPageSection>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" className="rounded-xl" asChild>
          <Link href={`/employer/jobs/${jobId}/unlocked`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Unlocked Candidates
          </Link>
        </Button>
        <Button variant="ghost" className="rounded-xl" asChild>
          <Link href={`/employer/jobs/${jobId}/matching`}>Back to Matching Results</Link>
        </Button>
      </div>
    </>
  );
}
