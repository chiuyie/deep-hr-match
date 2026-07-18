import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { assertSupabaseConfigured, getSupabaseEnv } from "@/lib/supabase/env";

export const createClient = cache(async function createClient() {
  assertSupabaseConfigured();

  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(
    url!,
    anonKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component - ignore
          }
        },
      },
    }
  );
});

export const createServiceClient = cache(async function createServiceClient() {
  assertSupabaseConfigured();

  const { url } = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceRoleKey || serviceRoleKey === "your-service-role-key") {
    throw new Error(
      "Supabase service role key is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local."
    );
  }

  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url!, serviceRoleKey);
});
