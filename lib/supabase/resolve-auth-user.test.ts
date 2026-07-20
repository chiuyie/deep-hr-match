import { describe, expect, it } from "vitest";
import { isStaleRefreshTokenError } from "@/lib/supabase/resolve-auth-user";

describe("isStaleRefreshTokenError", () => {
  it("detects refresh_token_not_found", () => {
    expect(
      isStaleRefreshTokenError({
        name: "AuthApiError",
        message: "Invalid Refresh Token: Refresh Token Not Found",
        status: 400,
        code: "refresh_token_not_found",
      })
    ).toBe(true);
  });

  it("ignores unrelated auth errors", () => {
    expect(
      isStaleRefreshTokenError({
        name: "AuthApiError",
        message: "Invalid login credentials",
        status: 400,
        code: "invalid_credentials",
      })
    ).toBe(false);
  });
});
