import { describe, expect, it } from "vitest";
import {
  isCandidateIdentityFieldLocked,
  preserveLockedCandidateIdentityFields,
} from "@/lib/candidate/lock-identity-fields";

describe("isCandidateIdentityFieldLocked", () => {
  it("locks full name and email once present", () => {
    expect(
      isCandidateIdentityFieldLocked("full_name", {
        full_name: "Ada Lovelace",
        email: "a@b.com",
      })
    ).toBe(true);
    expect(
      isCandidateIdentityFieldLocked("email", { full_name: "Ada", email: "a@b.com" })
    ).toBe(true);
    expect(
      isCandidateIdentityFieldLocked("full_name", { full_name: "", email: "a@b.com" })
    ).toBe(false);
    expect(isCandidateIdentityFieldLocked("phone", { full_name: "Ada", email: "a@b.com" })).toBe(
      false
    );
  });

  it("locks gender only after it is set", () => {
    expect(
      isCandidateIdentityFieldLocked("gender", {
        full_name: "Ada",
        email: "a@b.com",
        custom_fields: {},
      })
    ).toBe(false);
    expect(
      isCandidateIdentityFieldLocked("gender", {
        full_name: "Ada",
        email: "a@b.com",
        custom_fields: { gender: "Female" },
      })
    ).toBe(true);
  });
});

describe("preserveLockedCandidateIdentityFields", () => {
  it("keeps existing full name, email, and gender when already set", () => {
    const result = preserveLockedCandidateIdentityFields(
      {
        full_name: "Hacker Name",
        email: "hacker@evil.com",
        phone: "+6500000000",
        custom_fields: { gender: "Male", willing_overtime: "Yes" },
      },
      {
        full_name: "Ada Lovelace",
        email: "real@example.com",
        custom_fields: { gender: "Female", race: "Chinese" },
      }
    );

    expect(result.full_name).toBe("Ada Lovelace");
    expect(result.email).toBe("real@example.com");
    expect(result.phone).toBe("+6500000000");
    expect(result.custom_fields).toEqual({
      gender: "Female",
      race: "Chinese",
      willing_overtime: "Yes",
    });
  });

  it("allows first-time gender fills and phone updates", () => {
    const result = preserveLockedCandidateIdentityFields(
      {
        full_name: "Ada Lovelace",
        email: "a@b.com",
        phone: "+6592222222",
        custom_fields: { gender: "Other" },
      },
      {
        full_name: "Ada Lovelace",
        email: "a@b.com",
        custom_fields: {},
      }
    );

    expect(result.full_name).toBe("Ada Lovelace");
    expect(result.email).toBe("a@b.com");
    expect(result.phone).toBe("+6592222222");
    expect((result.custom_fields as Record<string, unknown>).gender).toBe("Other");
  });
});
