import { afterEach, describe, expect, it, vi } from "vitest";

const originalFetch = globalThis.fetch;

describe("captureException", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it("logs locally and skips network when SENTRY_DSN is unset", async () => {
    vi.stubEnv("SENTRY_DSN", "");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as typeof fetch;

    const { captureException } = await import("@/lib/observability/sentry");
    await captureException(new Error("no dsn"), { area: "unlock" });

    expect(errorSpy).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts to Sentry store endpoint when DSN is configured", async () => {
    vi.resetModules();
    vi.stubEnv("SENTRY_DSN", "https://abc123@o123.ingest.sentry.io/456");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;

    const { captureException } = await import("@/lib/observability/sentry");
    await captureException(new Error("boom"), {
      area: "unlock",
      source: "test",
    });

    expect(fetchMock).toHaveBeenCalled();
    const call = fetchMock.mock.calls[0];
    expect(call).toBeTruthy();
    const [url, init] = call as unknown as [string, RequestInit];
    expect(url).toBe("https://o123.ingest.sentry.io/api/456/store/");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Sentry-Auth"]).toContain("sentry_key=abc123");
    const body = JSON.parse(String(init.body));
    expect(body.message).toBe("boom");
    expect(body.tags.area).toBe("unlock");
  });
});
