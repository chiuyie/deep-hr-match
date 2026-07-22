"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { extractCustomFields, stripCustomEntries } from "@/lib/form-fields/parse-custom";
import { buildDynamicProfileSchema, validateRequiredCustomFields, normalizeCandidateProfilePayload } from "@/lib/form-fields/validate-dynamic";
import { ensureFormFieldsReady, loadFormFields } from "@/lib/form-fields/queries";
import {
  calculateProfileCompletion,
} from "@/lib/utils/profile";
import {
  parseLanguageEntriesInput,
  parseStringArrayInput,
  validateCertificationsList,
  validateLanguagesList,
  validateSkillsList,
} from "@/lib/form-fields/profile-tags";
import { fetchCandidateOnboardingState } from "@/lib/candidate/onboarding";
import { MATRIX_CATEGORY_TREE_SELECT, pickPrimaryMatrixCategory } from "@/lib/matching/matrix-queries";
import { filterSharedMatrixCategories } from "@/lib/matching/matrix-form";
import {
  toColumnAnswersMap,
  validateMatrixColumnSubmission,
} from "@/lib/matching/matrix-column-flow";

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

  const skillsResult = validateSkillsList(data.skills);
  const certsResult = validateCertificationsList(data.certifications);
  // Draft saves drop unknown legacy language names so wizard Next isn't blocked;
  // aliases (e.g. Mandarin → Mandarin Chinese) apply on every save.
  const langsResult = validateLanguagesList(data.languages, { dropUnknown: !submit });

  return {
    ...data,
    skills: skillsResult.ok === true ? skillsResult.value : parseStringArrayInput(data.skills),
    certifications:
      certsResult.ok === true ? certsResult.value : parseStringArrayInput(data.certifications),
    languages:
      langsResult.ok === true ? langsResult.value : parseLanguageEntriesInput(data.languages),
    completion_percentage: completion,
    status,
  };
}

export async function saveCandidateProfile(formData: FormData, submit = false): Promise<void> {
  const result = await saveCandidateProfileCore(formData, submit);
  if (result.error) throw new Error(result.error);

  if (submit) {
    if ((result.completionPercentage ?? 0) < 60) {
      redirect("/candidate/profile?error=profile-incomplete");
    }
    redirect("/candidate/cv?step=profile-complete");
  }
}

export type SaveCandidateProfileResult = {
  error?: string;
  completionPercentage?: number;
};

export async function saveCandidateProfileCore(
  formData: FormData,
  submit: boolean
): Promise<SaveCandidateProfileResult> {
  const user = await requireRole("candidate");
  const supabase = await createClient();

  await ensureFormFieldsReady();
  const fields = await loadFormFields({ audience: "candidate", formGroup: "profile" });
  // Draft saves (wizard Next / Save for later) allow incomplete later pages;
  // full submit still enforces required fields.
  const schemaOptions = { enforceRequired: submit };
  const schema = buildDynamicProfileSchema(fields, schemaOptions);
  const raw = stripCustomEntries(Object.fromEntries(formData.entries()));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile data" };
  }

  const custom_fields = extractCustomFields(formData);
  const customCheck = validateRequiredCustomFields(fields, custom_fields, schemaOptions);
  if (customCheck.ok === false) return { error: customCheck.message };
  const payload = buildProfilePayload(
    normalizeCandidateProfilePayload(
      {
        ...(parsed.data as Record<string, unknown>),
        custom_fields,
      },
      fields
    ),
    submit
  );

  const { error } = await supabase
    .from("candidate_profiles")
    .update(payload)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/candidate");
  revalidatePath("/candidate/profile");
  revalidatePath("/candidate/status");

  return { completionPercentage: payload.completion_percentage };
}

const CV_MAX_BYTES = 10 * 1024 * 1024;
const CV_ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);
const CV_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export type CandidateCvActionResult = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
  downloadUrl?: string;
};

function sanitizeCvFileName(name: string): string {
  const base = name.split(/[/\\]/).pop()?.trim() || "cv";
  return base.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 180);
}

function validateCvFile(file: File | null): string | null {
  if (!file || file.size === 0) return "Please choose a CV file to upload.";
  if (file.size > CV_MAX_BYTES) return "File is too large. Maximum size is 10MB.";
  const lower = file.name.toLowerCase();
  const hasAllowedExt = [...CV_ALLOWED_EXTENSIONS].some((ext) => lower.endsWith(ext));
  if (!hasAllowedExt) return "Use a PDF or Word file (.pdf, .doc, .docx).";
  if (file.type && !CV_ALLOWED_MIME_TYPES.has(file.type)) {
    // Some browsers send empty type for docx — extension check already passed.
    if (file.type !== "application/octet-stream") {
      return "Use a PDF or Word file (.pdf, .doc, .docx).";
    }
  }
  return null;
}

