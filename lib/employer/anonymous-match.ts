import { anonymizeCandidateId } from "@/lib/auth/session";
import { buildAnonymousPreviewFields } from "@/lib/employer/match-disclosure";
import type { FormFieldDefinition } from "@/lib/form-fields/types";
import type { AnonymousCandidateMatch } from "@/types/database";

type MatchResultLike = {
  candidate_id: string;
  ranking_position: number;
  overall_score: number | string;
  is_placeholder: boolean;
};

export function buildAnonymousCandidateMatches(options: {
  matchResults: MatchResultLike[];
  profilesById: Record<string, Record<string, unknown> | null | undefined>;
  candidateFields: FormFieldDefinition[];
  unlockedIds: string[];
}): AnonymousCandidateMatch[] {
  const { matchResults, profilesById, candidateFields, unlockedIds } = options;

  return matchResults.map((match) => {
    const profile = profilesById[match.candidate_id];
    return {
      id: match.candidate_id,
      anonymous_id: anonymizeCandidateId(match.candidate_id),
      ranking_position: match.ranking_position,
      overall_score: Number(match.overall_score),
      is_placeholder: match.is_placeholder,
      preview_fields: buildAnonymousPreviewFields(candidateFields, profile),
      is_unlocked: unlockedIds.includes(match.candidate_id),
    };
  });
}
