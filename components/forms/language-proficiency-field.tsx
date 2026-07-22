"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  LANGUAGE_PROFICIENCY_LEVELS,
  STANDARD_LANGUAGES,
  type CandidateLanguageEntry,
  type LanguageProficiency,
} from "@/lib/constants/profile-tags";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  name: string;
  label: string;
  values: CandidateLanguageEntry[];
  onChange: (next: CandidateLanguageEntry[]) => void;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
};

export function LanguageProficiencyField({
  id,
  name,
  label,
  values,
  onChange,
  disabled,
  invalid,
  required,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = useMemo(
    () => new Set(values.map((v) => v.language.toLowerCase())),
    [values]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = STANDARD_LANGUAGES.filter((l) => !selected.has(l.toLowerCase()));
    if (!q) return base.slice(0, 10);
    return base.filter((l) => l.toLowerCase().includes(q)).slice(0, 10);
  }, [query, selected]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function addLanguage(language: string) {
    if (disabled || selected.has(language.toLowerCase())) return;
    onChange([...values, { language, proficiency: null }]);
    setQuery("");
    setOpen(false);
  }

  function removeLanguage(language: string) {
    onChange(values.filter((v) => v.language !== language));
  }

  function setProficiency(language: string, proficiency: LanguageProficiency | "") {
    onChange(
      values.map((v) =>
        v.language === language
          ? { ...v, proficiency: proficiency === "" ? null : proficiency }
          : v
      )
    );
  }

  return (
    <div ref={rootRef} className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(values)} />

      <div className="relative">
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? listId : undefined}
          aria-label={label}
          aria-invalid={invalid || undefined}
          aria-required={required || undefined}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20",
            invalid && "border-rose-400 focus:ring-rose-500/20",
            disabled && "opacity-50"
          )}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="truncate text-slate-500">Search languages…</span>
          <ChevronDown className="size-4 shrink-0 text-slate-400" />
        </button>

        {open ? (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to filter…"
              aria-label={`Search ${label}`}
              className="mb-2 h-9 rounded-lg border-slate-200 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setOpen(false);
                  return;
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                  return;
                }
                if (e.key === "Enter" && filtered[activeIndex]) {
                  e.preventDefault();
                  addLanguage(filtered[activeIndex]!);
                }
              }}
            />
            <ul
              id={listId}
              role="listbox"
              className="max-h-48 overflow-y-auto text-sm"
              aria-label={`${label} options`}
            >
              {filtered.length === 0 ? (
                <li className="px-2 py-2 text-slate-500">No matching languages</li>
              ) : (
                filtered.map((language, index) => (
                  <li key={language}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      className={cn(
                        "w-full rounded-md px-2 py-2 text-left hover:bg-slate-100",
                        index === activeIndex && "bg-sky-50 font-medium text-sky-900"
                      )}
                      onClick={() => addLanguage(language)}
                    >
                      {language}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}
      </div>

      {values.length > 0 ? (
        <ul className="space-y-2">
          {values.map((entry) => (
            <li
              key={entry.language}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-slate-800">
                  {entry.language}
                </span>
                <button
                  type="button"
                  className="rounded-md p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                  aria-label={`Remove ${entry.language}`}
                  disabled={disabled}
                  onClick={() => removeLanguage(entry.language)}
                >
                  <X className="size-4" />
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 sm:w-56">
                <span className="shrink-0">Proficiency</span>
                <select
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm"
                  value={entry.proficiency ?? ""}
                  disabled={disabled}
                  aria-label={`${entry.language} proficiency`}
                  onChange={(e) =>
                    setProficiency(
                      entry.language,
                      e.target.value as LanguageProficiency | ""
                    )
                  }
                >
                  <option value="">Optional</option>
                  {LANGUAGE_PROFICIENCY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500">Select one or more languages from the list.</p>
      )}
    </div>
  );
}
