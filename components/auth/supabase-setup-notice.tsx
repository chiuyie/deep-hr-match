import { SUPABASE_SETUP_MESSAGE } from "@/lib/supabase/env";

export function SupabaseSetupNotice() {
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <p className="font-medium">Local setup required</p>
      <p className="mt-1">{SUPABASE_SETUP_MESSAGE}</p>
      <p className="mt-2">
        Get values from{" "}
        <a
          href="https://supabase.com/dashboard/project/_/settings/api"
          target="_blank"
          rel="noreferrer"
          className="font-medium underline"
        >
          Supabase API settings
        </a>
        , then restart the dev server.
      </p>
    </div>
  );
}
