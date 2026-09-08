import type { User } from "@/types/database";

/**
 * Accept middleware-forwarded session JSON only when it matches the verified
 * auth user id. Prevents client-spoofed `x-auth-session` headers from elevating role.
 */
export function parseForwardedSession(
  sessionJson: string | null,
  authUserId: string | null
): User | null {
  if (!sessionJson || !authUserId) return null;
  try {
    const parsed = JSON.parse(sessionJson) as User;
    if (!parsed?.auth_user_id || parsed.auth_user_id !== authUserId) {
      return null;
    }
    if (!parsed.id || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}
