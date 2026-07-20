import type { AuthError, User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export function isStaleRefreshTokenError(error: AuthError | null | undefined): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  const message = error.message.toLowerCase();
  return (
    code === "refresh_token_not_found" ||
    code === "invalid_refresh_token" ||
    message.includes("refresh token")
  );
}

/**
 * Validates the session via getUser(); clears broken cookies when refresh fails.
 */
export async function resolveAuthUser(
  supabase: SupabaseClient
): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error) {
    return user;
  }

  if (isStaleRefreshTokenError(error)) {
    await supabase.auth.signOut();
    return null;
  }

  return user;
}
