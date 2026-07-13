import type { SupabaseClient } from "@supabase/supabase-js";

export type CandidateOnboardingStep = "profile" | "cv" | "matrix" | "done";

export interface CandidateOnboardingState {
  completionPercentage: number;
  hasCv: boolean;
  hasMatrix: boolean;
}

export function getOnboardingStep(state: CandidateOnboardingState): CandidateOnboardingStep {
  if (state.completionPercentage < 60) return "profile";
  if (!state.hasCv) return "cv";
  if (!state.hasMatrix) return "matrix";
  return "done";
}

export function getOnboardingPath(step: CandidateOnboardingStep): string {
  switch (step) {
    case "profile":
      return "/candidate/profile";
    case "cv":
      return "/candidate/cv";
    case "matrix":
      return "/candidate/matrix";
    case "done":
      return "/candidate";
  }
}

export function isOnboardingChecklistComplete(state: CandidateOnboardingState): boolean {
  return getOnboardingStep(state) === "done";
}

export async function fetchCandidateOnboardingState(
  supabase: SupabaseClient,
  userId: string
): Promise<CandidateOnboardingState> {
  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("id, completion_percentage")
    .eq("user_id", userId)
    .single();

  if (!profile?.id) {
    return { completionPercentage: 0, hasCv: false, hasMatrix: false };
  }

  const [{ count: cvCount }, { count: matrixCount }] = await Promise.all([
    supabase
      .from("candidate_cv_files")
      .select("*", { count: "exact", head: true })
      .eq("candidate_id", profile.id),
    supabase
      .from("candidate_matrix_answers")
      .select("*", { count: "exact", head: true })
      .eq("candidate_id", profile.id),
  ]);

  return {
    completionPercentage: profile.completion_percentage ?? 0,
    hasCv: (cvCount ?? 0) > 0,
    hasMatrix: (matrixCount ?? 0) > 0,
  };
}
