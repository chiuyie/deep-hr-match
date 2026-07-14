"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canRunMatching,
  getEmployerMatrixSubmitRedirect,
  runMatchingBlockedReason,
} from "@/lib/employer/job-rules";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { employerProfileSchema, jobSchema } from "@/lib/validations/schemas";
import {
  formStateToJobPayload,
  parseJobFormState,
} from "@/lib/utils/job-form";
import {
  filterSharedMatrixCategories,
  validateMatrixSubmission,
} from "@/lib/matching/matrix-form";
import {
  UNLOCK_CURRENCY,
  UNLOCK_PRICE_CENTS,
} from "@/lib/matching/engine";
import { triggerMatchRun } from "@/lib/matching/trigger";
import { getStripe, getAppUrl } from "@/lib/stripe/client";

async function getEmployerId(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();
  return data?.id;
}

export async function saveEmployerProfile(formData: FormData): Promise<void> {
  const user = await requireRole("employer");
  const supabase = await createClient();

  const parsed = employerProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  const { error } = await supabase
    .from("employer_profiles")
    .update(parsed.data)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/employer/company");
}

export async function saveJob(formData: FormData, jobId?: string): Promise<void> {
  const user = await requireRole("employer");
  const supabase = await createClient();
  const employerId = await getEmployerId(user.id);
  if (!employerId) throw new Error("Company profile not found");

  const formState = parseJobFormState(formData);
  const parsed = jobSchema.safeParse(formState);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message);
  }

  const jobPayload = formStateToJobPayload(formState);
  const payload = {
    title: jobPayload.title,
    description: jobPayload.description,
    department: jobPayload.department,
    location: jobPayload.location,
    employment_type: jobPayload.employment_type,
    salary_range: jobPayload.salary_range,
    years_experience_required: jobPayload.years_experience_required,
    education_required: jobPayload.education_required,
    required_skills: jobPayload.required_skills,
    preferred_skills: jobPayload.preferred_skills,
    status: jobPayload.status,
    employer_id: employerId,
  };

  if (jobId) {
    const { data: existing } = await supabase
      .from("jobs")
      .select("status")
      .eq("id", jobId)
      .eq("employer_id", employerId)
      .single();

    if (!existing) throw new Error("Job not found");
    if (existing.status !== "draft") {
      throw new Error(
        "Published jobs cannot be edited. Create a new posting or view the existing job."
      );
    }

    const { error } = await supabase.from("jobs").update(payload).eq("id", jobId);
    if (error) throw new Error(error.message);
    revalidatePath(`/employer/jobs/${jobId}`);
  } else {
    const { data, error } = await supabase.from("jobs").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    revalidatePath("/employer/jobs");
    redirect(`/employer/jobs/${data.id}`);
  }

  revalidatePath("/employer/jobs");
}

export async function uploadJobJD(formData: FormData, jobId: string): Promise<void> {
  const user = await requireRole("employer");
  const supabase = await createClient();
  const employerId = await getEmployerId(user.id);
  if (!employerId) throw new Error("Company profile not found");

  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("employer_id", employerId)
    .single();

  if (!job) throw new Error("Job not found");

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Please select a file");

  const path = `${jobId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("job-jds")
    .upload(path, file, { upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  await supabase.from("job_jd_files").insert({
    job_id: jobId,
    file_name: file.name,
    file_url: path,
    file_path: path,
    file_type: file.type,
    file_size: file.size,
  });

  revalidatePath(`/employer/jobs/${jobId}/jd`);
}

export async function saveJobMatrixAnswers(
  jobId: string,
  answers: { question_id: string; option_id?: string; answer_text?: string }[],
  submit = false
) {
  const user = await requireRole("employer");
  const supabase = await createClient();
  const employerId = await getEmployerId(user.id);
  if (!employerId) return { error: "Company profile not found" };

  const { data: job } = await supabase
    .from("jobs")
    .select("id, status")
    .eq("id", jobId)
    .eq("employer_id", employerId)
    .single();

  if (!job) return { error: "Job not found" };

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
    await supabase.from("job_matrix_answers").upsert(
      {
        job_id: jobId,
        question_id: answer.question_id,
        option_id: answer.option_id ?? null,
        answer_text: answer.answer_text ?? null,
      },
      { onConflict: "job_id,question_id" }
    );
  }

  revalidatePath(`/employer/jobs/${jobId}/matrix`);
  revalidatePath(`/employer/jobs/${jobId}`);
  revalidatePath(`/employer/jobs/${jobId}/matching`);

  if (submit) {
    return {
      success: true,
      redirectTo: getEmployerMatrixSubmitRedirect(jobId, job.status),
    };
  }

  return { success: true };
}

export async function generateMatchingResults(jobId: string): Promise<void> {
  const user = await requireRole("employer");
  const supabase = await createClient();
  const employerId = await getEmployerId(user.id);
  if (!employerId) throw new Error("Company profile not found");

  const { data: job } = await supabase
    .from("jobs")
    .select("status")
    .eq("id", jobId)
    .eq("employer_id", employerId)
    .single();

  if (!job) throw new Error("Job not found");

  const { count: matchCount } = await supabase
    .from("match_results")
    .select("*", { count: "exact", head: true })
    .eq("job_id", jobId);

  const lifecycle = {
    status: job.status,
    hasMatches: (matchCount ?? 0) > 0,
  };

  const blocked = runMatchingBlockedReason(lifecycle);
  if (blocked || !canRunMatching(lifecycle)) {
    throw new Error(blocked ?? "Matching cannot be run for this job.");
  }

  await triggerMatchRun(supabase, {
    jobId,
    employerId,
  });
  revalidatePath(`/employer/jobs/${jobId}/matching`);
}

export async function createUnlockCheckout(jobId: string, candidateIds: string[]) {
  const user = await requireRole("employer");
  const supabase = await createClient();
  const employerId = await getEmployerId(user.id);
  if (!employerId) return { error: "Company profile not found" };

  if (!candidateIds.length) {
    return { error: "Select at least one candidate" };
  }

  const amount = UNLOCK_PRICE_CENTS * candidateIds.length;
  const stripe = getStripe();

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      employer_id: employerId,
      job_id: jobId,
      selected_candidate_ids: candidateIds,
      amount,
      currency: UNLOCK_CURRENCY,
      status: "pending",
      payment_type: "candidate_profile_unlock",
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    return { error: paymentError?.message ?? "Failed to create payment" };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: UNLOCK_CURRENCY,
          product_data: {
            name: "Candidate Profile Unlock",
            description: `Unlock ${candidateIds.length} candidate profile(s) — Deep HR Match`,
          },
          unit_amount: UNLOCK_PRICE_CENTS,
        },
        quantity: candidateIds.length,
      },
    ],
    metadata: {
      payment_id: payment.id,
      employer_id: employerId,
      job_id: jobId,
       candidate_ids: candidateIds.join(","),
    },
    success_url: `${getAppUrl()}/employer/jobs/${jobId}/unlocked?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getAppUrl()}/employer/jobs/${jobId}/matching`,
  });

  await supabase
    .from("payments")
    .update({ stripe_session_id: session.id })
    .eq("id", payment.id);

  if (!session.url) return { error: "Failed to create checkout session" };
  redirect(session.url);
}
