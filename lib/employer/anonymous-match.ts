import { anonymizeCandidateId } from "@/lib/auth/session";
import {
  buildAnonymousPreviewFields,
  isUnlockedContactFieldVisible,
} from "@/lib/employer/match-disclosure";
import type { FormFieldDefinition } from "@/lib/form-fields/types";
import type { AnonymousCandidateMatch } from "@/types/database";

type MatchResultLike = {
  candidate_id: string;
  ranking_position: number;
  overall_score: number | string;
  is_placeholder: boolean;
  match_summary?: string | null;
  strengths?: string[] | null;
  gaps?: string[] | null;
};

export function buildAnonymousCandidateMatches(options: {
  matchResults: MatchResultLike[];
  profilesById: Record<string, Record<string, unknown> | null | undefined>;
  candidateFields: FormFieldDefinition[];
  unlockedIds: string[];
}): AnonymousCandidateMatch[] {
  const { matchResults, profilesById, candidateFields, unlockedIds } = options;
  const showName = isUnlockedContactFieldVisible(candidateFields, "full_name");

  return matchResults.map((match) => {
    const profile = profilesById[match.candidate_id];
    const isUnlocked = unlockedIds.includes(match.candidate_id);
    const rawName =
      typeof profile?.full_name === "string" ? profile.full_name.trim() : "";
    return {
      id: match.candidate_id,
      anonymous_id: anonymizeCandidateId(match.candidate_id),
      display_name: isUnlocked && showName && rawName ? rawName : null,
      ranking_position: match.ranking_position,
      overall_score: Number(match.overall_score),
      is_placeholder: match.is_placeholder,
      preview_fields: buildAnonymousPreviewFields(candidateFields, profile),
      is_unlocked: isUnlocked,
      match_summary: match.match_summary ?? null,
      strengths: match.strengths ?? null,
      gaps: match.gaps ?? null,
    };
  });
}
