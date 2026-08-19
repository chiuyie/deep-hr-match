/** Set by `proxy.ts` after verifying the JWT so RSC can skip a second Auth round-trip. */
export const AUTH_USER_ID_HEADER = "x-auth-user-id";
/** JSON-encoded session row forwarded from proxy to eliminate the users-table query in RSC. */
export const AUTH_SESSION_HEADER = "x-auth-session";
