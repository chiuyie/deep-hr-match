import { describe, expect, it } from "vitest";
import { anonymizeCandidateId } from "@/lib/auth/session";
import { buildAnonymousCandidateMatches } from "@/lib/employer/anonymous-match";
import { makeFormField } from "@/lib/form-fields/test-fixtures";

describe("buildAnonymousCandidateMatches", () => {
  const candidateFields = [
    makeFormField({
      field_key: "years_of_experience",
      label: "Years of Experience",
      show_on_anonymous_match: true,
    }),
    makeFormField({
      field_key: "email",
      label: "Email",
      show_on_anonymous_match: false,
    }),
  ];

  it("maps match rows into anonymous employer-facing candidates", () => {
    const results = buildAnonymousCandidateMatches({
      matchResults: [
        {
          candidate_id: "cand-abc12345",
          ranking_position: 2,
          overall_score: 91.5,
          is_placeholder: false,
          match_summary: "Strong fit",
          strengths: ["React"],
          gaps: ["Leadership"],
        },
      ],
      profilesById: {
        "cand-abc12345": { years_of_experience: 6, email: "hidden@example.com" },
      },
      candidateFields,
      unlockedIds: [],
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: "cand-abc12345",
      anonymous_id: anonymizeCandidateId("cand-abc12345"),
      ranking_position: 2,
      overall_score: 91.5,
      is_placeholder: false,
      is_unlocked: false,
      match_summary: "Strong fit",
      strengths: ["React"],
      gaps: ["Leadership"],
    });
    expect(results[0].preview_fields).toEqual([
      { key: "years_of_experience", label: "Years of Experience", value: "6" },
    ]);
  });

  it("marks unlocked candidates", () => {
    const results = buildAnonymousCandidateMatches({
      matchResults: [
        {
          candidate_id: "cand-1",
          ranking_position: 1,
          overall_score: 80,
          is_placeholder: false,
        },
      ],
      profilesById: { "cand-1": { years_of_experience: 4 } },
      candidateFields,
      unlockedIds: ["cand-1"],
    });

    expect(results[0].is_unlocked).toBe(true);
  });
});
