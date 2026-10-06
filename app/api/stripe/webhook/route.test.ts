import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/stripe/webhook/route";

const constructEvent = vi.fn();
const createServiceClient = vi.fn();
const handleVerifiedStripeEvent = vi.fn();
const captureException = vi.fn();

vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({
    webhooks: { constructEvent },
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => createServiceClient(),
}));

vi.mock("@/lib/payments/stripe-webhook", () => ({
  handleVerifiedStripeEvent: (...args: unknown[]) => handleVerifiedStripeEvent(...args),
}));

vi.mock("@/lib/observability/sentry", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

vi.mock("@/lib/observability/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function makeRequest(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers,
    body: "{}",
  }) as never;
}

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret_value";
  });

  it("returns 400 when signature is missing", async () => {
    const response = await POST(makeRequest());
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Missing signature" });
  });

  it("returns 400 when Stripe signature verification fails", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("bad sig");
    });

    const response = await POST(
      makeRequest({ "stripe-signature": "t=1,v1=abc" })
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "bad sig" });
  });

  it("returns handler status when unlock metadata is incomplete", async () => {
    constructEvent.mockReturnValue({ type: "checkout.session.completed" });
    createServiceClient.mockResolvedValue({});
    handleVerifiedStripeEvent.mockResolvedValue({
      ok: false,
      status: 400,
      error: "checkout.session.completed missing unlock metadata",
    });

    const response = await POST(
      makeRequest({ "stripe-signature": "t=1,v1=abc" })
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "checkout.session.completed missing unlock metadata",
    });
  });

  it("returns received true after successful fulfill", async () => {
    constructEvent.mockReturnValue({ type: "checkout.session.completed" });
    createServiceClient.mockResolvedValue({ tag: "service" });
    handleVerifiedStripeEvent.mockResolvedValue({ ok: true });

    const response = await POST(
      makeRequest({ "stripe-signature": "t=1,v1=abc" })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      received: true,
      ignored: false,
    });
    expect(handleVerifiedStripeEvent).toHaveBeenCalled();
  });
});
