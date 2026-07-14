"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import {
  MATRIX_WORDS_PER_LEVEL,
  matchingFactorLabel,
  placeholderWordLabel,
} from "@/lib/matching/matrix-constants";
import {
  matrixCategorySchema,
  matrixOptionSchema,
  matrixQuestionSchema,
} from "@/lib/validations/schemas";

const MATRIX_PATHS = [
  "/admin/matrix",
  "/candidate/matrix",
  "/employer/jobs",
] as const;

function revalidateMatrixPages() {
  for (const path of MATRIX_PATHS) {
    revalidatePath(path, "layout");
  }
}

export async function saveMatrixCategory(formData: FormData, id?: string) {
  await requireRole("admin");
  const supabase = await createClient();

  const raw = Object.fromEntries(formData);
  const parsed = matrixCategorySchema.safeParse({
    ...raw,
    is_active:
      raw.is_active === "on" ||
      raw.is_active === "true" ||
      raw.is_active === undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid category data" };
  }

  if (id) {
    const { error } = await supabase
      .from("matrix_categories")
      .update(parsed.data)
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("matrix_categories").insert(parsed.data);
    if (error) return { error: error.message };
  }

  revalidateMatrixPages();
  return { success: true };
}

export async function deleteMatrixCategory(id: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("matrix_categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateMatrixPages();
  return { success: true };
}

export async function saveMatrixQuestion(formData: FormData, id?: string) {
  await requireRole("admin");
  const supabase = await createClient();

  const raw = Object.fromEntries(formData);
  const parsed = matrixQuestionSchema.safeParse({
    ...raw,
    is_required: raw.is_required === "on" || raw.is_required === "true",
    is_active:
      raw.is_active === "on" ||
      raw.is_active === "true" ||
      raw.is_active === undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid sub-level data" };
  }

  if (id) {
    const { error } = await supabase
      .from("matrix_questions")
      .update(parsed.data)
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("matrix_questions").insert(parsed.data);
    if (error) return { error: error.message };
  }

  revalidateMatrixPages();
  return { success: true };
}

export async function deleteMatrixQuestion(id: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("matrix_questions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateMatrixPages();
  return { success: true };
}

export async function saveMatrixOption(formData: FormData, id?: string) {
  await requireRole("admin");
  const supabase = await createClient();

  const raw = Object.fromEntries(formData);
  const parsed = matrixOptionSchema.safeParse({
    ...raw,
    is_active:
      raw.is_active === "on" ||
      raw.is_active === "true" ||
      raw.is_active === undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid word data" };
  }

  if (id) {
    const { error } = await supabase
      .from("matrix_options")
      .update(parsed.data)
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("matrix_options").insert(parsed.data);
    if (error) return { error: error.message };
  }

  revalidateMatrixPages();
  return { success: true };
}

export async function deleteMatrixOption(id: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("matrix_options").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateMatrixPages();
  return { success: true };
}

export async function toggleMatrixItem(
  table: "matrix_categories" | "matrix_questions" | "matrix_options",
  id: string,
  is_active: boolean
) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from(table).update({ is_active }).eq("id", id);
  if (error) return { error: error.message };
  revalidateMatrixPages();
  return { success: true };
}

/** Add a sub-level (question) under a matching factor with default word1–word7. */
export async function createMatrixSubLevel(categoryId: string) {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: category, error: categoryError } = await supabase
    .from("matrix_categories")
    .select("id, sort_order, matrix_questions(sort_order)")
    .eq("id", categoryId)
    .single();

  if (categoryError || !category) {
    return { error: "Matching factor not found" };
  }

  const existingLevels = category.matrix_questions ?? [];
  const nextLevel = existingLevels.length + 1;
  const nextSort =
    existingLevels.reduce((max, q) => Math.max(max, q.sort_order ?? 0), 0) + 1;
  const factorNumber = category.sort_order || nextLevel;

  const { data: question, error: questionError } = await supabase
    .from("matrix_questions")
    .insert({
      category_id: categoryId,
      question_text: `${matchingFactorLabel(factorNumber)} — sub-level ${nextLevel}: choose one word`,
      question_type: "single_select",
      target_role: "both",
      sort_order: nextSort,
      is_required: true,
      is_active: true,
    })
    .select("id")
    .single();

  if (questionError || !question) {
    return { error: questionError?.message ?? "Failed to create sub-level" };
  }

  const options = Array.from({ length: MATRIX_WORDS_PER_LEVEL }, (_, index) => {
    const word = placeholderWordLabel(index + 1);
    return {
      question_id: question.id,
      option_text: word,
      option_value: word,
      sort_order: index + 1,
      is_active: true,
    };
  });

  const { error: optionsError } = await supabase.from("matrix_options").insert(options);
  if (optionsError) {
    await supabase.from("matrix_questions").delete().eq("id", question.id);
    return { error: optionsError.message };
  }

  revalidateMatrixPages();
  return { success: true };
}

/** Add one word option to a sub-level. */
export async function createMatrixWord(questionId: string, optionText: string) {
  await requireRole("admin");
  const supabase = await createClient();

  const trimmed = optionText.trim();
  if (!trimmed) return { error: "Word label is required" };

  const { data: existing } = await supabase
    .from("matrix_options")
    .select("sort_order")
    .eq("question_id", questionId);

  const nextSort =
    (existing ?? []).reduce((max, row) => Math.max(max, row.sort_order ?? 0), 0) + 1;

  const slug = trimmed.toLowerCase().replace(/\s+/g, "_");

  const { error } = await supabase.from("matrix_options").insert({
    question_id: questionId,
    option_text: trimmed,
    option_value: slug,
    sort_order: nextSort,
    is_active: true,
  });

  if (error) return { error: error.message };
  revalidateMatrixPages();
  return { success: true };
}

/** Create a new top-level matching factor. */
export async function createMatrixFactor(name?: string) {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("matrix_categories")
    .select("sort_order");

  const nextSort =
    (categories ?? []).reduce((max, row) => Math.max(max, row.sort_order ?? 0), 0) + 1;

  const { data: category, error: categoryError } = await supabase
    .from("matrix_categories")
    .insert({
      name: name?.trim() || matchingFactorLabel(nextSort),
      description: `7^7 matching factor ${nextSort}`,
      sort_order: nextSort,
      is_active: true,
    })
    .select("id")
    .single();

  if (categoryError || !category) {
    return { error: categoryError?.message ?? "Failed to create factor" };
  }

  const result = await createMatrixSubLevel(category.id);
  if (result.error) {
    await supabase.from("matrix_categories").delete().eq("id", category.id);
    return result;
  }

  revalidateMatrixPages();
  return { success: true };
}
