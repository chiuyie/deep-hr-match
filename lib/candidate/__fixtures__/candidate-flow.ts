import type { CandidateOnboardingState } from "@/lib/candidate/onboarding";
import type { CandidateCvFile } from "@/types/database";
import type { CandidateDashboardStep } from "@/components/candidate/candidate-dashboard-view";

export function makeCandidateOnboardingState(
  overrides: Partial<CandidateOnboardingState> = {}
): CandidateOnboardingState {
  return {
    completionPercentage: 0,
    hasCv: false,
    hasMatrix: false,
    ...overrides,
  };
}

export function makeCandidateCvFile(overrides: Partial<CandidateCvFile> = {}): CandidateCvFile {
  return {
    id: "cv-1",
    candidate_id: "cand-1",
    file_name: "resume.pdf",
    file_url: "cand-1/123-resume.pdf",
    file_path: "cand-1/123-resume.pdf",
    file_type: "application/pdf",
    file_size: 1024,
    uploaded_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeDashboardSteps(
  overrides: Partial<Record<string, boolean>> = {}
): CandidateDashboardStep[] {
  const done = {
    profile: false,
    cv: false,
    matrix: false,
    status: false,
    ...overrides,
  };

  return [
    {
      id: "profile",
      label: "Complete profile",
      description: "Tell us about your experience",
      done: done.profile,
      href: "/candidate/profile",
      icon: () => null,
    },
    {
      id: "cv",
      label: "Upload CV",
      description: "Share your résumé",
      done: done.cv,
      href: "/candidate/cv",
      icon: () => null,
    },
    {
      id: "matrix",
      label: "7^7 form",
      description: "Complete matching language",
      done: done.matrix,
      href: "/candidate/matrix",
      icon: () => null,
    },
    {
      id: "status",
      label: "Go live",
      description: "Mark ready for matching",
      done: done.status,
      href: "/candidate/status",
      icon: () => null,
    },
  ];
}
