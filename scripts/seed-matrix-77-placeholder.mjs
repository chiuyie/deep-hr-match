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
/** Word levels per factor (Level 2 … Level 8). Default 7 = full depth. Set MATRIX_LEVELS=1 for minimal. */
const LEVELS_PER_FACTOR = Number(process.env.MATRIX_LEVELS ?? "7");

function placeholderWord(wordNumber) {
  return `word${wordNumber}`;
}

function matchingFactorLabel(factorNumber) {
  return `Matching Factor ${factorNumber}`;
}

function matrixWordLevelNumber(questionIndex) {
  return questionIndex + 2;
}

function wordLevelQuestionText(factorNumber, questionIndex) {
  const level = matrixWordLevelNumber(questionIndex);
  return `[PLACEHOLDER] ${matchingFactorLabel(factorNumber)} — Level ${level}: choose one word`;
}

function sortOrderForColumnStack(column, stackIndex) {
  return column + stackIndex * MATRIX_WORDS_PER_LEVEL;
}

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

function optionId(factorIndex, levelIndex, optionIndex) {
  const f = String(factorIndex + 1).padStart(2, "0");
  const l = String(levelIndex + 1).padStart(2, "0");
  const o = String(optionIndex + 1).padStart(3, "0");
  const tail = `${f}${l}${o}`.padEnd(12, "0");
  return `c1000000-0000-4000-8000-${tail}`;
}

function buildOptionsForLevel(factorIndex, levelIndex, questionIdValue) {
  const options = [];

  if (levelIndex === 0) {
    for (let col = 1; col <= MATRIX_WORDS_PER_LEVEL; col += 1) {
      const word = placeholderWord(col);
      options.push({
        id: optionId(factorIndex, levelIndex, col - 1),
        question_id: questionIdValue,
        option_text: word,
        option_value: word,
        sort_order: col,
        is_active: true,
      });
    }
    return options;
  }

  let optionIndex = 0;
  for (let col = 1; col <= MATRIX_WORDS_PER_LEVEL; col += 1) {
    for (let stack = 0; stack < MATRIX_WORDS_PER_LEVEL; stack += 1) {
      const word = placeholderWord(stack + 1);
      options.push({
        id: optionId(factorIndex, levelIndex, optionIndex),
        question_id: questionIdValue,
        option_text: word,
        option_value: word,
        sort_order: sortOrderForColumnStack(col, stack),
        is_active: true,
      });
      optionIndex += 1;
    }
  }

  return options;
}

async function insertInBatches(table, rows, batchSize = 400) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) fail(`${table} batch ${i / batchSize + 1}: ${error.message}`);
  }
}

async function main() {
  if (LEVELS_PER_FACTOR < 1 || LEVELS_PER_FACTOR > 7) {
    fail("MATRIX_LEVELS must be between 1 and 7");
  }

  const optionsPerLevel =
    LEVELS_PER_FACTOR === 1
      ? MATRIX_WORDS_PER_LEVEL
      : MATRIX_WORDS_PER_LEVEL + (LEVELS_PER_FACTOR - 1) * MATRIX_WORDS_PER_LEVEL * MATRIX_WORDS_PER_LEVEL;

  console.log(
    `Seeding 7^7 placeholder: ${MATRIX_FACTOR_COUNT} factors × ${LEVELS_PER_FACTOR} word level(s)`
  );
  console.log(
    `  Level 2: ${MATRIX_WORDS_PER_LEVEL} words (one per column); Levels 3+: ${MATRIX_WORDS_PER_LEVEL} stacked words × ${MATRIX_WORDS_PER_LEVEL} columns`
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
    name: matchingFactorLabel(factorIndex + 1),
    description: `7^7 matching factor ${factorIndex + 1} of ${MATRIX_FACTOR_COUNT}`,
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
        question_text: wordLevelQuestionText(f + 1, l),
        question_type: "single_select",
        target_role: "both",
        sort_order: l + 1,
        is_required: true,
        is_active: true,
      });

      options.push(...buildOptionsForLevel(f, l, qid));
    }
  }

  await insertInBatches("matrix_questions", questions);
  await insertInBatches("matrix_options", options);

  const totalOptions = options.length;
  const perFactor = totalOptions / MATRIX_FACTOR_COUNT;

  console.log("");
  console.log("Done:");
  console.log(`  ${categories.length} factors (Level 1 names)`);
  console.log(`  ${questions.length} word levels (${questions.length / MATRIX_FACTOR_COUNT} per factor)`);
  console.log(`  ${totalOptions} words (${perFactor} per factor, ~${optionsPerLevel} avg per level)`);
  console.log("");
  console.log("Open /admin/matrix to review the spreadsheet layout.");
  console.log("Re-complete employer job matrix and candidate matrix forms after seeding.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
