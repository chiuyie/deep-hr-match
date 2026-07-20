import { describe, expect, it, afterEach } from "vitest";
import { getPaymentsMode, isMockPayments } from "@/lib/payments/mode";

describe("payments mode", () => {
  const original = process.env.PAYMENTS_MODE;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.PAYMENTS_MODE;
    } else {
      process.env.PAYMENTS_MODE = original;
    }
  });

  it("defaults to mock", () => {
    delete process.env.PAYMENTS_MODE;
    expect(getPaymentsMode()).toBe("mock");
    expect(isMockPayments()).toBe(true);
  });

  it("uses stripe when PAYMENTS_MODE=stripe", () => {
    process.env.PAYMENTS_MODE = "stripe";
    expect(getPaymentsMode()).toBe("stripe");
    expect(isMockPayments()).toBe(false);
  });
});
