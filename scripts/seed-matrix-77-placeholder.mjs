import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const MATRIX_FACTOR_COUNT = 7;
const MATRIX_WORDS_PER_LEVEL = 7;

function placeholderWord(wordNumber) {
  return `word${wordNumber}`;
}

function matchingFactorLabel(factorNumber) {
  return `Matching Factor ${factorNumber}`;
}

function subLevelQuestionText(factorNumber, subLevel) {
  return `[PLACEHOLDER] ${matchingFactorLabel(factorNumber)} — sub-level ${subLevel}: choose one word`;
}

/** Sub-levels per factor — set MATRIX_LEVELS=1 for minimal placeholder. Default: 1. */
const LEVELS_PER_FACTOR = Number(process.env.MATRIX_LEVELS ?? "1");

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceRoleKey) {
  fail("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function categoryId(factorIndex) {
  return `a1000000-0000-4000-8000-00000000000${factorIndex + 1}`;
}

function questionId(factorIndex, levelIndex) {
  const f = String(factorIndex + 1).padStart(2, "0");
  const l = String(levelIndex + 1).padStart(2, "0");
  const tail = `${f}${l}`.padEnd(10, "0") + "01";
  return `b1000000-0000-4000-8000-${tail}`;
}

function optionId(factorIndex, levelIndex, wordIndex) {
  const f = String(factorIndex + 1).padStart(2, "0");
  const l = String(levelIndex + 1).padStart(2, "0");
  const w = String(wordIndex + 1).padStart(2, "0");
  const tail = `${f}${l}${w}`.padEnd(10, "0") + "01";
  return `c1000000-0000-4000-8000-${tail}`;
}

async function main() {
  console.log(
    `Seeding 7^7 placeholder: ${MATRIX_FACTOR_COUNT} matching factors × ${LEVELS_PER_FACTOR} sub-level(s) × ${MATRIX_WORDS_PER_LEVEL} words`
  );

  const { error: deleteOptionsError } = await supabase
    .from("matrix_options")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteOptionsError) fail(deleteOptionsError.message);

  const { error: deleteQuestionsError } = await supabase
    .from("matrix_questions")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteQuestionsError) fail(deleteQuestionsError.message);

  const { error: deleteCategoriesError } = await supabase
    .from("matrix_categories")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteCategoriesError) fail(deleteCategoriesError.message);

  const categories = Array.from({ length: MATRIX_FACTOR_COUNT }, (_, factorIndex) => ({
    id: categoryId(factorIndex),
    name: `[PLACEHOLDER] ${matchingFactorLabel(factorIndex + 1)}`,
    description: `[PLACEHOLDER] 7^7 matching factor ${factorIndex + 1} of ${MATRIX_FACTOR_COUNT}`,
    sort_order: factorIndex + 1,
    is_active: true,
  }));

  const { error: catError } = await supabase.from("matrix_categories").insert(categories);
  if (catError) fail(catError.message);

  const questions = [];
  const options = [];

  for (let f = 0; f < MATRIX_FACTOR_COUNT; f += 1) {
    for (let l = 0; l < LEVELS_PER_FACTOR; l += 1) {
      const qid = questionId(f, l);
      questions.push({
        id: qid,
        category_id: categoryId(f),
        question_text: subLevelQuestionText(f + 1, l + 1),
        question_type: "single_select",
        target_role: "both",
        sort_order: l + 1,
        is_required: true,
        is_active: true,
      });

      for (let w = 0; w < MATRIX_WORDS_PER_LEVEL; w += 1) {
        const word = placeholderWord(w + 1);
        options.push({
          id: optionId(f, l, w),
          question_id: qid,
          option_text: word,
          option_value: word,
          sort_order: w + 1,
          is_active: true,
        });
      }
    }
  }

  const { error: qError } = await supabase.from("matrix_questions").insert(questions);
  if (qError) fail(qError.message);

  const { error: oError } = await supabase.from("matrix_options").insert(options);
  if (oError) fail(oError.message);

  console.log(
    `Done: ${categories.length} factors, ${questions.length} sub-levels, ${options.length} words`
  );
  console.log("Re-complete employer job matrix and candidate matrix forms after seeding.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
