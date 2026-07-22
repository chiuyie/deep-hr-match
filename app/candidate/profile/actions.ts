"use server";

import { redirect } from "next/navigation";
import { saveCandidateProfileCore } from "@/lib/candidate/actions";
import { PROFILE_COMPLETION_THRESHOLD } from "@/lib/candidate/profile-sections";

export type ProfileFormState = {
  error?: string;
  saved?: boolean;
  completionPercentage?: number;
};

/** Quiet draft save used when advancing wizard pages — no redirect. */
export async function saveProfileStepDraft(
  formData: FormData
): Promise<ProfileFormState> {
  const result = await saveCandidateProfileCore(formData, false);
  if (result.error) {
    return { error: result.error };
  }
  return {
    saved: true,
    completionPercentage: result.completionPercentage,
  };
}

export async function profileFormAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const intent = formData.get("intent");
  const submit = intent === "submit";

  const result = await saveCandidateProfileCore(formData, submit);
  if (result.error) {
    return { error: result.error };
  }

  if (submit) {
    if ((result.completionPercentage ?? 0) < PROFILE_COMPLETION_THRESHOLD) {
      redirect(
        `/candidate/profile?error=profile-incomplete&completion=${result.completionPercentage ?? 0}`
      );
    }
    redirect("/candidate/cv?step=profile-complete");
  }

  redirect("/candidate/profile?saved=draft");
}
