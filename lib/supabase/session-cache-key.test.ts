import { describe, expect, it } from "vitest";
import { buildAuthSessionCacheKey } from "@/lib/supabase/session-cache-key";
import { parseForwardedSession } from "@/lib/auth/parse-forwarded-session";

const JWT_HEADER = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";

function fakeJwt(payloadStart: string, signature: string) {
  return `${JWT_HEADER}.${payloadStart}.${signature}`;
}

describe("buildAuthSessionCacheKey", () => {
  it("returns empty when no auth cookies", () => {
    expect(buildAuthSessionCacheKey([{ name: "other", value: "x" }])).toBe("");
  });

  it("does not collide for two JWTs that share the same header prefix", () => {
    const candidate = fakeJwt(
      "eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxLCJzdWIiOiJjYW5kLTEifQ",
      "sig-candidate-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );
    const employer = fakeJwt(
      "eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxLCJzdWIiOiJlbXAtMSJ9",
      "sig-employer-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    );

    expect(candidate.slice(0, 64)).toBe(employer.slice(0, 64));

    const candidateKey = buildAuthSessionCacheKey([
      { name: "sb-xyz-auth-token", value: candidate },
    ]);
    const employerKey = buildAuthSessionCacheKey([
      { name: "sb-xyz-auth-token", value: employer },
    ]);

    expect(candidateKey).not.toBe(employerKey);
    expect(candidateKey.startsWith("h")).toBe(true);
  });
});

describe("parseForwardedSession trust rules", () => {
  const validRow = {
    id: "user-db-1",
    auth_user_id: "auth-1",
    role: "employer" as const,
    name: "Acme",
    email: "e@example.com",
    created_at: "",
    updated_at: "",
  };

  it("accepts session JSON only when auth_user_id matches forwarded id", () => {
    expect(parseForwardedSession(JSON.stringify(validRow), "auth-1")).toEqual(validRow);
  });

  it("rejects spoofed admin session when auth ids differ", () => {
    const spoofed = {
      ...validRow,
      role: "admin" as const,
      auth_user_id: "attacker",
    };
    expect(parseForwardedSession(JSON.stringify(spoofed), "auth-1")).toBeNull();
  });

  it("rejects session JSON when forwarded auth id is missing", () => {
    expect(parseForwardedSession(JSON.stringify(validRow), null)).toBeNull();
    expect(parseForwardedSession(JSON.stringify(validRow), "")).toBeNull();
  });
});
