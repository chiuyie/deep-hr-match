import { describe, expect, it } from "vitest";
import { ageRangeFromDateOfBirth } from "@/lib/matching/age-range";

const today = new Date(2026, 9, 12);

describe("ageRangeFromDateOfBirth", () => {
  it("maps a date of birth onto the employer age bands", () => {
    expect(ageRangeFromDateOfBirth("1998-01-01", today)).toBe("26-30");
    expect(ageRangeFromDateOfBirth("2008-10-12", today)).toBe("18-25");
    expect(ageRangeFromDateOfBirth("1966-10-13", today)).toBe("56-60");
    expect(ageRangeFromDateOfBirth("1965-10-12", today)).toBe("60+");
  });

  it("returns null when the date is missing or under 18", () => {
    expect(ageRangeFromDateOfBirth("", today)).toBeNull();
    expect(ageRangeFromDateOfBirth("2010-10-12", today)).toBeNull();
  });
});
