import type { EmployerJobListItem } from "@/lib/employer/job-list";
import type { AnonymousCandidateMatch } from "@/types/database";

export function makeEmployerJobListItem(
  overrides: Partial<EmployerJobListItem> = {}
): EmployerJobListItem {
  return {
    id: "job-1",
    title: "Software Engineer",
    location: "Singapore",
    department: "Engineering",
    employment_type: "Full-time",
    status: "active",
    created_at: "2026-01-01T00:00:00.000Z",
    matchCount: 3,
    unlockCount: 1,
    ...overrides,
  };
}

export function makeAnonymousCandidateMatch(
  overrides: Partial<AnonymousCandidateMatch> = {}
): AnonymousCandidateMatch {
  return {
    id: "cand-1",
    anonymous_id: "CAND-CAND0001",
    ranking_position: 1,
    overall_score: 88,
    is_placeholder: false,
    preview_fields: [
      { key: "years_of_experience", label: "Years of Experience", value: "5" },
    ],
    is_unlocked: false,
    match_summary: null,
    strengths: null,
    gaps: null,
    ...overrides,
  };
}
