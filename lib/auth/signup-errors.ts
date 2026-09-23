import { toUserFacingMessage } from "@/lib/ui/readable-error";

export type SignUpErrorCode =
  | "invalid"
  | "email-exists"
  | "weak-password"
  | "signup-disabled"
  | "database-setup"
  | "setup-failed"
  | "rate-limit"
  | "invalid-email"
  | "email-send-failed"
  | "signup-failed";

export type ClassifiedSignUpError = {
  error: SignUpErrorCode;
  /** Short user-facing reason from the auth provider, when we don't have a dedicated message. */
  detail?: string;
};

const MAX_DETAIL = 220;

/** Keep provider messages that are already written for users; drop dumps. */
export function publicAuthErrorDetail(message: string, code?: string): string | undefined {
  const cleaned = message
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const lower = cleaned.toLowerCase();

  const looksInternal =
    !cleaned ||
    cleaned.length > MAX_DETAIL ||
    lower.includes("stack") ||
    lower.includes("postgres") ||
    lower.includes("sqlstate") ||
    lower.includes("duplicate key") ||
    lower.includes("violates") ||
    /\b(select|insert|update)\b/i.test(cleaned);

  if (looksInternal) {
    return code ? `The sign-up service rejected the request (${code}).` : undefined;
  }

  return toUserFacingMessage(cleaned, {
    fallback: "Check your details and try again.",
  });
}

export function classifySignUpError(
  message: string,
  code?: string,
  status?: number
): ClassifiedSignUpError {
  const normalized = message.toLowerCase();
  const normalizedCode = (code ?? "").toLowerCase();

  if (
    normalized.includes("already registered") ||
    normalized.includes("already exists") ||
    normalized.includes("user already") ||
    normalizedCode === "user_already_exists"
  ) {
    return { error: "email-exists" };
  }

  if (
    normalized.includes("rate limit") ||
    normalized.includes("too many") ||
    normalized.includes("only request this") ||
    normalizedCode.includes("rate_limit")
  ) {
    return { error: "rate-limit" };
  }

  if (
    normalized.includes("password") ||
    normalized.includes("weak") ||
    normalizedCode === "weak_password"
  ) {
    return {
      error: "weak-password",
      detail: publicAuthErrorDetail(message),
    };
  }

  if (
    normalized.includes("invalid format") ||
    normalized.includes("invalid email") ||
    normalized.includes("unable to validate email") ||
    normalizedCode === "email_address_invalid"
  ) {
    return { error: "invalid-email" };
  }

  if (
    normalized.includes("error sending") ||
    normalized.includes("confirmation email") ||
    (normalizedCode === "unexpected_failure" && normalized.includes("email"))
  ) {
    return { error: "email-send-failed" };
  }

  if (normalized.includes("signup") && normalized.includes("disabled")) {
    return { error: "signup-disabled" };
  }

  if (
    status === 500 ||
    normalized.includes("database error") ||
    normalized.includes("unexpected_failure") ||
    normalizedCode === "unexpected_failure"
  ) {
    return { error: "database-setup" };
  }

  return {
    error: "signup-failed",
    detail: publicAuthErrorDetail(message, code),
  };
}
