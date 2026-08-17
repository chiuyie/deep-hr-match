import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_USER_ID_HEADER } from "@/lib/auth/forwarded-user";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";
import { resolveAuthUser } from "@/lib/supabase/resolve-auth-user";

function signInPathForRoute(pathname: string): string {
  if (pathname.startsWith("/admin")) return "/auth/admin/sign-in";
  if (pathname.startsWith("/employer")) return "/auth/sign-in?role=employer";
  if (pathname.startsWith("/candidate")) return "/auth/sign-in?role=candidate";
  return "/auth/sign-in";
}

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

  const forwarded = NextResponse.next({
    request: { headers: requestHeaders },
  });
  supabaseResponse.cookies.getAll().forEach((cookie) => forwarded.cookies.set(cookie));
  supabaseResponse = forwarded;

  const isProtectedRoute =
    pathname.startsWith("/candidate") ||
    pathname.startsWith("/employer") ||
    pathname.startsWith("/admin");

  if (isProtectedRoute && !user) {
    const signInUrl = new URL(signInPathForRoute(pathname), request.url);
    return NextResponse.redirect(signInUrl);
  }

  return supabaseResponse;
}
