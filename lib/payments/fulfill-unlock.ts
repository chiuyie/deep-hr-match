import type { SupabaseClient } from "@supabase/supabase-js";
import { toUserFacingMessage } from "@/lib/ui/readable-error";

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

  if (!paymentId || !employerId || !jobId || candidateIds.length === 0) {
    return { error: "Missing payment or candidate details" };
  }

  const { data: payment, error: loadError } = await supabase
    .from("payments")
    .select("id, employer_id, job_id, selected_candidate_ids, status")
    .eq("id", paymentId)
    .maybeSingle();

  if (loadError) {
    return {
      error: toUserFacingMessage(loadError.message, {
        fallback: "We couldn’t finish unlocking those profiles. Try again.",
      }),
    };
  }
  if (!payment) {
    return { error: "Payment not found" };
  }

  // Never trust Stripe metadata alone — it must match the pending payment row.
  if (payment.employer_id !== employerId || payment.job_id !== jobId) {
    return { error: "This payment does not match the unlock request." };
  }

  const storedIds = Array.isArray(payment.selected_candidate_ids)
    ? payment.selected_candidate_ids.map(String)
    : [];
  if (!sameIdSet(storedIds, candidateIds.map(String))) {
    return { error: "The candidate list does not match this payment." };
  }

  if (payment.status === "paid") {
    // Idempotent: still ensure unlock rows exist for this payment.
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
    return {
      error: toUserFacingMessage(unlockError.message, {
        fallback: "We couldn’t finish unlocking those profiles. Try again.",
      }),
    };
  }

  return {};
}
