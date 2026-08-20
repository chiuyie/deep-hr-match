/**
 * Inserts any missing built-in form_fields / form_sections rows.
 * Uses the service role key (RLS blocks anon/candidate writes).
 *
 * Usage: node --env-file=.env.local scripts/sync-form-fields.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const file = path.join(root, name);
    try {
      for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq <= 0) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (process.env[key] == null) process.env[key] = value;
      }
    } catch {
      // ignore missing file
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const { getDefaultFormFields } = await import(
  pathToFileURL(path.join(root, "lib/form-fields/defaults.ts")).href
);
const { DEFAULT_SELECT_OPTIONS_BY_KEY, normalizeSelectOptions } = await import(
  pathToFileURL(path.join(root, "lib/form-fields/select-options.ts")).href
);
const { defaultSectionTitles } = await import(
  pathToFileURL(path.join(root, "lib/form-fields/section-defaults.ts")).href
);

const supabase = createClient(url, serviceKey);

function defaultRow(field) {
  const field_type = field.field_type ?? "text";
  const defaultOptions = DEFAULT_SELECT_OPTIONS_BY_KEY[field.field_key];
  return {
    ...field,
    field_type,
    options:
      field_type === "select"
        ? normalizeSelectOptions(field.options ?? defaultOptions ?? null)
        : null,
    is_required: field.is_required ?? false,
    is_active: true,
    is_custom: false,
    employer_disclosure_mode: "candidate_optional",
    show_on_anonymous_match: ["years_of_experience", "highest_education", "skills"].includes(
      field.field_key
    ),
    placeholder: field.placeholder ?? null,
  };
}

const { data: existing, error: readError } = await supabase
  .from("form_fields")
  .select("audience, form_group, field_key");

if (readError) {
  console.error("Failed to read form_fields:", readError.message);
  process.exit(1);
}

const existingKeys = new Set(
  (existing ?? []).map((row) => `${row.audience}:${row.form_group}:${row.field_key}`)
);

const missing = getDefaultFormFields()
  .filter((field) => !existingKeys.has(`${field.audience}:${field.form_group}:${field.field_key}`))
  .map(defaultRow);

if (missing.length > 0) {
  const { error: insertError } = await supabase.from("form_fields").insert(missing);
  if (insertError) {
    console.error("Failed to insert form_fields:", insertError.message);
    process.exit(1);
  }
  console.log(`Inserted ${missing.length} missing form field(s).`);
} else {
  console.log("All built-in form fields already exist.");
}

for (const { audience, formGroup } of [
  { audience: "candidate", formGroup: "profile" },
  { audience: "employer", formGroup: "profile" },
  { audience: "employer", formGroup: "job" },
]) {
  const { data: sectionRows } = await supabase
    .from("form_sections")
    .select("title")
    .eq("audience", audience)
    .eq("form_group", formGroup);

  const existingTitles = new Set((sectionRows ?? []).map((row) => row.title));
  const defaults = defaultSectionTitles(audience, formGroup);
  const toInsert = defaults
    .filter((title) => !existingTitles.has(title))
    .map((title, index) => ({
      audience,
      form_group: formGroup,
      title,
      sort_order: index + 1,
    }));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("form_sections").insert(toInsert);
    if (error && !error.message.toLowerCase().includes("form_sections")) {
      console.error(`Failed to insert form_sections (${audience}/${formGroup}):`, error.message);
      process.exit(1);
    } else if (!error) {
      console.log(`Inserted ${toInsert.length} section(s) for ${audience}/${formGroup}.`);
    }
  }
}

const { count } = await supabase
  .from("form_fields")
  .select("id", { count: "exact", head: true })
  .eq("audience", "candidate")
  .eq("form_group", "profile");

console.log(`Candidate profile fields in DB: ${count ?? "?"}`);
console.log("Done.");
