import type { SupabaseClient } from "@supabase/supabase-js";

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
    return { error: loadError.message };
  }
  if (!payment) {
    return { error: "Payment not found" };
  }

  // Never trust Stripe metadata alone — it must match the pending payment row.
  if (payment.employer_id !== employerId || payment.job_id !== jobId) {
    return { error: "Payment metadata does not match payment record" };
  }

  const storedIds = Array.isArray(payment.selected_candidate_ids)
    ? payment.selected_candidate_ids.map(String)
    : [];
  if (!sameIdSet(storedIds, candidateIds.map(String))) {
    return { error: "Payment candidate list does not match payment record" };
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
    return { error: paymentError.message };
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
    return { error: unlockError.message };
  }

  return {};
}
