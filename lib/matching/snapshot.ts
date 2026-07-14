import type { SupabaseClient } from "@supabase/supabase-js";

/** Human-readable notice when new candidates joined after the last snapshot. */
export function newCandidatesNotice(count: number): string | null {
  if (count <= 0) return null;
  if (count === 1) {
    return "1 new candidate has joined since this snapshot. Refresh matches to include them.";
  }
  return `${count} new candidates have joined since this snapshot. Refresh matches to include them.`;
}

/** All rows in a run share the same generated_at — use the first row as snapshot time. */
export function getSnapshotGeneratedAt(
  matchResults: { generated_at: string }[]
): string | null {
  if (!matchResults.length) return null;
  return matchResults[0].generated_at;
}

/**
 * Count candidates who became ready (or updated profile) after the last match run.
 * Uses updated_at as a proxy for "joined the matching pool" until a dedicated ready_at exists.
 */
export async function countNewReadyCandidatesSince(
  supabase: SupabaseClient,
  since: string
): Promise<number> {
  const { count, error } = await supabase
    .from("candidate_profiles")
    .select("*", { count: "exact", head: true })
    .eq("status", "ready_for_matching")
    .gt("updated_at", since);

  if (error) return 0;
  return count ?? 0;
}