export async function uploadCandidateCV(
  formData: FormData
): Promise<CandidateCvActionResult> {
  const user = await requireRole("candidate");
  const supabase = await createClient();
  const file = formData.get("file");
  const stayOnPage = formData.get("stay") === "1";

  if (!(file instanceof File)) {
    return { error: "Please choose a CV file to upload." };
  }

  const validationError = validateCvFile(file);
  if (validationError) return { error: validationError };

  const candidateId = await getCandidateId(user.id);
  if (!candidateId) return { error: "Profile not found" };

  const safeName = sanitizeCvFileName(file.name);
  const path = `${candidateId}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from("candidate-cvs")
    .upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from("candidate_cv_files").insert({
    candidate_id: candidateId,
    file_name: safeName,
    file_url: path,
    file_path: path,
    file_type: file.type || null,
    file_size: file.size,
  });

  if (insertError) {
    await supabase.storage.from("candidate-cvs").remove([path]);
    return { error: insertError.message };
  }

  revalidatePath("/candidate/cv");
  revalidatePath("/candidate");
  revalidatePath("/candidate/status");

  if (stayOnPage) {
    return { success: true };
  }

  return { success: true, redirectTo: "/candidate/matrix?step=cv-complete" };
}

export async function deleteCandidateCV(
  fileId: string
): Promise<CandidateCvActionResult> {
  const user = await requireRole("candidate");
  const supabase = await createClient();
  const candidateId = await getCandidateId(user.id);
  if (!candidateId) return { error: "Profile not found" };
  if (!fileId) return { error: "Missing file id" };

  const { data: row, error: loadError } = await supabase
    .from("candidate_cv_files")
    .select("id, file_path")
    .eq("id", fileId)
    .eq("candidate_id", candidateId)
    .maybeSingle();

  if (loadError) return { error: loadError.message };
  if (!row) return { error: "CV file not found" };

  const { error: storageError } = await supabase.storage
    .from("candidate-cvs")
    .remove([row.file_path]);

  if (storageError) {
    // Still remove the DB row if the object is already gone.
    if (!/not found|404/i.test(storageError.message)) {
      return { error: storageError.message };
    }
  }

  const { error: deleteError } = await supabase
    .from("candidate_cv_files")
    .delete()
    .eq("id", row.id)
    .eq("candidate_id", candidateId);

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/candidate/cv");
  revalidatePath("/candidate");
  revalidatePath("/candidate/status");

  return { success: true };
}

export async function getCandidateCvDownloadUrl(
  fileId: string
): Promise<CandidateCvActionResult> {
  const user = await requireRole("candidate");
  const supabase = await createClient();
  const candidateId = await getCandidateId(user.id);
  if (!candidateId) return { error: "Profile not found" };
  if (!fileId) return { error: "Missing file id" };

  const { data: row, error: loadError } = await supabase
    .from("candidate_cv_files")
    .select("id, file_path")
    .eq("id", fileId)
    .eq("candidate_id", candidateId)
    .maybeSingle();

  if (loadError) return { error: loadError.message };
  if (!row) return { error: "CV file not found" };

  const { data: signed, error: signError } = await supabase.storage
    .from("candidate-cvs")
    .createSignedUrl(row.file_path, 3600);

  if (signError || !signed?.signedUrl) {
    return { error: signError?.message || "Could not create download link" };
  }

  return { success: true, downloadUrl: signed.signedUrl };
}

export async function saveCandidateMatrixAnswers(
  answers: {
    question_id: string;
    option_id?: string;
    answer_text?: string;
    matrix_column?: number;
  }[],
  submit = false
): Promise<{ error?: string; success?: boolean; redirectTo?: string }> {
  const user = await requireRole("candidate");
  const supabase = await createClient();
  const candidateId = await getCandidateId(user.id);
  if (!candidateId) return { error: "Profile not found" };

  if (submit) {
    const { data: categories } = await supabase
      .from("matrix_categories")
      .select(MATRIX_CATEGORY_TREE_SELECT)
      .eq("is_active", true)
      .order("sort_order");

    const primary = pickPrimaryMatrixCategory(
      filterSharedMatrixCategories(categories ?? [])
    );
    if (!primary) return { error: "Matrix form is not configured" };

    const answerMap = toColumnAnswersMap(
      answers.map((a) => ({
        question_id: a.question_id,
        option_id: a.option_id,
        answer_text: a.answer_text,
        matrix_column: a.matrix_column,
      }))
    );

    const validationError = validateMatrixColumnSubmission(primary, answerMap);
    if (validationError) return { error: validationError };
  }

  for (const answer of answers) {
    const matrixColumn = answer.matrix_column && answer.matrix_column >= 1 ? answer.matrix_column : 0;
    await supabase.from("candidate_matrix_answers").upsert(
      {
        candidate_id: candidateId,
        question_id: answer.question_id,
        option_id: answer.option_id ?? null,
        answer_text: answer.answer_text ?? null,
        matrix_column: matrixColumn,
      },
      { onConflict: "candidate_id,question_id,matrix_column" }
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

export async function markCandidateReady(formData: FormData): Promise<void> {
  const user = await requireRole("candidate");
  const supabase = await createClient();

  if (formData.get("matching_consent") !== "on") {
    redirect("/candidate/status?error=consent");
  }

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
