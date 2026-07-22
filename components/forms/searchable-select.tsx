"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
  keywords?: string;
};

type Props = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SearchableSelectOption[];
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  listClassName?: string;
  emptyMessage?: string;
  /** Max options rendered at once (scroll within this capped list). */
  maxVisibleOptions?: number;
};

const ITEM_HEIGHT = 36;
const SEARCH_BLOCK = 48;
const PANEL_PAD = 16;
const VIEWPORT_GAP = 8;
const DEFAULT_VISIBLE = 8;

const triggerClassName =
  "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50";

type PanelPos = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "bottom" | "top";
};

export function SearchableSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  className,
  listClassName,
  emptyMessage = "No matches",
  maxVisibleOptions = DEFAULT_VISIBLE,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<PanelPos | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    return options.find((o) => o.value === value)?.label ?? value;
  }, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const hay = `${o.label} ${o.keywords ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  const visible = filtered.slice(0, Math.max(maxVisibleOptions * 6, 48));
  const truncated = filtered.length > visible.length;

  const updatePosition = () => {
    const trigger = rootRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_GAP;
    const spaceAbove = rect.top - VIEWPORT_GAP;
    const ideal =
      SEARCH_BLOCK + PANEL_PAD + Math.min(maxVisibleOptions, 8) * ITEM_HEIGHT;
    const placeBottom = spaceBelow >= Math.min(ideal, 160) || spaceBelow >= spaceAbove;
    const available = placeBottom ? spaceBelow : spaceAbove;
    const maxHeight = Math.max(140, Math.min(ideal + 40, available));

    setPos({
      top: placeBottom ? rect.bottom + 4 : rect.top - 4,
      left: Math.min(rect.left, window.innerWidth - Math.max(rect.width, 200) - VIEWPORT_GAP),
      width: Math.max(rect.width, Math.min(280, window.innerWidth - VIEWPORT_GAP * 2)),
      maxHeight,
      placement: placeBottom ? "bottom" : "top",
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onReposition = () => updatePosition();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, filtered.length, maxVisibleOptions]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const listMaxHeight = pos
    ? Math.max(80, pos.maxHeight - SEARCH_BLOCK - PANEL_PAD)
    : maxVisibleOptions * ITEM_HEIGHT;

  const panel =
    open && mounted && pos ? (
      <div
        ref={panelRef}
        className={cn(
          "fixed z-[200] rounded-xl border border-slate-200 bg-white p-2 shadow-lg",
          listClassName
        )}
        style={{
          top: pos.placement === "bottom" ? pos.top : undefined,
          bottom:
            pos.placement === "top" ? window.innerHeight - pos.top : undefined,
          left: pos.left,
          width: pos.width,
          maxHeight: pos.maxHeight,
        }}
      >
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search…"
          className="mb-2 h-9 rounded-lg border-slate-200 text-sm"
        />
        <ul
          id={listId}
          role="listbox"
          className="overflow-y-auto overscroll-contain text-sm"
          style={{ maxHeight: listMaxHeight }}
        >
          {visible.length === 0 ? (
            <li className="px-2 py-2 text-slate-500">{emptyMessage}</li>
          ) : (
            visible.map((option) => (
              <li key={`${option.value}::${option.label}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option.value}
                  className={cn(
                    "flex min-h-9 w-full items-center rounded-md px-2 py-1.5 text-left hover:bg-slate-100",
                    value === option.value && "bg-sky-50 font-medium text-sky-900"
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <span className="truncate">{option.label}</span>
                </button>
              </li>
            ))
          )}
        </ul>
        {truncated ? (
          <p className="mt-1 border-t border-slate-100 px-1 pt-1.5 text-[11px] text-slate-500">
            Showing {visible.length} of {filtered.length} — type to narrow results
          </p>
        ) : filtered.length > maxVisibleOptions ? (
          <p className="mt-1 border-t border-slate-100 px-1 pt-1.5 text-[11px] text-slate-500">
            Scroll for more · type to filter
          </p>
        ) : null}
      </div>
    ) : null;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        className={triggerClassName}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
          setQuery("");
        }}
      >
        <span className={cn("min-w-0 flex-1 truncate", !value && "text-slate-400")}>
          {value ? selectedLabel : placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-slate-400" />
      </button>
      {required && !value ? (
        <input
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          value=""
          onChange={() => {}}
          required
        />
      ) : null}
      {mounted ? createPortal(panel, document.body) : null}
    </div>
  );
}
