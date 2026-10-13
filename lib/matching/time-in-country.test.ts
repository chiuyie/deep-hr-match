import { describe, expect, it } from "vitest";
import { timeInCountryBand } from "@/lib/matching/time-in-country";

const today = new Date(2026, 9, 12);

describe("timeInCountryBand", () => {
  it("moves into a later band as time passes", () => {
    expect(timeInCountryBand("2022-10-12", today)).toBe("3-5 years");
    expect(timeInCountryBand("2026-08-01", today)).toBe("0-6 months");
    expect(timeInCountryBand("2010-01-01", today)).toBe("10+ years");
  });

  it("returns null for a missing or future date", () => {
    expect(timeInCountryBand("", today)).toBeNull();
    expect(timeInCountryBand("2026-12-01", today)).toBeNull();
  });
});
