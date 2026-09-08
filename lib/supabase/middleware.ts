import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_USER_ID_HEADER, AUTH_SESSION_HEADER } from "@/lib/auth/forwarded-user";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";
import { resolveAuthUser } from "@/lib/supabase/resolve-auth-user";

/**
 * Cache only the users-row JSON after JWT verification, keyed by auth user id.
 * Never skip getUser() — that caused cross-user identity bugs and stale sessions.
 */
const USER_ROW_CACHE = new Map<
  string,
  { sessionJson: string; expiresAt: number }
>();
const CACHE_TTL_MS = 60_000;
const CACHE_MAX_ENTRIES = 100;
const MAX_SESSION_HEADER_CHARS = 8_000;

function signInPathForRoute(pathname: string): string {
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return "/auth/admin/sign-in";
  }
  if (pathname.startsWith("/employer")) return "/auth/sign-in?role=employer";
  if (pathname.startsWith("/candidate")) return "/auth/sign-in?role=candidate";
  return "/auth/sign-in";
}

/** Identity only — keep header small; full profiles load in RSC when needed. */
const SESSION_SELECT =
  "id, auth_user_id, role, name, email, created_at, updated_at";

function pruneUserRowCache() {
  const now = Date.now();
  for (const [key, value] of USER_ROW_CACHE) {
    if (value.expiresAt < now) USER_ROW_CACHE.delete(key);
  }
  while (USER_ROW_CACHE.size > CACHE_MAX_ENTRIES) {
    const oldest = USER_ROW_CACHE.keys().next().value;
    if (oldest === undefined) break;
    USER_ROW_CACHE.delete(oldest);
  }
}

export async function updateSession(request: NextRequest) {
  // Never trust client-supplied identity headers (spoofable).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(AUTH_USER_ID_HEADER);
  requestHeaders.delete(AUTH_SESSION_HEADER);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const { url, anonKey } = getSupabaseEnv();
  const pathname = request.nextUrl.pathname;

  const isProtectedRoute =
    pathname.startsWith("/candidate") ||
    pathname.startsWith("/employer") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin");

  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<NextResponse["cookies"]["set"]>[2];
  };
  const cookiesToApply: CookieToSet[] = [];

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(url!, anonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToApply.push(...cookiesToSet);
        supabaseResponse = NextResponse.next({
          request: { headers: requestHeaders },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Always verify/refresh the JWT — never short-circuit auth on a cookie-prefix cache.
  const user = await resolveAuthUser(supabase);
  requestHeaders.set(AUTH_USER_ID_HEADER, user?.id ?? "");

  if (isProtectedRoute && !user) {
    const signInUrl = new URL(signInPathForRoute(pathname), request.url);
    const redirectResponse = NextResponse.redirect(signInUrl);
    cookiesToApply.forEach(({ name, value, options }) =>
      redirectResponse.cookies.set(name, value, options)
    );
    return redirectResponse;
  }

  if (user && isProtectedRoute) {
    const cached = USER_ROW_CACHE.get(user.id);
    let sessionJson = "";

    if (cached && cached.expiresAt > Date.now()) {
      sessionJson = cached.sessionJson;
    } else {
      const { data } = await supabase
        .from("users")
        .select(SESSION_SELECT)
        .eq("auth_user_id", user.id)
        .single();
      if (data && data.auth_user_id === user.id) {
        sessionJson = JSON.stringify(data);
        if (sessionJson.length > MAX_SESSION_HEADER_CHARS) {
          sessionJson = "";
        } else {
          USER_ROW_CACHE.set(user.id, {
            sessionJson,
            expiresAt: Date.now() + CACHE_TTL_MS,
          });
          pruneUserRowCache();
        }
      }
    }

    if (sessionJson) {
      requestHeaders.set(AUTH_SESSION_HEADER, sessionJson);
    }
  }

  // Rebuild so RSC sees the AUTH_* headers we set after getUser().
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  cookiesToApply.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );
  return response;
}
