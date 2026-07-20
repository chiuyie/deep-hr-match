/** Single matrix tree in the product UI (Level 1–3 grid). Extra DB categories are ignored. */
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
