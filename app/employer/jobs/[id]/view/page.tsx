import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, MapPin, Pencil } from "lucide-react";
import { JobMatchPreview } from "@/components/employer/job-match-preview";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  EmployerDetailField,
  EmployerJobContext,
  EmployerPageSection,
} from "@/components/employer/employer-ui";
import { JobWorkflowNav } from "@/components/employer/job-workflow-nav";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  canEditJob,
  canOpenMatchingPage,
  editBlockedReason,
  matchingActionLabel,
} from "@/lib/employer/job-rules";
import { buildAnonymousCandidateMatches } from "@/lib/employer/anonymous-match";
import {
  countNewReadyCandidatesSince,
  getSnapshotGeneratedAt,
} from "@/lib/matching/snapshot";
import { getUnlockedCandidateIds } from "@/lib/auth/unlock";
import { ensureFormFieldsReady, loadFormFields } from "@/lib/form-fields/queries";
import {
  isShownOnAnonymous,
  loadPlatformDisclosureMap,
} from "@/lib/employer/platform-disclosure";
import { formatDate } from "@/lib/utils/profile";
import type { AnonymousCandidateMatch } from "@/types/database";

export default async function JobViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("employer");
  const supabase = await createClient();

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("employer_id", employer?.id ?? "")
    .single();

  if (!job) notFound();

  const [{ count: matchCount }, { count: unlockCount }, { data: latestMatchRows }] =
    await Promise.all([
    supabase
      .from("match_results")
      .select("*", { count: "exact", head: true })
      .eq("job_id", id),
    supabase
      .from("unlocks")
      .select("*", { count: "exact", head: true })
      .eq("job_id", id)
      .eq("employer_id", employer?.id ?? ""),
    supabase
      .from("match_results")
      .select("generated_at")
      .eq("job_id", id)
      .order("ranking_position")
      .limit(1),
  ]);

  const lifecycle = {
    status: job.status,
    hasMatches: (matchCount ?? 0) > 0,
    hasUnlocks: (unlockCount ?? 0) > 0,
  };

  const lastMatchedAt = getSnapshotGeneratedAt(latestMatchRows ?? []);
  const newCandidatesSince = lastMatchedAt
    ? await countNewReadyCandidatesSince(supabase, lastMatchedAt)
    : 0;

  const matchingStatus = !lifecycle.hasMatches
    ? "Not yet generated"
    : [
        `Snapshot from ${formatDate(lastMatchedAt!)}`,
        newCandidatesSince > 0
          ? `${newCandidatesSince} new candidate${newCandidatesSince === 1 ? "" : "s"} since — refresh on Matching`
          : null,
      ]
        .filter(Boolean)
        .join(" · ");

  const editable = canEditJob(lifecycle);
  const lockReason = editBlockedReason(lifecycle);
  const unlockedIds = await getUnlockedCandidateIds(employer!.id, id);

  const { data: topMatches } = lifecycle.hasMatches
    ? await supabase
        .from("match_results")
        .select("candidate_id, ranking_position, overall_score, is_placeholder")
        .eq("job_id", id)
        .order("ranking_position")
        .limit(3)
    : { data: [] };

  const previewCandidateIds = (topMatches ?? []).map((row) => row.candidate_id);
  await ensureFormFieldsReady();
  const [candidateFields, platformDisclosure, previewProfilesResult] = await Promise.all([
    loadFormFields({ audience: "candidate", formGroup: "profile", includeInactive: false }),
    loadPlatformDisclosureMap(),
    previewCandidateIds.length
      ? supabase.from("candidate_profiles").select("*").in("id", previewCandidateIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const previewProfilesById = Object.fromEntries(
    (previewProfilesResult.data ?? []).map((profile) => [
      String((profile as { id: string }).id),
      profile as Record<string, unknown>,
    ])
  );

  const previewMatches: AnonymousCandidateMatch[] = buildAnonymousCandidateMatches({
    matchResults: topMatches ?? [],
    profilesById: previewProfilesById,
    candidateFields,
    unlockedIds,
  });

  return (
    <>
      <EmployerJobContext
        jobTitle={job.title}
        jobId={id}
        description="Read-only view of this job posting"
      />
      <JobWorkflowNav jobId={id} currentStep="view" canEdit={editable} />

      <EmployerPageSection
        title="Job Overview"
        description={lockReason ?? "Draft job — you can still edit before publishing"}
        icon={<Briefcase className="h-6 w-6" />}
        gradient="from-emerald-500 to-emerald-600"
        action={
          <div className="flex flex-wrap gap-2">
            {editable && (
              <Button size="sm" className="rounded-lg" asChild>
                <Link href={`/employer/jobs/${id}`}>
                  <Pencil className="mr-1.5 h-4 w-4" />
                  Edit Job
                </Link>
              </Button>
            )}
            {canOpenMatchingPage(lifecycle) && (
              <Button variant="outline" size="sm" className="rounded-lg" asChild>
                <Link href={`/employer/jobs/${id}/matching`}>{matchingActionLabel(lifecycle)}</Link>
              </Button>
            )}
          </div>
        }
      >
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <StatusBadge status={job.status} />
          {job.location && (
            <span className="inline-flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </span>
          )}
          <span className="text-sm text-slate-500">Created {formatDate(job.created_at)}</span>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <EmployerDetailField label="Department" value={job.department} />
          <EmployerDetailField label="Employment Type" value={job.employment_type} />
          <EmployerDetailField label="Salary Range" value={job.salary_range} />
          <EmployerDetailField
            label="Years of Experience"
            value={
              job.years_experience_required != null
                ? String(job.years_experience_required)
                : null
            }
          />
          <EmployerDetailField label="Education Required" value={job.education_required} />
          <EmployerDetailField
            label="Required Skills"
            value={job.required_skills?.join(", ")}
          />
          <EmployerDetailField
            label="Preferred Skills"
            value={job.preferred_skills?.join(", ")}
          />
          <EmployerDetailField label="Matching Results" value={matchingStatus} />
        </dl>

        {job.description && (
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <h3 className="text-sm font-semibold text-slate-700">Description</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{job.description}</p>
          </div>
        )}
      </EmployerPageSection>

      <div className="mt-6">
        <JobMatchPreview
          jobId={id}
          results={previewMatches}
          showMatchScore={isShownOnAnonymous(platformDisclosure, "match_score")}
          showMatchRank={isShownOnAnonymous(platformDisclosure, "match_rank")}
        />
      </div>
    </>
  );
}
