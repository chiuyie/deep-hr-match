import type { MatrixOption } from "@/types/database";

/** Text used to match search queries (includes internal labels admins use). */
export function matrixOptionSearchHaystack(option: MatrixOption): string {
  return [option.option_text, option.option_value, option.description ?? ""]
    .join(" ")
    .toLowerCase();
}

/** What candidates/employers see — never the internal full word label unless no description exists. */
export function matrixOptionPublicLabel(option: MatrixOption): string {
  const description = option.description?.trim();
  if (description) return description;
  return "Matching choice (confirm selection)";
}

export function filterMatrixOptionsByQuery(
  options: MatrixOption[],
  query: string
): MatrixOption[] {
  const active = options.filter((o) => o.is_active);
  const q = query.trim().toLowerCase();
  if (!q) return active;
  return active.filter((option) => matrixOptionSearchHaystack(option).includes(q));
}

export function sortMatrixOptions(options: MatrixOption[]): MatrixOption[] {
  return [...options].sort((a, b) => a.sort_order - b.sort_order);
}
