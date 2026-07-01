"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { candidateProfileSchema } from "@/lib/validations/schemas";
import {
  calculateProfileCompletion,
  parseCommaList,
} from "@/lib/utils/profile";
import { FRAMEWORK_MATCHING_LANGUAGE } from "@/lib/constants/branding";

async function getCandidateId(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();
  return data?.id;
}

function buildProfilePayload(data: Record<string, unknown>, submit: boolean) {
  const completion = calculateProfileCompletion(data as never);
  const status = submit
    ? completion >= 80
      ? "ready_for_matching"
      : "incomplete"
    : "draft";

  return {
    ...data,
    skills: parseCommaList(data.skills as string),
    certifications: parseCommaList(data.certifications as string),
    languages: parseCommaList(data.languages as string),
    completion_percentage: completion,
    status,
  };
}

export async function saveCandidateProfile(formData: FormData, submit = false): Promise<void> {
  const user = await requireRole("candidate");
  const supabase = await createClient();

  const raw = Object.fromEntries(formData.entries());
  const parsed = candidateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message);
  }

  const payload = buildProfilePayload(parsed.data, submit);

  const { error } = await supabase
    .from("candidate_profiles")
    .update(payload)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/candidate");
}

export async function uploadCandidateCV(formData: FormData): Promise<void> {
  const user = await requireRole("candidate");
  const supabase = await createClient();
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    throw new Error("Please select a file");
  }

  const candidateId = await getCandidateId(user.id);
  if (!candidateId) throw new Error("Profile not found");

  const path = `${candidateId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("candidate-cvs")
    .upload(path, file, { upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = supabase.storage.from("candidate-cvs").getPublicUrl(path);

  await supabase.from("candidate_cv_files").insert({
    candidate_id: candidateId,
    file_name: file.name,
    file_url: urlData.publicUrl,
    file_path: path,
    file_type: file.type,
    file_size: file.size,
  });

  revalidatePath("/candidate/cv");
}

export async function saveCandidateMatrixAnswers(
  answers: { question_id: string; option_id?: string; answer_text?: string }[],
  submit = false
) {
  const user = await requireRole("candidate");
  const supabase = await createClient();
  const candidateId = await getCandidateId(user.id);
  if (!candidateId) return { error: "Profile not found" };

  for (const answer of answers) {
    await supabase.from("candidate_matrix_answers").upsert(
      {
        candidate_id: candidateId,
        question_id: answer.question_id,
        option_id: answer.option_id ?? null,
        answer_text: answer.answer_text ?? null,
      },
      { onConflict: "candidate_id,question_id" }
    );
  }

  if (submit) {
    const { data: profile } = await supabase
      .from("candidate_profiles")
      .select("*")
      .eq("id", candidateId)
      .single();

    if (profile && profile.completion_percentage >= 60) {
      await supabase
        .from("candidate_profiles")
        .update({ status: "ready_for_matching" })
        .eq("id", candidateId);
    }
  }

  revalidatePath("/candidate/matrix");
  revalidatePath("/candidate");
}

export async function markCandidateReady(): Promise<void> {
  const user = await requireRole("candidate");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const { data: cv } = await supabase
    .from("candidate_cv_files")
    .select("id")
    .eq("candidate_id", profile.id)
    .limit(1);

  const { data: answers } = await supabase
    .from("candidate_matrix_answers")
    .select("id")
    .eq("candidate_id", profile.id);

  if (!cv?.length) throw new Error("Please upload your CV first");
  if (!answers?.length) throw new Error(`Please complete the ${FRAMEWORK_MATCHING_LANGUAGE} form first`);

  await supabase
    .from("candidate_profiles")
    .update({ status: "ready_for_matching" })
    .eq("id", profile.id);

  revalidatePath("/candidate");
}
