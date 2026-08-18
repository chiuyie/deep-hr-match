import type { SupabaseClient } from "@supabase/supabase-js";
import {
  scoreMatrixMatch,
  type MatrixAnswerPick,
} from "@/lib/matching/matrix-score";

export interface MatchingInput {
  jobId: string;
  employerId: string;
}

export interface PlaceholderMatchScore {
  overall_score: number;
  matrix_score: number;
  profile_score: number | null;
  skills_score: number | null;
  experience_score: number | null;
  education_score: number | null;
  match_summary: string;
  strengths: string[];
  gaps: string[];
}

function buildMatrixSummary(
  matrixScore: number,
  matchedCount: number,
  totalCount: number,
  columnCount: number
): Pick<PlaceholderMatchScore, "match_summary" | "strengths" | "gaps"> {
  if (totalCount === 0) {
    return {
      match_summary:
        "No comparable 7^7 answers yet — complete the matching language form on the job and candidate profiles.",
      strengths: [],
      gaps: ["Matrix form incomplete"],
    };
  }

  return {
    match_summary: `7^7 match (equal column weights): ${matchedCount}/${totalCount} word picks aligned across ${columnCount} factor${columnCount === 1 ? "" : "s"} (${matrixScore}%).`,
    strengths:
      matchedCount > 0
        ? [
            `${matchedCount} exact word match${matchedCount === 1 ? "" : "es"} at the same factor column and level`,
          ]
        : [],
    gaps:
      totalCount - matchedCount > 0
        ? [
            `${totalCount - matchedCount} word pick${totalCount - matchedCount === 1 ? "" : "s"} differ between job and candidate`,
          ]
        : [],
  };
}

function scoreFromMatrix(
  matrixScore: number,
  matchedCount: number,
  totalCount: number,
  columnCount: number
): PlaceholderMatchScore {
  const summary = buildMatrixSummary(
    matrixScore,
    matchedCount,
    totalCount,
    columnCount
  );

  return {
    overall_score: matrixScore,
    matrix_score: matrixScore,
    // Profile / skills / experience / education stay unset until those signals are scored.
    profile_score: null,
    skills_score: null,
    experience_score: null,
    education_score: null,
    ...summary,
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
    .select("question_id, option_id, matrix_column")
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
    .select("candidate_id, question_id, option_id, matrix_column")
    .in("candidate_id", candidateIds);

  const answersByCandidate = new Map<string, MatrixAnswerPick[]>();
  for (const row of candidateAnswers ?? []) {
    const list = answersByCandidate.get(row.candidate_id) ?? [];
    list.push({
      question_id: row.question_id,
      option_id: row.option_id,
      matrix_column: row.matrix_column,
    });
    answersByCandidate.set(row.candidate_id, list);
  }

  const jobPicks: MatrixAnswerPick[] = (jobAnswers ?? []).map((a) => ({
    question_id: a.question_id,
    option_id: a.option_id,
    matrix_column: a.matrix_column,
  }));
  const jobHasMatrix = jobPicks.some((a) => a.option_id);
  if (!jobHasMatrix) {
    throw new Error(
      "Job has no 7^7 matching language answers. Complete the form before generating matches."
    );
  }

  const generatedAt = new Date().toISOString();

  const { error: deleteError } = await supabase
    .from("match_results")
    .delete()
    .eq("job_id", jobId);

  if (deleteError) {
    throw new Error(
      `Could not clear previous match snapshot: ${deleteError.message}`
    );
  }

  const results = candidates.map((candidate) => {
    const { matrixScore, matchedCount, totalCount, columnScores } = scoreMatrixMatch(
      jobPicks,
      answersByCandidate.get(candidate.id) ?? []
    );
    const scores = scoreFromMatrix(
      matrixScore,
      matchedCount,
      totalCount,
      columnScores.length
    );

    return {
      job_id: jobId,
      candidate_id: candidate.id,
      ...scores,
      ranking_position: 0,
      is_placeholder: false,
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
    .upsert(topResults, { onConflict: "job_id,candidate_id" })
    .select();

  if (error) throw error;

  return { count: inserted?.length ?? 0, results: inserted };
}

/** Top-ranked candidates stored and shown per match snapshot. */
export const MATCH_DISPLAY_LIMIT = 25;

export const UNLOCK_PRICE_CENTS = 4900;
export const UNLOCK_CURRENCY = "usd";
