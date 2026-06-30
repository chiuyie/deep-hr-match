"use server";

import { saveCandidateProfile as saveProfile } from "@/lib/candidate/actions";

export async function saveDraft(formData: FormData) {
  return saveProfile(formData, false);
}

export async function submitProfile(formData: FormData) {
  return saveProfile(formData, true);
}
