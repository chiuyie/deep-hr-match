import type { SupabaseClient } from "@supabase/supabase-js";
import { toUserFacingMessage } from "@/lib/ui/readable-error";
import { logger } from "@/lib/observability/logger";
import { captureException } from "@/lib/observability/sentry";

export type FulfillUnlockPaymentInput = {
  paymentId: string;
  employerId: string;
  jobId: string;
  candidateIds: string[];
  /** Stripe session id, or a mock session id like `mock_<paymentId>`. */
  sessionId: string;
};

function sameIdSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].map(String).sort();
  const right = [...b].map(String).sort();
  return left.every((id, index) => id === right[index]);
}

/** Mark payment paid and upsert unlock rows (shared by Stripe webhook + mock checkout). */
export async function fulfillUnlockPayment(
  supabase: SupabaseClient,
  input: FulfillUnlockPaymentInput
): Promise<{ error?: string }> {
  const { paymentId, employerId, jobId, candidateIds, sessionId } = input;

  logger.info("unlock.fulfill.start", {
    area: "unlock",
    paymentId,
    employerId,
    jobId,
    sessionId,
    candidateCount: candidateIds.length,
  });

  if (!paymentId || !employerId || !jobId || candidateIds.length === 0) {
    logger.warn("unlock.fulfill.missing_input", { paymentId, employerId, jobId });
    return { error: "Missing payment or candidate details" };
  }

  const { data: payment, error: loadError } = await supabase
    .from("payments")
    .select("id, employer_id, job_id, selected_candidate_ids, status")
    .eq("id", paymentId)
    .maybeSingle();

  if (loadError) {
    await captureException(loadError, {
      area: "unlock",
      source: "fulfill.load_payment",
      paymentId,
    });
    return {
      error: toUserFacingMessage(loadError.message, {
        fallback: "We couldn’t finish unlocking those profiles. Try again.",
      }),
    };
  }
  if (!payment) {
    logger.warn("unlock.fulfill.payment_not_found", { paymentId });
    return { error: "Payment not found" };
  }

  if (payment.employer_id !== employerId || payment.job_id !== jobId) {
    logger.warn("unlock.fulfill.metadata_mismatch", {
      paymentId,
      expectedEmployerId: payment.employer_id,
      gotEmployerId: employerId,
      expectedJobId: payment.job_id,
      gotJobId: jobId,
    });
    return { error: "This payment does not match the unlock request." };
  }

  const storedIds = Array.isArray(payment.selected_candidate_ids)
    ? payment.selected_candidate_ids.map(String)
    : [];
  if (!sameIdSet(storedIds, candidateIds.map(String))) {
    logger.warn("unlock.fulfill.candidate_mismatch", {
      paymentId,
      storedIds,
      candidateIds,
    });
    return { error: "The candidate list does not match this payment." };
  }

  if (payment.status === "paid") {
    logger.info("unlock.fulfill.idempotent_paid", { paymentId });
  }

  const { error: paymentError } = await supabase
    .from("payments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_session_id: sessionId,
    })
    .eq("id", paymentId)
    .eq("employer_id", employerId)
    .eq("job_id", jobId);

  if (paymentError) {
    await captureException(paymentError, {
      area: "unlock",
      source: "fulfill.update_payment",
      paymentId,
    });
    return {
      error: toUserFacingMessage(paymentError.message, {
        fallback: "We couldn’t finish unlocking those profiles. Try again.",
      }),
    };
  }

  const unlockRecords = storedIds.map((candidateId) => ({
    employer_id: payment.employer_id,
    job_id: payment.job_id,
    candidate_id: candidateId,
    payment_id: paymentId,
  }));

  const { error: unlockError } = await supabase.from("unlocks").upsert(unlockRecords, {
    onConflict: "employer_id,job_id,candidate_id",
    ignoreDuplicates: true,
  });

  if (unlockError) {
    await captureException(unlockError, {
      area: "unlock",
      source: "fulfill.upsert_unlocks",
      paymentId,
    });
    return {
      error: toUserFacingMessage(unlockError.message, {
        fallback: "We couldn’t finish unlocking those profiles. Try again.",
      }),
    };
  }

  logger.info("unlock.fulfill.success", {
    area: "unlock",
    paymentId,
    jobId,
    candidateCount: storedIds.length,
    sessionId,
  });

  return {};
}
