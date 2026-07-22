import { createClient } from "@/lib/supabase/server";
import type { EmployerDisclosureMode } from "@/lib/form-fields/types";

export type PlatformDisclosureCategory = "scores" | "matrix" | "report";

export type PlatformDisclosureKey =
  | "match_score"
  | "match_rank"
  | "matrix_candidate_answers"
  | "matrix_job_comparison"
  | "match_narrative"
  | "candidate_cv";

export interface PlatformDisclosureItem {
  disclosure_key: PlatformDisclosureKey;
  label: string;
  description: string;
  category: PlatformDisclosureCategory;
  sort_order: number;
  show_on_anonymous_match: boolean;
  employer_disclosure_mode: EmployerDisclosureMode;
}

export const PLATFORM_DISCLOSURE_DEFAULTS: PlatformDisclosureItem[] = [
  {
    disclosure_key: "match_score",
    label: "Match score",
    description: "Overall match percentage shown on ranked candidate lists.",
    category: "scores",
    sort_order: 1,
    show_on_anonymous_match: true,
    employer_disclosure_mode: "always_visible",
  },
  {
    disclosure_key: "match_rank",
    label: "Ranking position",
    description: "Position in the ranked list for this job (e.g. #1, #2).",
    category: "scores",
    sort_order: 2,
    show_on_anonymous_match: true,
    employer_disclosure_mode: "always_visible",
  },
  {
    disclosure_key: "matrix_candidate_answers",
    label: "Candidate 7^7 word choices",
    description:
      "The words the candidate selected on their matching language form (factor by factor).",
    category: "matrix",
    sort_order: 10,
    show_on_anonymous_match: false,
    employer_disclosure_mode: "always_visible",
  },
  {
    disclosure_key: "matrix_job_comparison",
    label: "Job vs candidate word comparison",
    description: "Side-by-side comparison of job and candidate words at each factor level.",
    category: "matrix",
    sort_order: 11,
    show_on_anonymous_match: false,
    employer_disclosure_mode: "always_visible",
  },
  {
    disclosure_key: "match_narrative",
    label: "Match summary, strengths & gaps",
    description: "Text summary generated with the match (including demo placeholder copy today).",
    category: "report",
    sort_order: 20,
    show_on_anonymous_match: false,
    employer_disclosure_mode: "candidate_optional",
  },
  {
    disclosure_key: "candidate_cv",
    label: "CV / résumé download",
    description: "Lets employers download the candidate CV after unlock.",
    category: "report",
    sort_order: 21,
    show_on_anonymous_match: false,
    employer_disclosure_mode: "always_visible",
  },
];

export type PlatformDisclosureLoadResult = {
  items: PlatformDisclosureItem[];
  /** True when rows came from platform_disclosure_items (not in-memory defaults). */
  persisted: boolean;
  error?: string;
};

function isMissingRelationError(message?: string | null) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("platform_disclosure_items") &&
    (lower.includes("does not exist") ||
      lower.includes("schema cache") ||
      lower.includes("could not find"))
  );
}

export async function ensurePlatformDisclosureSeeded(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("platform_disclosure_items")
    .select("disclosure_key", { count: "exact", head: true });

  if (countError) {
    return { error: countError.message };
  }

  if (count && count > 0) return {};

  const { error: insertError } = await supabase
    .from("platform_disclosure_items")
    .insert(PLATFORM_DISCLOSURE_DEFAULTS);

  if (insertError && !insertError.message.toLowerCase().includes("duplicate")) {
    return { error: insertError.message };
  }
  return {};
}

export async function loadPlatformDisclosureItems(): Promise<PlatformDisclosureLoadResult> {
  const seed = await ensurePlatformDisclosureSeeded();
  if (seed.error) {
    return {
      items: PLATFORM_DISCLOSURE_DEFAULTS,
      persisted: false,
      error: seed.error,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_disclosure_items")
    .select("*")
    .order("sort_order");

  if (error) {
    return {
      items: PLATFORM_DISCLOSURE_DEFAULTS,
      persisted: false,
      error: error.message,
    };
  }

  const rows = (data ?? []) as PlatformDisclosureItem[];
  if (rows.length === 0) {
    return {
      items: PLATFORM_DISCLOSURE_DEFAULTS,
      persisted: false,
      error: isMissingRelationError(seed.error)
        ? seed.error
        : "platform_disclosure_items is empty — apply migration 011",
    };
  }

  return { items: rows, persisted: true };
}

export type PlatformDisclosureMap = Record<
  PlatformDisclosureKey,
  PlatformDisclosureItem
>;

export async function loadPlatformDisclosureMap(): Promise<PlatformDisclosureMap> {
  const { items } = await loadPlatformDisclosureItems();
  const map = {} as PlatformDisclosureMap;
  for (const item of items) {
    map[item.disclosure_key] = item;
  }
  for (const fallback of PLATFORM_DISCLOSURE_DEFAULTS) {
    if (!map[fallback.disclosure_key]) {
      map[fallback.disclosure_key] = fallback;
    }
  }
  return map;
}

export function isShownOnAnonymous(
  map: PlatformDisclosureMap,
  key: PlatformDisclosureKey
) {
  return Boolean(map[key]?.show_on_anonymous_match);
}

export function shouldShowUnlockedPlatformItem(
  map: PlatformDisclosureMap,
  key: PlatformDisclosureKey,
  hasContent = true
) {
  const item = map[key];
  if (!item || item.employer_disclosure_mode === "admin_removed") return false;
  if (item.employer_disclosure_mode === "always_visible") return true;
  return hasContent;
}
