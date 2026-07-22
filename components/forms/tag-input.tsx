"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { canonicalizeTag, collapseTagWhitespace } from "@/lib/form-fields/profile-tags";

type Props = {
  id?: string;
  name: string;
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestions: readonly string[];
  allowCustom?: boolean;
  maxItems: number;
  maxItemLength: number;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
};

export function TagInput({
  id,
  name,
  label,
  values,
  onChange,
  suggestions,
  allowCustom = true,
  maxItems,
  maxItemLength,
  placeholder = "Type to search or add…",
  disabled,
  invalid,
  required,
}: Props) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedLower = useMemo(
    () => new Set(values.map((v) => v.toLowerCase())),
    [values]
  );

  const filtered = useMemo(() => {
    const q = collapseTagWhitespace(query).toLowerCase();
    const base = suggestions.filter((s) => !selectedLower.has(s.toLowerCase()));
    if (!q) return base.slice(0, 8);
    return base.filter((s) => s.toLowerCase().includes(q)).slice(0, 8);
  }, [query, suggestions, selectedLower]);

  const canAddMore = values.length < maxItems;
  const exactSuggestion = filtered.find(
    (s) => s.toLowerCase() === collapseTagWhitespace(query).toLowerCase()
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  function addTag(raw: string) {
    if (!canAddMore || disabled) return;
    const canonical = canonicalizeTag(raw, suggestions);
    if (!canonical) return;
    if (canonical.length > maxItemLength) return;
    if (!allowCustom) {
      const allowed = suggestions.some((s) => s.toLowerCase() === canonical.toLowerCase());
      if (!allowed) return;
    }
    if (selectedLower.has(canonical.toLowerCase())) {
      setQuery("");
      return;
    }
    onChange([...values, canonical]);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeTag(index: number) {
    if (disabled) return;
    onChange(values.filter((_, i) => i !== index));
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered[activeIndex]) {
        addTag(filtered[activeIndex]!);
        return;
      }
      if (exactSuggestion) {
        addTag(exactSuggestion);
        return;
      }
      if (allowCustom && collapseTagWhitespace(query)) {
        addTag(query);
      }
      return;
    }
    if (e.key === "Backspace" && !query && values.length > 0) {
      e.preventDefault();
      removeTag(values.length - 1);
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(values)} />
      <div
        className={cn(
          "min-h-11 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-500/20",
          invalid && "border-rose-400 focus-within:ring-rose-500/20",
          disabled && "opacity-50"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap gap-1.5">
          {values.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="inline-flex max-w-full items-center gap-1 rounded-lg bg-sky-50 px-2 py-1 text-xs font-medium text-sky-900 ring-1 ring-sky-100"
            >
              <span className="truncate">{tag}</span>
              <button
                type="button"
                className="rounded p-0.5 text-sky-700 hover:bg-sky-100"
                aria-label={`Remove ${tag}`}
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
          <Input
            ref={inputRef}
            id={id}
            value={query}
            disabled={disabled || !canAddMore}
            placeholder={values.length === 0 ? placeholder : canAddMore ? "Add more…" : "Limit reached"}
            aria-label={label}
            aria-autocomplete="list"
            aria-controls={open ? listId : undefined}
            aria-expanded={open}
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            role="combobox"
            className="h-8 min-w-[8rem] flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
            onChange={(e) => {
              setQuery(e.target.value.slice(0, maxItemLength + 5));
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              // Delay so suggestion click registers.
              window.setTimeout(() => setOpen(false), 150);
            }}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>

      {open && canAddMore && (filtered.length > 0 || (allowCustom && collapseTagWhitespace(query))) ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg"
        >
          {filtered.map((option, index) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  "w-full rounded-md px-2 py-2 text-left hover:bg-slate-100",
                  index === activeIndex && "bg-sky-50 text-sky-900"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(option)}
              >
                {option}
              </button>
            </li>
          ))}
          {allowCustom &&
          collapseTagWhitespace(query) &&
          !exactSuggestion &&
          !selectedLower.has(collapseTagWhitespace(query).toLowerCase()) ? (
            <li>
              <button
                type="button"
                role="option"
                className="w-full rounded-md px-2 py-2 text-left text-slate-700 hover:bg-slate-100"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(query)}
              >
                Add “{collapseTagWhitespace(query)}”
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}

      <p className="text-[11px] text-slate-500">
        {values.length}/{maxItems} selected
        {allowCustom ? " · Enter to add · Backspace removes last tag" : " · Choose from the list"}
      </p>
    </div>
  );
}
