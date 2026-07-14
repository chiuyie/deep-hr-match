import { describe, expect, it, afterEach } from "vitest";
import { resolveMatchingEngineMode } from "@/lib/matching/trigger";

describe("matching engine trigger", () => {
  const originalUrl = process.env.MATCHING_ENGINE_URL;

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.MATCHING_ENGINE_URL;
    } else {
      process.env.MATCHING_ENGINE_URL = originalUrl;
    }
  });

  it("uses inline placeholder when MATCHING_ENGINE_URL is unset", () => {
    delete process.env.MATCHING_ENGINE_URL;
    expect(resolveMatchingEngineMode()).toBe("inline");
  });

  it("uses external engine when MATCHING_ENGINE_URL is set", () => {
    process.env.MATCHING_ENGINE_URL = "https://matching.example.com";
    expect(resolveMatchingEngineMode()).toBe("external");
  });
});
