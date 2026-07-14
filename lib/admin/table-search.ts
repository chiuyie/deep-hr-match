/** Table cell styles so full UUIDs wrap instead of truncating */
export const adminIdCellClassName =
  "inline-block max-w-[11rem] font-mono text-[11px] leading-relaxed break-all whitespace-normal text-slate-600 sm:max-w-[13rem]";

export const adminIdLinkClassName =
  "inline-block max-w-[11rem] cursor-pointer font-mono text-[11px] font-medium leading-relaxed break-all whitespace-normal text-primary hover:underline sm:max-w-[13rem]";

/** Server-safe props for AdminSearchableTable row filtering */
export function adminRowSearchProps(text: string) {
  return { "data-search": text.toLowerCase() } as const;
}
