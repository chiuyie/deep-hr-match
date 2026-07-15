"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { candidateProfileSchema } from "@/lib/validations/schemas";
import { extractCustomFields, stripCustomEntries } from "@/lib/form-fields/parse-custom";
import {
  calculateProfileCompletion,
  parseCommaList,
} from "@/lib/utils/profile";
import { fetchCandidateOnboardingState } from "@/lib/candidate/onboarding";
import {
  filterSharedMatrixCategories,
  validateMatrixSubmission,
} from "@/lib/matching/matrix-form";

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
    ? completion >= 60
      ? "incomplete"
      : "draft"
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

  const raw = stripCustomEntries(Object.fromEntries(formData.entries()));
  const parsed = candidateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message);
  }

  const custom_fields = extractCustomFields(formData);
  const payload = buildProfilePayload({ ...parsed.data, custom_fields }, submit);

  const { error } = await supabase
    .from("candidate_profiles")
    .update(payload)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/candidate");
  revalidatePath("/candidate/profile");
  revalidatePath("/candidate/status");

  if (submit) {
    if (payload.completion_percentage < 60) {
      redirect("/candidate/profile?error=profile-incomplete");
    }
    redirect("/candidate/cv?step=profile-complete");
  }
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

  await supabase.from("candidate_cv_files").insert({
    candidate_id: candidateId,
    file_name: file.name,
    file_url: path,
    file_path: path,
    file_type: file.type,
    file_size: file.size,
  });

  revalidatePath("/candidate/cv");
  revalidatePath("/candidate");
  revalidatePath("/candidate/status");

  redirect("/candidate/matrix?step=cv-complete");
}

export async function saveCandidateMatrixAnswers(
  answers: { question_id: string; option_id?: string; answer_text?: string }[],
  submit = false
): Promise<{ error?: string; success?: boolean; redirectTo?: string }> {
  const user = await requireRole("candidate");
  const supabase = await createClient();
  const candidateId = await getCandidateId(user.id);
  if (!candidateId) return { error: "Profile not found" };

  if (submit) {
    const { data: categories } = await supabase
      .from("matrix_categories")
      .select("*, matrix_questions(*, matrix_options(*))")
      .eq("is_active", true)
      .order("sort_order");

    const answerMap = Object.fromEntries(
      answers.map((a) => [
        a.question_id,
        { option_id: a.option_id, answer_text: a.answer_text },
      ])
    );

    const validationError = validateMatrixSubmission(
      filterSharedMatrixCategories(categories ?? []),
      answerMap
    );
    if (validationError) return { error: validationError };
  }

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

  revalidatePath("/candidate/matrix");
  revalidatePath("/candidate");
  revalidatePath("/candidate/status");

  if (submit) {
    return { success: true, redirectTo: "/candidate/status?matrix=complete" };
  }

  return { success: true };
}

export async function markCandidateReady(): Promise<void> {
  const user = await requireRole("candidate");
  const supabase = await createClient();

  const onboarding = await fetchCandidateOnboardingState(supabase, user.id);

  if (onboarding.completionPercentage < 60) {
    redirect("/candidate/status?error=profile");
  }
  if (!onboarding.hasCv) {
    redirect("/candidate/status?error=cv");
  }
  if (!onboarding.hasMatrix) {
    redirect(`/candidate/status?error=matrix`);
  }

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    redirect("/candidate/status?error=profile");
  }

  await supabase
    .from("candidate_profiles")
    .update({ status: "ready_for_matching" })
    .eq("id", profile.id);

  revalidatePath("/candidate");
  revalidatePath("/candidate/status");

  redirect("/candidate/status?success=ready");
}
