export type PaymentsMode = "mock" | "stripe";

/**
 * Payment provider for candidate unlocks.
 * - `mock` (default) — instant paid + unlock, no Stripe. Use for local/UAT smoke tests.
 * - `stripe` — real Checkout + webhook. Set `PAYMENTS_MODE=stripe` plus Stripe env vars.
 */
export function getPaymentsMode(): PaymentsMode {
  const raw = process.env.PAYMENTS_MODE?.trim().toLowerCase();
  if (raw === "stripe") return "stripe";
  return "mock";
}

export function isMockPayments(): boolean {
  return getPaymentsMode() === "mock";
}
