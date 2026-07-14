import type { SupabaseClient } from "@supabase/supabase-js";
import { scoreMatrixMatch } from "@/lib/matching/matrix-score";

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

function buildMatrixSummary(
  matrixScore: number,
  matchedCount: number,
  totalCount: number
): Pick<PlaceholderMatchScore, "match_summary" | "strengths" | "gaps"> {
  if (totalCount === 0) {
    return {
      match_summary:
        "[DEMO] No comparable 7^7 answers yet — complete the matching language form on the job and candidate profiles.",
      strengths: [],
      gaps: ["[DEMO] Matrix form incomplete"],
    };
  }

  return {
    match_summary: `[DEMO] 7^7 word match: ${matchedCount}/${totalCount} sub-levels aligned (${matrixScore}%).`,
    strengths:
      matchedCount > 0
        ? [`[DEMO] ${matchedCount} exact word match${matchedCount === 1 ? "" : "es"} at the same sub-level`]
        : [],
    gaps:
      totalCount - matchedCount > 0
        ? [
            `[DEMO] ${totalCount - matchedCount} sub-level${totalCount - matchedCount === 1 ? "" : "s"} with different word choices`,
          ]
        : [],
  };
}

function scoreFromMatrix(
  matrixScore: number,
  matchedCount: number,
  totalCount: number,
  index: number
): PlaceholderMatchScore {
  const profileScore = Math.max(0, matrixScore - 5 + (index % 3));
  const summary = buildMatrixSummary(matrixScore, matchedCount, totalCount);

  return {
    overall_score: matrixScore,
    matrix_score: matrixScore,
    profile_score: profileScore,
    skills_score: Math.max(0, matrixScore - 2),
    experience_score: Math.max(0, matrixScore - 4),
    education_score: Math.max(0, matrixScore - 6),
    ...summary,
  };
}

// Fallback when job matrix is empty — random demo ordering until forms are filled.
function generateFallbackScore(index: number): PlaceholderMatchScore {
  const base = 95 - index * 7 + Math.floor(Math.random() * 5);
  const score = Math.max(45, Math.min(98, base));

  return {
    overall_score: score,
    matrix_score: score - 3,
    profile_score: score - 5,
    skills_score: score - 2,
    experience_score: score - 4,
    education_score: score - 6,
    match_summary: `[DEMO] Placeholder match summary for ranking position ${index + 1}. Complete the 7^7 form for real word matching.`,
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
    .select("question_id, option_id")
    .eq("job_id", jobId);

  const { data: candidates } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("status", "ready_for_matching");

  if (!candidates?.length) {
    return { count: 0, results: [] };
  }

  const candidateIds = candidates.map((c) => c.id);
  const { data: candidateAnswers } = await supabase
    .from("candidate_matrix_answers")
    .select("candidate_id, question_id, option_id")
    .in("candidate_id", candidateIds);

  const answersByCandidate = new Map<string, { question_id: string; option_id: string | null }[]>();
  for (const row of candidateAnswers ?? []) {
    const list = answersByCandidate.get(row.candidate_id) ?? [];
    list.push({ question_id: row.question_id, option_id: row.option_id });
    answersByCandidate.set(row.candidate_id, list);
  }

  const jobHasMatrix = (jobAnswers ?? []).some((a) => a.option_id);
  const generatedAt = new Date().toISOString();

  await supabase.from("match_results").delete().eq("job_id", jobId);

  const results = candidates.map((candidate, index) => {
    let scores: PlaceholderMatchScore;

    if (jobHasMatrix) {
      const { matrixScore, matchedCount, totalCount } = scoreMatrixMatch(
        jobAnswers ?? [],
        answersByCandidate.get(candidate.id) ?? []
      );
      scores = scoreFromMatrix(matrixScore, matchedCount, totalCount, index);
    } else {
      scores = generateFallbackScore(index);
    }

    return {
      job_id: jobId,
      candidate_id: candidate.id,
      ...scores,
      ranking_position: index + 1,
      is_placeholder: true,
      generated_at: generatedAt,
    };
  });

  results.sort((a, b) => b.overall_score - a.overall_score);
  results.forEach((r, i) => {
    r.ranking_position = i + 1;
  });

  const topResults = results.slice(0, MATCH_DISPLAY_LIMIT);

  const { data: inserted, error } = await supabase
    .from("match_results")
    .insert(topResults)
    .select();

  if (error) throw error;

  return { count: inserted?.length ?? 0, results: inserted };
}

/** Top-ranked candidates stored and shown per match snapshot. */
export const MATCH_DISPLAY_LIMIT = 25;

export const UNLOCK_PRICE_CENTS = 4900;
export const UNLOCK_CURRENCY = "usd";
