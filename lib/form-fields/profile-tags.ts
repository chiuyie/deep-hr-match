import {
  CERTIFICATIONS_MAX_COUNT,
  CERTIFICATION_MAX_LENGTH,
  CERTIFICATION_SUGGESTIONS,
  LANGUAGE_PROFICIENCY_LEVELS,
  LANGUAGES_MAX_COUNT,
  SKILL_MAX_LENGTH,
  SKILL_SUGGESTIONS,
  SKILLS_MAX_COUNT,
  STANDARD_LANGUAGES,
  type CandidateLanguageEntry,
  type LanguageProficiency,
} from "@/lib/constants/profile-tags";

export type TagListValidationResult =
  | { ok: true; value: string[] }
  | { ok: false; message: string };

export type LanguageListValidationResult =
  | { ok: true; value: CandidateLanguageEntry[] }
  | { ok: false; message: string };

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/u;

export function collapseTagWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Prefer a known suggestion's casing when the typed value matches it. */
export function canonicalizeTag(
  raw: string,
  suggestions: readonly string[]
): string {
  const trimmed = collapseTagWhitespace(raw);
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  const match = suggestions.find((s) => s.toLowerCase() === lower);
  return match ?? trimmed;
}

export function parseStringArrayInput(raw: unknown): string[] {
  if (raw == null || raw === "") return [];
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item ?? "")).map(collapseTagWhitespace).filter(Boolean);
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item ?? "")).map(collapseTagWhitespace).filter(Boolean);
        }
      } catch {
        // fall through to comma list
      }
    }
    return trimmed
      .split(",")
      .map(collapseTagWhitespace)
      .filter(Boolean);
  }
  return [];
}

export function parseLanguageEntriesInput(raw: unknown): CandidateLanguageEntry[] {
  if (raw == null || raw === "") return [];

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        return parseLanguageEntriesInput(JSON.parse(trimmed));
      } catch {
        // legacy comma-separated language names
        return trimmed
          .split(",")
          .map(collapseTagWhitespace)
          .filter(Boolean)
          .map((language) => ({ language, proficiency: null }));
      }
    }
    return trimmed
      .split(",")
      .map(collapseTagWhitespace)
      .filter(Boolean)
      .map((language) => ({ language, proficiency: null }));
  }

  if (!Array.isArray(raw)) return [];

  const out: CandidateLanguageEntry[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const language = collapseTagWhitespace(item);
      if (language) out.push({ language, proficiency: null });
      continue;
    }
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const language = collapseTagWhitespace(String(record.language ?? ""));
      if (!language) continue;
      const proficiencyRaw = record.proficiency;
      const proficiency =
        typeof proficiencyRaw === "string" &&
        LANGUAGE_PROFICIENCY_LEVELS.includes(
          proficiencyRaw as LanguageProficiency
        )
          ? (proficiencyRaw as LanguageProficiency)
          : null;
      out.push({ language, proficiency });
    }
  }
  return out;
}

function validateTagList(
  raw: unknown,
  options: {
    label: string;
    required: boolean;
    maxItems: number;
    maxItemLength: number;
    suggestions: readonly string[];
    allowCustom: boolean;
  }
): TagListValidationResult {
  const items = parseStringArrayInput(raw).map((item) =>
    canonicalizeTag(item, options.suggestions)
  );

  if (options.required && items.length === 0) {
    return { ok: false, message: `${options.label} is required.` };
  }

  if (items.length > options.maxItems) {
    return {
      ok: false,
      message: `You can add at most ${options.maxItems} ${options.label.toLowerCase()}.`,
    };
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of items) {
    if (!item) {
      return { ok: false, message: `${options.label} cannot include empty values.` };
    }
    if (CONTROL.test(item) || EMOJI.test(item)) {
      return {
        ok: false,
        message: `${options.label} contains invalid characters.`,
      };
    }
    if (item.length > options.maxItemLength) {
      return {
        ok: false,
        message: `Each ${options.label.toLowerCase().replace(/s$/, "")} must be at most ${options.maxItemLength} characters.`,
      };
    }
    if (!options.allowCustom) {
      const allowed = options.suggestions.some((s) => s.toLowerCase() === item.toLowerCase());
      if (!allowed) {
        return {
          ok: false,
          message: `Choose ${options.label.toLowerCase()} from the list.`,
        };
      }
    }
    const key = item.toLowerCase();
    if (seen.has(key)) {
      return {
        ok: false,
        message: `Duplicate ${options.label.toLowerCase().replace(/s$/, "")} "${item}" is not allowed.`,
      };
    }
    seen.add(key);
    normalized.push(item);
  }

  return { ok: true, value: normalized };
}

