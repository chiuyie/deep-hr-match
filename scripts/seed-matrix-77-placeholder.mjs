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
/** Word levels per factor (Level 1–3). Default 3. Set MATRIX_LEVELS=1 for minimal. */
const LEVELS_PER_FACTOR = Number(process.env.MATRIX_LEVELS ?? "3");
/** Sub-levels under each Level-1 column (factor1…factor7). Set MATRIX_SUB_LEVELS=0 to skip. */
const SEED_SUB_LEVELS = process.env.MATRIX_SUB_LEVELS !== "0";

function placeholderRootWordLabel(levelIndex, column) {
  if (levelIndex <= 0) return `factor${column}`;
  return `Level${levelIndex}Word${column}`;
}

function placeholderSubLevelWordLabel(parentLevelIndex, parentColumn, wordIndex) {
  return `Level${parentLevelIndex + 1}SubLevel${parentColumn}Word${wordIndex}`;
}

function matchingFactorLabel(factorNumber) {
  return `Matching Factor ${factorNumber}`;
}

function matrixWordLevelNumber(questionIndex) {
  return questionIndex + 1;
}

function wordLevelQuestionText(factorNumber, questionIndex) {
  const level = matrixWordLevelNumber(questionIndex);
  return `[PLACEHOLDER] ${matchingFactorLabel(factorNumber)} — Level ${level}: choose one field`;
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

function optionId(factorIndex, levelIndex, columnIndex) {
  const f = String(factorIndex + 1).padStart(2, "0");
  const l = String(levelIndex + 1).padStart(2, "0");
  const c = String(columnIndex + 1).padStart(2, "0");
  const tail = `${f}${l}${c}`.padEnd(12, "0");
  return `c1000000-0000-4000-8000-${tail}`;
}

function subQuestionId(factorIndex, parentColumn) {
  const n = factorIndex * 10 + parentColumn;
  return `b2000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

function subOptionId(factorIndex, parentColumn, wordIndex) {
  const n = factorIndex * 100 + parentColumn * 10 + wordIndex;
  return `c2000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

function buildRootOptionsForLevel(factorIndex, levelIndex, questionIdValue) {
  return Array.from({ length: MATRIX_WORDS_PER_LEVEL }, (_, columnIndex) => {
    const column = columnIndex + 1;
    const word = placeholderRootWordLabel(levelIndex, column);
    return {
      id: optionId(factorIndex, levelIndex, columnIndex),
      question_id: questionIdValue,
      option_text: word,
      option_value: word,
      sort_order: column,
      is_active: true,
      description: null,
    };
  });
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

  console.log(
    `Seeding matrix placeholder: ${MATRIX_FACTOR_COUNT} factors × ${LEVELS_PER_FACTOR} word level(s)` +
      (SEED_SUB_LEVELS && LEVELS_PER_FACTOR >= 1
        ? " + Level1SubLevel{col}Word{n} under each factor column"
        : "")
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
    description: `[PLACEHOLDER] 7^7 matching factor ${factorIndex + 1} of ${MATRIX_FACTOR_COUNT}`,
    sort_order: factorIndex + 1,
    is_active: true,
  }));

  const { error: catError } = await supabase.from("matrix_categories").insert(categories);
  if (catError) fail(catError.message);

  const rootQuestions = [];
  const subQuestions = [];
  const rootOptions = [];
  const subOptions = [];

  for (let f = 0; f < MATRIX_FACTOR_COUNT; f += 1) {
    for (let l = 0; l < LEVELS_PER_FACTOR; l += 1) {
      const qid = questionId(f, l);
      rootQuestions.push({
        id: qid,
        category_id: categoryId(f),
        question_text: wordLevelQuestionText(f + 1, l),
        question_type: "single_select",
        target_role: "both",
        sort_order: l + 1,
        is_required: true,
        is_active: true,
        parent_option_id: null,
      });

      rootOptions.push(...buildRootOptionsForLevel(f, l, qid));
    }

    if (SEED_SUB_LEVELS && LEVELS_PER_FACTOR >= 1) {
      for (let col = 1; col <= MATRIX_WORDS_PER_LEVEL; col += 1) {
        const parentOptionId = optionId(f, 0, col - 1);
        const subQid = subQuestionId(f, col);
        const parentWord = placeholderRootWordLabel(0, col);

        subQuestions.push({
          id: subQid,
          category_id: categoryId(f),
          question_text: `[PLACEHOLDER] Follow-up for “${parentWord}” — choose one field`,
          question_type: "single_select",
          target_role: "both",
          sort_order: 100 + col,
          is_required: true,
          is_active: true,
          parent_option_id: parentOptionId,
        });

        for (let w = 1; w <= MATRIX_WORDS_PER_LEVEL; w += 1) {
          const word = placeholderSubLevelWordLabel(0, col, w);
          subOptions.push({
            id: subOptionId(f, col, w),
            question_id: subQid,
            option_text: word,
            option_value: word,
            sort_order: w,
            is_active: true,
            description: null,
          });
        }
      }
    }
  }

  await insertInBatches("matrix_questions", rootQuestions);
  await insertInBatches("matrix_options", rootOptions);
  await insertInBatches("matrix_questions", subQuestions);
  await insertInBatches("matrix_options", subOptions);

  const questions = [...rootQuestions, ...subQuestions];
  const options = [...rootOptions, ...subOptions];

  console.log("");
  console.log("Done:");
  console.log(`  ${categories.length} factors (tab titles)`);
  console.log(`  ${questions.length} questions`);
  console.log(`  ${options.length} field labels`);
  console.log("");
  console.log("Level 1 columns: factor1 … factor7");
  console.log("Level 2 columns: Level1Word1 … Level1Word7 (when MATRIX_LEVELS≥2)");
  console.log("Level 3 columns: Level2Word1 … Level2Word7 (when MATRIX_LEVELS≥3)");
  console.log("Sub-levels: Level1SubLevel{col}Word1 … Word7 under each factor column");
  console.log("");
  console.log("Open /admin/matrix to review. Re-complete job and candidate matrix forms after seeding.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
