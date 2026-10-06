import { describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/observability/logger";

describe("logger", () => {
  it("emits structured JSON with event and context", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    logger.info("unlock.checkout.start", { jobId: "job-1", area: "unlock" });
    expect(spy).toHaveBeenCalled();
    const payload = JSON.parse(String(spy.mock.calls[0][0]));
    expect(payload).toMatchObject({
      level: "info",
      event: "unlock.checkout.start",
      jobId: "job-1",
      area: "unlock",
    });
    expect(payload.ts).toBeTruthy();
    spy.mockRestore();
  });

  it("serializes Error instances on error logs", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logger.error("unlock.fail", { paymentId: "pay-1" }, new Error("boom"));
    const payload = JSON.parse(String(spy.mock.calls[0][0]));
    expect(payload.error).toMatchObject({
      name: "Error",
      message: "boom",
    });
    spy.mockRestore();
  });
});
