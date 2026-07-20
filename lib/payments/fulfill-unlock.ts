import type { SupabaseClient } from "@supabase/supabase-js";

export type FulfillUnlockPaymentInput = {
  paymentId: string;
  employerId: string;
  jobId: string;
  candidateIds: string[];
  /** Stripe session id, or a mock session id like `mock_<paymentId>`. */
  sessionId: string;
};

/** Mark payment paid and upsert unlock rows (shared by Stripe webhook + mock checkout). */
export async function fulfillUnlockPayment(
  supabase: SupabaseClient,
  input: FulfillUnlockPaymentInput
): Promise<{ error?: string }> {
  const { paymentId, employerId, jobId, candidateIds, sessionId } = input;

  if (!paymentId || !employerId || !jobId || candidateIds.length === 0) {
    return { error: "Missing payment or candidate details" };
  }

  const { error: paymentError } = await supabase
    .from("payments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_session_id: sessionId,
    })
    .eq("id", paymentId);

  if (paymentError) {
    return { error: paymentError.message };
  }

  const unlockRecords = candidateIds.map((candidateId) => ({
    employer_id: employerId,
    job_id: jobId,
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
