import Stripe from "stripe";

/**
 * Stripe client for unlock Checkout.
 * Local / non-production must use test-mode keys (`sk_test_...`).
 */
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  const allowLive =
    process.env.STRIPE_ALLOW_LIVE === "true" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production";

  if (key.startsWith("sk_live_") && !allowLive) {
    throw new Error(
      "Live Stripe keys are blocked outside production. Use a test-mode secret key (sk_test_...) or set STRIPE_ALLOW_LIVE=true."
    );
  }

  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_")) {
    throw new Error(
      "STRIPE_SECRET_KEY must be a Stripe secret key (sk_test_... for test mode, or sk_live_... in production)."
    );
  }

  if (key === "sk_test_..." || key.includes("...")) {
    throw new Error(
      "STRIPE_SECRET_KEY is still a placeholder. Paste your Stripe test secret key from https://dashboard.stripe.com/test/apikeys"
    );
  }

  return new Stripe(key);
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** True when the configured Stripe secret is test-mode. */
export function isStripeTestMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  return key.startsWith("sk_test_");
}
