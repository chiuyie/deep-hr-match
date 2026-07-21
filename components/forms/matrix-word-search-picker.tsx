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
  value?: string;
  onChange: (optionId: string) => void;
}

export function MatrixWordSearchPicker({
  options,
  value,
  onChange,
}: MatrixWordSearchPickerProps) {
  const [query, setQuery] = useState("");
  const sorted = useMemo(() => sortMatrixOptions(options), [options]);

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
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search this level if you want to narrow the choices..."
          className="h-11 rounded-2xl border-slate-200 bg-white pl-10 shadow-sm dark:border-slate-700 dark:bg-slate-950"
          aria-label="Search words on this level"
        />
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-900/40">
          No words match your search on this level.
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
          role="listbox"
          aria-label="Word options for this level"
        >
          {visible.map((option) => {
            const selected = value === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onChange(option.id)}
                className={cn(
                  "cursor-pointer rounded-2xl border px-4 py-4 text-left text-sm font-medium shadow-sm transition-all",
                  selected
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/15"
                    : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="block text-base font-semibold">{option.option_text}</span>
                  {selected ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : null}
                </div>
                {option.description?.trim() ? (
                  <span className="mt-1.5 block text-sm font-normal text-slate-500 dark:text-slate-400">
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
