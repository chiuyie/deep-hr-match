import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { CandidateCvFile, CandidateProfile, MatchResult } from "@/types/database";

export async function hasCandidateUnlock(
  employerId: string,
  jobId: string,
  candidateId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("unlocks")
    .select("id")
    .eq("employer_id", employerId)
    .eq("job_id", jobId)
    .eq("candidate_id", candidateId)
    .maybeSingle();
  return !!data;
}

export async function getUnlockedCandidateIds(
  employerId: string,
  jobId: string
): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("unlocks")
    .select("candidate_id")
    .eq("employer_id", employerId)
    .eq("job_id", jobId);
  return data?.map((u) => u.candidate_id) ?? [];
}

export async function getUnlockedCandidateDetails(
  employerId: string,
  jobId: string,
  candidateId: string
): Promise<{
  profile: CandidateProfile | null;
  cv: CandidateCvFile | null;
  cvDownloadUrl: string | null;
  matchResult: MatchResult | null;
}> {
  const unlocked = await hasCandidateUnlock(employerId, jobId, candidateId);
  if (!unlocked) {
    throw new Error("Candidate not unlocked");
  }

  const sessionSupabase = await createClient();

  let profile: CandidateProfile | null = null;
  let cv: CandidateCvFile | null = null;
  let matchResult: MatchResult | null = null;
  let cvDownloadUrl: string | null = null;

  try {
    const service = await createServiceClient();
    const [{ data: serviceProfile }, { data: serviceCv }, { data: serviceMatchResult }] =
      await Promise.all([
        service.from("candidate_profiles").select("*").eq("id", candidateId).maybeSingle(),
        service
          .from("candidate_cv_files")
          .select("*")
          .eq("candidate_id", candidateId)
          .order("uploaded_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        service
          .from("match_results")
          .select("*")
          .eq("job_id", jobId)
          .eq("candidate_id", candidateId)
          .maybeSingle(),
      ]);

    profile = (serviceProfile as CandidateProfile | null) ?? null;
    cv = (serviceCv as CandidateCvFile | null) ?? null;
    matchResult = (serviceMatchResult as MatchResult | null) ?? null;

    if (serviceCv?.file_path) {
      const { data: signed } = await service.storage
        .from("candidate-cvs")
        .createSignedUrl(serviceCv.file_path, 3600);
      cvDownloadUrl = signed?.signedUrl ?? null;
    }
  } catch {
    const [{ data: sessionProfile }, { data: sessionCv }, { data: sessionMatchResult }] =
      await Promise.all([
        sessionSupabase.from("candidate_profiles").select("*").eq("id", candidateId).maybeSingle(),
        sessionSupabase
          .from("candidate_cv_files")
          .select("*")
          .eq("candidate_id", candidateId)
          .order("uploaded_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        sessionSupabase
          .from("match_results")
          .select("*")
          .eq("job_id", jobId)
          .eq("candidate_id", candidateId)
          .maybeSingle(),
      ]);

    profile = (sessionProfile as CandidateProfile | null) ?? null;
    cv = (sessionCv as CandidateCvFile | null) ?? null;
    matchResult = (sessionMatchResult as MatchResult | null) ?? null;

    if (sessionCv?.file_path) {
      const { data: signed } = await sessionSupabase.storage
        .from("candidate-cvs")
        .createSignedUrl(sessionCv.file_path, 3600);
      cvDownloadUrl = signed?.signedUrl ?? null;
    }
  }

  return {
    profile,
    cv,
    cvDownloadUrl,
    matchResult,
  };
}

export async function getUnlockedCandidateDetailsBatch(
  employerId: string,
  jobId: string,
  candidateIds: string[]
): Promise<
  Array<{
    candidateId: string;
    profile: CandidateProfile | null;
    cv: CandidateCvFile | null;
    cvDownloadUrl: string | null;
    matchResult: MatchResult | null;
  }>
> {
  if (!candidateIds.length) return [];

  const sessionSupabase = await createClient();
  let source: Awaited<ReturnType<typeof createClient>> | Awaited<ReturnType<typeof createServiceClient>> =
    sessionSupabase;

  try {
    source = await createServiceClient();
  } catch {
    source = sessionSupabase;
  }

  const { data: unlocks } = await source
    .from("unlocks")
    .select("candidate_id")
    .eq("employer_id", employerId)
    .eq("job_id", jobId)
    .in("candidate_id", candidateIds);

  const allowedIds = new Set((unlocks ?? []).map((row) => row.candidate_id));
  const scopedCandidateIds = candidateIds.filter((candidateId) => allowedIds.has(candidateId));
  if (!scopedCandidateIds.length) return [];

  const [{ data: profiles }, { data: cvs }, { data: matchResults }] = await Promise.all([
    source.from("candidate_profiles").select("*").in("id", scopedCandidateIds),
    source
      .from("candidate_cv_files")
      .select("*")
      .in("candidate_id", scopedCandidateIds)
      .order("uploaded_at", { ascending: false }),
    source
      .from("match_results")
      .select("*")
      .eq("job_id", jobId)
      .in("candidate_id", scopedCandidateIds),
  ]);

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile as CandidateProfile]));
  const matchMap = new Map(
    (matchResults ?? []).map((matchResult) => [matchResult.candidate_id, matchResult as MatchResult])
  );
  const cvMap = new Map<string, CandidateCvFile>();

  for (const cv of cvs ?? []) {
    if (!cvMap.has(cv.candidate_id)) {
      cvMap.set(cv.candidate_id, cv as CandidateCvFile);
    }
  }

  const signedUrlEntries = await Promise.all(
    Array.from(cvMap.entries()).map(async ([candidateId, cv]) => {
      if (!cv.file_path) return [candidateId, null] as const;
      const { data: signed } = await source.storage
        .from("candidate-cvs")
        .createSignedUrl(cv.file_path, 3600);
      return [candidateId, signed?.signedUrl ?? null] as const;
    })
  );

  const signedUrlMap = new Map(signedUrlEntries);

  return scopedCandidateIds.map((candidateId) => ({
    candidateId,
    profile: profileMap.get(candidateId) ?? null,
    cv: cvMap.get(candidateId) ?? null,
    cvDownloadUrl: signedUrlMap.get(candidateId) ?? null,
    matchResult: matchMap.get(candidateId) ?? null,
  }));
}
