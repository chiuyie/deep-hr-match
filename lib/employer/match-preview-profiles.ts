import { createClient, createServiceClient } from "@/lib/supabase/server";

const MATCH_PREVIEW_PROFILE_SELECT =
  "id, full_name, years_of_experience, highest_education, skills, custom_fields";

/**
 * Load candidate rows for employer match tables. Uses the service role so
 * anonymous previews still work after RLS restricts employee SELECT to unlocks.
 * Callers must run results through buildAnonymousCandidateMatches before UI.
 */
export async function loadMatchPreviewProfilesByIds(
  candidateIds: string[]
): Promise<Record<string, Record<string, unknown>>> {
  if (!candidateIds.length) return {};

  let client: Awaited<ReturnType<typeof createClient>>;
  try {
    client = await createServiceClient();
  } catch {
    client = await createClient();
  }

  const { data } = await client
    .from("candidate_profiles")
    .select(MATCH_PREVIEW_PROFILE_SELECT)
    .in("id", candidateIds);

  return Object.fromEntries(
    (data ?? []).map((profile) => [
      String((profile as { id: string }).id),
      profile as Record<string, unknown>,
    ])
  );
}
