import { describe, expect, it } from "vitest";
import { classifySignUpError } from "@/lib/auth/signup-errors";

describe("classifySignUpError", () => {
  it("maps duplicate emails", () => {
    expect(classifySignUpError("User already registered").error).toBe("email-exists");
  });

  it("maps rate limits", () => {
    expect(classifySignUpError("Email rate limit exceeded", "over_email_send_rate_limit").error).toBe(
      "rate-limit"
    );
  });

  it("keeps the provider reason for unknown failures", () => {
    const result = classifySignUpError("Hook requires a verified phone number", "hook_error");
    expect(result.error).toBe("signup-failed");
    expect(result.detail).toBe("Hook requires a verified phone number");
  });

  it("hides internal database dumps", () => {
    const result = classifySignUpError(
      'duplicate key value violates unique constraint "users_email_key"',
      "23505"
    );
    expect(result.error).toBe("signup-failed");
    expect(result.detail).toBe("The sign-up service rejected the request (23505).");
  });
});
