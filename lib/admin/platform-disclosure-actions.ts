"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { EmployerDisclosureMode } from "@/lib/form-fields/types";
import type { PlatformDisclosureKey } from "@/lib/employer/platform-disclosure";

const PATHS = ["/admin/forms", "/employer/jobs"] as const;

function revalidate() {
  for (const path of PATHS) {
    revalidatePath(path, "layout");
  }
}

export async function updatePlatformDisclosure(
  disclosure_key: PlatformDisclosureKey,
  patch: {
    show_on_anonymous_match?: boolean;
    employer_disclosure_mode?: EmployerDisclosureMode;
  }
) {
  await requireRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_disclosure_items")
    .update(patch)
    .eq("disclosure_key", disclosure_key)
    .select("disclosure_key");

  if (error) return { error: error.message };
  if (!data?.length) {
    return {
      error:
        "Could not save platform disclosure. Apply migration 011_platform_disclosure.sql, then try again.",
    };
  }
  revalidate();
  return { success: true };
}
