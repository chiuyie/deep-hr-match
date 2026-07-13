import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { MatchingResultsTable } from "@/components/matching/matching-results-table";
import { requireRole, anonymizeCandidateId } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { generateMatchingResults } from "@/lib/employer/actions";
import { getUnlockedCandidateIds } from "@/lib/auth/unlock";
import type { AnonymousCandidateMatch } from "@/types/database";

export default async function JobMatchingPage({
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
    .select("title")
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
    <DashboardShell
      role="employer"
      userName={user.name}
      title="Matching Results"
      description={`Ranked candidates for ${job.title}`}
      actions={
        <form action={generate}>
          <Button type="submit">
            Generate Matching Results
          </Button>
        </form>
      }
    >
      <MatchingResultsTable jobId={id} results={results} />
    </DashboardShell>
  );
}
