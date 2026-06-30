import { createClient } from "@/lib/supabase/server";

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
) {
  const unlocked = await hasCandidateUnlock(employerId, jobId, candidateId);
  if (!unlocked) {
    throw new Error("Candidate not unlocked");
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("id", candidateId)
    .single();

  const { data: cv } = await supabase
    .from("candidate_cv_files")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: matchResult } = await supabase
    .from("match_results")
    .select("*")
    .eq("job_id", jobId)
    .eq("candidate_id", candidateId)
    .maybeSingle();

  let cvDownloadUrl: string | null = null;
  if (cv?.file_path) {
    const { data: signed } = await supabase.storage
      .from("candidate-cvs")
      .createSignedUrl(cv.file_path, 3600);
    cvDownloadUrl = signed?.signedUrl ?? null;
  }

  return {
    profile,
    cv,
    cvDownloadUrl,
    matchResult,
  };
}
