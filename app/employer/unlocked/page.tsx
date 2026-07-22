import Link from "next/link";
import { Users } from "lucide-react";
import { EmployerEmptyState, EmployerPageSection } from "@/components/employer/employer-ui";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getUnlockedCandidateDetailsBatch } from "@/lib/auth/unlock";
import { isUnlockedContactFieldVisible } from "@/lib/employer/match-disclosure";
import { ensureFormFieldsReady, loadFormFields } from "@/lib/form-fields/queries";

export default async function EmployerUnlockedPage() {
  const user = await requireRole("employer");
  const supabase = await createClient();

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: unlocks } = await supabase
    .from("unlocks")
    .select("*, jobs(title)")
    .eq("employer_id", employer?.id ?? "")
    .order("unlocked_at", { ascending: false });

  const unlockRows = unlocks ?? [];
  await ensureFormFieldsReady();
  const candidateFields = await loadFormFields({
    audience: "candidate",
    formGroup: "profile",
    includeInactive: false,
  });
  const showName = isUnlockedContactFieldVisible(candidateFields, "full_name");

  const jobIds = Array.from(new Set(unlockRows.map((unlock) => unlock.job_id)));
  const detailGroups = await Promise.all(
    jobIds.map(async (jobId) => {
      const jobCandidateIds = unlockRows
        .filter((unlock) => unlock.job_id === jobId)
        .map((unlock) => unlock.candidate_id);
      const details = await getUnlockedCandidateDetailsBatch(employer!.id, jobId, jobCandidateIds);
      return details.map((detail) => [`${jobId}:${detail.candidateId}`, detail] as const);
    })
  );
  const detailMap = new Map(detailGroups.flat());

  const items = unlockRows.map((unlock) => {
    const detail = detailMap.get(`${unlock.job_id}:${unlock.candidate_id}`);
    return {
      id: unlock.id,
      candidateId: unlock.candidate_id,
      name: showName ? detail?.profile?.full_name ?? "Candidate" : "Candidate",
      jobTitle: (unlock.jobs as { title: string } | null)?.title ?? "Job",
      jobId: unlock.job_id,
    };
  });

  return (
    <EmployerPageSection
      title="Unlocked Candidates"
      description="All candidate profiles you have purchased across your jobs"
      icon={<Users className="h-6 w-6" />}
      gradient="from-blue-500 to-blue-600"
    >
      {!items.length ? (
        <EmployerEmptyState
          icon={Users}
          title="No unlocked candidates yet"
          description="Post a job, generate matches, and unlock candidate profiles to see them here."
          actionLabel="View your jobs"
          actionHref="/employer/jobs"
          gradient="from-blue-500 to-blue-600"
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/employer/jobs/${item.jobId}/unlocked/${item.candidateId}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 px-5 py-4 transition-all hover:border-slate-200 hover:bg-white hover:shadow-md"
            >
              <div>
                <p className="font-semibold text-slate-800">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500">{item.jobTitle}</p>
              </div>
              <span className="text-sm font-medium text-primary">View details →</span>
            </Link>
          ))}
        </div>
      )}
    </EmployerPageSection>
  );
}
