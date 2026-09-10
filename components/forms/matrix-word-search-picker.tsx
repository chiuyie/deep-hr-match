"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  filterMatrixOptionsByQuery,
  sortMatrixOptions,
} from "@/lib/matching/matrix-option-display";
import type { MatrixOption } from "@/types/database";

interface MatrixWordSearchPickerProps {
  options: MatrixOption[];
  /** Single-select value (employer / sub-levels). Ignored when `values` is set. */
  value?: string;
  /** Multi-select values (candidate factor word pick). */
  values?: string[];
  /** Max selectable words when multi-select. Default unlimited within options. */
  maxSelections?: number;
  onChange: (optionId: string) => void;
  /** Shorter copy for search when used in dense employer flows. */
  searchPlaceholder?: string;
}

export function MatrixWordSearchPicker({
  options,
  value,
  values,
  maxSelections,
  onChange,
  searchPlaceholder = "Search words…",
}: MatrixWordSearchPickerProps) {
  const [query, setQuery] = useState("");
  const sorted = useMemo(() => sortMatrixOptions(options), [options]);
  const multi = Array.isArray(values);
  const selectedIds = useMemo(
    () => new Set(multi ? values : value ? [value] : []),
    [multi, value, values]
  );

  useEffect(() => {
    setQuery("");
  }, [options]);

  const visible = useMemo(
    () => filterMatrixOptionsByQuery(sorted, query),
    [sorted, query]
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-12 rounded-2xl border-slate-200/90 bg-white pl-11 text-[15px] shadow-sm focus-visible:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950"
          aria-label="Search words on this level"
        />
        {query ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800"
            onClick={() => setQuery("")}
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          {visible.length === sorted.length
            ? `${sorted.length} word${sorted.length === 1 ? "" : "s"}`
            : `${visible.length} of ${sorted.length} words`}
        </p>
        {multi && typeof maxSelections === "number" ? (
          <p
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              selectedIds.size > 0
                ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            Selected {selectedIds.size} / {maxSelections}
          </p>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-900/40">
          No words match “{query}”. Try a shorter search.
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
          role="listbox"
          aria-label="Word options for this level"
          aria-multiselectable={multi || undefined}
        >
          {visible.map((option) => {
            const selected = selectedIds.has(option.id);
            const atMax =
              multi &&
              typeof maxSelections === "number" &&
              selectedIds.size >= maxSelections &&
              !selected;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={atMax}
                onClick={() => onChange(option.id)}
                className={cn(
                  "group cursor-pointer rounded-2xl border px-4 py-3.5 text-left transition-all duration-200",
                  selected
                    ? "border-sky-500 bg-sky-50 text-sky-950 shadow-[0_10px_24px_-16px_rgba(14,165,233,0.85)] ring-2 ring-sky-500/20 dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-50"
                    : atMax
                      ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-60 dark:border-slate-800 dark:bg-slate-900/40"
                      : "border-slate-200/90 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50/60 hover:shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-sky-500/40 dark:hover:bg-slate-900"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="block text-[15px] font-semibold leading-snug">
                    {option.option_text}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                      selected
                        ? "border-sky-500 bg-sky-500 text-white"
                        : "border-slate-300 text-transparent group-hover:border-sky-300 dark:border-slate-600"
                    )}
                    aria-hidden
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                </div>
                {option.description?.trim() ? (
                  <span
                    className={cn(
                      "mt-1.5 block text-sm font-normal leading-relaxed",
                      selected
                        ? "text-sky-800/80 dark:text-sky-200/80"
                        : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {option.description}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