export function validateSkillsList(
  raw: unknown,
  options: { required?: boolean; label?: string } = {}
): TagListValidationResult {
  return validateTagList(raw, {
    label: options.label ?? "Skills",
    required: options.required ?? false,
    maxItems: SKILLS_MAX_COUNT,
    maxItemLength: SKILL_MAX_LENGTH,
    suggestions: SKILL_SUGGESTIONS,
    allowCustom: true,
  });
}

export function validateCertificationsList(
  raw: unknown,
  options: { required?: boolean; label?: string } = {}
): TagListValidationResult {
  return validateTagList(raw, {
    label: options.label ?? "Certifications",
    required: options.required ?? false,
    maxItems: CERTIFICATIONS_MAX_COUNT,
    maxItemLength: CERTIFICATION_MAX_LENGTH,
    suggestions: CERTIFICATION_SUGGESTIONS,
    allowCustom: true,
  });
}

/** Map common free-text / legacy names onto STANDARD_LANGUAGES. */
export const LANGUAGE_ALIASES: Record<string, (typeof STANDARD_LANGUAGES)[number]> = {
  mandarin: "Mandarin Chinese",
  chinese: "Mandarin Chinese",
  "mandarin chinese": "Mandarin Chinese",
  "chinese mandarin": "Mandarin Chinese",
  bahasa: "Malay",
  "bahasa melayu": "Malay",
  "bahasa malaysia": "Malay",
  "bahasa indonesia": "Indonesian",
  filipino: "Tagalog",
  farsi: "Persian",
  castilian: "Spanish",
};

/** Resolve a language name to a standard entry, or null if unknown. */
export function canonicalizeLanguage(raw: string): string | null {
  const trimmed = collapseTagWhitespace(raw);
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const listed = STANDARD_LANGUAGES.find((l) => l.toLowerCase() === lower);
  if (listed) return listed;
  return LANGUAGE_ALIASES[lower] ?? null;
}

export function validateLanguagesList(
  raw: unknown,
  options: { required?: boolean; label?: string; dropUnknown?: boolean } = {}
): LanguageListValidationResult {
  const label = options.label ?? "Languages";
  const required = options.required ?? false;
  const dropUnknown = options.dropUnknown === true;
  const entries = parseLanguageEntriesInput(raw);

  if (required && entries.length === 0) {
    return { ok: false, message: `${label} is required.` };
  }
  if (entries.length > LANGUAGES_MAX_COUNT) {
    return {
      ok: false,
      message: `You can add at most ${LANGUAGES_MAX_COUNT} languages.`,
    };
  }

  const seen = new Set<string>();
  const normalized: CandidateLanguageEntry[] = [];

  for (const entry of entries) {
    const language = collapseTagWhitespace(entry.language);
    if (!language) {
      if (dropUnknown) continue;
      return { ok: false, message: `${label} cannot include empty values.` };
    }
    const canonical = canonicalizeLanguage(language);
    if (!canonical) {
      if (dropUnknown) continue;
      return {
        ok: false,
        message: `Choose languages from the standard list only.`,
      };
    }
    const key = canonical.toLowerCase();
    if (seen.has(key)) {
      // Alias collisions (Mandarin + Chinese) and case variants collapse to one entry.
      continue;
    }
    seen.add(key);

    let proficiency: LanguageProficiency | null = null;
    if (entry.proficiency) {
      if (!LANGUAGE_PROFICIENCY_LEVELS.includes(entry.proficiency)) {
        if (dropUnknown) {
          normalized.push({ language: canonical, proficiency: null });
          continue;
        }
        return {
          ok: false,
          message: `Invalid proficiency for ${canonical}.`,
        };
      }
      proficiency = entry.proficiency;
    }

    normalized.push({ language: canonical, proficiency });
  }

  if (required && normalized.length === 0) {
    return { ok: false, message: `${label} is required.` };
  }

  return { ok: true, value: normalized };
}

export function formatLanguagesForDisplay(entries: CandidateLanguageEntry[] | null | undefined): string {
  if (!entries?.length) return "—";
  return entries
    .map((e) => (e.proficiency ? `${e.language} (${e.proficiency})` : e.language))
    .join(", ");
}

export function serializeTagsForForm(tags: string[]): string {
  return JSON.stringify(tags);
}

export function serializeLanguagesForForm(entries: CandidateLanguageEntry[]): string {
  return JSON.stringify(entries);
}
