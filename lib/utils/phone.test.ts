import { describe, expect, it } from "vitest";
import {
  isValidPhoneNumber,
  normalizePhoneToE164,
  parseStoredPhone,
  phoneValidationMessage,
  resolvePhoneInput,
  stripDuplicateCallingCode,
  validateSubmittedPhone,
} from "@/lib/utils/phone";

describe("stripDuplicateCallingCode", () => {
  it("removes a duplicated Singapore dial code from the national field", () => {
    expect(stripDuplicateCallingCode("+65 9123 4567", "SG")).toBe("9123 4567");
    expect(stripDuplicateCallingCode("+6591234567", "SG")).toBe("91234567");
    expect(stripDuplicateCallingCode("006591234567", "SG")).toBe("91234567");
  });
});

describe("resolvePhoneInput — valid numbers", () => {
  const cases: Array<{ iso: "SG" | "MY" | "US" | "GB" | "CN" | "IN" | "KR" | "ID"; national: string; e164: string }> = [
    { iso: "SG", national: "91234567", e164: "+6591234567" },
    { iso: "SG", national: "8123 4567", e164: "+6581234567" },
    { iso: "MY", national: "012-345 6789", e164: "+60123456789" },
    { iso: "US", national: "2015550123", e164: "+12015550123" },
    { iso: "GB", national: "07400 123456", e164: "+447400123456" },
    { iso: "CN", national: "131 2345 6789", e164: "+8613123456789" },
    { iso: "IN", national: "8123456789", e164: "+918123456789" },
    { iso: "KR", national: "010-2000-0000", e164: "+821020000000" },
    { iso: "ID", national: "0812-345-678", e164: "+62812345678" },
  ];

  it.each(cases)("accepts $iso $national → $e164", ({ iso, national, e164 }) => {
    const result = resolvePhoneInput(national, iso);
    expect(result.valid).toBe(true);
    expect(result.e164).toBe(e164);
    expect(result.error).toBeNull();
  });
});

describe("resolvePhoneInput — invalid numbers", () => {
  it("rejects incomplete Singapore numbers", () => {
    const result = resolvePhoneInput("9123", "SG");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/too short/i);
  });

  it("rejects impossible Singapore numbers", () => {
    const result = resolvePhoneInput("11111111", "SG");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/not valid/i);
  });

  it("rejects a US number when Singapore is selected", () => {
    const result = resolvePhoneInput("2015550123", "SG");
    expect(result.valid).toBe(false);
  });

  it("rejects empty national after stripping a duplicated dial code", () => {
    const result = resolvePhoneInput("+65", "SG");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/country code/i);
  });
});

describe("pasted international numbers", () => {
  it("accepts a pasted E.164 Singapore number and sets the country", () => {
    const result = resolvePhoneInput("+65 9123 4567", "MY");
    expect(result.valid).toBe(true);
    expect(result.isoCode).toBe("SG");
    expect(result.e164).toBe("+6591234567");
    expect(result.nationalDisplay).not.toMatch(/\+65/);
  });

  it("accepts pasted compact E.164 for the US", () => {
    const result = resolvePhoneInput("+12015550123", "SG");
    expect(result.valid).toBe(true);
    expect(result.isoCode).toBe("US");
    expect(result.e164).toBe("+12015550123");
  });

  it("does not double-apply the country code when national already includes it", () => {
    const result = resolvePhoneInput("+6591234567", "SG");
    expect(result.valid).toBe(true);
    expect(result.e164).toBe("+6591234567");
  });

  it("rejects garbage international paste", () => {
    const result = resolvePhoneInput("+65+6591234567", "SG");
    expect(result.valid).toBe(false);
  });
});

describe("normalizePhoneToE164 / isValidPhoneNumber", () => {
  it("normalizes valid numbers from multiple countries to E.164", () => {
    expect(normalizePhoneToE164("+65 9123 4567")).toBe("+6591234567");
    expect(normalizePhoneToE164("012-345 6789", "MY")).toBe("+60123456789");
    expect(normalizePhoneToE164("+44 7400 123456")).toBe("+447400123456");
    expect(normalizePhoneToE164("+86 131 2345 6789")).toBe("+8613123456789");
    expect(normalizePhoneToE164("+91 81234 56789")).toBe("+918123456789");
    expect(normalizePhoneToE164("+82 10-2000-0000")).toBe("+821020000000");
    expect(normalizePhoneToE164("+62 812-345-678")).toBe("+62812345678");
    expect(normalizePhoneToE164("+1 201-555-0123")).toBe("+12015550123");
  });

  it("returns null for invalid numbers", () => {
    expect(normalizePhoneToE164("+65 12")).toBeNull();
    expect(normalizePhoneToE164("11111111", "SG")).toBeNull();
    expect(normalizePhoneToE164("not-a-phone")).toBeNull();
  });

  it("treats empty as valid (optional) and non-empty invalid as false", () => {
    expect(isValidPhoneNumber("")).toBe(true);
    expect(isValidPhoneNumber("+6591234567")).toBe(true);
    expect(isValidPhoneNumber("+65 12")).toBe(false);
  });
});

describe("parseStoredPhone", () => {
  it("hydrates UI state from E.164", () => {
    expect(parseStoredPhone("+6591234567")).toEqual({
      isoCode: "SG",
      dialCode: "+65",
      national: "9123 4567",
    });
  });
});

describe("validateSubmittedPhone", () => {
  it("requires a value when required", () => {
    expect(validateSubmittedPhone("", { required: true })).toEqual({
      ok: false,
      message: "Phone number is required.",
    });
  });

  it("accepts and returns E.164 for valid submissions", () => {
    expect(validateSubmittedPhone("+65 91234567")).toEqual({
      ok: true,
      e164: "+6591234567",
    });
  });

  it("rejects invalid submissions with a clear message", () => {
    const result = validateSubmittedPhone("+65 12");
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.message.length).toBeGreaterThan(0);
  });
});

describe("phoneValidationMessage", () => {
  it("explains required and invalid states", () => {
    expect(phoneValidationMessage("", "SG", { required: true })).toBe(
      "Phone number is required."
    );
    expect(phoneValidationMessage("+6591234567", "SG")).toBeNull();
    expect(phoneValidationMessage("9123", "SG")).toMatch(/too short/i);
  });
});
