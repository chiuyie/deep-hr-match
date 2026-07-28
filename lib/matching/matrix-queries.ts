import { createClient } from "@/lib/supabase/server";

/**
 * PostgREST embed for matrix_categories → questions → options.
 * After migration 009, disambiguate options FK (question_id vs parent_option_id).
 */
export const MATRIX_CATEGORY_TREE_SELECT =
  "*, matrix_questions(*, matrix_options!matrix_options_question_id_fkey(*))";

export type MatrixCategoryTreeRow = {
  id: string;
  sort_order: number;
  is_active?: boolean;
  matrix_questions?: Array<{
    matrix_options?: unknown[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Single matrix tree in the product UI (root word grid). Extra DB categories are ignored. */
export function pickPrimaryMatrixCategory<T extends { sort_order: number; is_active?: boolean }>(
  categories: T[]
): T | undefined {
  return [...categories]
    .filter((c) => c.is_active !== false)
    .sort((a, b) => a.sort_order - b.sort_order)[0];
}

export function pickPrimaryMatrixCategories<T extends { sort_order: number; is_active?: boolean }>(
  categories: T[]
): T[] {
  const primary = pickPrimaryMatrixCategory(categories);
  return primary ? [primary] : [];
}

/** Load only the primary active matrix category with its full question/option tree. */
export async function loadPrimaryMatrixCategoryTree<
  T extends MatrixCategoryTreeRow = MatrixCategoryTreeRow,
>(supabase: SupabaseServerClient): Promise<T | null> {
  const { data, error } = await supabase
    .from("matrix_categories")
    .select(MATRIX_CATEGORY_TREE_SELECT)
    .eq("is_active", true)
    .order("sort_order")
    .limit(1);

  if (error) {
    throw new Error(`Could not load matrix form: ${error.message}`);
  }

  const category = data?.[0];
  if (!category) return null;

  return {
    ...category,
    matrix_questions: (category.matrix_questions ?? []).map((question) => ({
      ...question,
      matrix_options: question.matrix_options ?? [],
    })),
  } as T;
}
