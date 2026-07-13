import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseConfigured, getSupabaseEnv } from "@/lib/supabase/env";

export function createClient() {
  assertSupabaseConfigured();

  const { url, anonKey } = getSupabaseEnv();

  return createBrowserClient(url!, anonKey!);
}
