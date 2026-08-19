import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_USER_ID_HEADER, AUTH_SESSION_HEADER } from "@/lib/auth/forwarded-user";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";
import { resolveAuthUser } from "@/lib/supabase/resolve-auth-user";

// Short-lived in-memory cache to avoid hitting Supabase auth on every request.
// Key: session cookie value, Value: { userId, sessionJson, expiresAt }
const SESSION_CACHE = new Map<string, { userId: string; sessionJson: string; expiresAt: number }>();
const CACHE_TTL_MS = 120_000; // 2 minutes

function signInPathForRoute(pathname: string): string {
  if (pathname.startsWith("/admin")) return "/auth/admin/sign-in";
  if (pathname.startsWith("/employer")) return "/auth/sign-in?role=employer";
  if (pathname.startsWith("/candidate")) return "/auth/sign-in?role=candidate";
  return "/auth/sign-in";
}

const SESSION_SELECT =
  "id, auth_user_id, role, name, email, created_at, updated_at, employer_profiles(id, user_id, company_name, registration_number, industry, company_size, website, company_description, contact_person_name, contact_person_email, contact_person_phone, created_at, updated_at), candidate_profiles(*)";

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  const { url, anonKey } = getSupabaseEnv();
  const pathname = request.nextUrl.pathname;

  const isProtectedRoute =
    pathname.startsWith("/candidate") ||
    pathname.startsWith("/employer") ||
    pathname.startsWith("/admin");

  // Check in-memory cache first to skip auth + DB round-trips entirely
  const sessionCookie = request.cookies.get("sb-access-token")?.value
    ?? request.cookies.getAll().find(c => c.name.includes("-auth-token"))?.value
    ?? "";
  const cacheKey = sessionCookie ? sessionCookie.slice(0, 64) : "";

  if (cacheKey) {
    const cached = SESSION_CACHE.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      requestHeaders.set(AUTH_USER_ID_HEADER, cached.userId);
      requestHeaders.set(AUTH_SESSION_HEADER, cached.sessionJson);
      const fast = NextResponse.next({ request: { headers: requestHeaders } });
      request.cookies.getAll().forEach(c => fast.cookies.set(c.name, c.value));
      return fast;
    }
  }

  const supabase = createServerClient(url!, anonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request: { headers: requestHeaders },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const user = await resolveAuthUser(supabase);
  requestHeaders.set(AUTH_USER_ID_HEADER, user?.id ?? "");

  if (isProtectedRoute && !user) {
    const signInUrl = new URL(signInPathForRoute(pathname), request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Pre-fetch session row so RSC skips a DB round-trip
  let sessionJson = "";
  if (user && isProtectedRoute) {
    const { data } = await supabase
      .from("users")
      .select(SESSION_SELECT)
      .eq("auth_user_id", user.id)
      .single();
    if (data) {
      sessionJson = JSON.stringify(data);
      requestHeaders.set(AUTH_SESSION_HEADER, sessionJson);
    }
  }

  // Cache for subsequent requests
  if (cacheKey && user) {
    SESSION_CACHE.set(cacheKey, {
      userId: user.id,
      sessionJson,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    // Evict old entries
    if (SESSION_CACHE.size > 100) {
      const now = Date.now();
      for (const [k, v] of SESSION_CACHE) {
        if (v.expiresAt < now) SESSION_CACHE.delete(k);
      }
    }
  }

  const forwarded = NextResponse.next({
    request: { headers: requestHeaders },
  });
  supabaseResponse.cookies.getAll().forEach((cookie) => forwarded.cookies.set(cookie));

  return forwarded;
}
