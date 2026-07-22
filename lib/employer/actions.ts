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
import {
  buildDynamicProfileSchema,
  validateJobStateAgainstFormFields,
  validateRequiredCustomFields,
} from "@/lib/form-fields/validate-dynamic";
import { ensureFormFieldsReady, loadFormFields } from "@/lib/form-fields/queries";
import { extractCustomFields, stripCustomEntries } from "@/lib/form-fields/parse-custom";
import {
  formStateToJobPayload,
  parseJobFormState,
} from "@/lib/utils/job-form";
import { MATRIX_CATEGORY_TREE_SELECT, pickPrimaryMatrixCategory } from "@/lib/matching/matrix-queries";
import { filterSharedMatrixCategories } from "@/lib/matching/matrix-form";
import {
  toColumnAnswersMap,
  validateMatrixColumnSubmission,
} from "@/lib/matching/matrix-column-flow";
import {
  UNLOCK_CURRENCY,
  UNLOCK_PRICE_CENTS,
} from "@/lib/matching/engine";
import { triggerMatchRun } from "@/lib/matching/trigger";
import { fulfillUnlockPayment } from "@/lib/payments/fulfill-unlock";
import { isMockPayments } from "@/lib/payments/mode";
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

  await ensureFormFieldsReady();
  const fields = await loadFormFields({ audience: "employer", formGroup: "profile" });
  const schema = buildDynamicProfileSchema(fields);
  const parsed = schema.safeParse(stripCustomEntries(Object.fromEntries(formData)));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  const custom_fields = extractCustomFields(formData);
  const customCheck = validateRequiredCustomFields(fields, custom_fields);
  if (customCheck.ok === false) throw new Error(customCheck.message);

  const { error } = await supabase
    .from("employer_profiles")
    .update({ ...parsed.data, custom_fields })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/employer/company");
}

export async function saveJob(formData: FormData, jobId?: string): Promise<void> {
  const user = await requireRole("employer");
  const supabase = await createClient();
  const employerId = await getEmployerId(user.id);
  if (!employerId) throw new Error("Company profile not found");

  await ensureFormFieldsReady();
  const fields = await loadFormFields({ audience: "employer", formGroup: "job" });

  const formState = parseJobFormState(formData);
  const customFromForm = extractCustomFields(formData);
  const fieldValidation = validateJobStateAgainstFormFields(formState, fields, customFromForm);
  if (fieldValidation.ok === false) {
    throw new Error(fieldValidation.message);
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
    form_data: jobPayload.form_data,
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
  answers: {
    question_id: string;
    option_id?: string;
    answer_text?: string;
    matrix_column?: number;
  }[],
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
    await supabase.from("job_matrix_answers").upsert(
      {
        job_id: jobId,
        question_id: answer.question_id,
        option_id: answer.option_id ?? null,
        answer_text: answer.answer_text ?? null,
        matrix_column: matrixColumn,
      },
      { onConflict: "job_id,question_id,matrix_column" }
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
  const successPath =
    candidateIds.length === 1
      ? `/employer/jobs/${jobId}/unlocked/${candidateIds[0]}`
      : `/employer/jobs/${jobId}/unlocked`;

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

  // Mock path: no Stripe — mark paid + create unlocks immediately (UAT / local smoke).
  if (isMockPayments()) {
    const sessionId = `mock_${payment.id}`;
    const fulfilled = await fulfillUnlockPayment(supabase, {
      paymentId: payment.id,
      employerId,
      jobId,
      candidateIds,
      sessionId,
    });
    if (fulfilled.error) {
      return { error: fulfilled.error };
    }
    revalidatePath(`/employer/jobs/${jobId}/matching`);
    revalidatePath(`/employer/jobs/${jobId}/unlocked`);
    revalidatePath("/employer/unlocked");
    revalidatePath("/admin/payments");
    revalidatePath("/admin/unlocks");
    redirect(`${successPath}?session_id=${encodeURIComponent(sessionId)}&mock=1`);
  }

  const stripe = getStripe();
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
    success_url: `${getAppUrl()}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getAppUrl()}/employer/jobs/${jobId}/matching`,
  });

  await supabase
    .from("payments")
    .update({ stripe_session_id: session.id })
    .eq("id", payment.id);

  if (!session.url) return { error: "Failed to create checkout session" };
  redirect(session.url);
}
