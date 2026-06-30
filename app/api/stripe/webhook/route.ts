import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentId = session.metadata?.payment_id;
    const employerId = session.metadata?.employer_id;
    const jobId = session.metadata?.job_id;
    const candidateIds = session.metadata?.candidate_ids?.split(",").filter(Boolean) ?? [];

    if (paymentId && employerId && jobId && candidateIds.length) {
      const supabase = await createServiceClient();

      await supabase
        .from("payments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          stripe_session_id: session.id,
        })
        .eq("id", paymentId);

      const unlockRecords = candidateIds.map((candidateId) => ({
        employer_id: employerId,
        job_id: jobId,
        candidate_id: candidateId,
        payment_id: paymentId,
      }));

      await supabase.from("unlocks").upsert(unlockRecords, {
        onConflict: "employer_id,job_id,candidate_id",
        ignoreDuplicates: true,
      });
    }
  }

  return NextResponse.json({ received: true });
}
