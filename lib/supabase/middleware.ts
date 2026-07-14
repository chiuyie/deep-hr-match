import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  fetchCandidateOnboardingState,
  getOnboardingPath,
  getOnboardingStep,
  isOnboardingPathAllowed,
  normalizeDashboardPath,
} from "@/lib/candidate/onboarding";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedRoute =
    pathname.startsWith("/candidate") ||
    pathname.startsWith("/employer") ||
    pathname.startsWith("/admin");

  if (isProtectedRoute && !user) {
    const signInUrl = new URL(signInPathForRoute(pathname), request.url);
    return NextResponse.redirect(signInUrl);
  }

  if (user && pathname.startsWith("/candidate")) {
    const normalizedPath = normalizeDashboardPath(pathname);
    const { data: dbUser } = await supabase
      .from("users")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (dbUser?.role === "candidate") {
      const onboarding = await fetchCandidateOnboardingState(supabase, dbUser.id);
      const step = getOnboardingStep(onboarding);
      const targetPath = getOnboardingPath(step);

      if (!isOnboardingPathAllowed(normalizedPath, step) && normalizedPath !== targetPath) {
        return NextResponse.redirect(new URL(targetPath, request.url));
      }
    }
  }

  return supabaseResponse;
}
