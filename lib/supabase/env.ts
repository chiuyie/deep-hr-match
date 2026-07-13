const PLACEHOLDER_VALUES = new Set([
  "https://your-project.supabase.co",
  "your-anon-key",
  "your-service-role-key",
]);

export const SUPABASE_SETUP_MESSAGE =
  "Supabase is not configured. Add your project URL and anon key to .env.local (see .env.example).";

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  return { url, anonKey };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    return false;
  }

  if (PLACEHOLDER_VALUES.has(url) || PLACEHOLDER_VALUES.has(anonKey)) {
    return false;
  }

  return true;
}

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error(SUPABASE_SETUP_MESSAGE);
  }
}
