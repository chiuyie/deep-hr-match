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
  userId: string,
  profileHint?: { id: string; completion_percentage?: number | null } | null
): Promise<CandidateOnboardingState> {
  let profileId = profileHint?.id;
  let completionPercentage = profileHint?.completion_percentage ?? 0;

  if (!profileId) {
    const { data: profile } = await supabase
      .from("candidate_profiles")
      .select("id, completion_percentage")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile?.id) {
      return { completionPercentage: 0, hasCv: false, hasMatrix: false };
    }
    profileId = profile.id;
    completionPercentage = profile.completion_percentage ?? 0;
  }

  const [{ count: cvCount }, { count: matrixCount }] = await Promise.all([
    supabase
      .from("candidate_cv_files")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", profileId),
    supabase
      .from("candidate_matrix_answers")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", profileId),
  ]);

  return {
    completionPercentage,
    hasCv: (cvCount ?? 0) > 0,
    hasMatrix: (matrixCount ?? 0) > 0,
  };
}
