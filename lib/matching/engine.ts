import type { SupabaseClient } from "@supabase/supabase-js";

export interface MatchingInput {
  jobId: string;
  employerId: string;
}

export interface PlaceholderMatchScore {
  overall_score: number;
  matrix_score: number;
  profile_score: number;
  skills_score: number;
  experience_score: number;
  education_score: number;
  match_summary: string;
  strengths: string[];
  gaps: string[];
}

// TODO: Replace placeholder scoring logic after Deep HR Match matching algorithm is finalized.
function generatePlaceholderScore(index: number): PlaceholderMatchScore {
  const base = 95 - index * 7 + Math.floor(Math.random() * 5);
  const score = Math.max(45, Math.min(98, base));

  return {
    overall_score: score,
    matrix_score: score - 3,
    profile_score: score - 5,
    skills_score: score - 2,
    experience_score: score - 4,
    education_score: score - 6,
    match_summary: `[DEMO] Placeholder match summary for ranking position ${index + 1}. Final algorithm pending.`,
    strengths: ["[DEMO] Strong technical alignment", "[DEMO] Relevant industry experience"],
    gaps: ["[DEMO] Placeholder gap - pending final scoring"],
  };
}

export async function generatePlaceholderMatches(
  supabase: SupabaseClient,
  { jobId, employerId }: MatchingInput
) {
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("employer_id", employerId)
    .single();

  if (jobError || !job) {
    throw new Error("Job not found or access denied");
  }

  const { data: jobAnswers } = await supabase
    .from("job_matrix_answers")
    .select("*")
    .eq("job_id", jobId);

  const { data: candidates } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("status", "ready_for_matching");

  if (!candidates?.length) {
    return { count: 0, results: [] };
  }

  await supabase.from("match_results").delete().eq("job_id", jobId);

  const results = candidates.map((candidate, index) => {
    const scores = generatePlaceholderScore(index);
    return {
      job_id: jobId,
      candidate_id: candidate.id,
      ...scores,
      ranking_position: index + 1,
      is_placeholder: true,
      generated_at: new Date().toISOString(),
    };
  });

  results.sort((a, b) => b.overall_score - a.overall_score);
  results.forEach((r, i) => {
    r.ranking_position = i + 1;
  });

  const { data: inserted, error } = await supabase
    .from("match_results")
    .insert(results)
    .select();

  if (error) throw error;

  void jobAnswers;

  return { count: inserted?.length ?? 0, results: inserted };
}

export const UNLOCK_PRICE_CENTS = 4900;
export const UNLOCK_CURRENCY = "usd";
