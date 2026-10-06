import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { fulfillUnlockPayment } from "@/lib/payments/fulfill-unlock";
import { logger } from "@/lib/observability/logger";
import { captureException, captureMessage } from "@/lib/observability/sentry";
import type { SupabaseClient } from "@supabase/supabase-js";

export type StripeWebhookHandleResult =
  | { ok: true; ignored?: boolean }
  | { ok: false; status: number; error: string };

/**
 * Pure-ish handler for verified Stripe events (signature already checked).
 * Extracted so webhook route + unit tests share the same production path.
 */
export async function handleVerifiedStripeEvent(
  event: Stripe.Event,
  supabase: SupabaseClient
): Promise<StripeWebhookHandleResult> {
  if (event.type !== "checkout.session.completed") {
    logger.info("stripe.webhook.ignored_event", { type: event.type, id: event.id });
    return { ok: true, ignored: true };
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const paymentId = session.metadata?.payment_id;
  const employerId = session.metadata?.employer_id;
  const jobId = session.metadata?.job_id;
  const candidateIds = session.metadata?.candidate_ids?.split(",").filter(Boolean) ?? [];

  logger.info("stripe.webhook.checkout_completed", {
    area: "unlock",
    eventId: event.id,
    sessionId: session.id,
    paymentId,
    employerId,
    jobId,
    candidateCount: candidateIds.length,
  });

  if (!paymentId || !employerId || !jobId || !candidateIds.length) {
    await captureMessage("stripe.webhook.missing_unlock_metadata", {
      area: "unlock",
      eventId: event.id,
      sessionId: session.id,
      paymentId,
      employerId,
      jobId,
      candidateIds,
    });
    return {
      ok: false,
      status: 400,
      error: "checkout.session.completed missing unlock metadata",
    };
  }

  const result = await fulfillUnlockPayment(supabase, {
    paymentId,
    employerId,
    jobId,
    candidateIds,
    sessionId: session.id,
  });

  if (result.error) {
    await captureException(new Error(result.error), {
      area: "unlock",
      source: "stripe.webhook",
      paymentId,
      employerId,
      jobId,
      sessionId: session.id,
    });
    return { ok: false, status: 500, error: result.error };
  }

  revalidatePath(`/employer/jobs/${jobId}/matching`);
  revalidatePath(`/employer/jobs/${jobId}/unlocked`);
  if (candidateIds.length === 1) {
    revalidatePath(`/employer/jobs/${jobId}/unlocked/${candidateIds[0]}`);
  }
  revalidatePath("/employer/unlocked");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/unlocks");

  logger.info("stripe.webhook.unlock_fulfilled", {
    area: "unlock",
    paymentId,
    jobId,
    candidateCount: candidateIds.length,
  });

  return { ok: true };
}
