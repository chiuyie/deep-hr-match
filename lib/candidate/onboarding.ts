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

export function getAllowedOnboardingPaths(step: CandidateOnboardingStep): string[] {
  switch (step) {
    case "profile":
      return ["/candidate/profile"];
    case "cv":
      return ["/candidate/profile", "/candidate/cv"];
    case "matrix":
      return ["/candidate/profile", "/candidate/cv", "/candidate/matrix"];
    case "done":
      return [
        "/candidate",
        "/candidate/profile",
        "/candidate/cv",
        "/candidate/matrix",
        "/candidate/status",
      ];
  }
}

export function normalizeDashboardPath(path: string): string {
  const withoutQuery = path.split("?")[0]?.split("#")[0] ?? "";
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
}

export function isOnboardingPathAllowed(
  pathname: string,
  step: CandidateOnboardingStep
): boolean {
  if (step === "done") return true;
  const normalizedPath = normalizeDashboardPath(pathname);
  return getAllowedOnboardingPaths(step).includes(normalizedPath);
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
