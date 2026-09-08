/**
 * Simple non-crypto fingerprint for auth cookie blobs.
 * Must differ across sessions (never JWT-header-only prefixes).
 */
export function buildAuthSessionCacheKey(
  cookies: Array<{ name: string; value: string }>
): string {
  const authCookies = cookies
    .filter(
      (cookie) =>
        cookie.name.includes("-auth-token") || cookie.name === "sb-access-token"
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  if (authCookies.length === 0) return "";

  const raw = authCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("|");
  return `h${fnv1a(raw)}`;
}

/** FNV-1a 32-bit — fast, deterministic, Edge-safe. */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
