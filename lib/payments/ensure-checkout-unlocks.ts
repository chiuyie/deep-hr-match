import type { SupabaseClient } from "@supabase/supabase-js";
import { fulfillUnlockPayment } from "@/lib/payments/fulfill-unlock";
import { getStripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/server";
import { toUserFacingMessage } from "@/lib/ui/readable-error";

export type EnsureCheckoutUnlockResult = {
  ready: boolean;
  unlockCount: number;
  error?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getFulfillClient(fallback: SupabaseClient): Promise<SupabaseClient> {
  try {
    return await createServiceClient();
  } catch {
    return fallback;
  }
}

/**
 * After Stripe Checkout redirects back, the webhook may still be in flight.
 * Resolve the payment by session id and fulfill unlocks if needed, then wait
 * briefly for unlock rows so the unlocked pages are not empty.
 */
export async function ensureUnlocksForCheckoutSession(
  supabase: SupabaseClient,
  options: {
    employerId: string;
    jobId: string;
    sessionId: string;
    /** When landing on a single-candidate page, wait until this candidate is unlocked. */
    candidateId?: string;
    attempts?: number;
    delayMs?: number;
  }
): Promise<EnsureCheckoutUnlockResult> {
  const {
    employerId,
    jobId,
    sessionId,
    candidateId,
    attempts = 6,
    delayMs = 700,
  } = options;

  if (!sessionId.trim()) {
    return { ready: false, unlockCount: 0 };
  }

  const fulfillClient = await getFulfillClient(supabase);

  // Mock checkout fulfills before redirect — still confirm unlock rows exist.
  if (sessionId.startsWith("mock_")) {
    const paymentId = sessionId.slice("mock_".length);
    const { data: payment } = await supabase
      .from("payments")
      .select("id, status, selected_candidate_ids")
      .eq("id", paymentId)
      .eq("employer_id", employerId)
      .eq("job_id", jobId)
      .maybeSingle();

    if (payment?.status !== "paid") {
      const candidateIds = Array.isArray(payment?.selected_candidate_ids)
        ? payment.selected_candidate_ids.map(String)
        : [];
      if (payment && candidateIds.length) {
        await fulfillUnlockPayment(fulfillClient, {
          paymentId: payment.id,
          employerId,
          jobId,
          candidateIds,
          sessionId,
        });
      }
    }
  } else {
    let { data: payment } = await supabase
      .from("payments")
      .select("id, status, selected_candidate_ids, stripe_session_id")
      .eq("employer_id", employerId)
      .eq("job_id", jobId)
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    // Fallback when stripe_session_id write lagged: resolve via Checkout Session metadata.
    if (!payment) {
      try {
        const session = await getStripe().checkout.sessions.retrieve(sessionId);
        const paymentId = session.metadata?.payment_id;
        if (paymentId) {
          const byId = await supabase
            .from("payments")
            .select("id, status, selected_candidate_ids, stripe_session_id")
            .eq("id", paymentId)
            .eq("employer_id", employerId)
            .eq("job_id", jobId)
            .maybeSingle();
          payment = byId.data;
        }

        if (payment && payment.status !== "paid") {
          const paid =
            session.payment_status === "paid" || session.status === "complete";
          if (paid) {
            const candidateIds = Array.isArray(payment.selected_candidate_ids)
              ? payment.selected_candidate_ids.map(String)
              : (session.metadata?.candidate_ids ?? "")
                  .split(",")
                  .map((id) => id.trim())
                  .filter(Boolean);
            if (candidateIds.length) {
              const fulfilled = await fulfillUnlockPayment(fulfillClient, {
                paymentId: payment.id,
                employerId,
                jobId,
                candidateIds,
                sessionId,
              });
              if (fulfilled.error) {
                return { ready: false, unlockCount: 0, error: fulfilled.error };
              }
            }
          }
        }
      } catch (error) {
        return {
          ready: false,
          unlockCount: 0,
          error: toUserFacingMessage(
            error instanceof Error ? error.message : undefined,
            { fallback: "We couldn’t confirm your unlock payment yet. Refresh in a moment." }
          ),
        };
      }
    } else if (payment.status !== "paid") {
      try {
        const session = await getStripe().checkout.sessions.retrieve(sessionId);
        const paid =
          session.payment_status === "paid" || session.status === "complete";
        if (paid) {
          const candidateIds = Array.isArray(payment.selected_candidate_ids)
            ? payment.selected_candidate_ids.map(String)
            : (session.metadata?.candidate_ids ?? "")
                .split(",")
                .map((id) => id.trim())
                .filter(Boolean);
          if (candidateIds.length) {
            const fulfilled = await fulfillUnlockPayment(fulfillClient, {
              paymentId: payment.id,
              employerId,
              jobId,
              candidateIds,
              sessionId,
            });
            if (fulfilled.error) {
              return { ready: false, unlockCount: 0, error: fulfilled.error };
            }
          }
        }
      } catch (error) {
        return {
          ready: false,
          unlockCount: 0,
          error: toUserFacingMessage(
            error instanceof Error ? error.message : undefined,
            { fallback: "We couldn’t confirm your unlock payment yet. Refresh in a moment." }
          ),
        };
      }
    }
  }

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let query = supabase
      .from("unlocks")
      .select("candidate_id")
      .eq("employer_id", employerId)
      .eq("job_id", jobId);

    if (candidateId) {
      query = query.eq("candidate_id", candidateId);
    }

    const { data } = await query;
    const unlockCount = data?.length ?? 0;
    const ready = candidateId ? unlockCount > 0 : unlockCount > 0;
    if (ready) {
      return { ready: true, unlockCount };
    }
    if (attempt < attempts - 1) {
      await sleep(delayMs);
    }
  }

  return {
    ready: false,
    unlockCount: 0,
    error:
      "Payment is processing. Refresh this page in a few seconds if unlocked profiles are not listed yet.",
  };
}
