import { NextRequest, NextResponse } from "next/server";
import { handleVerifiedStripeEvent } from "@/lib/payments/stripe-webhook";
import { getStripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability/logger";
import { captureException } from "@/lib/observability/sentry";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    logger.warn("stripe.webhook.missing_signature");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET.trim();
  if (!webhookSecret.startsWith("whsec_") || webhookSecret.includes("...")) {
    logger.error("stripe.webhook.invalid_secret_config");
    return NextResponse.json(
      {
        error:
          "STRIPE_WEBHOOK_SECRET must be a Stripe webhook signing secret (whsec_...). Run: npm run stripe:listen",
      },
      { status: 500 }
    );
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    logger.warn("stripe.webhook.signature_invalid", { message });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const supabase = await createServiceClient();
    const result = await handleVerifiedStripeEvent(event, supabase);
    if (result.ok === false) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ received: true, ignored: result.ignored ?? false });
  } catch (error) {
    await captureException(error, { area: "unlock", source: "stripe.webhook.route" });
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
