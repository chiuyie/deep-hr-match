import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Download,
  FileText,
  LockOpen,
  Sparkles,
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
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/profile";
import { getEmployerUnlockedCandidateView } from "@/lib/employer/unlocked-candidate-view";
import type { EmployerVisibleCandidateField } from "@/lib/employer/unlocked-candidate-view";

const PLACEHOLDER_MATCHING_STATS = [
  { label: "7^7 Alignment Score", value: "Placeholder 88%" },
  { label: "Shared Word Matches", value: "Placeholder 5 / 7" },
  { label: "Priority Gaps", value: "Placeholder 2 flagged differences" },
];

const PLACEHOLDER_77_FACTORS = [
  {
    factor: "Work Style",
    jobWord: "Structured",
    candidateWord: "Structured",
    status: "Strong match",
    note: "Candidate and employer are aligned on a predictable, process-led working rhythm.",
  },
  {
    factor: "Communication",
    jobWord: "Direct",
    candidateWord: "Direct",
    status: "Strong match",
    note: "Both sides prefer concise updates and explicit decision-making.",
  },
  {
    factor: "Pace",
    jobWord: "Fast",
    candidateWord: "Fast",
    status: "Strong match",
    note: "Candidate appears comfortable with quick iteration and shipping pace.",
  },
  {
    factor: "Ownership",
    jobWord: "Independent",
    candidateWord: "Independent",
    status: "Strong match",
    note: "Candidate profile suggests comfort with autonomous execution.",
  },
  {
    factor: "Collaboration",
    jobWord: "Cross-functional",
    candidateWord: "Cross-functional",
    status: "Strong match",
    note: "Good fit for product, design, and stakeholder collaboration.",
  },
  {
    factor: "Problem Solving",
    jobWord: "Analytical",
    candidateWord: "Creative",
    status: "Partial gap",
    note: "Candidate may approach ambiguity differently, but this can still be complementary.",
  },
  {
    factor: "Growth Orientation",
    jobWord: "High growth",
    candidateWord: "High growth",
    status: "Strong match",
    note: "Candidate appears motivated by learning velocity and role expansion.",
  },
];

function statusBadgeClassName(status: string) {
  if (status === "Strong match") {
    return "bg-emerald-600 hover:bg-emerald-600";
  }
  if (status === "Partial gap") {
    return "bg-amber-500 hover:bg-amber-500";
  }
  return "bg-slate-500 hover:bg-slate-500";
}

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

  const candidateFirstName = candidateView.profile?.full_name?.split(" ")[0] ?? "This candidate";

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
        title={candidateView.profile?.full_name ?? "Unlocked Candidate"}
        description="Employer-facing candidate report after unlock"
        icon={<UserRoundSearch className="h-6 w-6" />}
        gradient="from-emerald-500 to-emerald-600"
        action={
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-emerald-600 hover:bg-emerald-600">
              <LockOpen className="h-3 w-3" />
              Unlocked
            </Badge>
            {candidateView.cvDownloadUrl && (
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
              {candidateView.profile?.email ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {candidateView.profile?.phone ?? "—"}
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
          <EmployerPageSection
            title="7^7 Matching Stats"
            description="Placeholder structure for the future detailed match report"
            icon={<Sparkles className="h-6 w-6" />}
            gradient="from-violet-500 to-indigo-600"
          >
            <div className="grid gap-4 md:grid-cols-3">
              {PLACEHOLDER_MATCHING_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-dashed border-violet-200 bg-violet-50/60 p-4 text-sm text-violet-900">
              Detailed 7^7 word-level comparisons, strengths, and mismatch reasoning are placeholders
              here for now. This page is ready for the final matching report to be inserted later.
            </div>

            <div className="mt-5 space-y-3 md:hidden">
              {PLACEHOLDER_77_FACTORS.map((factor) => (
                <article
                  key={factor.factor}
                  className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">{factor.factor}</h3>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                        Placeholder comparison
                      </p>
                    </div>
                    <Badge className={statusBadgeClassName(factor.status)}>{factor.status}</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Job word
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{factor.jobWord}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Candidate word
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {factor.candidateWord}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{factor.note}</p>
                </article>
              ))}
            </div>

            <div className="mt-5 hidden overflow-hidden rounded-xl border border-slate-100 bg-white md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factor</TableHead>
                    <TableHead>Job Word</TableHead>
                    <TableHead>Candidate Word</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Placeholder Explanation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PLACEHOLDER_77_FACTORS.map((factor) => (
                    <TableRow key={factor.factor}>
                      <TableCell className="font-medium text-slate-800">{factor.factor}</TableCell>
                      <TableCell>{factor.jobWord}</TableCell>
                      <TableCell>{factor.candidateWord}</TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClassName(factor.status)}>{factor.status}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-normal break-words text-slate-600">
                        {factor.note}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <h3 className="text-sm font-semibold text-slate-800">Placeholder Match Narrative</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {candidateFirstName} currently shows a strong placeholder fit for this role across
                structure, communication style, execution pace, and cross-functional ownership. The
                only visible placeholder gap is in problem-solving style, where the role leans more
                analytical while the candidate is tagged as more creative. This section is
                intentionally mocked so you can review the layout and employer experience before the
                final 7^7 engine output is wired in.
              </p>
            </div>
          </EmployerPageSection>

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
          <EmployerPageSection
            title="CV"
            description="Latest uploaded CV available to the employer after unlock"
            icon={<FileText className="h-6 w-6" />}
            gradient="from-amber-500 to-orange-600"
          >
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                File
              </p>
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
